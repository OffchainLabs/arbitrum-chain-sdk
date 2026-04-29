import { configDefaults, defineConfig, mergeConfig } from 'vitest/config';
import commonConfig from './vitest.common';

export default mergeConfig(
  commonConfig,
  defineConfig({
    test: {
      // allow tests to run for 7 minutes as retryables can take a while
      testTimeout: 7 * 60 * 1000,
      exclude: [...configDefaults.exclude, './src/**/*.unit.test.ts'],
      include: ['./src/**/*.integration.test.ts'],
      fileParallelism: false, // Run all integration tests sequentially
    },
  }),
);
