import { NodeConfig } from './types/NodeConfig.generated';
import {
  NodeConfigChainInfoJson,
  NodeConfigDataAvailabilityRpcAggregatorBackendsJson,
} from './types/NodeConfig';
import { ChainConfig } from './types/ChainConfig';
import { CoreContracts } from './types/CoreContracts';
import { ParentChainId, validateParentChain } from './types/ParentChain';
import { getParentChainLayer } from './utils';
import { parentChainIsArbitrum } from './parentChainIsArbitrum';

// this is different from `sanitizePrivateKey` from utils, as this removes the 0x prefix
function sanitizePrivateKey(privateKey: string) {
  return privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
}

function stringifyInfoJson(infoJson: NodeConfigChainInfoJson): string {
  return JSON.stringify(infoJson);
}

function stringifyBackendsJson(
  backendsJson: NodeConfigDataAvailabilityRpcAggregatorBackendsJson,
): string {
  return JSON.stringify(backendsJson);
}

export type PrepareNodeConfigParams = {
  chainName: string;
  chainConfig: ChainConfig;
  coreContracts: CoreContracts;
  batchPosterPrivateKey: string;
  validatorPrivateKey: string;
  stakeToken: string;
  parentChainId: ParentChainId;
  parentChainIsArbitrum?: boolean;
  parentChainRpcUrl: string;
  parentChainBeaconRpcUrl?: string;
  dasServerUrl?: string;
};

function getDisableBlobReader(parentChainId: ParentChainId): boolean {
  if (getParentChainLayer(parentChainId) !== 1 && !parentChainIsArbitrum(parentChainId)) {
    return true;
  }

  return false;
}

export function prepareNodeConfig({
  chainName,
  chainConfig,
  coreContracts,
  batchPosterPrivateKey,
  validatorPrivateKey,
  stakeToken,
  parentChainId,
  parentChainIsArbitrum: parentChainIsArbitrumParam,
  parentChainRpcUrl,
  parentChainBeaconRpcUrl,
  dasServerUrl,
}: PrepareNodeConfigParams): NodeConfig {
  // For L2 Orbit chains settling to Ethereum mainnet or testnet, a parentChainBeaconRpcUrl is enforced
  if (getParentChainLayer(parentChainId) === 1 && !parentChainBeaconRpcUrl) {
    throw new Error(`"parentChainBeaconRpcUrl" is required for L2 Orbit chains.`);
  }

  const { chainId: parentChainIdValidated, isCustom: parentChainIsCustom } =
    validateParentChain(parentChainId);

  if (parentChainIsCustom && typeof parentChainIsArbitrumParam === 'undefined') {
    throw new Error(
      `"params.parentChainIsArbitrum" must be provided when using a custom parent chain.`,
    );
  }

  const config: NodeConfig = {
    'chain': {
      'info-json': stringifyInfoJson([
        {
          'chain-id': chainConfig.chainId,
          'parent-chain-id': parentChainId,
          'parent-chain-is-arbitrum': parentChainIsCustom
            ? parentChainIsArbitrumParam!
            : parentChainIsArbitrum(parentChainIdValidated),
          'chain-name': chainName,
          'chain-config': chainConfig,
          'rollup': {
            'bridge': coreContracts.bridge,
            'inbox': coreContracts.inbox,
            'sequencer-inbox': coreContracts.sequencerInbox,
            'rollup': coreContracts.rollup,
            'validator-utils': coreContracts.validatorUtils,
            'validator-wallet-creator': coreContracts.validatorWalletCreator,
            'stake-token': stakeToken,
            'deployed-at': coreContracts.deployedAtBlockNumber,
          },
        },
      ]),
      'name': chainName,
    },
    'parent-chain': {
      connection: {
        url: parentChainRpcUrl,
      },
    },
    'http': {
      addr: '0.0.0.0',
      port: 8449,
      vhosts: ['*'],
      corsdomain: ['*'],
      api: ['eth', 'net', 'web3', 'arb', 'debug'],
    },
    'node': {
      'sequencer': true,
      'delayed-sequencer': {
        'enable': true,
        'use-merge-finality': false,
        'finalize-distance': 1,
      },
      'batch-poster': {
        'max-size': 90000,
        'enable': true,
        'parent-chain-wallet': {
          'private-key': sanitizePrivateKey(batchPosterPrivateKey),
        },
      },
      'staker': {
        'enable': true,
        'strategy': 'MakeNodes',
        'parent-chain-wallet': {
          'private-key': sanitizePrivateKey(validatorPrivateKey),
        },
      },
      'dangerous': {
        'no-sequencer-coordinator': true,
        'disable-blob-reader': getDisableBlobReader(parentChainId),
      },
    },
    'execution': {
      'forwarding-target': '',
      'sequencer': {
        'enable': true,
        'max-tx-data-size': 85000,
        'max-block-speed': '250ms',
      },
      'caching': {
        archive: true,
      },
    },
  };

  if (parentChainBeaconRpcUrl) {
    config['parent-chain']!['blob-client'] = {
      'beacon-url': parentChainBeaconRpcUrl,
    };
  }

  const dasServerUrlWithFallback = dasServerUrl ?? 'http://localhost';

  if (chainConfig.arbitrum.DataAvailabilityCommittee) {
    config.node!['data-availability'] = {
      'enable': true,
      'sequencer-inbox-address': coreContracts.sequencerInbox,
      'parent-chain-node-url': parentChainRpcUrl,
      'rest-aggregator': {
        enable: true,
        urls: [`${dasServerUrlWithFallback}:9877`],
      },
      'rpc-aggregator': {
        'enable': true,
        'assumed-honest': 1,
        'backends': stringifyBackendsJson([
          {
            url: `${dasServerUrlWithFallback}:9876`,
            pubkey:
              'YAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==',
            signermask: 1,
          },
        ]),
      },
    };
  }

  return config;
}
