//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ArbAggregator
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const arbAggregatorABI = [
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [{ name: 'newBatchPoster', internalType: 'address', type: 'address' }],
    name: 'addBatchPoster',
    outputs: [],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'getBatchPosters',
    outputs: [{ name: '', internalType: 'address[]', type: 'address[]' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'getDefaultAggregator',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [{ name: 'batchPoster', internalType: 'address', type: 'address' }],
    name: 'getFeeCollector',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [{ name: 'addr', internalType: 'address', type: 'address' }],
    name: 'getPreferredAggregator',
    outputs: [
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'bool', type: 'bool' },
    ],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [{ name: 'aggregator', internalType: 'address', type: 'address' }],
    name: 'getTxBaseFee',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'batchPoster', internalType: 'address', type: 'address' },
      { name: 'newFeeCollector', internalType: 'address', type: 'address' },
    ],
    name: 'setFeeCollector',
    outputs: [],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'aggregator', internalType: 'address', type: 'address' },
      { name: 'feeInL1Gas', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'setTxBaseFee',
    outputs: [],
  },
] as const;

export const arbAggregatorAddress = '0x000000000000000000000000000000000000006D' as const;

export const arbAggregatorConfig = {
  address: arbAggregatorAddress,
  abi: arbAggregatorABI,
} as const;
