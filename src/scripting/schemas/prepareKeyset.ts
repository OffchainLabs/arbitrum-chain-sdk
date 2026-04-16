import { z } from 'zod';
import { prepareKeyset } from '../../prepareKeyset';

export const prepareKeysetSchema = z
  .strictObject({
    publicKeys: z.array(z.string()),
    assumedHonest: z.number(),
  })
  .transform(
    (input): Parameters<typeof prepareKeyset> => [input.publicKeys, input.assumedHonest],
  );
