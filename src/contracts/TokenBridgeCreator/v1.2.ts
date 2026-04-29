//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// TokenBridgeCreator
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x60D9A46F24D5a35b95A78Dd3E793e55D94EE0660)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x4C240987d6fE4fa8C7a0004986e3db563150CA55)
 * - [__View Contract on Arbitrum One Arbiscan__](https://arbiscan.io/address/0x2f5624dc8800dfA0A82AC03509Ef8bb8E7Ac000e)
 * - [__View Contract on Arbitrum Nova Arbiscan__](https://nova.arbiscan.io/address/0x8B9D9490a68B1F16ac8A21DdAE5Fd7aB9d708c14)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0xFC71d21a4FE10Cc0d34745ba9c713836f82f8DE3)
 * - [__View Contract on Arbitrum Sepolia Blockscout__](https://sepolia-explorer.arbitrum.io/address/0x56C486D3786fA26cc61473C499A36Eb9CC1FbD8E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x7edb2dfBeEf9417e0454A80c51EE0C034e45a570)
 */
export const tokenBridgeCreatorABI = [
  { stateMutability: 'nonpayable', type: 'constructor', inputs: [] },
  { type: 'error', inputs: [], name: 'L1AtomicTokenBridgeCreator_L2FactoryCannotBeChanged' },
  { type: 'error', inputs: [], name: 'L1AtomicTokenBridgeCreator_OnlyRollupOwner' },
  { type: 'error', inputs: [], name: 'L1AtomicTokenBridgeCreator_ProxyAdminNotFound' },
  { type: 'error', inputs: [], name: 'L1AtomicTokenBridgeCreator_RollupOwnershipMisconfig' },
  { type: 'error', inputs: [], name: 'L1AtomicTokenBridgeCreator_TemplatesNotSet' },
  {
    type: 'event',
    anonymous: false,
    inputs: [{ name: 'version', internalType: 'uint8', type: 'uint8', indexed: false }],
    name: 'Initialized',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'inbox', internalType: 'address', type: 'address', indexed: true },
      { name: 'owner', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'l1Deployment',
        internalType: 'struct L1DeploymentAddresses',
        type: 'tuple',
        components: [
          { name: 'router', internalType: 'address', type: 'address' },
          { name: 'standardGateway', internalType: 'address', type: 'address' },
          { name: 'customGateway', internalType: 'address', type: 'address' },
          { name: 'wethGateway', internalType: 'address', type: 'address' },
          { name: 'weth', internalType: 'address', type: 'address' },
        ],
        indexed: false,
      },
      {
        name: 'l2Deployment',
        internalType: 'struct L2DeploymentAddresses',
        type: 'tuple',
        components: [
          { name: 'router', internalType: 'address', type: 'address' },
          { name: 'standardGateway', internalType: 'address', type: 'address' },
          { name: 'customGateway', internalType: 'address', type: 'address' },
          { name: 'wethGateway', internalType: 'address', type: 'address' },
          { name: 'weth', internalType: 'address', type: 'address' },
          { name: 'proxyAdmin', internalType: 'address', type: 'address' },
          { name: 'beaconProxyFactory', internalType: 'address', type: 'address' },
          { name: 'upgradeExecutor', internalType: 'address', type: 'address' },
          { name: 'multicall', internalType: 'address', type: 'address' },
        ],
        indexed: false,
      },
      { name: 'proxyAdmin', internalType: 'address', type: 'address', indexed: false },
      { name: 'upgradeExecutor', internalType: 'address', type: 'address', indexed: false },
    ],
    name: 'OrbitTokenBridgeCreated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'inbox', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'l1',
        internalType: 'struct L1DeploymentAddresses',
        type: 'tuple',
        components: [
          { name: 'router', internalType: 'address', type: 'address' },
          { name: 'standardGateway', internalType: 'address', type: 'address' },
          { name: 'customGateway', internalType: 'address', type: 'address' },
          { name: 'wethGateway', internalType: 'address', type: 'address' },
          { name: 'weth', internalType: 'address', type: 'address' },
        ],
        indexed: false,
      },
      {
        name: 'l2',
        internalType: 'struct L2DeploymentAddresses',
        type: 'tuple',
        components: [
          { name: 'router', internalType: 'address', type: 'address' },
          { name: 'standardGateway', internalType: 'address', type: 'address' },
          { name: 'customGateway', internalType: 'address', type: 'address' },
          { name: 'wethGateway', internalType: 'address', type: 'address' },
          { name: 'weth', internalType: 'address', type: 'address' },
          { name: 'proxyAdmin', internalType: 'address', type: 'address' },
          { name: 'beaconProxyFactory', internalType: 'address', type: 'address' },
          { name: 'upgradeExecutor', internalType: 'address', type: 'address' },
          { name: 'multicall', internalType: 'address', type: 'address' },
        ],
        indexed: false,
      },
    ],
    name: 'OrbitTokenBridgeDeploymentSet',
  },
  { type: 'event', anonymous: false, inputs: [], name: 'OrbitTokenBridgeTemplatesUpdated' },
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
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'canonicalL2FactoryAddress',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
  },
  {
    stateMutability: 'payable',
    type: 'function',
    inputs: [
      { name: 'inbox', internalType: 'address', type: 'address' },
      { name: 'rollupOwner', internalType: 'address', type: 'address' },
      { name: 'maxGasForContracts', internalType: 'uint256', type: 'uint256' },
      { name: 'gasPriceBid', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'createTokenBridge',
    outputs: [],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'gasLimitForL2FactoryDeployment',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [{ name: 'inbox', internalType: 'address', type: 'address' }],
    name: 'getRouter',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [{ name: '', internalType: 'address', type: 'address' }],
    name: 'inboxToL1Deployment',
    outputs: [
      { name: 'router', internalType: 'address', type: 'address' },
      { name: 'standardGateway', internalType: 'address', type: 'address' },
      { name: 'customGateway', internalType: 'address', type: 'address' },
      { name: 'wethGateway', internalType: 'address', type: 'address' },
      { name: 'weth', internalType: 'address', type: 'address' },
    ],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [{ name: '', internalType: 'address', type: 'address' }],
    name: 'inboxToL2Deployment',
    outputs: [
      { name: 'router', internalType: 'address', type: 'address' },
      { name: 'standardGateway', internalType: 'address', type: 'address' },
      { name: 'customGateway', internalType: 'address', type: 'address' },
      { name: 'wethGateway', internalType: 'address', type: 'address' },
      { name: 'weth', internalType: 'address', type: 'address' },
      { name: 'proxyAdmin', internalType: 'address', type: 'address' },
      { name: 'beaconProxyFactory', internalType: 'address', type: 'address' },
      { name: 'upgradeExecutor', internalType: 'address', type: 'address' },
      { name: 'multicall', internalType: 'address', type: 'address' },
    ],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      {
        name: '_retryableSender',
        internalType: 'contract L1TokenBridgeRetryableSender',
        type: 'address',
      },
    ],
    name: 'initialize',
    outputs: [],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'l1Multicall',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'l1Templates',
    outputs: [
      { name: 'routerTemplate', internalType: 'contract L1GatewayRouter', type: 'address' },
      { name: 'standardGatewayTemplate', internalType: 'contract L1ERC20Gateway', type: 'address' },
      { name: 'customGatewayTemplate', internalType: 'contract L1CustomGateway', type: 'address' },
      { name: 'wethGatewayTemplate', internalType: 'contract L1WethGateway', type: 'address' },
      {
        name: 'feeTokenBasedRouterTemplate',
        internalType: 'contract L1OrbitGatewayRouter',
        type: 'address',
      },
      {
        name: 'feeTokenBasedStandardGatewayTemplate',
        internalType: 'contract L1OrbitERC20Gateway',
        type: 'address',
      },
      {
        name: 'feeTokenBasedCustomGatewayTemplate',
        internalType: 'contract L1OrbitCustomGateway',
        type: 'address',
      },
      { name: 'upgradeExecutor', internalType: 'contract IUpgradeExecutor', type: 'address' },
    ],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'l1Weth',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'l2CustomGatewayTemplate',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'l2MulticallTemplate',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'l2RouterTemplate',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'l2StandardGatewayTemplate',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'l2TokenBridgeFactoryTemplate',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'l2WethGatewayTemplate',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'l2WethTemplate',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
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
    name: 'retryableSender',
    outputs: [{ name: '', internalType: 'contract L1TokenBridgeRetryableSender', type: 'address' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'inbox', internalType: 'address', type: 'address' },
      {
        name: 'l1Deployment',
        internalType: 'struct L1DeploymentAddresses',
        type: 'tuple',
        components: [
          { name: 'router', internalType: 'address', type: 'address' },
          { name: 'standardGateway', internalType: 'address', type: 'address' },
          { name: 'customGateway', internalType: 'address', type: 'address' },
          { name: 'wethGateway', internalType: 'address', type: 'address' },
          { name: 'weth', internalType: 'address', type: 'address' },
        ],
      },
      {
        name: 'l2Deployment',
        internalType: 'struct L2DeploymentAddresses',
        type: 'tuple',
        components: [
          { name: 'router', internalType: 'address', type: 'address' },
          { name: 'standardGateway', internalType: 'address', type: 'address' },
          { name: 'customGateway', internalType: 'address', type: 'address' },
          { name: 'wethGateway', internalType: 'address', type: 'address' },
          { name: 'weth', internalType: 'address', type: 'address' },
          { name: 'proxyAdmin', internalType: 'address', type: 'address' },
          { name: 'beaconProxyFactory', internalType: 'address', type: 'address' },
          { name: 'upgradeExecutor', internalType: 'address', type: 'address' },
          { name: 'multicall', internalType: 'address', type: 'address' },
        ],
      },
    ],
    name: 'setDeployment',
    outputs: [],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      {
        name: '_l1Templates',
        internalType: 'struct L1AtomicTokenBridgeCreator.L1Templates',
        type: 'tuple',
        components: [
          { name: 'routerTemplate', internalType: 'contract L1GatewayRouter', type: 'address' },
          {
            name: 'standardGatewayTemplate',
            internalType: 'contract L1ERC20Gateway',
            type: 'address',
          },
          {
            name: 'customGatewayTemplate',
            internalType: 'contract L1CustomGateway',
            type: 'address',
          },
          { name: 'wethGatewayTemplate', internalType: 'contract L1WethGateway', type: 'address' },
          {
            name: 'feeTokenBasedRouterTemplate',
            internalType: 'contract L1OrbitGatewayRouter',
            type: 'address',
          },
          {
            name: 'feeTokenBasedStandardGatewayTemplate',
            internalType: 'contract L1OrbitERC20Gateway',
            type: 'address',
          },
          {
            name: 'feeTokenBasedCustomGatewayTemplate',
            internalType: 'contract L1OrbitCustomGateway',
            type: 'address',
          },
          { name: 'upgradeExecutor', internalType: 'contract IUpgradeExecutor', type: 'address' },
        ],
      },
      { name: '_l2TokenBridgeFactoryTemplate', internalType: 'address', type: 'address' },
      { name: '_l2RouterTemplate', internalType: 'address', type: 'address' },
      { name: '_l2StandardGatewayTemplate', internalType: 'address', type: 'address' },
      { name: '_l2CustomGatewayTemplate', internalType: 'address', type: 'address' },
      { name: '_l2WethGatewayTemplate', internalType: 'address', type: 'address' },
      { name: '_l2WethTemplate', internalType: 'address', type: 'address' },
      { name: '_l2MulticallTemplate', internalType: 'address', type: 'address' },
      { name: '_l1Weth', internalType: 'address', type: 'address' },
      { name: '_l1Multicall', internalType: 'address', type: 'address' },
      { name: '_gasLimitForL2FactoryDeployment', internalType: 'uint256', type: 'uint256' },
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
] as const;

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x60D9A46F24D5a35b95A78Dd3E793e55D94EE0660)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x4C240987d6fE4fa8C7a0004986e3db563150CA55)
 * - [__View Contract on Arbitrum One Arbiscan__](https://arbiscan.io/address/0x2f5624dc8800dfA0A82AC03509Ef8bb8E7Ac000e)
 * - [__View Contract on Arbitrum Nova Arbiscan__](https://nova.arbiscan.io/address/0x8B9D9490a68B1F16ac8A21DdAE5Fd7aB9d708c14)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0xFC71d21a4FE10Cc0d34745ba9c713836f82f8DE3)
 * - [__View Contract on Arbitrum Sepolia Blockscout__](https://sepolia-explorer.arbitrum.io/address/0x56C486D3786fA26cc61473C499A36Eb9CC1FbD8E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x7edb2dfBeEf9417e0454A80c51EE0C034e45a570)
 */
export const tokenBridgeCreatorAddress = {
  1: '0x60D9A46F24D5a35b95A78Dd3E793e55D94EE0660',
  1337: '0x4Af567288e68caD4aA93A272fe6139Ca53859C70',
  8453: '0x4C240987d6fE4fa8C7a0004986e3db563150CA55',
  42161: '0x2f5624dc8800dfA0A82AC03509Ef8bb8E7Ac000e',
  42170: '0x8B9D9490a68B1F16ac8A21DdAE5Fd7aB9d708c14',
  84532: '0xFC71d21a4FE10Cc0d34745ba9c713836f82f8DE3',
  412346: '0x38F35Af53bF913c439eaB06A367e09D6eb253492',
  421614: '0x56C486D3786fA26cc61473C499A36Eb9CC1FbD8E',
  11155111: '0x7edb2dfBeEf9417e0454A80c51EE0C034e45a570',
} as const;

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x60D9A46F24D5a35b95A78Dd3E793e55D94EE0660)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x4C240987d6fE4fa8C7a0004986e3db563150CA55)
 * - [__View Contract on Arbitrum One Arbiscan__](https://arbiscan.io/address/0x2f5624dc8800dfA0A82AC03509Ef8bb8E7Ac000e)
 * - [__View Contract on Arbitrum Nova Arbiscan__](https://nova.arbiscan.io/address/0x8B9D9490a68B1F16ac8A21DdAE5Fd7aB9d708c14)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0xFC71d21a4FE10Cc0d34745ba9c713836f82f8DE3)
 * - [__View Contract on Arbitrum Sepolia Blockscout__](https://sepolia-explorer.arbitrum.io/address/0x56C486D3786fA26cc61473C499A36Eb9CC1FbD8E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x7edb2dfBeEf9417e0454A80c51EE0C034e45a570)
 */
export const tokenBridgeCreatorConfig = {
  address: tokenBridgeCreatorAddress,
  abi: tokenBridgeCreatorABI,
} as const;
