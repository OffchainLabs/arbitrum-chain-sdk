import { z } from 'zod';

import { getChainContractVersions } from '../../getChainContractVersions';
import { addressSchema } from './common';

export const getChainContractVersionsSchema = z
  .object({
    inboxAddress: addressSchema,
    parentChainRpc: z.url(),
  })
  .strict()
  .transform(
    (input): Parameters<typeof getChainContractVersions> => [
      input.inboxAddress,
      input.parentChainRpc,
    ],
  );
