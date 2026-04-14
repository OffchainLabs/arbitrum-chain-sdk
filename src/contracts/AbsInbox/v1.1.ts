//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// AbsInbox (allowlist surface only)
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const absInboxABI = [
  {
    type: 'error',
    inputs: [{ name: 'origin', internalType: 'address', type: 'address' }],
    name: 'NotAllowedOrigin',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'user', internalType: 'address', type: 'address', indexed: true },
      { name: 'val', internalType: 'bool', type: 'bool', indexed: false },
    ],
    name: 'AllowListAddressSet',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [{ name: 'isEnabled', internalType: 'bool', type: 'bool', indexed: false }],
    name: 'AllowListEnabledUpdated',
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'allowListEnabled',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [{ name: '', internalType: 'address', type: 'address' }],
    name: 'isAllowed',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'user', internalType: 'address[]', type: 'address[]' },
      { name: 'val', internalType: 'bool[]', type: 'bool[]' },
    ],
    name: 'setAllowList',
    outputs: [],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [{ name: '_allowListEnabled', internalType: 'bool', type: 'bool' }],
    name: 'setAllowListEnabled',
    outputs: [],
  },
] as const;
