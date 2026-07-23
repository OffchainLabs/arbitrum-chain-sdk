import { Client, Transport, Chain } from 'viem';

type JsonRpcResult = {
  jsonrpc: '2.0';
  id: 1;
  result: string;
};

export async function getClientVersion<TChain extends Chain | undefined>(
  clientOrRpcUrl: Client<Transport, TChain> | string,
): Promise<string> {
  // chain.rpcUrls can be empty (custom/unknown chains), so prefer the transport URL the
  // caller connected with.
  const rpcUrl =
    typeof clientOrRpcUrl === 'string'
      ? clientOrRpcUrl
      : (clientOrRpcUrl.transport.url as string | undefined) ??
        clientOrRpcUrl.chain?.rpcUrls.default.http[0];

  if (typeof rpcUrl === 'undefined') {
    throw new Error(`[getClientVersion] invalid rpc url: ${rpcUrl}`);
  }

  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'web3_clientVersion',
      params: [],
      id: 1,
    }),
  });

  return ((await response.json()) as unknown as JsonRpcResult).result;
}
