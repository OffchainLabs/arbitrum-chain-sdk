import { z } from 'zod';
import { withWalletClient } from '../viemTransforms';
import { privateKeySchema } from './common';

// Deploys on whatever chain rpcUrl/chainId point at (typically the parent chain of a new Orbit chain).
export const deployRollupCreatorSchema = z
  .strictObject({
    rpcUrl: z.url(),
    chainId: z.number(),
    privateKey: privateKeySchema,
  })
  .transform(withWalletClient);
