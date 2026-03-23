import { afterAll } from 'vitest';

import { setupAnvilTestStack, teardownAnvilTestStack } from './anvilHarness.ts';

await setupAnvilTestStack();

afterAll(() => {
  teardownAnvilTestStack();
});
