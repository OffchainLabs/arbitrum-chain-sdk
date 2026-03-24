import { inject } from 'vitest';

import {
  type AnvilTestStack,
  type InjectedAnvilTestStack,
  hydrateAnvilTestStack,
} from './anvilHarness';

export type IntegrationTestMode = 'testnode' | 'anvil';

declare module 'vitest' {
  export interface ProvidedContext {
    integrationTestMode: IntegrationTestMode;
    anvilTestStack?: InjectedAnvilTestStack;
  }
}

export function isAnvilTestMode(): boolean {
  const value = inject('integrationTestMode');

  if (value === 'anvil') {
    return true;
  }

  return false;
}

export function getAnvilTestStack(): AnvilTestStack {
  const value = inject('anvilTestStack');

  if (value === undefined) {
    throw new Error('Injected Anvil test stack is unavailable.');
  }

  return hydrateAnvilTestStack(value);
}
