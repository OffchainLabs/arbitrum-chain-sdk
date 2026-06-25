import { z } from 'zod';
import { withChildChainSign } from '../viemTransforms';
import { privateKeySchema } from './common';

export const deployProxyAdminSchema = z
  .strictObject({
    orbitChainRpcUrl: z.url(),
    orbitChainId: z.number(),
    privateKey: privateKeySchema,
  })
  .transform(withChildChainSign);
