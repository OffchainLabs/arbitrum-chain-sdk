import { z } from 'zod';
import { Chain } from 'viem';
import { toPublicClient } from '../viemTransforms';
import { addressSchema } from './common';

export const getKeysetsSchema = z.object({
  rpcUrl: z.string().url(),
  sequencerInbox: addressSchema,
});

export const getKeysetsTransform = <TChain extends Chain | undefined = undefined>(
  input: z.output<typeof getKeysetsSchema>,
  chain?: TChain,
) => [
  toPublicClient(input.rpcUrl, chain),
  { sequencerInbox: input.sequencerInbox },
] as const;
