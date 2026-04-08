import { z } from 'zod';
import { prepareKeysetHash } from '../../prepareKeysetHash';

export const prepareKeysetHashSchema = z.strictObject({
  keysetBytes: z.string(),
});

export const prepareKeysetHashTransform = (
  input: z.output<typeof prepareKeysetHashSchema>,
): Parameters<typeof prepareKeysetHash> => [input.keysetBytes];
