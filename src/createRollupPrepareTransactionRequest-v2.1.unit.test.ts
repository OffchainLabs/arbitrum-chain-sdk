import { it, expect } from 'vitest';
import { createPublicClient, http, zeroAddress } from 'viem';
import { arbitrum, arbitrumSepolia } from 'viem/chains';

import { generateChainId } from './utils';
import { prepareChainConfig } from './prepareChainConfig';
import { createRollupDefaultRetryablesFees } from './constants';
import { createRollupPrepareDeploymentParamsConfig } from './createRollupPrepareDeploymentParamsConfig';
import { createRollupPrepareTransactionRequest } from './createRollupPrepareTransactionRequest';
import { rollupCreatorAddress } from './contracts/RollupCreator/v2.1';

import {
  getNitroTestnodePrivateKeyAccounts,
  testHelper_createCustomParentChain,
} from './testHelpers';
import { registerCustomParentChain } from './chains';
import { getConsensusReleaseByVersion } from './wasmModuleRoot';

const testnodeAccounts = getNitroTestnodePrivateKeyAccounts();
const deployer = testnodeAccounts.deployer;

const publicClient = createPublicClient({
  chain: arbitrumSepolia,
  transport: http(),
});

it(`fails to prepare transaction request if "params.batchPosters" is set to an empty array`, async () => {
  // generate a random chain id
  const chainId = generateChainId();

  // create the chain config
  const chainConfig = prepareChainConfig({
    chainId,
    arbitrum: { InitialChainOwner: deployer.address },
  });

  // prepare the transaction for deploying the core contracts
  await expect(
    createRollupPrepareTransactionRequest({
      params: {
        config: createRollupPrepareDeploymentParamsConfig(
          publicClient,
          {
            chainId: BigInt(chainId),
            owner: deployer.address,
            chainConfig,
          },
          'v2.1',
        ),
        batchPosters: [],
        validators: [deployer.address],
      },
      account: deployer.address,
      publicClient,
      rollupCreatorVersion: 'v2.1',
    }),
  ).rejects.toThrowError(`"params.batchPosters" can't be empty or contain the zero address.`);
});

it(`fails to prepare transaction request if "params.batchPosters" includes the zero address`, async () => {
  // generate a random chain id
  const chainId = generateChainId();

  // create the chain config
  const chainConfig = prepareChainConfig({
    chainId,
    arbitrum: { InitialChainOwner: deployer.address },
  });

  // prepare the transaction for deploying the core contracts
  await expect(
    createRollupPrepareTransactionRequest({
      params: {
        config: createRollupPrepareDeploymentParamsConfig(
          publicClient,
          {
            chainId: BigInt(chainId),
            owner: deployer.address,
            chainConfig,
          },
          'v2.1',
        ),
        // set batch posters array to include zero address
        batchPosters: [zeroAddress, deployer.address],
        validators: [deployer.address],
      },
      account: deployer.address,
      publicClient,
      rollupCreatorVersion: 'v2.1',
    }),
  ).rejects.toThrowError(`"params.batchPosters" can't be empty or contain the zero address.`);
});

it(`fails to prepare transaction request if "params.validators" is set to an empty array`, async () => {
  // generate a random chain id
  const chainId = generateChainId();

  // create the chain config
  const chainConfig = prepareChainConfig({
    chainId,
    arbitrum: { InitialChainOwner: deployer.address },
  });

  // prepare the transaction for deploying the core contracts
  await expect(
    createRollupPrepareTransactionRequest({
      params: {
        config: createRollupPrepareDeploymentParamsConfig(
          publicClient,
          {
            chainId: BigInt(chainId),
            owner: deployer.address,
            chainConfig,
          },
          'v2.1',
        ),
        batchPosters: [deployer.address],
        // set validators to an empty array
        validators: [],
      },
      account: deployer.address,
      publicClient,
      rollupCreatorVersion: 'v2.1',
    }),
  ).rejects.toThrowError(`"params.validators" can't be empty or contain the zero address.`);
});

