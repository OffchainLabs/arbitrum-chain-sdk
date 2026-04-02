import { z } from 'zod';

export const prepareKeysetHashSchema = z.object({
  keysetBytes: z.string(),
}).strict();

export const prepareKeysetHashTransform = (
  input: z.output<typeof prepareKeysetHashSchema>,
) => [input.keysetBytes] as const;
