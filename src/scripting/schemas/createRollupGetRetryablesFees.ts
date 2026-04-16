import { z } from 'zod';
import { toPublicClient, findChain } from '../viemTransforms';
import {
  addressSchema,
  bigintSchema,
  publicClientSchema,
  rollupCreatorVersionSchema,
} from './common';
import { createRollupGetRetryablesFees } from '../../createRollupGetRetryablesFees';

export const createRollupGetRetryablesFeesSchema = publicClientSchema
  .extend({
    account: addressSchema,
    nativeToken: addressSchema.optional(),
    maxFeePerGasForRetryables: bigintSchema.optional(),
    rollupCreatorVersion: rollupCreatorVersionSchema.optional(),
  })
  .strict()
  .transform(
    (input): Parameters<typeof createRollupGetRetryablesFees> => [
      toPublicClient(input.rpcUrl, findChain(input.chainId)),
      {
        account: input.account,
        nativeToken: input.nativeToken,
        maxFeePerGasForRetryables: input.maxFeePerGasForRetryables,
      },
      input.rollupCreatorVersion,
    ],
  );
