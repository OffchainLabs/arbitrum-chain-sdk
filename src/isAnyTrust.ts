import { Address, Chain, PublicClient, Transport, decodeFunctionData, getAbiItem } from 'viem';
import { createRollupFetchTransactionHash } from './createRollupFetchTransactionHash';

import { rollupCreatorABI as rollupCreatorV3Dot2ABI } from './contracts/RollupCreator/v3.2';
import { rollupCreatorABI as rollupCreatorV3Dot1ABI } from './contracts/RollupCreator/v3.1';
import { rollupCreatorABI as rollupCreatorV2Dot1ABI } from './contracts/RollupCreator/v2.1';
import { rollupCreatorABI as rollupCreatorV1Dot1ABI } from './contracts/RollupCreator/v1.1';

const createRollupV3Dot2ABI = getAbiItem({ abi: rollupCreatorV3Dot2ABI, name: 'createRollup' });
const createRollupV3Dot1ABI = getAbiItem({ abi: rollupCreatorV3Dot1ABI, name: 'createRollup' });
const createRollupV2Dot1ABI = getAbiItem({ abi: rollupCreatorV2Dot1ABI, name: 'createRollup' });
const createRollupV1Dot1ABI = getAbiItem({ abi: rollupCreatorV1Dot1ABI, name: 'createRollup' });

function parseConfig(config: { chainConfig: string }): boolean {
  return JSON.parse(config.chainConfig).arbitrum.DataAvailabilityCommittee;
}

export async function isAnyTrust<TChain extends Chain>({
  rollup,
  publicClient,
}: {
  rollup: Address;
  publicClient: PublicClient<Transport, TChain>;
}) {
  const createRollupTransactionHash = await createRollupFetchTransactionHash({
    rollup,
    publicClient,
  });

  const transaction = await publicClient.getTransaction({
    hash: createRollupTransactionHash,
  });

  let result: boolean | null = null;
  // try parsing from multiple RollupCreator versions
  [
    // v3.2
    createRollupV3Dot2ABI,
    // v3.1
    createRollupV3Dot1ABI,
    // v2.1
    createRollupV2Dot1ABI,
    // v1.1
    createRollupV1Dot1ABI,
  ].forEach((abi) => {
    try {
      const {
        args: [{ config }],
      } = decodeFunctionData({
        abi: [abi],
        data: transaction.input,
      });

      result = parseConfig(config);
    } catch (error) {
      // do nothing
    }
  });

  if (result === null) {
    throw new Error(
      `[isAnyTrust] failed to decode input data for transaction ${createRollupTransactionHash}`,
    );
  }

  return result;
}
