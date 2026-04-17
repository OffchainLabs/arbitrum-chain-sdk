import { z } from 'zod';
import { prepareChainConfigArbitrumParamsSchema } from './common';
import { prepareChainConfig } from '../../prepareChainConfig';

export const prepareChainConfigInputSchema = z.strictObject({
  chainId: z.number(),
  arbitrum: prepareChainConfigArbitrumParamsSchema,
});

export const prepareChainConfigParamsSchema = prepareChainConfigInputSchema.transform(
  (input): Parameters<typeof prepareChainConfig> => [input],
);
