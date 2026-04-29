import { z } from 'zod';
import { toPublicClient, findChain } from '../../viemTransforms';
import { bigintSchema, gasOptionsSchema, actionWriteBaseSchema } from '../common';

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
  .strict()
  .transform((input) => {
    const { rpcUrl, chainId, newVersion, timestamp, gasOverrides, ...rest } = input;
    return [
      toPublicClient(rpcUrl, findChain(chainId)),
      { ...rest, args: [newVersion, timestamp] as const, ...(gasOverrides && { gasOverrides }) },
    ] as const;
  });
