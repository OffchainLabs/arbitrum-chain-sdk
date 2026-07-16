import { z } from 'zod';
import { toWalletClient, findChain } from '../viemTransforms';
import { bigintSchema, privateKeySchema } from '../schemas/common';
import { deployWeth } from '../../deployWeth';
import { deployRollupCreator } from '../../deployRollupCreator';
import { deployTokenBridgeCreator } from '../../deployTokenBridgeCreator';

export const inputSchema = z.strictObject({
  rpcUrl: z.url(),
  chainId: z.number(),
  privateKey: privateKeySchema,
  // Forwarded to deployRollupCreator; a later createRollup must pass the same value. Omit for the default.
  maxDataSize: bigintSchema.optional(),
});

export const schema = inputSchema.transform((input) => ({
  walletClient: toWalletClient(input.rpcUrl, input.privateKey, findChain(input.chainId)),
  maxDataSize: input.maxDataSize,
}));

export const execute = async ({ walletClient, maxDataSize }: z.output<typeof schema>) => {
  // WETH first: deployTokenBridgeCreator bakes its address in as l1Weth.
  const { weth } = await deployWeth({ walletClient });
  const { rollupCreator } = await deployRollupCreator({ walletClient, maxDataSize });
  const { tokenBridgeCreator } = await deployTokenBridgeCreator({ walletClient, l1Weth: weth });

  return { rollupCreator, tokenBridgeCreator, weth };
};
