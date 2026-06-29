import { Address, Chain, PublicClient, zeroAddress } from 'viem';
import { PrivateKeyAccount, privateKeyToAccount, generatePrivateKey } from 'viem/accounts';
import { config } from 'dotenv';
import { execFileSync } from 'node:child_process';

import { generateChainId, sanitizePrivateKey } from './utils';
import { createRollup } from './createRollup';
import { createRollupPrepareDeploymentParamsConfig } from './createRollupPrepareDeploymentParamsConfig';
import { prepareChainConfig } from './prepareChainConfig';
import { CreateRollupParams, RollupCreatorSupportedVersion } from './types/createRollupTypes';

config();

type PrivateKeyAccountWithPrivateKey = PrivateKeyAccount & { privateKey: `0x${string}` };
// Source: https://github.com/OffchainLabs/nitro-testnode/blob/release/scripts/accounts.ts#L28
type NitroTestNodePrivateKeyAccounts = {
  // funnel
  deployer: PrivateKeyAccountWithPrivateKey;
  // sequencer (batch poster and rollup owner are the same in nitro-testnode)
  l2RollupOwner: PrivateKeyAccountWithPrivateKey;
  // l3owner
  l3RollupOwner: PrivateKeyAccountWithPrivateKey;
  // sha256(user_token_bridge_deployer)
  l3TokenBridgeDeployer: PrivateKeyAccountWithPrivateKey;
  // l2 token bridge deployer
  l2TokenBridgeDeployer: PrivateKeyAccountWithPrivateKey;
  // l3 token bridge deployer which holds custom gas token
};

export function getNitroTestnodePrivateKeyAccounts(): NitroTestNodePrivateKeyAccounts {
  if (
    typeof process.env.NITRO_TESTNODE_DEPLOYER_PRIVATE_KEY === 'undefined' ||
    typeof process.env.NITRO_TESTNODE_L2_ROLLUP_OWNER_PRIVATE_KEY === 'undefined' ||
    typeof process.env.NITRO_TESTNODE_L3_ROLLUP_OWNER_PRIVATE_KEY === 'undefined' ||
    typeof process.env.NITRO_TESTNODE_L2_TOKEN_BRIDGE_DEPLOYER_PRIVATE_KEY === 'undefined' ||
    typeof process.env.NITRO_TESTNODE_L3_TOKEN_BRIDGE_DEPLOYER_PRIVATE_KEY === 'undefined'
  ) {
    throw Error(
      `required env variables: NITRO_TESTNODE_DEPLOYER_PRIVATE_KEY, NITRO_TESTNODE_L2_ROLLUP_OWNER_PRIVATE_KEY,
      NITRO_TESTNODE_L2_TOKEN_BRIDGE_DEPLOYER_PRIVATE_KEY, NITRO_TESTNODE_L3_ROLLUP_OWNER_PRIVATE_KEY,
      NITRO_TESTNODE_L3_TOKEN_BRIDGE_DEPLOYER_PRIVATE_KEY`,
    );
  }

  const deployerPrivateKey = sanitizePrivateKey(process.env.NITRO_TESTNODE_DEPLOYER_PRIVATE_KEY);
  const l2RollupOwnerPrivateKey = sanitizePrivateKey(
    process.env.NITRO_TESTNODE_L2_ROLLUP_OWNER_PRIVATE_KEY,
  );
  const l2TokenBridgeDeployerPrivateKey = sanitizePrivateKey(
    process.env.NITRO_TESTNODE_L2_TOKEN_BRIDGE_DEPLOYER_PRIVATE_KEY,
  );
  const l3RollupOwnerPrivateKey = sanitizePrivateKey(
    process.env.NITRO_TESTNODE_L3_ROLLUP_OWNER_PRIVATE_KEY,
  );
  const l3TokenBridgeDeployerPrivateKey = sanitizePrivateKey(
    process.env.NITRO_TESTNODE_L3_TOKEN_BRIDGE_DEPLOYER_PRIVATE_KEY,
  );

  return {
    deployer: { ...privateKeyToAccount(deployerPrivateKey), privateKey: deployerPrivateKey },
    l2RollupOwner: {
      ...privateKeyToAccount(l2RollupOwnerPrivateKey),
      privateKey: l2RollupOwnerPrivateKey,
    },
    l2TokenBridgeDeployer: {
      ...privateKeyToAccount(l2TokenBridgeDeployerPrivateKey),
      privateKey: l2TokenBridgeDeployerPrivateKey,
    },
    l3RollupOwner: {
      ...privateKeyToAccount(l3RollupOwnerPrivateKey),
      privateKey: l3RollupOwnerPrivateKey,
    },
    l3TokenBridgeDeployer: {
      ...privateKeyToAccount(l3TokenBridgeDeployerPrivateKey),
      privateKey: l3TokenBridgeDeployerPrivateKey,
    },
  };
}

