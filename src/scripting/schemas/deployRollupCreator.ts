import { z } from 'zod';
import { withWalletClient } from '../viemTransforms';
import { bigintSchema, privateKeySchema } from './common';

export const deployRollupCreatorSchema = z
  .strictObject({
    rpcUrl: z.url(),
    chainId: z.number(),
    privateKey: privateKeySchema,
    maxDataSize: bigintSchema.optional(),
  })
  .transform(withWalletClient);
