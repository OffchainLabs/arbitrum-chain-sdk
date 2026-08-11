import { z } from 'zod';
import { prepareKeysetHash } from '../../prepareKeysetHash';

export const prepareKeysetHashSchema = z
  .strictObject({
    keysetBytes: z.string(),
  })
  .transform((input): Parameters<typeof prepareKeysetHash> => [input.keysetBytes]);
