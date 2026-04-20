import { z } from 'zod';
import { Client, Transport, Chain } from 'viem';
import { toPublicClient } from '../viemTransforms';
import { ParentChainId } from '../../types/ParentChain';

export const getDefaultsSchema = z
  .union([
    z.strictObject({ parentChainId: z.number().transform((n) => n as ParentChainId) }),
    z.strictObject({ rpcUrl: z.url() }),
  ])
  .transform(
    (input): readonly [ParentChainId | Client<Transport, Chain | undefined>] => {
      if ('rpcUrl' in input) {
        return [toPublicClient(input.rpcUrl)];
      }
      return [input.parentChainId];
    },
  );
