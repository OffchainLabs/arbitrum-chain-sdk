import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    sequence: {
      concurrent: false,
    },
    snapshotFormat: {
      escapeString: true,
    },
    typecheck: {
      enabled: true,
    },
  },
});