type TestnodeInformation = {
  bridge: Address;
  rollup: Address;
  sequencerInbox: Address;
  l3SequencerInbox: Address;
  l3Bridge: Address;
  batchPoster: Address;
  l3BatchPoster: Address;
  l3UpgradeExecutor: Address;
  l3ChainOwnerUpgradeExecutor?: Address;
  l3Rollup: `0x${string}`;
  l3NativeToken: `0x${string}`;
  l2RollupCreator?: Address;
};

type TestnodeDeploymentJson = {
  'bridge': Address;
  'rollup': Address;
  'sequencer-inbox': Address;
  'native-token'?: `0x${string}`;
  'upgrade-executor'?: Address;
  'chain-owner-upgrade-executor'?: Address;
  'rollup-creator'?: Address;
};

type TestnodeNodeConfig = {
  node: {
    'batch-poster': {
      'parent-chain-wallet': {
        'account'?: Address;
        'private-key'?: string;
      };
    };
  };
};

function getBatchPosterAddressFromNodeConfig(config: TestnodeNodeConfig): Address {
  const wallet = config.node['batch-poster']['parent-chain-wallet'];

  if (typeof wallet.account !== 'undefined') {
    return wallet.account;
  }

  if (typeof wallet['private-key'] !== 'undefined') {
    return privateKeyToAccount(sanitizePrivateKey(wallet['private-key'])).address;
  }

  throw new Error('Missing batch poster account or private key in testnode config');
}

function readFirstExistingContainerJson<T>(container: string, paths: string[]): T {
  for (const path of paths) {
    try {
      return JSON.parse(
        execFileSync('docker', ['exec', container, 'cat', path], {
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'ignore'],
        }),
      ) as T;
    } catch {
      // try the next supported path
    }
  }

  throw new Error(`None of these testnode config files exist in ${container}: ${paths.join(', ')}`);
}

function getInformationFromTestnodeContainer(container: string): TestnodeInformation {
  const deploymentJson = readFirstExistingContainerJson<TestnodeDeploymentJson>(container, [
    '/config/deployment.json',
    '/config/l2_deployment.json',
    '/opt/arbitrum-testnode/export-config/deployment.json',
    '/opt/arbitrum-testnode/export-config/l2_deployment.json',
  ]);
  const l3DeploymentJson = readFirstExistingContainerJson<Required<TestnodeDeploymentJson>>(
    container,
    [
      '/config/l3deployment.json',
      '/config/l3_deployment.json',
      '/opt/arbitrum-testnode/export-config/l3deployment.json',
      '/opt/arbitrum-testnode/export-config/l3_deployment.json',
    ],
  );
  const sequencerConfig = readFirstExistingContainerJson<TestnodeNodeConfig>(container, [
    '/config/sequencer_config.json',
    '/config/l2-nodeConfig.json',
    '/opt/arbitrum-testnode/export-config/sequencer_config.json',
    '/opt/arbitrum-testnode/export-config/l2-nodeConfig.json',
  ]);

  const l3SequencerConfig = readFirstExistingContainerJson<TestnodeNodeConfig>(container, [
    '/config/l3node_config.json',
    '/config/l3-nodeConfig.json',
    '/opt/arbitrum-testnode/export-config/l3node_config.json',
    '/opt/arbitrum-testnode/export-config/l3-nodeConfig.json',
  ]);
  const l2RollupCreator = l3DeploymentJson['rollup-creator'];

  return {
    bridge: deploymentJson['bridge'],
    rollup: deploymentJson['rollup'],
    sequencerInbox: deploymentJson['sequencer-inbox'],
    batchPoster: getBatchPosterAddressFromNodeConfig(sequencerConfig),
    l3Bridge: l3DeploymentJson['bridge'],
    l3Rollup: l3DeploymentJson['rollup'],
    l3SequencerInbox: l3DeploymentJson['sequencer-inbox'],
    l3NativeToken: l3DeploymentJson['native-token'],
    l3BatchPoster: getBatchPosterAddressFromNodeConfig(l3SequencerConfig),
    l3UpgradeExecutor: l3DeploymentJson['upgrade-executor'],
    l3ChainOwnerUpgradeExecutor: l3DeploymentJson['chain-owner-upgrade-executor'],
    ...(l2RollupCreator && l2RollupCreator !== zeroAddress ? { l2RollupCreator } : {}),
  };
}

