import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import {
  Address,
  Chain,
  createPublicClient,
  createWalletClient,
  defineChain,
  Hex,
  http,
  parseEther,
  parseGwei,
  PublicClient,
  Transport,
  zeroAddress,
} from 'viem';
import { sepolia } from 'viem/chains';
import { ethers } from 'ethers';

import TestWETH9 from '@arbitrum/token-bridge-contracts/build/contracts/contracts/tokenbridge/test/TestWETH9.sol/TestWETH9.json';

import { arbOwnerPrepareTransactionRequest } from '../arbOwnerPrepareTransactionRequest';
import { arbOwnerReadContract } from '../arbOwnerReadContract';
import { registerCustomParentChain } from '../chains';
import {
  rollupCreatorABI,
  rollupCreatorAddress as rollupCreatorV3Dot2Address,
} from '../contracts/RollupCreator/v3.2';
import { createRollup } from '../createRollup';
import { createTokenBridge } from '../createTokenBridge';
import { createRollupPrepareDeploymentParamsConfig } from '../createRollupPrepareDeploymentParamsConfig';
import { prepareChainConfig } from '../prepareChainConfig';
import { prepareNodeConfig } from '../prepareNodeConfig';
import { ChainConfig } from '../types/ChainConfig';
import { CreateRollupParams, RollupCreatorSupportedVersion } from '../types/createRollupTypes';
import type { ParentChainId } from '../types/ParentChain';
import { testConstants } from './constants';
import {
  cleanupCurrentHarnessResources,
  cleanupStaleHarnessContainers,
  cleanupStaleHarnessNetworks,
  createDockerNetwork,
  startL1AnvilContainer,
  startNitroContainer,
  waitForRpc,
} from './dockerHelpers';
import {
  bridgeNativeTokenToOrbitChain,
  ContractArtifact,
  configureL2Fees,
  createAccount,
  deployContract,
  deployRollupCreator,
  deployTokenBridgeCreator,
  ensureCreate2Factory,
  fundL2Deployer,
  refreshForkTime,
  setBalanceOnL1,
} from './anvilHarnessHelpers';
import { type RpcCachingProxy, startRpcCachingProxy } from './rpcCachingProxy';
import type { CustomTimingParams, PrivateKeyAccountWithPrivateKey } from '../testHelpers';

type RegisteredParentChain = Parameters<typeof registerCustomParentChain>[0];

type BaseStack<L2Accounts, L3Accounts> = {
  l1: {
    rpcUrl: string;
    chain: Chain;
  };
  l2: {
    rpcUrl: string;
    chain: Chain;
    accounts: L2Accounts;
    timingParams: CustomTimingParams;
    rollupCreatorVersion: RollupCreatorSupportedVersion;
    upgradeExecutor: Address;
  };
  l3: {
    rpcUrl: string;
    chain: Chain;
    accounts: L3Accounts;
    timingParams: CustomTimingParams;
    nativeToken: Address;
    rollup: Address;
    bridge: Address;
    sequencerInbox: Address;
    parentChainUpgradeExecutor: Address;
    childChainUpgradeExecutor: Address;
    batchPoster: Address;
  };
};

export type AnvilTestStack = BaseStack<
  {
    rollupOwner: PrivateKeyAccountWithPrivateKey;
    deployer: PrivateKeyAccountWithPrivateKey;
  },
  {
    rollupOwner: PrivateKeyAccountWithPrivateKey;
    tokenBridgeDeployer: PrivateKeyAccountWithPrivateKey;
  }
>;

export type InjectedAnvilTestStack = BaseStack<
  {
    rollupOwnerPrivateKey: Hex;
    deployerPrivateKey: Hex;
  },
  {
    rollupOwnerPrivateKey: Hex;
    tokenBridgeDeployerPrivateKey: Hex;
  }
>;

let envPromise: Promise<AnvilTestStack> | undefined;
let initializedEnv: AnvilTestStack | undefined;
let runtimeDir: string | undefined;
let dockerNetworkName: string | undefined;
let l1ContainerName: string | undefined;
let l2ContainerName: string | undefined;
let l3ContainerName: string | undefined;
let cleanupHookRegistered = false;
let teardownStarted = false;
let l1RpcCachingProxy: RpcCachingProxy | undefined;

