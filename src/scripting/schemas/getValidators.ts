import { z } from 'zod';
import { Chain } from 'viem';
import { toPublicClient } from '../viemTransforms';
import { addressSchema } from './common';

export const getValidatorsSchema = z.object({
  rpcUrl: z.string().url(),
  rollup: addressSchema,
}).strict();

export const getValidatorsTransform = <TChain extends Chain | undefined = undefined>(
  input: z.output<typeof getValidatorsSchema>,
  chain?: TChain,
) => [
  toPublicClient(input.rpcUrl, chain),
  { rollup: input.rollup },
] as const;
