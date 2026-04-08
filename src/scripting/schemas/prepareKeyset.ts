import { z } from 'zod';
import { prepareKeyset } from '../../prepareKeyset';

export const prepareKeysetSchema = z.strictObject({
  publicKeys: z.array(z.string()),
  assumedHonest: z.number(),
});

export const prepareKeysetTransform = (
  input: z.output<typeof prepareKeysetSchema>,
): Parameters<typeof prepareKeyset> => [input.publicKeys, input.assumedHonest];
