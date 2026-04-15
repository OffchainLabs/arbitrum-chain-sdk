import { z } from 'zod';
import { toPublicClient, findChain } from '../../viemTransforms';
import { bigintSchema, gasOptionsSchema, actionWriteBaseSchema } from '../common';
import { buildScheduleArbOSUpgrade } from '../../../actions/buildScheduleArbOSUpgrade';

export const buildScheduleArbOSUpgradeSchema = actionWriteBaseSchema
  .extend({
    newVersion: bigintSchema,
    timestamp: bigintSchema,
    gasOverrides: z
      .object({
        gasLimit: gasOptionsSchema.optional(),
      })
      .optional(),
  })
  .strict();

export const buildScheduleArbOSUpgradeTransform = (
  input: z.output<typeof buildScheduleArbOSUpgradeSchema>,
): Parameters<typeof buildScheduleArbOSUpgrade> => [
  toPublicClient(input.rpcUrl, findChain(input.chainId)),
  {
    account: input.account,
    upgradeExecutor: input.upgradeExecutor ?? false,
    args: [input.newVersion, input.timestamp],
    ...(input.gasOverrides && { gasOverrides: input.gasOverrides }),
  },
];
