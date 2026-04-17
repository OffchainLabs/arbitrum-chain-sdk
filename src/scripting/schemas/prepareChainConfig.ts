import { z } from 'zod';
import { prepareChainConfigArbitrumParamsSchema } from './common';
import { prepareChainConfig } from '../../prepareChainConfig';

export const prepareChainConfigParamsSchema = z
  .strictObject({
    chainId: z.number(),
    arbitrum: prepareChainConfigArbitrumParamsSchema,
  })
  .transform((input): Parameters<typeof prepareChainConfig> => [input]);
