import { z } from 'zod';
import { prepareKeysetHash } from '../../prepareKeysetHash';

export const prepareKeysetHashSchema = z
  .object({
    keysetBytes: z.string(),
  })
  .strict();

export const prepareKeysetHashTransform = (
  input: z.output<typeof prepareKeysetHashSchema>,
): Parameters<typeof prepareKeysetHash> => [input.keysetBytes];
