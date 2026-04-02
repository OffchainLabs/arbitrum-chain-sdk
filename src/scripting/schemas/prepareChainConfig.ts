import { z } from 'zod';
import { prepareChainConfigArbitrumParamsSchema } from './common';

export const prepareChainConfigParamsSchema = z
  .object({
    chainId: z.number(),
    arbitrum: prepareChainConfigArbitrumParamsSchema,
  })
  .strict();

export const prepareChainConfigTransform = (
  input: z.output<typeof prepareChainConfigParamsSchema>,
) => [input] as const;
