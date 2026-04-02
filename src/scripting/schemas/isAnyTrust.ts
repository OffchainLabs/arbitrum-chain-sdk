import { z } from 'zod';
import { Chain } from 'viem';
import { toPublicClient } from '../viemTransforms';
import { addressSchema } from './common';

export const isAnyTrustSchema = z.object({
  rpcUrl: z.string().url(),
  rollup: addressSchema,
}).strict();

export const isAnyTrustTransform = <TChain extends Chain | undefined = undefined>(
  input: z.output<typeof isAnyTrustSchema>,
  chain?: TChain,
) => [{
  rollup: input.rollup,
  publicClient: toPublicClient(input.rpcUrl, chain),
}] as const;
