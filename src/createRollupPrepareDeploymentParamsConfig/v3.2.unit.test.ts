import { it, expect } from 'vitest';
import { Address, createPublicClient, http, parseEther } from 'viem';

import {
  arbitrumOne,
  arbitrumSepolia,
  base,
  baseSepolia,
  registerCustomParentChain,
} from '../chains';
import { prepareChainConfig } from '../prepareChainConfig';
import { createRollupPrepareDeploymentParamsConfig } from '../createRollupPrepareDeploymentParamsConfig';

import { testHelper_createCustomParentChain } from '../testHelpers';

const chainId = 69_420n;
const vitalik: `0x${string}` = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045';

function getOverrides({ owner, chainId }: { owner: Address; chainId: bigint }) {
  return {
    owner,
    chainId,
    chainConfig: prepareChainConfig({
      chainId: Number(chainId),
      arbitrum: {
        InitialChainOwner: owner,
        InitialArbOSVersion: 20,
        DataAvailabilityCommittee: true,
      },
    }),
    confirmPeriodBlocks: 4200n,
    challengeGracePeriodBlocks: 4201n,
    bufferConfig: {
      threshold: 2n,
      max: 2n,
      replenishRateInBasis: 25n,
    },
    loserStakeEscrow: '0x0000000000000000000000000000000000000001',
    sequencerInboxMaxTimeVariation: {
      delayBlocks: 200n,
      delaySeconds: 5n,
      futureBlocks: 100n,
      futureSeconds: 1n,
    },
    validatorAfkBlocks: 14n,
    minimumAssertionPeriod: 15n,
    baseStake: parseEther('3'),
    stakeToken: '0x0000000000000000000000000000000000000002',
    wasmModuleRoot: '0xWasmModuleRoot',
  } as const;
}

it('creates config for a chain on top of arbitrum one with defaults', () => {
  const arbitrumOneClient = createPublicClient({
    chain: arbitrumOne,
    transport: http(),
  });

  expect(
    createRollupPrepareDeploymentParamsConfig(arbitrumOneClient, {
      owner: vitalik,
      chainId,
    }),
  ).toMatchSnapshot();
});

it('creates config for a chain on top of arbitrum one with overrides', () => {
  const arbitrumOneClient = createPublicClient({
    chain: arbitrumOne,
    transport: http(),
  });

  expect(
    createRollupPrepareDeploymentParamsConfig(
      arbitrumOneClient,
      getOverrides({ owner: vitalik, chainId }),
    ),
  ).toMatchSnapshot();
});

it('creates config for a chain on top of arbitrum sepolia with defaults', () => {
  const arbitrumSepoliaClient = createPublicClient({
    chain: arbitrumSepolia,
    transport: http(),
  });

  expect(
    createRollupPrepareDeploymentParamsConfig(arbitrumSepoliaClient, {
      owner: vitalik,
      chainId,
    }),
  ).toMatchSnapshot();
});

it('creates config for a chain on top of arbitrum sepolia with overrides', () => {
  const arbitrumSepoliaClient = createPublicClient({
    chain: arbitrumSepolia,
    transport: http(),
  });

  expect(
    createRollupPrepareDeploymentParamsConfig(
      arbitrumSepoliaClient,
      getOverrides({ owner: vitalik, chainId }),
    ),
  ).toMatchSnapshot();
});

it('creates config for a chain on top of base with defaults', () => {
  const baseClient = createPublicClient({
    chain: base,
    transport: http(),
  });

  expect(
    createRollupPrepareDeploymentParamsConfig(baseClient, {
      owner: vitalik,
      chainId,
    }),
  ).toMatchSnapshot();
});

it('creates config for a chain on top of base sepolia with defaults', () => {
  const baseSepoliaClient = createPublicClient({
    chain: baseSepolia,
    transport: http(),
  });

  expect(
    createRollupPrepareDeploymentParamsConfig(baseSepoliaClient, {
      owner: vitalik,
      chainId,
    }),
  ).toMatchSnapshot();
});