const NITRO_TESTNODE_AUTHORIZED_VALIDATORS = 10;
const NITRO_TESTNODE_VALIDATOR_SIGNER = '0x6A568afe0f82d34759347bb36F14A6bB171d2CBe' as Address;

function prepareNitroRuntimeDir(runtimeDir: string) {
  chmodSync(runtimeDir, 0o777);

  for (const dataDir of ['nitro-data-l2', 'nitro-data-l3']) {
    mkdirSync(join(runtimeDir, dataDir), { recursive: true, mode: 0o777 });
    chmodSync(join(runtimeDir, dataDir), 0o777);
  }
}

function seedAnvilRpcCacheFromRepo(params: { cacheFilePath: string; repoCacheFilePath: string }) {
  const { cacheFilePath, repoCacheFilePath } = params;

  if (existsSync(cacheFilePath) || !existsSync(repoCacheFilePath)) {
    return;
  }

  mkdirSync(dirname(cacheFilePath), { recursive: true });
  copyFileSync(repoCacheFilePath, cacheFilePath);
}

async function getNitroTestnodeStyleValidators(
  publicClient: PublicClient<Transport, Chain>,
  rollupCreator: Address,
): Promise<Address[]> {
  const validatorWalletCreator = await publicClient.readContract({
    address: rollupCreator,
    abi: rollupCreatorABI,
    functionName: 'validatorWalletCreator',
  });

  const validators: Address[] = [];

  for (let i = 1; i <= NITRO_TESTNODE_AUTHORIZED_VALIDATORS; i++) {
    validators.push(
      ethers.utils.getContractAddress({
        from: validatorWalletCreator,
        nonce: ethers.BigNumber.from(i).toHexString(),
      }) as Address,
    );
  }

  validators.push(NITRO_TESTNODE_VALIDATOR_SIGNER);

  return validators;
}

async function ensureChainOwner(params: {
  publicClient: PublicClient<Transport, Chain>;
  chainOwner: PrivateKeyAccountWithPrivateKey;
  newChainOwner: Address;
}) {
  const { publicClient, chainOwner, newChainOwner } = params;

  const isAlreadyChainOwner = await arbOwnerReadContract(publicClient, {
    functionName: 'isChainOwner',
    args: [newChainOwner],
  });

  if (isAlreadyChainOwner) {
    return;
  }

  const transactionRequest = await arbOwnerPrepareTransactionRequest(publicClient, {
    functionName: 'addChainOwner',
    args: [newChainOwner],
    upgradeExecutor: false,
    account: chainOwner.address,
  });

  const transactionHash = await publicClient.sendRawTransaction({
    serializedTransaction: await chainOwner.signTransaction(transactionRequest),
  });

  const receipt = await publicClient.waitForTransactionReceipt({
    hash: transactionHash,
  });

  if (receipt.status !== 'success') {
    throw new Error(`Failed to add chain owner ${newChainOwner}`);
  }
}

export function dehydrateAnvilTestStack(env: AnvilTestStack): InjectedAnvilTestStack {
  return {
    ...env,
    l2: {
      ...env.l2,
      accounts: {
        rollupOwnerPrivateKey: env.l2.accounts.rollupOwner.privateKey,
        deployerPrivateKey: env.l2.accounts.deployer.privateKey,
      },
    },
    l3: {
      ...env.l3,
      accounts: {
        rollupOwnerPrivateKey: env.l3.accounts.rollupOwner.privateKey,
        tokenBridgeDeployerPrivateKey: env.l3.accounts.tokenBridgeDeployer.privateKey,
      },
    },
  };
}

export function hydrateAnvilTestStack(env: InjectedAnvilTestStack): AnvilTestStack {
  const l2Chain = defineChain(env.l2.chain) as RegisteredParentChain;
  registerCustomParentChain(l2Chain);
  const l3Chain = defineChain(env.l3.chain);

  return {
    ...env,
    l2: {
      ...env.l2,
      chain: l2Chain,
      accounts: {
        rollupOwner: createAccount(env.l2.accounts.rollupOwnerPrivateKey),
        deployer: createAccount(env.l2.accounts.deployerPrivateKey),
      },
    },
    l3: {
      ...env.l3,
      chain: l3Chain,
      accounts: {
        rollupOwner: createAccount(env.l3.accounts.rollupOwnerPrivateKey),
        tokenBridgeDeployer: createAccount(env.l3.accounts.tokenBridgeDeployerPrivateKey),
      },
    },
  };
}

