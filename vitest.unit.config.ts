import { configDefaults, defineConfig, mergeConfig } from 'vitest/config';
import commonConfig from './vitest.common';

export default mergeConfig(
  commonConfig,
  defineConfig({
    test: {
      // allow tests to run for 1 minute as some rpc calls can be slow
      testTimeout: 60 * 1000,
      exclude: [...configDefaults.exclude, './src/**/*.integration.test.ts'],
      include: ['./src/**/*.unit.test.ts'],
    },
  }),
);
