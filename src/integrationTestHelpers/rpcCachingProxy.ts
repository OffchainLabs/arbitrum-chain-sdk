import { once } from 'node:events';
import { createServer, IncomingHttpHeaders } from 'node:http';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { buffer } from 'node:stream/consumers';

type RpcRequest = {
  id?: unknown;
  jsonrpc?: string;
  method?: string;
  params?: unknown;
};

type RpcResponse = {
  error?: unknown;
  id?: unknown;
  jsonrpc?: string;
  result?: unknown;
};

type CacheEntry = {
  error?: unknown;
  jsonrpc: string;
  result?: unknown;
};

type CacheData = Record<string, CacheEntry>;

type CacheMetadata = {
  forkBlockNumber: number;
};

type CacheFile = {
  metadata: CacheMetadata;
  entries: CacheData;
};

export type RpcCachingProxy = {
  proxyUrl: string;
  close: () => void;
  getSummaryLines: () => string[];
};

const CACHEABLE_METHODS = new Set([
  'eth_chainId',
  'eth_gasPrice',
  'eth_getAccountInfo',
  'eth_getBalance',
  'eth_getBlockByNumber',
  'eth_getCode',
  'eth_getStorageAt',
  'eth_getTransactionCount',
  'eth_getTransactionReceipt',
]);

function forwardHeaders(headers: IncomingHttpHeaders): Record<string, string> {
  const nextHeaders: Record<string, string> = {};

  for (const [key, value] of Object.entries(headers)) {
    if (typeof value === 'undefined' || key === 'content-length' || key === 'host') {
      continue;
    }

    nextHeaders[key] = Array.isArray(value) ? value.join(', ') : value;
  }

  return nextHeaders;
}

function getCacheKey(request: RpcRequest): string | undefined {
  if (typeof request.method !== 'string' || !CACHEABLE_METHODS.has(request.method)) {
    return undefined;
  }

  return JSON.stringify([request.method, request.params ?? []]);
}

function shouldPersistCacheEntry(request: RpcRequest, response: RpcResponse): boolean {
  if (request.method === 'eth_getTransactionReceipt' && response.result === null) {
    return false;
  }

  return true;
}

function getIdKey(id: unknown): string {
  return JSON.stringify(id ?? null);
}

function writeCacheFile(cacheFilePath: string, cacheFile: CacheFile) {
  writeFileSync(cacheFilePath, JSON.stringify(cacheFile, null, 2));
}

function isCacheFile(value: unknown): value is CacheFile {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const maybeCacheFile = value as Partial<CacheFile>;
  return (
    !!maybeCacheFile.metadata &&
    typeof maybeCacheFile.metadata === 'object' &&
    typeof maybeCacheFile.metadata.forkBlockNumber === 'number' &&
    !!maybeCacheFile.entries &&
    typeof maybeCacheFile.entries === 'object'
  );
}

function loadCacheData(params: { cacheFilePath: string; metadata: CacheMetadata }): CacheData {
  const { cacheFilePath, metadata } = params;

  if (!existsSync(cacheFilePath)) {
    writeCacheFile(cacheFilePath, { metadata, entries: {} });
    return {};
  }

  try {
    const parsed = JSON.parse(readFileSync(cacheFilePath, 'utf8')) as unknown;
    if (isCacheFile(parsed) && parsed.metadata.forkBlockNumber === metadata.forkBlockNumber) {
      return parsed.entries;
    }
  } catch {
    // Reset invalid cache files below.
  }

  writeCacheFile(cacheFilePath, { metadata, entries: {} });
  return {};
}

export async function startRpcCachingProxy(
  targetUrl: string,
  cacheFilePath: string,
  metadata: CacheMetadata,
): Promise<RpcCachingProxy> {
  mkdirSync(dirname(cacheFilePath), { recursive: true });

  const cache = loadCacheData({ cacheFilePath, metadata });

  const stats = {
    cacheHits: 0,
    cacheMisses: 0,
    requests: 0,
    upstreamRequests: 0,
  };

  const server = createServer(async (request, response) => {
    try {
      const requestBody = await buffer(request);
      const upstreamRequestBody = new Uint8Array(requestBody.byteLength);
      upstreamRequestBody.set(requestBody);

      const parsed = JSON.parse(requestBody.toString('utf8')) as RpcRequest | RpcRequest[];
      const requests = Array.isArray(parsed) ? parsed : [parsed];

      stats.requests += requests.length;

      const cacheKeys = requests.map((item) => getCacheKey(item));
      const cachedResponses = cacheKeys.map((cacheKey) => (cacheKey ? cache[cacheKey] : undefined));

      if (cachedResponses.every((entry) => entry)) {
        stats.cacheHits += requests.length;
        response.setHeader('content-type', 'application/json');
        response.statusCode = 200;
        response.end(
          JSON.stringify(
            Array.isArray(parsed)
              ? requests.map((item, index) => ({ id: item.id ?? null, ...cachedResponses[index]! }))
              : { id: requests[0].id ?? null, ...cachedResponses[0]! },
          ),
        );
        return;
      }

      stats.cacheMisses += cacheKeys.filter(
        (cacheKey, index) => cacheKey && !cachedResponses[index],
      ).length;
      stats.upstreamRequests += 1;

      const upstreamResponse = await fetch(targetUrl, {
        method: request.method,
        headers: forwardHeaders(request.headers),
        body: upstreamRequestBody,
      });

      const upstreamText = Buffer.from(await upstreamResponse.arrayBuffer()).toString('utf8');
      const upstreamResponses = [JSON.parse(upstreamText)].flat() as RpcResponse[];
      const upstreamById = new Map(
        upstreamResponses.map((item) => [getIdKey(item.id), item] as const),
      );

      let cacheChanged = false;

      for (const [index, item] of requests.entries()) {
        const cacheKey = cacheKeys[index];
        const upstreamItem = upstreamById.get(getIdKey(item.id));
        if (!cacheKey || !upstreamItem || !shouldPersistCacheEntry(item, upstreamItem)) {
          continue;
        }

        cache[cacheKey] = {
          error: upstreamItem.error,
          jsonrpc: upstreamItem.jsonrpc ?? '2.0',
          result: upstreamItem.result,
        };
        cacheChanged = true;
      }

      if (cacheChanged) {
        writeCacheFile(cacheFilePath, { metadata, entries: cache });
      }

      const contentType = upstreamResponse.headers.get('content-type');
      if (contentType) {
        response.setHeader('content-type', contentType);
      }
      response.statusCode = upstreamResponse.status;
      response.end(upstreamText);
    } catch (error) {
      response.statusCode = 502;
      response.end(
        JSON.stringify({
          error: error instanceof Error ? error.message : String(error),
        }),
      );
    }
  });

  server.listen(0, '0.0.0.0');
  await once(server, 'listening');

  const address = server.address();
  if (!address || typeof address === 'string') {
    server.close();
    throw new Error('RPC caching proxy failed to resolve a listening TCP port.');
  }

  return {
    proxyUrl: `http://host.docker.internal:${address.port}`,
    getSummaryLines: () => [
      'RPC proxy cache summary',
      `  requests: ${stats.requests}`,
      `  cache hits: ${stats.cacheHits}`,
      `  cache misses: ${stats.cacheMisses}`,
      `  upstream HTTP requests: ${stats.upstreamRequests}`,
    ],
    close: () => server.close(),
  };
}
