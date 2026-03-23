import { inject } from 'vitest';

export const INTEGRATION_TEST_MODE = 'integrationTestMode' as const;
export type IntegrationTestMode = 'testnode' | 'anvil';

declare module 'vitest' {
  export interface ProvidedContext {
    integrationTestMode: IntegrationTestMode;
  }
}

export function isAnvilIntegrationTestMode(): boolean {
  const value = inject(INTEGRATION_TEST_MODE);

  if (value === 'anvil') {
    return true;
  }

  return false;
}
