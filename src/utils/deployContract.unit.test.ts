import { describe, expect, it } from 'vitest';

import { chunkByGas } from './deployContract';

describe('chunkByGas', () => {
  it('keeps a wave that fits the budget in one chunk', () => {
    expect(chunkByGas(['a', 'b', 'c'], [5n, 5n, 5n], 15n)).toEqual([[0, 1, 2]]);
  });

  it('starts a new chunk before the budget would be exceeded, keeping order', () => {
    expect(chunkByGas(['a', 'b', 'c', 'd'], [6n, 6n, 6n, 1n], 12n)).toEqual([
      [0, 1],
      [2, 3],
    ]);
  });

  it('gives a transaction over the budget a chunk of its own', () => {
    expect(chunkByGas(['a', 'b', 'c'], [1n, 20n, 1n], 10n)).toEqual([[0], [1], [2]]);
  });

  it('returns no chunks for an empty wave', () => {
    expect(chunkByGas([], [], 10n)).toEqual([]);
  });
});
