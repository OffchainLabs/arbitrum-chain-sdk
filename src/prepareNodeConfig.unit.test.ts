import { expect, it } from 'vitest';
import { zeroAddress } from 'viem';
import { arbitrumSepolia } from 'viem/chains';
import { prepareChainConfig } from './prepareChainConfig';
import { PrepareNodeConfigParams, prepareNodeConfig } from './prepareNodeConfig';

const privateKey = `0x${'1'.repeat(64)}`;

const params: PrepareNodeConfigParams = {
  insecure: false,
  chainName: 'Test Orbit Chain',
  chainConfig: prepareChainConfig({
    chainId: 123456,
    arbitrum: {
      InitialChainOwner: zeroAddress,
    },
  }),
  coreContracts: {
    rollup: zeroAddress,
    nativeToken: zeroAddress,
    inbox: zeroAddress,
    outbox: zeroAddress,
    rollupEventInbox: zeroAddress,
    challengeManager: zeroAddress,
    adminProxy: zeroAddress,
    sequencerInbox: zeroAddress,
    bridge: zeroAddress,
    upgradeExecutor: zeroAddress,
    validatorUtils: zeroAddress,
    validatorWalletCreator: zeroAddress,
    deployedAtBlockNumber: 1,
  },
  stakeToken: zeroAddress,
  parentChainId: arbitrumSepolia.id,
  parentChainRpcUrl: 'http://localhost:8545',
};

it('omits private keys when insecure is false', () => {
  const config = prepareNodeConfig(params);

  expect(config.node?.['batch-poster']?.['parent-chain-wallet']).toBeUndefined();
  expect(config.node?.staker?.['parent-chain-wallet']).toBeUndefined();
});

it('rejects private keys when insecure is false', () => {
  expect(() =>
    prepareNodeConfig({
      ...params,
      batchPosterPrivateKey: privateKey,
    }),
  ).toThrowError(`"params.insecure" must be true to include private keys in the node config.`);
});

it('includes private keys when insecure is true', () => {
  const config = prepareNodeConfig({
    ...params,
    insecure: true,
    batchPosterPrivateKey: privateKey,
    validatorPrivateKey: privateKey,
  });

  const sanitizedPrivateKey = privateKey.slice(2);
  expect(config.node?.['batch-poster']?.['parent-chain-wallet']?.['private-key']).toBe(
    sanitizedPrivateKey,
  );
  expect(config.node?.staker?.['parent-chain-wallet']?.['private-key']).toBe(sanitizedPrivateKey);
});
