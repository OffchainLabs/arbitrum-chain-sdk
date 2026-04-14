import { z } from 'zod';
import { ParentChainId } from '../../types/ParentChain';

export const parentChainIsArbitrumSchema = z.strictObject({
  parentChainId: z.number(),
});

export const parentChainIsArbitrumTransform = (
  input: z.output<typeof parentChainIsArbitrumSchema>,
): [ParentChainId] => [input.parentChainId as ParentChainId];