it(`fails to prepare transaction request if "params.validators" includes the zero address`, async () => {
  // generate a random chain id
  const chainId = generateChainId();

  // create the chain config
  const chainConfig = prepareChainConfig({
    chainId,
    arbitrum: { InitialChainOwner: deployer.address },
  });

  // prepare the transaction for deploying the core contracts
  await expect(
    createRollupPrepareTransactionRequest({
      params: {
        config: createRollupPrepareDeploymentParamsConfig(
          publicClient,
          {
            chainId: BigInt(chainId),
            owner: deployer.address,
            chainConfig,
          },
          'v2.1',
        ),
        batchPosters: [deployer.address],
        // set validators to zero address
        validators: [zeroAddress],
      },
      account: deployer.address,
      publicClient,
      rollupCreatorVersion: 'v2.1',
    }),
  ).rejects.toThrowError(`"params.validators" can't be empty or contain the zero address.`);
});

it(`fails to prepare transaction request if "params.nativeToken" is custom and chain is not anytrust`, async () => {
  // generate a random chain id
  const chainId = generateChainId();

  // create the chain config
  const chainConfig = prepareChainConfig({
    chainId,
    arbitrum: { InitialChainOwner: deployer.address },
  });

  // prepare the transaction for deploying the core contracts
  await expect(
    createRollupPrepareTransactionRequest({
      params: {
        config: createRollupPrepareDeploymentParamsConfig(
          publicClient,
          {
            chainId: BigInt(chainId),
            owner: deployer.address,
            chainConfig,
          },
          'v2.1',
        ),
        batchPosters: [deployer.address],
        validators: [deployer.address],
        // set native token to anything custom
        nativeToken: deployer.address,
      },
      account: deployer.address,
      publicClient,
      rollupCreatorVersion: 'v2.1',
    }),
  ).rejects.toThrowError(
    `"params.nativeToken" can only be used on AnyTrust chains. Set "arbitrum.DataAvailabilityCommittee" to "true" in the chain config.`,
  );
});

it(`fails to prepare transaction request if ArbOS version 30 is selected`, async () => {
  // generate a random chain id
  const chainId = generateChainId();

  // create the chain config
  const chainConfig = prepareChainConfig({
    chainId,
    arbitrum: { InitialChainOwner: deployer.address, InitialArbOSVersion: 30 },
  });

  // prepare the transaction for deploying the core contracts
  await expect(
    createRollupPrepareTransactionRequest({
      params: {
        config: createRollupPrepareDeploymentParamsConfig(
          publicClient,
          {
            chainId: BigInt(chainId),
            owner: deployer.address,
            chainConfig,
          },
          'v2.1',
        ),
        batchPosters: [deployer.address],
        validators: [deployer.address],
      },
      account: deployer.address,
      publicClient,
      rollupCreatorVersion: 'v2.1',
    }),
  ).rejects.toThrowError(
    `ArbOS 30 is not supported. Please set the ArbOS version to 32 or later by updating "arbitrum.InitialArbOSVersion" in your chain config.`,
  );
});

it(`fails to prepare transaction request if ArbOS version 31 is selected`, async () => {
  // generate a random chain id
  const chainId = generateChainId();

  // create the chain config
  const chainConfig = prepareChainConfig({
    chainId,
    arbitrum: { InitialChainOwner: deployer.address, InitialArbOSVersion: 31 },
  });

  // prepare the transaction for deploying the core contracts
  await expect(
    createRollupPrepareTransactionRequest({
      params: {
        config: createRollupPrepareDeploymentParamsConfig(
          publicClient,
          {
            chainId: BigInt(chainId),
            owner: deployer.address,
            chainConfig,
          },
          'v2.1',
        ),
        batchPosters: [deployer.address],
        validators: [deployer.address],
      },
      account: deployer.address,
      publicClient,
      rollupCreatorVersion: 'v2.1',
    }),
  ).rejects.toThrowError(
    `ArbOS 31 is not supported. Please set the ArbOS version to 32 or later by updating "arbitrum.InitialArbOSVersion" in your chain config.`,
  );
});

it(`fails to prepare transaction request if ArbOS version is incompatible with Consensus version`, async () => {
  // generate a random chain id
  const chainId = generateChainId();

  // create the chain config
  const chainConfig = prepareChainConfig({
    chainId,
    arbitrum: { InitialChainOwner: deployer.address, InitialArbOSVersion: 32 },
  });

  // prepare the transaction for deploying the core contracts
  await expect(
    createRollupPrepareTransactionRequest({
      params: {
        config: createRollupPrepareDeploymentParamsConfig(
          publicClient,
          {
            chainId: BigInt(chainId),
            owner: deployer.address,
            chainConfig,
            wasmModuleRoot: getConsensusReleaseByVersion(20).wasmModuleRoot,
          },
          'v2.1',
        ),
        batchPosters: [deployer.address],
        validators: [deployer.address],
      },
      account: deployer.address,
      publicClient,
      rollupCreatorVersion: 'v2.1',
    }),
  ).rejects.toThrowError(
    `Consensus v20 does not support ArbOS 32. Please update your "wasmModuleRoot" to that of a Consensus version compatible with ArbOS 32.`,
  );
});