it('fails to create a config for a chain on top of a custom parent chain if "confirmPeriodBlocks" is not provided', () => {
  const chain = testHelper_createCustomParentChain();

  const publicClient = createPublicClient({
    chain,
    transport: http(),
  });

  registerCustomParentChain(chain);

  expect(() =>
    createRollupPrepareDeploymentParamsConfig(publicClient, {
      owner: vitalik,
      chainId: BigInt(chain.id),
    }),
  ).toThrowError('"params.confirmPeriodBlocks" must be provided when using a custom parent chain');
});

it('fails to create a config for a chain on top of a custom parent chain if "challengeGracePeriodBlocks" is not provided', () => {
  const chain = testHelper_createCustomParentChain();

  const publicClient = createPublicClient({
    chain,
    transport: http(),
  });

  registerCustomParentChain(chain);

  expect(() =>
    createRollupPrepareDeploymentParamsConfig(publicClient, {
      owner: vitalik,
      chainId: BigInt(chain.id),
      confirmPeriodBlocks: 1n,
    }),
  ).toThrowError(
    '"params.challengeGracePeriodBlocks" must be provided when using a custom parent chain',
  );
});

it('fails to create a config for a chain on top of a custom parent chain if "minimumAssertionPeriod" is not provided', () => {
  const chain = testHelper_createCustomParentChain();

  const publicClient = createPublicClient({
    chain,
    transport: http(),
  });

  registerCustomParentChain(chain);

  expect(() =>
    createRollupPrepareDeploymentParamsConfig(publicClient, {
      owner: vitalik,
      chainId: BigInt(chain.id),
      confirmPeriodBlocks: 1n,
      challengeGracePeriodBlocks: 2n,
    }),
  ).toThrowError(
    '"params.minimumAssertionPeriod" must be provided when using a custom parent chain',
  );
});

it('fails to create a config for a chain on top of a custom parent chain if "validatorAfkBlocks" is not provided', () => {
  const chain = testHelper_createCustomParentChain();

  const publicClient = createPublicClient({
    chain,
    transport: http(),
  });

  registerCustomParentChain(chain);

  expect(() =>
    createRollupPrepareDeploymentParamsConfig(publicClient, {
      owner: vitalik,
      chainId: BigInt(chain.id),
      confirmPeriodBlocks: 1n,
      challengeGracePeriodBlocks: 2n,
      minimumAssertionPeriod: 3n,
    }),
  ).toThrowError('"params.validatorAfkBlocks" must be provided when using a custom parent chain');
});

it('fails to create a config for a chain on top of a custom parent chain if "sequencerInboxMaxTimeVariation" is not provided', () => {
  const chain = testHelper_createCustomParentChain();

  const publicClient = createPublicClient({
    chain,
    transport: http(),
  });

  registerCustomParentChain(chain);

  expect(() =>
    createRollupPrepareDeploymentParamsConfig(publicClient, {
      owner: vitalik,
      chainId: BigInt(chain.id),
      confirmPeriodBlocks: 1n,
      challengeGracePeriodBlocks: 2n,
      minimumAssertionPeriod: 3n,
      validatorAfkBlocks: 4n,
    }),
  ).toThrowError(
    '"params.sequencerInboxMaxTimeVariation" must be provided when using a custom parent chain.',
  );
});

it('creates a config for a chain on top of a custom parent chain', () => {
  const chain = testHelper_createCustomParentChain({
    // using a specific chain id here as it's a snapshot test
    id: 123,
  });

  const publicClient = createPublicClient({
    chain,
    transport: http(),
  });

  registerCustomParentChain(chain);

  expect(
    createRollupPrepareDeploymentParamsConfig(publicClient, {
      owner: vitalik,
      chainId: BigInt(chain.id),
      confirmPeriodBlocks: 1n,
      challengeGracePeriodBlocks: 2n,
      minimumAssertionPeriod: 3n,
      validatorAfkBlocks: 4n,
      sequencerInboxMaxTimeVariation: {
        delayBlocks: 2n,
        futureBlocks: 3n,
        delaySeconds: 4n,
        futureSeconds: 5n,
      },
    }),
  ).toMatchSnapshot();
});
