import { it, expect } from 'vitest';

import { prepareChainConfig, PrepareChainConfigParams } from './prepareChainConfig';

const chainId = 69_420;
const vitalik: `0x${string}` = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045';

it('creates chain config with defaults', () => {
  const params = {
    chainId,
    arbitrum: {
      InitialChainOwner: vitalik,
    },
  };

  expect(prepareChainConfig(params)).toMatchSnapshot();
});

it('creates chain config with custom params', () => {
  const params: PrepareChainConfigParams = {
    chainId,
    arbitrum: {
      InitialChainOwner: vitalik,
      InitialArbOSVersion: 20,
      DataAvailabilityCommittee: true,
      MaxCodeSize: 40 * 1024,
      MaxInitCodeSize: 80 * 1024,
    },
  };

  expect(prepareChainConfig(params)).toMatchSnapshot();
});
