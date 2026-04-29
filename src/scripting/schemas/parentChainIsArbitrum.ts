import { z } from 'zod';
import { ParentChainId } from '../../types/ParentChain';

export const parentChainIsArbitrumSchema = z
  .strictObject({
    parentChainId: z.number(),
  })
  .transform((input): [ParentChainId] => [input.parentChainId as ParentChainId]);
