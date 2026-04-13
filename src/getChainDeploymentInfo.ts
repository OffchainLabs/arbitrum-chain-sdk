import { Address, PublicClient, Transport, Chain } from 'viem';

import { ChainConfig } from './types/ChainConfig';
import { rollupABI } from './contracts/Rollup';
import { createRollupFetchTransactionHash } from './createRollupFetchTransactionHash';
import { createRollupPrepareTransaction } from './createRollupPrepareTransaction';
import { createRollupPrepareTransactionReceipt } from './createRollupPrepareTransactionReceipt';
import { getArbOSVersion } from './utils/getArbOSVersion';

export type ChainDeploymentInfo = {
  chainId: number;
  parentChainId: number;
  parentChainIsArbitrum: boolean;
  chainName: string;
  chainConfig: ChainConfig;
  rollup: {
    rollup: Address;
    bridge: Address;
    inbox: Address;
    sequencerInbox: Address;
    validatorWalletCreator: Address;
    stakeToken: Address;
    deployedAtBlockNumber: number;
  };
};

export type GetChainDeploymentInfoParams<TChain extends Chain | undefined> = {
  rollup: Address;
  chainName: string;
  parentChainPublicClient: PublicClient<Transport, TChain>;
  rollupDeploymentBlockNumber?: bigint;
};

async function parentChainIsArbitrum<TChain extends Chain | undefined>(
  parentChainPublicClient: PublicClient<Transport, TChain>,
): Promise<boolean> {
  try {
    await getArbOSVersion(parentChainPublicClient);
    return true;
  } catch {
    return false;
  }
}

export async function getChainDeploymentInfo<TChain extends Chain | undefined>({
  rollup,
  chainName,
  parentChainPublicClient,
  rollupDeploymentBlockNumber,
}: GetChainDeploymentInfoParams<TChain>): Promise<ChainDeploymentInfo> {
  const transactionHash = await createRollupFetchTransactionHash({
    rollup,
    publicClient: parentChainPublicClient,
    fromBlock: rollupDeploymentBlockNumber,
  });

  const [txData, txReceiptData, stakeToken, isArbitrum] = await Promise.all([
    parentChainPublicClient.getTransaction({ hash: transactionHash }),
    parentChainPublicClient.getTransactionReceipt({ hash: transactionHash }),
    parentChainPublicClient.readContract({
      address: rollup,
      abi: rollupABI,
      functionName: 'stakeToken',
    }),
    parentChainIsArbitrum(parentChainPublicClient),
  ]);

  const chainConfig: ChainConfig = JSON.parse(
    createRollupPrepareTransaction(txData).getInputs()[0].config.chainConfig,
  );

  const coreContracts = createRollupPrepareTransactionReceipt(txReceiptData).getCoreContracts();

  return {
    chainId: chainConfig.chainId,
    parentChainId: parentChainPublicClient.chain?.id ?? 0,
    parentChainIsArbitrum: isArbitrum,
    chainName,
    chainConfig,
    rollup: {
      rollup: coreContracts.rollup,
      bridge: coreContracts.bridge,
      inbox: coreContracts.inbox,
      sequencerInbox: coreContracts.sequencerInbox,
      validatorWalletCreator: coreContracts.validatorWalletCreator,
      stakeToken,
      deployedAtBlockNumber: coreContracts.deployedAtBlockNumber,
    },
  };
}
