import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { isHash } from 'viem';

export type GenerateGenesisParameters = {
  chainId: string;
  isAnyTrust?: string;
  arbosVersion: string;
  chainOwner: string;
  l1BaseFee: string;
  loadDefaultPredeploys?: string;
  enableNativeTokenSupply?: string;
  enableTransactionFiltering?: string;
  customAllocAccountFile?: string;
  maxCodeSize: string;
  maxInitCodeSize: string;
};

export type GenerateGenesisResult = {
  genesis: Record<string, unknown>;
  blockHash: `0x${string}`;
  sendRoot: `0x${string}`;
};

type GeneratorModule = {
  generateGenesis: (options: GenerateGenesisParameters) => Record<string, unknown>;
};

const packageName = '@arbitrum/genesis-file-generator';

export function parseGenesisGeneratorOutput(
  output: string,
): Pick<GenerateGenesisResult, 'blockHash' | 'sendRoot'> {
  const [blockHashSegment, sendRootSegment] = output.split(',', 2);
  const blockHash = blockHashSegment?.split('BlockHash: ')[1];
  const sendRoot = sendRootSegment?.trim().split('SendRoot: ')[1];

  if (!blockHash || !sendRoot || !isHash(blockHash) || !isHash(sendRoot)) {
    throw new Error('genesis-generator returned an unexpected result.');
  }

  return { blockHash, sendRoot };
}

export async function generateGenesis(
  options: GenerateGenesisParameters,
): Promise<GenerateGenesisResult> {
  let generator: GeneratorModule;
  try {
    generator = (await import(packageName)) as GeneratorModule;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== 'MODULE_NOT_FOUND' && code !== 'ERR_MODULE_NOT_FOUND') throw error;
    throw new Error('generateGenesis is only available in the chain-sdk Docker image.');
  }

  const genesis = generator.generateGenesis(options);
  const directory = mkdtempSync(join(tmpdir(), 'chain-sdk-genesis-'));
  const genesisPath = join(directory, 'genesis.json');

  try {
    writeFileSync(genesisPath, JSON.stringify(genesis));
    const globalState = execFileSync('genesis-generator', ['--genesis-json-file', genesisPath], {
      encoding: 'utf8',
    });

    return { genesis, ...parseGenesisGeneratorOutput(globalState) };
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}
