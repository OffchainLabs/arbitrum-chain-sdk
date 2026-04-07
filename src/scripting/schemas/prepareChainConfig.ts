import { z } from 'zod';
import { prepareChainConfigArbitrumParamsSchema } from './common';
import { prepareChainConfig } from '../../prepareChainConfig';

export const prepareChainConfigParamsSchema = z
  .object({
    chainId: z.number(),
    arbitrum: prepareChainConfigArbitrumParamsSchema,
  })
  .strict();

export const prepareChainConfigTransform = (
  input: z.output<typeof prepareChainConfigParamsSchema>,
): Parameters<typeof prepareChainConfig> => [input];
