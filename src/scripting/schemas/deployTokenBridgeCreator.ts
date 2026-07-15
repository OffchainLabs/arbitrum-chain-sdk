import { z } from 'zod';
import { withWalletClient } from '../viemTransforms';
import { addressSchema, privateKeySchema } from './common';

// Deploys on whatever chain rpcUrl/chainId point at (typically the parent chain of a new Orbit chain).
// l1Weth is the WETH on that chain, wired into the WETH gateway (e.g. from the deployWeth command).
export const deployTokenBridgeCreatorSchema = z
  .strictObject({
    rpcUrl: z.url(),
    chainId: z.number(),
    privateKey: privateKeySchema,
    l1Weth: addressSchema,
  })
  .transform(withWalletClient);
