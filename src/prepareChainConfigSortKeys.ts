import { ChainConfig } from './types/ChainConfig';

export function prepareChainConfigSortKeys(config: ChainConfig): ChainConfig {
  return {
    // https://github.com/OffchainLabs/go-ethereum/blob/d1bc3070cae4c3cbf711830148d696b66c6ada6e/params/config.go#L393
    chainId: config.chainId,
    homesteadBlock: config.homesteadBlock,
    daoForkBlock: config.daoForkBlock,
    daoForkSupport: config.daoForkSupport,
    eip150Block: config.eip150Block,
    eip150Hash: config.eip150Hash,
    eip155Block: config.eip155Block,
    eip158Block: config.eip158Block,
    byzantiumBlock: config.byzantiumBlock,
    constantinopleBlock: config.constantinopleBlock,
    petersburgBlock: config.petersburgBlock,
    istanbulBlock: config.istanbulBlock,
    muirGlacierBlock: config.muirGlacierBlock,
    berlinBlock: config.berlinBlock,
    londonBlock: config.londonBlock,

    // https://github.com/OffchainLabs/go-ethereum/blob/d1bc3070cae4c3cbf711830148d696b66c6ada6e/params/config.go#L461
    clique: {
      period: config.clique.period,
      epoch: config.clique.epoch,
    },

    // https://github.com/OffchainLabs/go-ethereum/blob/d1bc3070cae4c3cbf711830148d696b66c6ada6e/params/config_arbitrum.go#L49
    arbitrum: {
      EnableArbOS: config.arbitrum.EnableArbOS,
      AllowDebugPrecompiles: config.arbitrum.AllowDebugPrecompiles,
      DataAvailabilityCommittee: config.arbitrum.DataAvailabilityCommittee,
      InitialArbOSVersion: config.arbitrum.InitialArbOSVersion,
      InitialChainOwner: config.arbitrum.InitialChainOwner,
      GenesisBlockNum: config.arbitrum.GenesisBlockNum,
      MaxCodeSize: config.arbitrum.MaxCodeSize,
      MaxInitCodeSize: config.arbitrum.MaxInitCodeSize,
    },
  };
}