export function getInformationFromTestnode(): TestnodeInformation {
  const containers = Array.from(
    new Set([
      process.env.ARBITRUM_TESTNODE_CONTAINER,
      'arbitrum-testnode-l3-custom-18',
      'arbitrum-testnode-l3-eth',
      'arbitrum-testnode-l2',
      'arbitrum-testnode',
      'nitro_sequencer_1',
      'nitro-sequencer-1',
      'nitro-testnode-sequencer-1',
      'nitro-testnode_sequencer_1',
    ]),
  ).filter((container): container is string => typeof container === 'string' && container !== '');

  for (const container of containers) {
    try {
      return getInformationFromTestnodeContainer(container);
    } catch {
      // empty on purpose
    }
  }

  throw new Error('testnode container not found');
}

export async function createRollupHelper<
  TRollupCreatorVersion extends RollupCreatorSupportedVersion = 'v3.2',
>({
  deployer,
  batchPosters,
  validators,
  nativeToken = zeroAddress,
  client,
  rollupCreatorVersion = testHelper_getRollupCreatorVersionFromEnv() as TRollupCreatorVersion,
  rollupCreatorAddressOverride,
}: {
  deployer: PrivateKeyAccountWithPrivateKey;
  batchPosters: Address[];
  validators: Address[];
  nativeToken: Address;
  client: PublicClient;
  rollupCreatorVersion?: TRollupCreatorVersion;
  rollupCreatorAddressOverride?: Address;
}) {
  const chainId = generateChainId();
  let effectiveRollupCreatorAddressOverride = rollupCreatorAddressOverride;

  if (typeof effectiveRollupCreatorAddressOverride === 'undefined') {
    try {
      effectiveRollupCreatorAddressOverride = getInformationFromTestnode().l2RollupCreator;
    } catch {
      // keep SDK defaults when testnode metadata is unavailable
    }
  }

  const createRollupConfig = createRollupPrepareDeploymentParamsConfig(
    client,
    {
      chainId: BigInt(chainId),
      owner: deployer.address,
      chainConfig: prepareChainConfig({
        chainId,
        arbitrum: {
          InitialChainOwner: deployer.address,
          DataAvailabilityCommittee: true,
        },
      }),
    },
    rollupCreatorVersion,
  );

  const createRollupInformation =
    rollupCreatorVersion === 'v2.1'
      ? await createRollup({
          params: {
            config: createRollupConfig,
            batchPosters,
            validators,
            nativeToken,
          } as CreateRollupParams<'v2.1'>,
          account: deployer,
          parentChainPublicClient: client,
          rollupCreatorVersion: 'v2.1',
          rollupCreatorAddressOverride: effectiveRollupCreatorAddressOverride,
        })
      : await createRollup({
          params: {
            config: createRollupConfig,
            batchPosters,
            validators,
            nativeToken,
          } as CreateRollupParams<'v3.2'>,
          account: deployer,
          parentChainPublicClient: client,
          rollupCreatorVersion: 'v3.2',
          rollupCreatorAddressOverride: effectiveRollupCreatorAddressOverride,
        });

  // create test rollup with ETH as gas token
  return {
    createRollupConfig,
    createRollupInformation,
  };
}

export function testHelper_createCustomParentChain(params?: { id?: number }) {
  const chainId = params?.id ?? generateChainId();

  const rollupCreator = privateKeyToAccount(generatePrivateKey()).address;
  const tokenBridgeCreator = privateKeyToAccount(generatePrivateKey()).address;
  // randomly generated and hardcoded because it must not change for snapshot tests
  const weth = '0xabaF3D9f5cbDcE54cDc43b429d8f7154A3E19Afa';

  return {
    id: chainId,
    name: `Custom Parent Chain (${chainId})`,
    network: `custom-parent-chain-${chainId}`,
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: {
      public: {
        // have to put a valid rpc here so using arbitrum sepolia
        http: ['https://sepolia-rollup.arbitrum.io/rpc'],
      },
      default: {
        // have to put a valid rpc here so using arbitrum sepolia
        http: ['https://sepolia-rollup.arbitrum.io/rpc'],
      },
    },
    contracts: {
      rollupCreator: { address: rollupCreator },
      tokenBridgeCreator: { address: tokenBridgeCreator },
      weth: { address: weth },
    },
  } satisfies Chain;
}

export function testHelper_getRollupCreatorVersionFromEnv(): RollupCreatorSupportedVersion {
  if (process.env.INTEGRATION_TEST_NITRO_CONTRACTS_BRANCH) {
    // extract just major and minor version numbers
    return process.env.INTEGRATION_TEST_NITRO_CONTRACTS_BRANCH.split('.')
      .slice(0, 2)
      .join('.') as RollupCreatorSupportedVersion;
  }

  return 'v3.2';
}
