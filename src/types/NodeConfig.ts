import { ChainConfig } from './ChainConfig';

export type NodeConfigChainInfoJson = [
  {
    'chain-id': number;
    'parent-chain-id': number;
    'parent-chain-is-arbitrum': boolean;
    'chain-name': string;
    'chain-config': ChainConfig;
    'rollup': {
      'bridge': string;
      'inbox': string;
      'sequencer-inbox': string;
      'rollup': string;
      'validator-utils'?: string;
      'validator-wallet-creator': string;
      'stake-token': string;
      'deployed-at': number;
    };
  },
];

export type NodeConfigDataAvailabilityRpcAggregatorBackendsJson = [
  {
    url: string;
    pubkey: string;
    signermask: number;
  },
];
