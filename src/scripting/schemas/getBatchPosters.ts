import { z } from 'zod';
import { Chain } from 'viem';
import { toPublicClient } from '../viemTransforms';
import { addressSchema } from './common';

export const getBatchPostersSchema = z.object({
  rpcUrl: z.string().url(),
  rollup: addressSchema,
  sequencerInbox: addressSchema,
}).strict();

export const getBatchPostersTransform = <TChain extends Chain | undefined = undefined>(
  input: z.output<typeof getBatchPostersSchema>,
  chain?: TChain,
) => [
  toPublicClient(input.rpcUrl, chain),
  { rollup: input.rollup, sequencerInbox: input.sequencerInbox },
] as const;
