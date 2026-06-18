//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// RollupCreator
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x43698080f40dB54DEE6871540037b8AB8fD0AB44)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xDbe3e840569a0446CDfEbc65D7d429c5Da5537b7)
 * - [__View Contract on Arbitrum One Arbiscan__](https://arbiscan.io/address/0xB90e53fd945Cd28Ec4728cBfB566981dD571eB8b)
 * - [__View Contract on Arbitrum Nova Arbiscan__](https://nova.arbiscan.io/address/0xF916Bfe431B7A7AaE083273F5b862e00a15d60F4)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x70cA29dA3B116A2c4A267c549bf7947d47f41e22)
 * - [__View Contract on Arbitrum Sepolia Blockscout__](https://sepolia-explorer.arbitrum.io/address/0x5F45675AC8DDF7d45713b2c7D191B287475C16cF)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x687Bc1D23390875a868Db158DA1cDC8998E31640)
 */
export const rollupCreatorABI = [
  { stateMutability: 'nonpayable', type: 'constructor', inputs: [] },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'previousOwner', internalType: 'address', type: 'address', indexed: true },
      { name: 'newOwner', internalType: 'address', type: 'address', indexed: true },
    ],
    name: 'OwnershipTransferred',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'rollupAddress', internalType: 'address', type: 'address', indexed: true },
      { name: 'nativeToken', internalType: 'address', type: 'address', indexed: true },
      { name: 'inboxAddress', internalType: 'address', type: 'address', indexed: false },
      { name: 'outbox', internalType: 'address', type: 'address', indexed: false },
      { name: 'rollupEventInbox', internalType: 'address', type: 'address', indexed: false },
      { name: 'challengeManager', internalType: 'address', type: 'address', indexed: false },
      { name: 'adminProxy', internalType: 'address', type: 'address', indexed: false },
      { name: 'sequencerInbox', internalType: 'address', type: 'address', indexed: false },
      { name: 'bridge', internalType: 'address', type: 'address', indexed: false },
      { name: 'upgradeExecutor', internalType: 'address', type: 'address', indexed: false },
      { name: 'validatorWalletCreator', internalType: 'address', type: 'address', indexed: false },
    ],
    name: 'RollupCreated',
  },
  { type: 'event', anonymous: false, inputs: [], name: 'TemplatesUpdated' },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'bridgeCreator',
    outputs: [{ name: '', internalType: 'contract BridgeCreator', type: 'address' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'challengeManagerTemplate',
    outputs: [{ name: '', internalType: 'contract IEdgeChallengeManager', type: 'address' }],
  },
  {
    stateMutability: 'payable',
    type: 'function',
    inputs: [
      {
        name: 'deployParams',
        internalType: 'struct RollupCreator.RollupDeploymentParams',
        type: 'tuple',
        components: [
          {
            name: 'config',
            internalType: 'struct Config',
            type: 'tuple',
            components: [
              { name: 'confirmPeriodBlocks', internalType: 'uint64', type: 'uint64' },
              { name: 'stakeToken', internalType: 'address', type: 'address' },
              { name: 'baseStake', internalType: 'uint256', type: 'uint256' },
              { name: 'wasmModuleRoot', internalType: 'bytes32', type: 'bytes32' },
              { name: 'owner', internalType: 'address', type: 'address' },
              { name: 'loserStakeEscrow', internalType: 'address', type: 'address' },
              { name: 'chainId', internalType: 'uint256', type: 'uint256' },
              { name: 'chainConfig', internalType: 'string', type: 'string' },
              { name: 'minimumAssertionPeriod', internalType: 'uint256', type: 'uint256' },
              { name: 'validatorAfkBlocks', internalType: 'uint64', type: 'uint64' },
              { name: 'miniStakeValues', internalType: 'uint256[]', type: 'uint256[]' },
              {
                name: 'sequencerInboxMaxTimeVariation',
                internalType: 'struct ISequencerInbox.MaxTimeVariation',
                type: 'tuple',
                components: [
                  { name: 'delayBlocks', internalType: 'uint256', type: 'uint256' },
                  { name: 'futureBlocks', internalType: 'uint256', type: 'uint256' },
                  { name: 'delaySeconds', internalType: 'uint256', type: 'uint256' },
                  { name: 'futureSeconds', internalType: 'uint256', type: 'uint256' },
                ],
              },
              { name: 'layerZeroBlockEdgeHeight', internalType: 'uint256', type: 'uint256' },
              { name: 'layerZeroBigStepEdgeHeight', internalType: 'uint256', type: 'uint256' },
              { name: 'layerZeroSmallStepEdgeHeight', internalType: 'uint256', type: 'uint256' },
              {
                name: 'genesisAssertionState',
                internalType: 'struct AssertionState',
                type: 'tuple',
                components: [
                  {
                    name: 'globalState',
                    internalType: 'struct GlobalState',
                    type: 'tuple',
                    components: [
                      { name: 'bytes32Vals', internalType: 'bytes32[2]', type: 'bytes32[2]' },
                      { name: 'u64Vals', internalType: 'uint64[2]', type: 'uint64[2]' },
                    ],
                  },
                  { name: 'machineStatus', internalType: 'enum MachineStatus', type: 'uint8' },
                  { name: 'endHistoryRoot', internalType: 'bytes32', type: 'bytes32' },
                ],
              },
              { name: 'genesisInboxCount', internalType: 'uint256', type: 'uint256' },
              { name: 'anyTrustFastConfirmer', internalType: 'address', type: 'address' },
              { name: 'numBigStepLevel', internalType: 'uint8', type: 'uint8' },
              { name: 'challengeGracePeriodBlocks', internalType: 'uint64', type: 'uint64' },
              {
                name: 'bufferConfig',
                internalType: 'struct BufferConfig',
                type: 'tuple',
                components: [
                  { name: 'threshold', internalType: 'uint64', type: 'uint64' },
                  { name: 'max', internalType: 'uint64', type: 'uint64' },
                  { name: 'replenishRateInBasis', internalType: 'uint64', type: 'uint64' },
                ],
              },
            ],
          },
          { name: 'validators', internalType: 'address[]', type: 'address[]' },
          { name: 'maxDataSize', internalType: 'uint256', type: 'uint256' },
          { name: 'nativeToken', internalType: 'address', type: 'address' },
          { name: 'deployFactoriesToL2', internalType: 'bool', type: 'bool' },
          { name: 'maxFeePerGasForRetryables', internalType: 'uint256', type: 'uint256' },
          { name: 'batchPosters', internalType: 'address[]', type: 'address[]' },
          { name: 'batchPosterManager', internalType: 'address', type: 'address' },
          { name: 'feeTokenPricer', internalType: 'contract IFeeTokenPricer', type: 'address' },
        ],
      },
    ],
    name: 'createRollup',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'l2FactoriesDeployer',
    outputs: [{ name: '', internalType: 'contract DeployHelper', type: 'address' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'osp',
    outputs: [{ name: '', internalType: 'contract IOneStepProofEntry', type: 'address' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'rollupAdminLogic',
    outputs: [{ name: '', internalType: 'contract IRollupAdmin', type: 'address' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'rollupUserLogic',
    outputs: [{ name: '', internalType: 'contract IRollupUser', type: 'address' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: '_bridgeCreator', internalType: 'contract BridgeCreator', type: 'address' },
      { name: '_osp', internalType: 'contract IOneStepProofEntry', type: 'address' },
      {
        name: '_challengeManagerLogic',
        internalType: 'contract IEdgeChallengeManager',
        type: 'address',
      },
      { name: '_rollupAdminLogic', internalType: 'contract IRollupAdmin', type: 'address' },
      { name: '_rollupUserLogic', internalType: 'contract IRollupUser', type: 'address' },
      { name: '_upgradeExecutorLogic', internalType: 'contract IUpgradeExecutor', type: 'address' },
      { name: '_validatorWalletCreator', internalType: 'address', type: 'address' },
      { name: '_l2FactoriesDeployer', internalType: 'contract DeployHelper', type: 'address' },
    ],
    name: 'setTemplates',
    outputs: [],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [{ name: 'newOwner', internalType: 'address', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'upgradeExecutorLogic',
    outputs: [{ name: '', internalType: 'contract IUpgradeExecutor', type: 'address' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'validatorWalletCreator',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
  },
  { stateMutability: 'payable', type: 'receive' },
] as const;

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x43698080f40dB54DEE6871540037b8AB8fD0AB44)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xDbe3e840569a0446CDfEbc65D7d429c5Da5537b7)
 * - [__View Contract on Arbitrum One Arbiscan__](https://arbiscan.io/address/0xB90e53fd945Cd28Ec4728cBfB566981dD571eB8b)
 * - [__View Contract on Arbitrum Nova Arbiscan__](https://nova.arbiscan.io/address/0xF916Bfe431B7A7AaE083273F5b862e00a15d60F4)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x70cA29dA3B116A2c4A267c549bf7947d47f41e22)
 * - [__View Contract on Arbitrum Sepolia Blockscout__](https://sepolia-explorer.arbitrum.io/address/0x5F45675AC8DDF7d45713b2c7D191B287475C16cF)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x687Bc1D23390875a868Db158DA1cDC8998E31640)
 */
export const rollupCreatorAddress = {
  1: '0x43698080f40dB54DEE6871540037b8AB8fD0AB44',
  1337: '0xb562622f2D76F355D673560CB88c1dF6088702f1',
  8453: '0xDbe3e840569a0446CDfEbc65D7d429c5Da5537b7',
  42161: '0xB90e53fd945Cd28Ec4728cBfB566981dD571eB8b',
  42170: '0xF916Bfe431B7A7AaE083273F5b862e00a15d60F4',
  84532: '0x70cA29dA3B116A2c4A267c549bf7947d47f41e22',
  412346: '0x1E08B9c3f94E9aBcc531f67F949d796eC76963b9',
  421614: '0x5F45675AC8DDF7d45713b2c7D191B287475C16cF',
  11155111: '0x687Bc1D23390875a868Db158DA1cDC8998E31640',
} as const;

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x43698080f40dB54DEE6871540037b8AB8fD0AB44)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xDbe3e840569a0446CDfEbc65D7d429c5Da5537b7)
 * - [__View Contract on Arbitrum One Arbiscan__](https://arbiscan.io/address/0xB90e53fd945Cd28Ec4728cBfB566981dD571eB8b)
 * - [__View Contract on Arbitrum Nova Arbiscan__](https://nova.arbiscan.io/address/0xF916Bfe431B7A7AaE083273F5b862e00a15d60F4)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x70cA29dA3B116A2c4A267c549bf7947d47f41e22)
 * - [__View Contract on Arbitrum Sepolia Blockscout__](https://sepolia-explorer.arbitrum.io/address/0x5F45675AC8DDF7d45713b2c7D191B287475C16cF)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x687Bc1D23390875a868Db158DA1cDC8998E31640)
 */
export const rollupCreatorConfig = {
  address: rollupCreatorAddress,
  abi: rollupCreatorABI,
} as const;
