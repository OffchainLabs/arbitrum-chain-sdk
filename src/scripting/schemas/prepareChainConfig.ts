import { z } from 'zod';
import { prepareChainConfigArbitrumParamsSchema } from './common';
import { prepareChainConfig } from '../../prepareChainConfig';

export const prepareChainConfigParamsBaseSchema = z.strictObject({
  chainId: z.number(),
  arbitrum: prepareChainConfigArbitrumParamsSchema,
});

export const prepareChainConfigParamsSchema = prepareChainConfigParamsBaseSchema.transform(
  (input): Parameters<typeof prepareChainConfig> => [input],
);
