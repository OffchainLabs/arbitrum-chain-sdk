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
      testTimeout: 45 * 60 * 1000,
      setupFiles: ['./src/integrationTestHelpers/globalSetup.mjs'],
      exclude: [...configDefaults.exclude],
      include: ['./src/createRollup.integration.test.ts'],
      fileParallelism: false,
    },
  }),
);
