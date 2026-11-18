import { z } from 'zod';

import { getNitroContractVersions } from '../../getNitroContractVersions';
import { addressSchema } from './common';

export const getNitroContractVersionsSchema = z
  .object({
    inboxAddress: addressSchema,
    parentChainRpc: z.url(),
  })
  .strict()
  .transform(
    (input): Parameters<typeof getNitroContractVersions> => [
      input.inboxAddress,
      input.parentChainRpc,
    ],
  );