it(`fails to prepare transaction request if "params.maxDataSize" is not provided for a custom parent chain`, async () => {
  // generate a random chain id
  const chainId = generateChainId();

  // create the chain config
  const chainConfig = prepareChainConfig({
    chainId,
    arbitrum: { InitialChainOwner: deployer.address, DataAvailabilityCommittee: true },
  });

  const chain = testHelper_createCustomParentChain({
    id: chainId,
  });

  const publicClient = createPublicClient({
    chain,
    transport: http(),
  });

  registerCustomParentChain(chain);

  // prepare the transaction for deploying the core contracts
  await expect(
    createRollupPrepareTransactionRequest({
      params: {
        config: createRollupPrepareDeploymentParamsConfig(
          publicClient,
          {
            chainId: BigInt(chainId),
            owner: deployer.address,
            chainConfig,
            confirmPeriodBlocks: 1n,
            sequencerInboxMaxTimeVariation: {
              delayBlocks: 2n,
              futureBlocks: 3n,
              delaySeconds: 4n,
              futureSeconds: 5n,
            },
          },
          'v2.1',
        ),
        batchPosters: [deployer.address],
        validators: [deployer.address],
      },
      account: deployer.address,
      publicClient,
      rollupCreatorVersion: 'v2.1',
    }),
  ).rejects.toThrowError(`"params.maxDataSize" must be provided when using a custom parent chain.`);
});

it(`fails to prepare transaction request if "params.wasmModuleRoot" is blacklisted`, async () => {
  const chainId = 123456;

  // create the chain config
  const chainConfig = prepareChainConfig({
    chainId,
    arbitrum: { InitialChainOwner: deployer.address, DataAvailabilityCommittee: true },
  });

  const wasmModuleRoot = '0x28b6ad83ed87b21a87c73f7a0296a135ebc7074e449efb289ececccad771ccd6';
  const arbOSVersion = chainConfig.arbitrum.InitialArbOSVersion;

  await expect(
    createRollupPrepareTransactionRequest({
      params: {
        config: createRollupPrepareDeploymentParamsConfig(
          publicClient,
          {
            chainId: BigInt(chainId),
            owner: deployer.address,
            chainConfig,
            wasmModuleRoot,
          },
          'v2.1',
        ),
        batchPosters: [deployer.address],
        validators: [deployer.address],
      },
      value: createRollupDefaultRetryablesFees,
      account: deployer.address,
      publicClient,
      gasOverrides: { gasLimit: { base: 1_000n } },
      rollupCreatorVersion: 'v2.1',
    }),
  ).rejects.toThrowError(
    `Wasm module root ${wasmModuleRoot} is not supported. Please update your "wasmModuleRoot" to that of a Consensus version compatible with ArbOS ${arbOSVersion}.`,
  );
});

it(`successfully prepares a transaction request with the default rollup creator and a gas limit override`, async () => {
  // generate a random chain id
  const chainId = generateChainId();

  // create the chain config
  const chainConfig = prepareChainConfig({
    chainId,
    arbitrum: { InitialChainOwner: deployer.address, DataAvailabilityCommittee: true },
  });

  const txRequest = await createRollupPrepareTransactionRequest({
    params: {
      config: createRollupPrepareDeploymentParamsConfig(
        publicClient,
        {
          chainId: BigInt(chainId),
          owner: deployer.address,
          chainConfig,
        },
        'v2.1',
      ),
      batchPosters: [deployer.address],
      validators: [deployer.address],
    },
    value: createRollupDefaultRetryablesFees,
    account: deployer.address,
    publicClient,
    gasOverrides: { gasLimit: { base: 1_000n } },
    rollupCreatorVersion: 'v2.1',
  });

  expect(txRequest.account).toEqual(deployer.address);
  expect(txRequest.from).toEqual(deployer.address);
  expect(txRequest.to).toEqual(rollupCreatorAddress[arbitrumSepolia.id]);
  expect(txRequest.chainId).toEqual(arbitrumSepolia.id);
  expect(txRequest.gas).toEqual(1_000n);
});

