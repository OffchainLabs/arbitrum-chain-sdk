import { configDefaults, defineConfig, mergeConfig } from 'vitest/config';
import commonConfig from './vitest.common';

export default mergeConfig(
  commonConfig,
  defineConfig({
    test: {
      provide: {
        integrationTestMode: 'anvil',
      },
      // The Anvil stack boots a forked L1 and dockerized Nitro L2 in-process.
      // Use worker threads so the provided Anvil env can cross the worker boundary with structured clone.
      pool: 'threads',
      testTimeout: 45 * 60 * 1000,
      globalSetup: ['./src/integrationTestHelpers/globalSetup.mjs'],
      exclude: [...configDefaults.exclude],
      include: [
        './src/createRollup.integration.test.ts',
        './src/decorators/arbAggregatorActions.integration.test.ts',
        './src/getBatchPosters.integration.test.ts',
      ],
      fileParallelism: false,
    },
  }),
);
