import { z } from 'zod';

export const prepareKeysetSchema = z.object({
  publicKeys: z.array(z.string()),
  assumedHonest: z.number(),
}).strict();

export const prepareKeysetTransform = (
  input: z.output<typeof prepareKeysetSchema>,
) => [input.publicKeys, input.assumedHonest] as const;
