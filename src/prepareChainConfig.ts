import { ExcludeSome, Prettify, RequireSome } from './types/utils';
import { ChainConfig, ChainConfigArbitrumParams } from './types/ChainConfig';
import { prepareChainConfigSortKeys } from './prepareChainConfigSortKeys';

export const defaults = {
  homesteadBlock: 0,
  daoForkBlock: null,
  daoForkSupport: true,
  eip150Block: 0,
  eip150Hash: '0x0000000000000000000000000000000000000000000000000000000000000000',
  eip155Block: 0,
  eip158Block: 0,
  byzantiumBlock: 0,
  constantinopleBlock: 0,
  petersburgBlock: 0,
  istanbulBlock: 0,
  muirGlacierBlock: 0,
  berlinBlock: 0,
  londonBlock: 0,
  clique: {
    period: 0,
    epoch: 0,
  },
  arbitrum: {
    EnableArbOS: true,
    AllowDebugPrecompiles: false,
    DataAvailabilityCommittee: false,
    InitialArbOSVersion: 51,
    GenesisBlockNum: 0,
    MaxCodeSize: 24_576,
    MaxInitCodeSize: 49_152,
  },
};

export type PrepareChainConfigParams = Prettify<
  Pick<ChainConfig, 'chainId'> & {
    arbitrum: PrepareChainConfigArbitrumParams;
  }
>;

export type PrepareChainConfigArbitrumParams = RequireSome<
  // exclude some fields that shouldn't be changed
  ExcludeSome<
    ChainConfigArbitrumParams,
    'EnableArbOS' | 'GenesisBlockNum' | 'AllowDebugPrecompiles'
  >,
  // make InitialChainOwner required
  'InitialChainOwner'
>;

export function prepareChainConfig(params: PrepareChainConfigParams): ChainConfig {
  return prepareChainConfigSortKeys({
    ...defaults,
    chainId: params.chainId,
    arbitrum: { ...defaults.arbitrum, ...params.arbitrum },
  });
}
