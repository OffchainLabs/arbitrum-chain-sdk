import { z } from 'zod';
import { prepareKeyset } from '../../prepareKeyset';

export const prepareKeysetSchema = z
  .object({
    publicKeys: z.array(z.string()),
    assumedHonest: z.number(),
  })
  .strict();

export const prepareKeysetTransform = (
  input: z.output<typeof prepareKeysetSchema>,
): Parameters<typeof prepareKeyset> => [input.publicKeys, input.assumedHonest];
