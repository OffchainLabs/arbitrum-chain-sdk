import { describe, expect, it } from 'vitest';

import { getCustomParentChains, registerCustomParentChain } from './chains';
import { testHelper_createCustomParentChain } from './testHelpers';

describe('registerCustomParentChain', () => {
  it(`throws if "contracts.rollupCreator.address" is invalid`, () => {
    // omit contracts from the chain
    const { ...chain } = testHelper_createCustomParentChain();

    expect(() =>
      registerCustomParentChain({
        ...chain,
        contracts: {
          rollupCreator: {
            address: '0x123',
          },
          tokenBridgeCreator: {
            address: '0x123',
          },
        },
      }),
    ).toThrowError(
      `"contracts.rollupCreator.address" is invalid for custom parent chain with id ${chain.id}`,
    );
  });

  it(`throws if "contracts.tokenBridgeCreator.address" is invalid`, () => {
    // omit contracts from the chain
    const { contracts, ...chain } = testHelper_createCustomParentChain();

    expect(() =>
      registerCustomParentChain({
        ...chain,
        contracts: {
          rollupCreator: {
            // use a correct address for the RollupCreator
            address: contracts.rollupCreator.address,
          },
          tokenBridgeCreator: {
            address: '0x0',
          },
        },
      }),
    ).toThrowError(
      `"contracts.tokenBridgeCreator.address" is invalid for custom parent chain with id ${chain.id}`,
    );
  });

  it('successfully registers a custom parent chain', () => {
    const chain = testHelper_createCustomParentChain();

    // assert before
    expect(getCustomParentChains().map((c) => c.id)).not.includes(chain.id);

    // register
    registerCustomParentChain(chain);

    // assert after
    expect(getCustomParentChains().map((c) => c.id)).includes(chain.id);
  });
});
