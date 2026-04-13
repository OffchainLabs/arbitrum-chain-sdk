import { z } from 'zod';
import { parseAbi } from 'viem';
import { runScript } from '../scriptUtils';
import { addressSchema, bigintSchema } from '../schemas/common';
import { toPublicClient, findChain } from '../viemTransforms';
import { createRollupFetchTransactionHash } from '../../createRollupFetchTransactionHash';
import { createRollupPrepareTransaction } from '../../createRollupPrepareTransaction';
import { createRollupPrepareTransactionReceipt } from '../../createRollupPrepareTransactionReceipt';
import { getArbOSVersion } from '../../utils/getArbOSVersion';
import { ChainConfig } from '../../types/ChainConfig';

export const schema = z
  .strictObject({
    parentChainRpcUrl: z.url(),
    parentChainId: z.number(),
    rollup: addressSchema,
    chainName: z.string(),
    rollupDeploymentBlockNumber: bigintSchema.optional(),
  })
  .transform((input) => ({
    rollup: input.rollup,
    chainName: input.chainName,
    parentChainPublicClient: toPublicClient(
      input.parentChainRpcUrl,
      findChain(input.parentChainId),
    ),
    parentChainId: input.parentChainId,
    rollupDeploymentBlockNumber: input.rollupDeploymentBlockNumber,
  }));

export const execute = async (input: z.output<typeof schema>) => {
  const { rollup, chainName, parentChainPublicClient, parentChainId, rollupDeploymentBlockNumber } =
    input;

  const transactionHash = await createRollupFetchTransactionHash({
    rollup,
    publicClient: parentChainPublicClient,
    fromBlock: rollupDeploymentBlockNumber,
  });

  const [txData, txReceiptData, stakeToken, parentChainIsArbitrum] = await Promise.all([
    parentChainPublicClient.getTransaction({ hash: transactionHash }),
    parentChainPublicClient.getTransactionReceipt({ hash: transactionHash }),
    parentChainPublicClient.readContract({
      address: rollup,
      abi: parseAbi(['function stakeToken() view returns (address)']),
      functionName: 'stakeToken',
    }),
    getArbOSVersion(parentChainPublicClient)
      .then(() => true)
      .catch(() => false),
  ]);

  const chainConfig: ChainConfig = JSON.parse(
    createRollupPrepareTransaction(txData).getInputs()[0].config.chainConfig,
  );

  const coreContracts = createRollupPrepareTransactionReceipt(txReceiptData).getCoreContracts();

  return {
    chainId: chainConfig.chainId,
    parentChainId,
    parentChainIsArbitrum,
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
};

runScript(schema, execute);
