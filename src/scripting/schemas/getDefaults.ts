import { z } from 'zod';
import { Client, Transport, Chain } from 'viem';
import { toPublicClient } from '../viemTransforms';
import { ParentChainId } from '../../types/ParentChain';

export const getDefaultsSchema = z.union([
  z.object({ parentChainId: z.number().transform((n) => n as ParentChainId) }),
  z.object({ rpcUrl: z.url() }),
]);

export const getDefaultsTransform = (
  input: z.output<typeof getDefaultsSchema>,
): readonly [ParentChainId | Client<Transport, Chain | undefined>] => {
  if ('rpcUrl' in input) {
    return [toPublicClient(input.rpcUrl)];
  }
  return [input.parentChainId];
};
