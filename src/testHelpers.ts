import { Address, Chain, PublicClient, zeroAddress } from 'viem';
import { PrivateKeyAccount, privateKeyToAccount, generatePrivateKey } from 'viem/accounts';
import { config } from 'dotenv';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

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
  l3Rollup: `0x${string}`;
  l3NativeToken: `0x${string}`;
  l2RollupCreator: Address;
};

/**
 * Discover the RollupCreator address by querying the parent chain for the
 * RollupCreated event that deployed the given rollup. Falls back to zeroAddress.
 */
function discoverRollupCreatorAddress(
  parentRpcUrl: string,
  rollupAddress: Address,
  deployedAtBlock: number,
): Address {
  try {
    // v3.2: RollupCreated(address,address,address,address,address,address,address,address,address,address,address)
    // v2.1: RollupCreated(address,address,address,address,address,address,address,address,address,address,address,address)
    const topics = [
      '0xd9bfd3bb3012f0caa103d1ba172692464d2de5c7b75877ce255c72147086a79d',
      '0x481277de518d1f364b196166b90219b996fba76138a3dc84e7fe02540eb1cbdb',
    ];
    const rollupTopic = '0x000000000000000000000000' + rollupAddress.slice(2).toLowerCase();
    const fromBlock = '0x' + Math.max(0, deployedAtBlock - 1).toString(16);
    const toBlock = '0x' + (deployedAtBlock + 1).toString(16);
    for (const eventTopic of topics) {
      const body = JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getLogs',
        params: [{ fromBlock, toBlock, topics: [eventTopic, rollupTopic] }],
      });
      const result = execSync(
        `curl -sf -X POST -H "Content-Type: application/json" -d '${body}' "${parentRpcUrl}"`,
        { timeout: 10000 },
      ).toString();
      const parsed = JSON.parse(result);
      if (parsed.result?.length > 0) return parsed.result[0].address as Address;
    }
  } catch {
    // empty on purpose
  }
  return zeroAddress;
}

function getInformationFromConfigDir(configDir: string): TestnodeInformation {
  const deploymentJson = JSON.parse(readFileSync(join(configDir, 'deployment.json'), 'utf-8'));
  const l3DeploymentJson = JSON.parse(readFileSync(join(configDir, 'l3deployment.json'), 'utf-8'));
  const sequencerConfig = JSON.parse(readFileSync(join(configDir, 'l2-nodeConfig.json'), 'utf-8'));
  const l3NodeConfig = JSON.parse(readFileSync(join(configDir, 'l3-nodeConfig.json'), 'utf-8'));

  const batchPosterKey = sequencerConfig.node['batch-poster']['parent-chain-wallet']['private-key'];
  const l3BatchPosterKey = l3NodeConfig.node['batch-poster']['parent-chain-wallet']['private-key'];

  // Read rollup-creator from config if available, otherwise discover from the chain
  let l2RollupCreator: Address = l3DeploymentJson['rollup-creator'] ?? zeroAddress;
  if (
    l2RollupCreator === zeroAddress &&
    l3DeploymentJson['rollup'] &&
    l3DeploymentJson['deployed-at'] != null
  ) {
    l2RollupCreator = discoverRollupCreatorAddress(
      'http://127.0.0.1:8547',
      l3DeploymentJson['rollup'],
      l3DeploymentJson['deployed-at'],
    );
  }

  return {
    bridge: deploymentJson['bridge'],
    rollup: deploymentJson['rollup'],
    sequencerInbox: deploymentJson['sequencer-inbox'],
    batchPoster: privateKeyToAccount(`0x${batchPosterKey}`).address,
    l3Bridge: l3DeploymentJson['bridge'],
    l3Rollup: l3DeploymentJson['rollup'],
    l3SequencerInbox: l3DeploymentJson['sequencer-inbox'],
    l3NativeToken: l3DeploymentJson['native-token'],
    l3BatchPoster: privateKeyToAccount(`0x${l3BatchPosterKey}`).address,
    l3UpgradeExecutor: l3DeploymentJson['upgrade-executor'],
    l2RollupCreator,
  };
}

export function getInformationFromTestnode(): TestnodeInformation {
  const configDir = process.env.ARBITRUM_TESTNODE_CONFIG_DIR;
  if (configDir) {
    return getInformationFromConfigDir(configDir);
  }

  const containers = [
    'nitro_sequencer_1',
    'nitro-sequencer-1',
    'nitro-testnode-sequencer-1',
    'nitro-testnode_sequencer_1',
  ];

  for (const container of containers) {
    try {
      const deploymentJson = JSON.parse(
        execSync('docker exec ' + container + ' cat /config/deployment.json').toString(),
      );

      const l3DeploymentJson = JSON.parse(
        execSync('docker exec ' + container + ' cat /config/l3deployment.json').toString(),
      );

      const sequencerConfig = JSON.parse(
        execSync('docker exec ' + container + ' cat /config/sequencer_config.json').toString(),
      );

      const l3SequencerConfig = JSON.parse(
        execSync('docker exec ' + container + ' cat /config/l3node_config.json').toString(),
      );

      return {
        bridge: deploymentJson['bridge'],
        rollup: deploymentJson['rollup'],
        sequencerInbox: deploymentJson['sequencer-inbox'],
        batchPoster: sequencerConfig.node['batch-poster']['parent-chain-wallet'].account,
        l3Bridge: l3DeploymentJson['bridge'],
        l3Rollup: l3DeploymentJson['rollup'],
        l3SequencerInbox: l3DeploymentJson['sequencer-inbox'],
        l3NativeToken: l3DeploymentJson['native-token'],
        l3BatchPoster: l3SequencerConfig.node['batch-poster']['parent-chain-wallet'].account,
        l3UpgradeExecutor: l3DeploymentJson['upgrade-executor'],
        l2RollupCreator: l3DeploymentJson['rollup-creator'] ?? zeroAddress,
      };
    } catch {
      // empty on purpose
    }
  }

  throw new Error('nitro-testnode sequencer not found');
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
          rollupCreatorAddressOverride,
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
          rollupCreatorAddressOverride,
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