export async function setupAnvilTestStack(): Promise<AnvilTestStack> {
  if (envPromise) {
    return envPromise;
  }

  teardownStarted = false;

  if (!cleanupHookRegistered) {
    process.once('exit', () => {
      void teardownAnvilTestStack();
    });
    cleanupHookRegistered = true;
  }

  envPromise = (async () => {
    console.log('Bootstrapping shared stack');
    cleanupStaleHarnessContainers();
    cleanupStaleHarnessNetworks();

    runtimeDir = mkdtempSync(join(tmpdir(), 'chain-sdk-int-test'));
    prepareNitroRuntimeDir(runtimeDir);
    dockerNetworkName = `chain-sdk-int-test-net-${Date.now()}`;
    createDockerNetwork(dockerNetworkName);

    const l2ChainId = testConstants.DEFAULT_L2_CHAIN_ID;
    const l3ChainId = l2ChainId + 1;
    const l1RpcPort = testConstants.DEFAULT_L1_RPC_PORT;
    const l2RpcPort = testConstants.DEFAULT_L2_RPC_PORT;
    const l3RpcPort = testConstants.DEFAULT_L3_RPC_PORT;
    const anvilImage = testConstants.DEFAULT_ANVIL_IMAGE;
    const nitroImage = testConstants.DEFAULT_NITRO_IMAGE;
    const sepoliaBeaconRpc = testConstants.DEFAULT_SEPOLIA_BEACON_RPC;
    const anvilForkUrl = testConstants.DEFAULT_SEPOLIA_RPC;
    const rollupCreatorVersion: RollupCreatorSupportedVersion = 'v3.2';
    const rollupTimingParams: CustomTimingParams = {
      confirmPeriodBlocks: 150n,
      challengeGracePeriodBlocks: 14_400n,
      minimumAssertionPeriod: 75n,
      validatorAfkBlocks: 201_600n,
      sequencerInboxMaxTimeVariation: {
        delayBlocks: 5_760n,
        futureBlocks: 12n,
        delaySeconds: 86_400n,
        futureSeconds: 3_600n,
      },
    };

    const cacheFilePath = join(process.cwd(), '.cache', 'anvil-rpc-cache.json');
    const repoCacheFilePath = join(
      process.cwd(),
      'src',
      'integrationTestHelpers',
      'anvil-rpc-cache.json',
    );

    seedAnvilRpcCacheFromRepo({
      cacheFilePath,
      repoCacheFilePath,
    });

    l1RpcCachingProxy = await startRpcCachingProxy(anvilForkUrl, cacheFilePath, {
      forkBlockNumber: testConstants.DEFAULT_SEPOLIA_FORK_BLOCK_NUMBER,
    });

    const l1RpcUrlWithCaching = l1RpcCachingProxy.proxyUrl;

    const harnessDeployer = createAccount(testConstants.DEPLOYER_PRIVATE_KEY);
    const blockAdvancerAccount = createAccount();

    // Starting L1 node (Anvil)
    l1ContainerName = `chain-sdk-int-test-l1-${Date.now()}`;
    console.log('Starting L1 Anvil node...');

    startL1AnvilContainer({
      containerName: l1ContainerName,
      networkName: dockerNetworkName,
      l1RpcPort,
      anvilImage,
      anvilForkUrl: l1RpcUrlWithCaching,
      anvilForkBlockNumber: testConstants.DEFAULT_SEPOLIA_FORK_BLOCK_NUMBER,
      chainId: sepolia.id,
    });

    const l1RpcUrl = `http://127.0.0.1:${l1RpcPort}`;
    const l1Chain = defineChain({
      ...sepolia,
      rpcUrls: {
        default: { http: [l1RpcUrl] },
        public: { http: [l1RpcUrl] },
      },
    });
    const l1Client = createPublicClient({
      chain: l1Chain,
      transport: http(l1RpcUrl),
    });

    await waitForRpc({
      rpcUrl: l1RpcUrl,
      timeoutMs: 60_000,
      failIfContainerExited: l1ContainerName,
    });
    console.log('L1 Anvil node is ready\n');

    await refreshForkTime({ rpcUrl: l1RpcUrl });

    await setBalanceOnL1({
      rpcUrl: l1RpcUrl,
      address: harnessDeployer.address,
      balance: parseEther('10000000'),
    });

    // Deploying L2 rollup contracts on L1
    console.log('Deploying L2 rollup contracts on L1...');
    const l2RollupConfig = createRollupPrepareDeploymentParamsConfig(
      l1Client,
      {
        chainId: BigInt(l2ChainId),
        owner: harnessDeployer.address,
        sequencerInboxMaxTimeVariation: rollupTimingParams.sequencerInboxMaxTimeVariation,
        confirmPeriodBlocks: rollupTimingParams.confirmPeriodBlocks,
        challengeGracePeriodBlocks: rollupTimingParams.challengeGracePeriodBlocks,
        minimumAssertionPeriod: rollupTimingParams.minimumAssertionPeriod,
        validatorAfkBlocks: rollupTimingParams.validatorAfkBlocks,
        chainConfig: prepareChainConfig({
          chainId: l2ChainId,
          arbitrum: {
            InitialChainOwner: harnessDeployer.address,
            DataAvailabilityCommittee: true,
          },
        }),
      },
      rollupCreatorVersion,
    );

    const l2Rollup = await createRollup({
      params: {
        config: l2RollupConfig,
        batchPosters: [harnessDeployer.address],
        validators: await getNitroTestnodeStyleValidators(
          l1Client,
          rollupCreatorV3Dot2Address[sepolia.id],
        ),
        nativeToken: zeroAddress,
        maxFeePerGasForRetryables: parseGwei('0.1'),
      } as CreateRollupParams<'v3.2'>,
      account: harnessDeployer,
      parentChainPublicClient: l1Client,
      rollupCreatorVersion: 'v3.2',
    });
    console.log('L2 rollup contracts deployed on L1\n');

    const l2ChainConfig = JSON.parse(l2RollupConfig.chainConfig) as ChainConfig;
    const l2NodeConfig = prepareNodeConfig({
      chainName: 'Chain SDK Int Test L2',
      chainConfig: l2ChainConfig,
      coreContracts: l2Rollup.coreContracts,
      batchPosterPrivateKey: harnessDeployer.privateKey,
      validatorPrivateKey: harnessDeployer.privateKey,
      stakeToken: l2RollupConfig.stakeToken,
      parentChainId: sepolia.id,
      parentChainRpcUrl: `http://${l1ContainerName}:8545`,
      parentChainBeaconRpcUrl: sepoliaBeaconRpc,
    });

    if (
      l2NodeConfig.node === undefined ||
      l2NodeConfig.node['batch-poster'] === undefined ||
      l2NodeConfig.node.staker === undefined
    ) {
      throw new Error('L2 node config batch poster is undefined');
    }

    l2NodeConfig.node['batch-poster'].enable = true;
    l2NodeConfig.node['batch-poster']['max-delay'] = '1s';
    l2NodeConfig.node['batch-poster']['poll-interval'] = '1s';
    l2NodeConfig.node['batch-poster']['error-delay'] = '1s';
    l2NodeConfig.node['batch-poster']['l1-block-bound'] = 'ignore';
    l2NodeConfig.node['batch-poster']['data-poster'] = {
      'wait-for-l1-finality': false,
    };

    l2NodeConfig.node.staker.enable = false;

    const l2NodeConfigPath = join(runtimeDir, 'l2-node-config.json');
    writeFileSync(l2NodeConfigPath, JSON.stringify(l2NodeConfig, null, 2), { mode: 0o644 });

    // Starting L2 node (Nitro)
    console.log('Starting L2 Nitro node...');
    l2ContainerName = `chain-sdk-int-test-l2-${Date.now()}`;

    startNitroContainer({
      containerName: l2ContainerName,
      networkName: dockerNetworkName,
      rpcPort: l2RpcPort,
      runtimeDir,
      nitroImage,
      configFilePath: '/runtime/l2-node-config.json',
      persistentChainPath: '/runtime/nitro-data-l2',
    });

    const l2RpcUrl = `http://127.0.0.1:${l2RpcPort}`;
    const l2BootstrapChain = defineChain({
      id: l2ChainId,
      network: 'chain-sdk-int-test-l2-bootstrap',
      name: 'Chain SDK Int Test L2 Bootstrap',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: {
        default: { http: [l2RpcUrl] },
        public: { http: [l2RpcUrl] },
      },
      testnet: true,
    });

    await waitForRpc({
      rpcUrl: l2RpcUrl,
      timeoutMs: 60_000,
      failIfContainerExited: l2ContainerName,
    });
    console.log('L2 Nitro node is ready\n');

    console.log('Funding deployer on L2...');
    await fundL2Deployer({
      l1RpcUrl,
      l2RpcUrl,
      l2Chain: l2BootstrapChain,
      deployer: harnessDeployer,
      inbox: l2Rollup.coreContracts.inbox,
    });
    console.log('Deployer funded on L2');

    let l2Client: PublicClient<Transport, Chain> = createPublicClient({
      chain: l2BootstrapChain,
      transport: http(l2RpcUrl),
    });

    const l2WalletClient = createWalletClient({
      chain: l2BootstrapChain,
      transport: http(l2RpcUrl),
      account: harnessDeployer,
    });

    const blockAdvancerWalletClient = createWalletClient({
      chain: l2BootstrapChain,
      transport: http(l2RpcUrl),
      account: blockAdvancerAccount,
    });

    console.log('Configuring L2 fee settings...');
    await configureL2Fees(l2Client, l2WalletClient, harnessDeployer);
    console.log('L2 fee settings updated\n');

    console.log('Ensuring L2 create2 factory...');
    await ensureCreate2Factory({
      publicClient: l2Client,
      walletClient: l2WalletClient,
      fundingAccount: harnessDeployer,
    });
    console.log('L2 create2 factory is ready\n');

    const l2Provider = new ethers.providers.JsonRpcProvider(l2RpcUrl);
    const l2Signer = new ethers.Wallet(harnessDeployer.privateKey, l2Provider);

    console.log('Deploying L2 custom gas token...');
    const customGasToken = await deployContract(l2Signer, TestWETH9 as ContractArtifact, [
      'Orbit Test Token',
      'ORBT',
    ]);

    console.log('L2 custom gas token deployed\n');

    const tx = await l2Signer.sendTransaction({
      to: blockAdvancerAccount.address,
      value: parseEther('1'),
      ...testConstants.LOW_L2_FEE_OVERRIDES,
    });
    await tx.wait();

    console.log('Deploying L2 rollup creator...');
    const l2RollupCreator = await deployRollupCreator(
      {
        networkName: dockerNetworkName,
        rpcUrl: `http://${l2ContainerName}:8449`,
        deployerPrivateKey: harnessDeployer.privateKey,
        factoryOwner: harnessDeployer.address,
        maxDataSize: 104_857,
        chainId: l2ChainId,
      },
      {
        publicClient: l2Client,
        walletClient: blockAdvancerWalletClient,
        account: blockAdvancerAccount,
      },
    );

    console.log('L2 rollup creator deployed\n');

    console.log('Deploying L2 token bridge creator...');
    const l2TokenBridgeCreator = await deployTokenBridgeCreator(
      {
        networkName: dockerNetworkName,
        rpcUrl: `http://${l2ContainerName}:8449`,
        deployerPrivateKey: harnessDeployer.privateKey,
        wethAddress: customGasToken.address as Address,
      },
      {
        publicClient: l2Client,
        walletClient: blockAdvancerWalletClient,
        account: blockAdvancerAccount,
      },
    );
    console.log('L2 token bridge creator deployed\n');

    await (
      await customGasToken.deposit({
        value: parseEther('10'),
        ...testConstants.LOW_L2_FEE_OVERRIDES,
      })
    ).wait();
    console.log('L2 funding done\n');

    const l2Chain = defineChain({
      id: l2ChainId,
      network: 'chain-sdk-int-test-l2',
      name: 'Chain SDK Int Test L2',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: {
        default: { http: [l2RpcUrl] },
        public: { http: [l2RpcUrl] },
      },
      testnet: true,
      contracts: {
        rollupCreator: { address: l2RollupCreator },
        tokenBridgeCreator: { address: l2TokenBridgeCreator },
        weth: { address: customGasToken.address as Address },
      },
    });
    registerCustomParentChain(l2Chain);
    console.log('L1 & L2 chains ready\n');

    l2Client = createPublicClient({
      chain: l2Chain,
      transport: http(l2RpcUrl),
    });

    console.log('Deploying L3 rollup contracts on L2...');
    const l3RollupConfig = createRollupPrepareDeploymentParamsConfig(l2Client, {
      chainId: BigInt(l3ChainId),
      owner: harnessDeployer.address,
      sequencerInboxMaxTimeVariation: rollupTimingParams.sequencerInboxMaxTimeVariation,
      confirmPeriodBlocks: rollupTimingParams.confirmPeriodBlocks,
      challengeGracePeriodBlocks: rollupTimingParams.challengeGracePeriodBlocks,
      minimumAssertionPeriod: rollupTimingParams.minimumAssertionPeriod,
      validatorAfkBlocks: rollupTimingParams.validatorAfkBlocks,
      chainConfig: prepareChainConfig({
        chainId: l3ChainId,
        arbitrum: {
          InitialChainOwner: harnessDeployer.address,
          DataAvailabilityCommittee: true,
        },
      }),
    });

    const l3Rollup = await createRollup({
      params: {
        config: l3RollupConfig,
        batchPosters: [harnessDeployer.address],
        validators: await getNitroTestnodeStyleValidators(l2Client, l2RollupCreator),
        nativeToken: customGasToken.address as Address,
        maxDataSize: 104_857n,
      } as CreateRollupParams<'v3.2'>,
      account: harnessDeployer,
      parentChainPublicClient: l2Client,
      rollupCreatorVersion,
    });
    console.log('L3 rollup contracts deployed on L2\n');

    const l3ChainConfig = JSON.parse(l3RollupConfig.chainConfig) as ChainConfig;
    const l3NodeConfig = prepareNodeConfig({
      chainName: 'Chain SDK Int Test L3',
      chainConfig: l3ChainConfig,
      coreContracts: l3Rollup.coreContracts,
      batchPosterPrivateKey: harnessDeployer.privateKey,
      validatorPrivateKey: harnessDeployer.privateKey,
      stakeToken: l3RollupConfig.stakeToken,
      parentChainId: l2ChainId as ParentChainId,
      parentChainIsArbitrum: true,
      parentChainRpcUrl: `http://${l2ContainerName}:8449`,
    });

    if (
      l3NodeConfig.node === undefined ||
      l3NodeConfig.node['batch-poster'] === undefined ||
      l3NodeConfig.node.staker === undefined
    ) {
      throw new Error('L3 node config is undefined');
    }

    // The test harness only needs a local L3 sequencer/read node.
    // Disable services that require extra parent-chain plumbing.
    l3NodeConfig.node['batch-poster'].enable = false;
    l3NodeConfig.node.staker.enable = false;
    if (l3ChainConfig.arbitrum.DataAvailabilityCommittee) {
      delete l3NodeConfig.node['data-availability']?.['rpc-aggregator'];
    }

    const l3NodeConfigPath = join(runtimeDir, 'l3-node-config.json');
    writeFileSync(l3NodeConfigPath, JSON.stringify(l3NodeConfig, null, 2), { mode: 0o644 });

    // Starting L3 node (Nitro)
    console.log('Starting L3 Nitro node...');
    l3ContainerName = `chain-sdk-int-test-l3-${Date.now()}`;

    startNitroContainer({
      containerName: l3ContainerName,
      networkName: dockerNetworkName,
      rpcPort: l3RpcPort,
      runtimeDir,
      nitroImage,
      configFilePath: '/runtime/l3-node-config.json',
      persistentChainPath: '/runtime/nitro-data-l3',
    });

    const l3RpcUrl = `http://127.0.0.1:${l3RpcPort}`;
    const l3Chain = defineChain({
      id: l3ChainId,
      network: 'chain-sdk-int-test-l3',
      name: 'Chain SDK Int Test L3',
      nativeCurrency: { name: 'Orbit Test Token', symbol: 'ORBT', decimals: 18 },
      rpcUrls: {
        default: { http: [l3RpcUrl] },
        public: { http: [l3RpcUrl] },
      },
      testnet: true,
    });

    await waitForRpc({
      rpcUrl: l3RpcUrl,
      timeoutMs: 60_000,
      failIfContainerExited: l3ContainerName,
    });
    console.log('L3 Nitro node is ready\n');
    const l3Client = createPublicClient({
      chain: l3Chain,
      transport: http(l3RpcUrl),
    });

    await (
      await customGasToken.deposit({
        value: parseEther('100'),
        ...testConstants.LOW_L2_FEE_OVERRIDES,
      })
    ).wait();

    console.log('Funding deployer on L3...');
    await bridgeNativeTokenToOrbitChain({
      parentPublicClient: l2Client,
      parentWalletClient: l2WalletClient,
      childPublicClient: l3Client,
      depositor: harnessDeployer,
      inbox: l3Rollup.coreContracts.inbox,
      nativeToken: customGasToken.address as Address,
      amount: parseEther('100'),
    });
    console.log('Deployer funded on L3\n');

    console.log('Deploying L3 token bridge contracts on L2...');
    const { tokenBridgeContracts } = await createTokenBridge({
      rollupOwner: harnessDeployer.address,
      rollupAddress: l3Rollup.coreContracts.rollup,
      account: harnessDeployer,
      parentChainPublicClient: l2Client,
      orbitChainPublicClient: l3Client,
      nativeTokenAddress: customGasToken.address as Address,
      gasOverrides: {
        gasLimit: {
          base: 6_000_000n,
        },
      },
      retryableGasOverrides: {
        maxGasForFactory: {
          base: 20_000_000n,
        },
        maxGasForContracts: {
          base: 20_000_000n,
        },
        maxSubmissionCostForFactory: {
          base: 4_000_000_000_000n,
        },
        maxSubmissionCostForContracts: {
          base: 4_000_000_000_000n,
        },
      },
    });

    await ensureChainOwner({
      publicClient: l3Client,
      chainOwner: harnessDeployer,
      newChainOwner: tokenBridgeContracts.orbitChainContracts.upgradeExecutor,
    });
    console.log('L3 token bridge contracts deployed on L2\n');

    initializedEnv = {
      l1: {
        rpcUrl: l1RpcUrl,
        chain: l1Chain,
      },
      l2: {
        rpcUrl: l2RpcUrl,
        chain: l2Chain,
        accounts: {
          rollupOwner: harnessDeployer,
          deployer: harnessDeployer,
        },
        timingParams: rollupTimingParams,
        rollupCreatorVersion,
        upgradeExecutor: l2Rollup.coreContracts.upgradeExecutor,
      },
      l3: {
        rpcUrl: l3RpcUrl,
        chain: l3Chain,
        accounts: {
          rollupOwner: harnessDeployer,
          tokenBridgeDeployer: harnessDeployer,
        },
        timingParams: rollupTimingParams,
        nativeToken: customGasToken.address as Address,
        rollup: l3Rollup.coreContracts.rollup,
        bridge: l3Rollup.coreContracts.bridge,
        sequencerInbox: l3Rollup.coreContracts.sequencerInbox,
        parentChainUpgradeExecutor: l3Rollup.coreContracts.upgradeExecutor,
        childChainUpgradeExecutor: tokenBridgeContracts.orbitChainContracts.upgradeExecutor,
        batchPoster: harnessDeployer.address,
      },
    };

    return initializedEnv;
  })().catch((error) => {
    void teardownAnvilTestStack();
    throw error;
  });

  return envPromise;
}

export function getInitializedAnvilTestStackEnv(): AnvilTestStack {
  if (!initializedEnv) {
    throw new Error('Anvil test stack has not finished initializing.');
  }

  return initializedEnv;
}

export function teardownAnvilTestStack() {
  if (teardownStarted) {
    return;
  }
  teardownStarted = true;

  if (l1RpcCachingProxy) {
    for (const line of l1RpcCachingProxy.getSummaryLines()) {
      console.log(line);
    }

    l1RpcCachingProxy.close();
  }

  cleanupCurrentHarnessResources({
    l3ContainerName: l3ContainerName,
    l2ContainerName: l2ContainerName,
    l1ContainerName: l1ContainerName,
    dockerNetworkName: dockerNetworkName,
    runtimeDir: runtimeDir,
  });

  l3ContainerName = undefined;
  l2ContainerName = undefined;
  l1ContainerName = undefined;
  dockerNetworkName = undefined;
  runtimeDir = undefined;
  l1RpcCachingProxy = undefined;
  envPromise = undefined;
  initializedEnv = undefined;
}