it(`successfully prepares a transaction request with a custom rollup creator and a gas limit override`, async () => {
  // generate a random chain id
  const chainId = generateChainId();

  // create the chain config
  const chainConfig = prepareChainConfig({
    chainId,
    arbitrum: { InitialChainOwner: deployer.address, DataAvailabilityCommittee: true },
  });

  const txRequest = await createRollupPrepareTransactionRequest({
    params: {
      config: createRollupPrepareDeploymentParamsConfig(
        publicClient,
        {
          chainId: BigInt(chainId),
          owner: deployer.address,
          chainConfig,
        },
        'v2.1',
      ),
      batchPosters: [deployer.address],
      validators: [deployer.address],
    },
    account: deployer.address,
    value: createRollupDefaultRetryablesFees,
    publicClient,
    gasOverrides: { gasLimit: { base: 1_000n, percentIncrease: 20n } },
    rollupCreatorAddressOverride: '0x31421C442c422BD16aef6ae44D3b11F404eeaBd9',
    rollupCreatorVersion: 'v2.1',
  });

  expect(txRequest.account).toEqual(deployer.address);
  expect(txRequest.from).toEqual(deployer.address);
  expect(txRequest.to).toEqual('0x31421C442c422BD16aef6ae44D3b11F404eeaBd9');
  expect(txRequest.chainId).toEqual(arbitrumSepolia.id);
  expect(txRequest.gas).toEqual(1_200n);
});

it(`successfully prepares a transaction request with a custom parent chain`, async () => {
  // generate a random chain id
  const chainId = generateChainId();

  // create the chain config
  const chainConfig = prepareChainConfig({
    chainId,
    arbitrum: { InitialChainOwner: deployer.address, DataAvailabilityCommittee: true },
  });

  const chain = testHelper_createCustomParentChain({
    id: chainId,
  });

  const publicClient = createPublicClient({
    chain,
    transport: http(),
  });

  registerCustomParentChain(chain);

  const txRequest = await createRollupPrepareTransactionRequest({
    params: {
      config: createRollupPrepareDeploymentParamsConfig(
        publicClient,
        {
          chainId: BigInt(chainId),
          owner: deployer.address,
          chainConfig,
          confirmPeriodBlocks: 1n,
          sequencerInboxMaxTimeVariation: {
            delayBlocks: 2n,
            futureBlocks: 3n,
            delaySeconds: 4n,
            futureSeconds: 5n,
          },
        },
        'v2.1',
      ),
      batchPosters: [deployer.address],
      validators: [deployer.address],
      maxDataSize: 123_456n,
    },
    account: deployer.address,
    value: createRollupDefaultRetryablesFees,
    publicClient,
    gasOverrides: { gasLimit: { base: 1_000n } },
    rollupCreatorVersion: 'v2.1',
  });

  expect(txRequest.account).toEqual(deployer.address);
  expect(txRequest.from).toEqual(deployer.address);
  expect(txRequest.to).toEqual(chain.contracts.rollupCreator.address);
  expect(txRequest.chainId).toEqual(chainId);
  expect(txRequest.gas).toEqual(1_000n);
});

it(`successfully prepare transaction request if "params.nativeToken" uses supported number of decimals`, async () => {
  // generate a random chain id
  const chainId = generateChainId();

  // create the chain config
  const chainConfig = prepareChainConfig({
    chainId,
    arbitrum: { InitialChainOwner: deployer.address, DataAvailabilityCommittee: true },
  });

  const txRequest = await createRollupPrepareTransactionRequest({
    params: {
      config: createRollupPrepareDeploymentParamsConfig(
        publicClient,
        {
          chainId: BigInt(chainId),
          owner: deployer.address,
          chainConfig,
        },
        'v2.1',
      ),
      batchPosters: [deployer.address],
      validators: [deployer.address],
      nativeToken: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d', // USDC
    },
    value: createRollupDefaultRetryablesFees,
    account: deployer.address,
    publicClient,
    gasOverrides: { gasLimit: { base: 1_000n } },
    rollupCreatorVersion: 'v2.1',
  });

  expect(txRequest.account).toEqual(deployer.address);
  expect(txRequest.from).toEqual(deployer.address);
  expect(txRequest.to).toEqual(rollupCreatorAddress[arbitrumSepolia.id]);
  expect(txRequest.chainId).toEqual(arbitrumSepolia.id);
  expect(txRequest.gas).toEqual(1_000n);
});
