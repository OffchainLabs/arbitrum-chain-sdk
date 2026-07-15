import { z } from 'zod';
import { withWalletClient } from '../viemTransforms';
import { addressSchema, privateKeySchema } from './common';

export const deployTokenBridgeCreatorSchema = z
  .strictObject({
    rpcUrl: z.url(),
    chainId: z.number(),
    privateKey: privateKeySchema,
    l1Weth: addressSchema,
  })
  .transform(withWalletClient);
