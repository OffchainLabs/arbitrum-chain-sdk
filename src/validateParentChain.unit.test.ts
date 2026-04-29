import { it, expect } from 'vitest';

import { validateParentChain } from './types/ParentChain';
import { arbitrumOne, registerCustomParentChain } from './chains';
import { generateChainId } from './utils';

import { testHelper_createCustomParentChain } from './testHelpers';

it(`sucessfully validates arbitrum one`, () => {
  const result = validateParentChain(arbitrumOne.id);

  expect(result.chainId).toEqual(arbitrumOne.id);
  expect(result.isCustom).toEqual(false);
});

it(`throws for an unregistered custom parent chain`, () => {
  const id = generateChainId();

  expect(() => validateParentChain(id)).toThrowError(`Parent chain not supported: ${id}`);
});

it(`sucessfully validates a registered custom parent chain`, () => {
  const chain = testHelper_createCustomParentChain();

  registerCustomParentChain(chain);

  const result = validateParentChain(chain.id);

  expect(result.chainId).toEqual(chain.id);
  expect(result.isCustom).toEqual(true);
});
