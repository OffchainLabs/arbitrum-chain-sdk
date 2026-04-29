import { Address, PublicClient, Chain, Transport } from 'viem';

import { CoreContracts } from './types/CoreContracts';
import { createRollupFetchTransactionHash } from './createRollupFetchTransactionHash';
import { createRollupPrepareTransactionReceipt } from './createRollupPrepareTransactionReceipt';

export type CreateRollupFetchCoreContractsParams<TChain extends Chain | undefined> = {
  /**
   * Address of the Rollup contract.
   */
  rollup: Address;
  /**
   * Number of the block in which the Rollup contract was deployed.
   *
   * This parameter is used to reduce the span of blocks to query, so it doesn't have to be exactly the right block number.
   * However, for the query to work properly, it has to be **less than or equal to** the right block number.
   */
  rollupDeploymentBlockNumber?: bigint;
  publicClient: PublicClient<Transport, TChain>;
};

export async function createRollupFetchCoreContracts<TChain extends Chain | undefined>({
  rollup,
  rollupDeploymentBlockNumber,
  publicClient,
}: CreateRollupFetchCoreContractsParams<TChain>): Promise<CoreContracts> {
  // getting core contract addresses
  const transactionHash = await createRollupFetchTransactionHash({
    rollup,
    publicClient,
    fromBlock: rollupDeploymentBlockNumber,
  });

  const transactionReceipt = createRollupPrepareTransactionReceipt(
    await publicClient.waitForTransactionReceipt({
      hash: transactionHash,
    }),
  );

  return transactionReceipt.getCoreContracts();
}
