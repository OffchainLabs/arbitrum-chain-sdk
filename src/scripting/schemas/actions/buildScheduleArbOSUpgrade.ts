import { z } from 'zod';
import { toPublicClient, toAccount, findChain } from '../../viemTransforms';
import { addressSchema, bigintSchema, privateKeySchema, gasOptionsSchema } from '../common';
import { buildScheduleArbOSUpgrade } from '../../../actions/buildScheduleArbOSUpgrade';

export const buildScheduleArbOSUpgradeSchema = z.strictObject({
  rpcUrl: z.url(),
  chainId: z.number(),
  privateKey: privateKeySchema,
  upgradeExecutor: addressSchema.optional(),
  newVersion: bigintSchema,
  timestamp: bigintSchema,
  gasOverrides: z
    .object({
      gasLimit: gasOptionsSchema.optional(),
    })
    .optional(),
});

export const buildScheduleArbOSUpgradeTransform = (
  input: z.output<typeof buildScheduleArbOSUpgradeSchema>,
): Parameters<typeof buildScheduleArbOSUpgrade> => [
  toPublicClient(input.rpcUrl, findChain(input.chainId)),
  {
    account: toAccount(input.privateKey).address,
    upgradeExecutor: input.upgradeExecutor ?? false,
    args: [input.newVersion, input.timestamp],
    ...(input.gasOverrides && { gasOverrides: input.gasOverrides }),
  },
];
