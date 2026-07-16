import { z } from 'zod';
import { withWalletClient } from '../viemTransforms';
import { bigintSchema, privateKeySchema } from './common';

export const deployRollupCreatorSchema = z
  .strictObject({
    rpcUrl: z.url(),
    chainId: z.number(),
    privateKey: privateKeySchema,
    // Set this to match the maxDataSize a later createRollup uses; omit to take the SDK default.
    maxDataSize: bigintSchema.optional(),
  })
  .transform(withWalletClient);
