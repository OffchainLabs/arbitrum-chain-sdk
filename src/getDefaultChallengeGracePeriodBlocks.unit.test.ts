import { it, expect } from 'vitest';

import { chains } from './chains';
import { ParentChainId } from './types/ParentChain';
import { getDefaultChallengeGracePeriodBlocks } from './getDefaultChallengeGracePeriodBlocks';

it('returns default value for challengeGracePeriodBlocks based on parent chain', () => {
  expect(
    chains
      .filter((chain) => chain.id !== 333333)
      .reduce((acc, value) => {
        return {
          ...acc,
          // it's ok to cast as we've filtered out 333333 above
          [value.id]: getDefaultChallengeGracePeriodBlocks(value.id as ParentChainId),
        };
      }, {}),
  ).toMatchSnapshot();
});
