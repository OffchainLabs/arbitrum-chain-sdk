import {
  dehydrateAnvilTestStack,
  setupAnvilTestStack,
  teardownAnvilTestStack,
} from './anvilHarness.ts';

export async function setup(project) {
  const env = await setupAnvilTestStack();
  project.provide('anvilTestStack', structuredClone(dehydrateAnvilTestStack(env)));

  return async () => {
    await teardownAnvilTestStack();
  };
}
