export const edgeChallengeManagerABI = [
  { inputs: [], stateMutability: 'nonpayable', type: 'constructor' },
  {
    inputs: [
      { internalType: 'address', name: 'account', type: 'address' },
      { internalType: 'bytes32', name: 'mutualId', type: 'bytes32' },
    ],
    name: 'AccountHasMadeLayerZeroRival',
    type: 'error',
  },
  { inputs: [], name: 'AssertionHashEmpty', type: 'error' },
  {
    inputs: [
      { internalType: 'bytes32', name: 'h1', type: 'bytes32' },
      { internalType: 'bytes32', name: 'h2', type: 'bytes32' },
    ],
    name: 'AssertionHashMismatch',
    type: 'error',
  },
  { inputs: [], name: 'AssertionNoSibling', type: 'error' },
  { inputs: [], name: 'AssertionNotPending', type: 'error' },
  {
    inputs: [
      { internalType: 'uint8', name: 'levels', type: 'uint8' },
    ],
    name: 'BigStepLevelsTooMany',
    type: 'error',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'actual', type: 'uint256' },
      { internalType: 'uint256', name: 'expected', type: 'uint256' },
    ],
    name: 'CachedTimeSufficient',
    type: 'error',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'edgeId', type: 'bytes32' },
      { internalType: 'bytes32', name: 'lowerChildId', type: 'bytes32' },
      { internalType: 'bytes32', name: 'upperChildId', type: 'bytes32' },
    ],
    name: 'ChildrenAlreadySet',
    type: 'error',
  },
  {
    inputs: [
      { internalType: 'uint8', name: 'argLevel', type: 'uint8' },
      { internalType: 'uint8', name: 'claimLevel', type: 'uint8' },
    ],
    name: 'ClaimEdgeInvalidLevel',
    type: 'error',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'claimId', type: 'bytes32' },
    ],
    name: 'ClaimEdgeNotLengthOneRival',
    type: 'error',
  },
  { inputs: [], name: 'ClaimEdgeNotPending', type: 'error' },
  {
    inputs: [
      { internalType: 'bytes32', name: 'edgeId', type: 'bytes32' },
    ],
    name: 'EdgeAlreadyExists',
    type: 'error',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'edgeId', type: 'bytes32' },
    ],
    name: 'EdgeAlreadyRefunded',
    type: 'error',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'edgeId', type: 'bytes32' },
      { internalType: 'bytes32', name: 'claimingEdgeId', type: 'bytes32' },
    ],
    name: 'EdgeClaimMismatch',
    type: 'error',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'edgeId1', type: 'bytes32' },
      { internalType: 'bytes32', name: 'edgeId2', type: 'bytes32' },
      { internalType: 'uint8', name: 'level1', type: 'uint8' },
      { internalType: 'uint8', name: 'level2', type: 'uint8' },
    ],
    name: 'EdgeLevelInvalid',
    type: 'error',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'edgeId', type: 'bytes32' },
      { internalType: 'enum EdgeStatus', name: '', type: 'uint8' },
    ],
    name: 'EdgeNotConfirmed',
    type: 'error',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'edgeId', type: 'bytes32' },
    ],
    name: 'EdgeNotExists',
    type: 'error',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'edgeId', type: 'bytes32' },
      { internalType: 'address', name: 'staker', type: 'address' },
      { internalType: 'bytes32', name: 'claimId', type: 'bytes32' },
    ],
    name: 'EdgeNotLayerZero',
    type: 'error',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'length', type: 'uint256' },
    ],
    name: 'EdgeNotLengthOne',
    type: 'error',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'edgeId', type: 'bytes32' },
      { internalType: 'enum EdgeStatus', name: 'status', type: 'uint8' },
    ],
    name: 'EdgeNotPending',
    type: 'error',
  },
  {
    inputs: [
      { internalType: 'uint8', name: 'level', type: 'uint8' },
    ],
    name: 'EdgeTypeNotSmallStep',
    type: 'error',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'edgeId', type: 'bytes32' },
    ],
    name: 'EdgeUnrivaled',
    type: 'error',
  },
  { inputs: [], name: 'EmptyArray', type: 'error' },
  { inputs: [], name: 'EmptyAssertionChain', type: 'error' },
  { inputs: [], name: 'EmptyChallengePeriod', type: 'error' },
  { inputs: [], name: 'EmptyClaimId', type: 'error' },
  { inputs: [], name: 'EmptyEdgeSpecificProof', type: 'error' },
  { inputs: [], name: 'EmptyEndMachineStatus', type: 'error' },
  { inputs: [], name: 'EmptyEndRoot', type: 'error' },
  { inputs: [], name: 'EmptyFirstRival', type: 'error' },
  { inputs: [], name: 'EmptyOneStepProofEntry', type: 'error' },
  { inputs: [], name: 'EmptyOriginId', type: 'error' },
  { inputs: [], name: 'EmptyPrefixProof', type: 'error' },
  { inputs: [], name: 'EmptyStakeReceiver', type: 'error' },
  { inputs: [], name: 'EmptyStaker', type: 'error' },
  { inputs: [], name: 'EmptyStartMachineStatus', type: 'error' },
  { inputs: [], name: 'EmptyStartRoot', type: 'error' },
  {
    inputs: [
      { internalType: 'bytes32', name: 'endHistoryRoot', type: 'bytes32' },
      { internalType: 'bytes32', name: 'assertionEndRoot', type: 'bytes32' },
    ],
    name: 'EndHistoryRootMismatch',
    type: 'error',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'h1', type: 'uint256' },
      { internalType: 'uint256', name: 'h2', type: 'uint256' },
    ],
    name: 'HeightDiffLtTwo',
    type: 'error',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'totalBlocks', type: 'uint256' },
      { internalType: 'uint256', name: 'thresholdBlocks', type: 'uint256' },
    ],
    name: 'InsufficientConfirmationBlocks',
    type: 'error',
  },
  {
    inputs: [
      { internalType: 'enum EdgeType', name: 'edgeType', type: 'uint8' },
    ],
    name: 'InvalidEdgeType',
    type: 'error',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'actualHeight', type: 'uint256' },
      { internalType: 'uint256', name: 'expectedHeight', type: 'uint256' },
    ],
    name: 'InvalidEndHeight',
    type: 'error',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'start', type: 'uint256' },
      { internalType: 'uint256', name: 'end', type: 'uint256' },
    ],
    name: 'InvalidHeights',
    type: 'error',
  },
  {
    inputs: [
      { internalType: 'uint8', name: 'level', type: 'uint8' },
      { internalType: 'uint8', name: 'numBigStepLevels', type: 'uint8' },
    ],
    name: 'LevelTooHigh',
    type: 'error',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'actualLength', type: 'uint256' },
      { internalType: 'uint256', name: 'maxProofLength', type: 'uint256' },
    ],
    name: 'MerkleProofTooLong',
    type: 'error',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'val', type: 'uint256' },
    ],
    name: 'NotPowerOfTwo',
    type: 'error',
  },
  {
    inputs: [
      { internalType: 'address', name: 'account', type: 'address' },
    ],
    name: 'NotValidator',
    type: 'error',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'mutualId', type: 'bytes32' },
      { internalType: 'bytes32', name: 'originId', type: 'bytes32' },
    ],
    name: 'OriginIdMutualIdMismatch',
    type: 'error',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'edgeId', type: 'bytes32' },
      { internalType: 'bytes32', name: 'confirmedRivalId', type: 'bytes32' },
    ],
    name: 'RivalEdgeConfirmed',
    type: 'error',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'stakeLevels', type: 'uint256' },
      { internalType: 'uint256', name: 'numLevels', type: 'uint256' },
    ],
    name: 'StakeAmountsMismatch',
    type: 'error',
  },
  { inputs: [], name: 'ZeroBigStepLevels', type: 'error' },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'bytes32', name: 'edgeId', type: 'bytes32' },
      { indexed: true, internalType: 'bytes32', name: 'mutualId', type: 'bytes32' },
      { indexed: true, internalType: 'bytes32', name: 'originId', type: 'bytes32' },
      { indexed: false, internalType: 'bytes32', name: 'claimId', type: 'bytes32' },
      { indexed: false, internalType: 'uint256', name: 'length', type: 'uint256' },
      { indexed: false, internalType: 'uint8', name: 'level', type: 'uint8' },
      { indexed: false, internalType: 'bool', name: 'hasRival', type: 'bool' },
      { indexed: false, internalType: 'bool', name: 'isLayerZero', type: 'bool' },
    ],
    name: 'EdgeAdded',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'bytes32', name: 'edgeId', type: 'bytes32' },
      { indexed: true, internalType: 'bytes32', name: 'lowerChildId', type: 'bytes32' },
      { indexed: true, internalType: 'bytes32', name: 'upperChildId', type: 'bytes32' },
      { indexed: false, internalType: 'bool', name: 'lowerChildAlreadyExists', type: 'bool' },
    ],
    name: 'EdgeBisected',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'bytes32', name: 'edgeId', type: 'bytes32' },
      { indexed: true, internalType: 'bytes32', name: 'mutualId', type: 'bytes32' },
    ],
    name: 'EdgeConfirmedByOneStepProof',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'bytes32', name: 'edgeId', type: 'bytes32' },
      { indexed: true, internalType: 'bytes32', name: 'mutualId', type: 'bytes32' },
      { indexed: false, internalType: 'uint256', name: 'totalTimeUnrivaled', type: 'uint256' },
    ],
    name: 'EdgeConfirmedByTime',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'bytes32', name: 'edgeId', type: 'bytes32' },
      { indexed: true, internalType: 'bytes32', name: 'mutualId', type: 'bytes32' },
      { indexed: false, internalType: 'address', name: 'stakeToken', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'stakeAmount', type: 'uint256' },
    ],
    name: 'EdgeRefunded',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: 'uint8', name: 'version', type: 'uint8' },
    ],
    name: 'Initialized',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'bytes32', name: 'edgeId', type: 'bytes32' },
      { indexed: false, internalType: 'uint256', name: 'newValue', type: 'uint256' },
    ],
    name: 'TimerCacheUpdated',
    type: 'event',
  },
  {
    inputs: [],
    name: 'LAYERZERO_BIGSTEPEDGE_HEIGHT',
    outputs: [
      { internalType: 'uint256', name: '', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'LAYERZERO_BLOCKEDGE_HEIGHT',
    outputs: [
      { internalType: 'uint256', name: '', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'LAYERZERO_SMALLSTEPEDGE_HEIGHT',
    outputs: [
      { internalType: 'uint256', name: '', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'NUM_BIGSTEP_LEVEL',
    outputs: [
      { internalType: 'uint8', name: '', type: 'uint8' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'assertionChain',
    outputs: [
      { internalType: 'contract IAssertionChain', name: '', type: 'address' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'edgeId', type: 'bytes32' },
      { internalType: 'bytes32', name: 'bisectionHistoryRoot', type: 'bytes32' },
      { internalType: 'bytes', name: 'prefixProof', type: 'bytes' },
    ],
    name: 'bisectEdge',
    outputs: [
      { internalType: 'bytes32', name: '', type: 'bytes32' },
      { internalType: 'bytes32', name: '', type: 'bytes32' },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint8', name: 'level', type: 'uint8' },
      { internalType: 'bytes32', name: 'originId', type: 'bytes32' },
      { internalType: 'uint256', name: 'startHeight', type: 'uint256' },
      { internalType: 'bytes32', name: 'startHistoryRoot', type: 'bytes32' },
      { internalType: 'uint256', name: 'endHeight', type: 'uint256' },
      { internalType: 'bytes32', name: 'endHistoryRoot', type: 'bytes32' },
    ],
    name: 'calculateEdgeId',
    outputs: [
      { internalType: 'bytes32', name: '', type: 'bytes32' },
    ],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint8', name: 'level', type: 'uint8' },
      { internalType: 'bytes32', name: 'originId', type: 'bytes32' },
      { internalType: 'uint256', name: 'startHeight', type: 'uint256' },
      { internalType: 'bytes32', name: 'startHistoryRoot', type: 'bytes32' },
      { internalType: 'uint256', name: 'endHeight', type: 'uint256' },
    ],
    name: 'calculateMutualId',
    outputs: [
      { internalType: 'bytes32', name: '', type: 'bytes32' },
    ],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    inputs: [],
    name: 'challengePeriodBlocks',
    outputs: [
      { internalType: 'uint64', name: '', type: 'uint64' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'edgeId', type: 'bytes32' },
      {
        components: [
          { internalType: 'bytes32', name: 'beforeHash', type: 'bytes32' },
          { internalType: 'bytes', name: 'proof', type: 'bytes' },
        ],
        internalType: 'struct OneStepData',
        name: 'oneStepData',
        type: 'tuple',
      },
      {
        components: [
          { internalType: 'bytes32', name: 'wasmModuleRoot', type: 'bytes32' },
          { internalType: 'uint256', name: 'requiredStake', type: 'uint256' },
          { internalType: 'address', name: 'challengeManager', type: 'address' },
          { internalType: 'uint64', name: 'confirmPeriodBlocks', type: 'uint64' },
          { internalType: 'uint64', name: 'nextInboxPosition', type: 'uint64' },
        ],
        internalType: 'struct ConfigData',
        name: 'prevConfig',
        type: 'tuple',
      },
      { internalType: 'bytes32[]', name: 'beforeHistoryInclusionProof', type: 'bytes32[]' },
      { internalType: 'bytes32[]', name: 'afterHistoryInclusionProof', type: 'bytes32[]' },
    ],
    name: 'confirmEdgeByOneStepProof',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'edgeId', type: 'bytes32' },
      {
        components: [
          {
            components: [
              {
                components: [
                  { internalType: 'bytes32[2]', name: 'bytes32Vals', type: 'bytes32[2]' },
                  { internalType: 'uint64[2]', name: 'u64Vals', type: 'uint64[2]' },
                ],
                internalType: 'struct GlobalState',
                name: 'globalState',
                type: 'tuple',
              },
              { internalType: 'enum MachineStatus', name: 'machineStatus', type: 'uint8' },
              { internalType: 'bytes32', name: 'endHistoryRoot', type: 'bytes32' },
            ],
            internalType: 'struct AssertionState',
            name: 'assertionState',
            type: 'tuple',
          },
          { internalType: 'bytes32', name: 'prevAssertionHash', type: 'bytes32' },
          { internalType: 'bytes32', name: 'inboxAcc', type: 'bytes32' },
        ],
        internalType: 'struct AssertionStateData',
        name: 'claimStateData',
        type: 'tuple',
      },
    ],
    name: 'confirmEdgeByTime',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'mutualId', type: 'bytes32' },
    ],
    name: 'confirmedRival',
    outputs: [
      { internalType: 'bytes32', name: '', type: 'bytes32' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          { internalType: 'uint8', name: 'level', type: 'uint8' },
          { internalType: 'bytes32', name: 'endHistoryRoot', type: 'bytes32' },
          { internalType: 'uint256', name: 'endHeight', type: 'uint256' },
          { internalType: 'bytes32', name: 'claimId', type: 'bytes32' },
          { internalType: 'bytes', name: 'prefixProof', type: 'bytes' },
          { internalType: 'bytes', name: 'proof', type: 'bytes' },
        ],
        internalType: 'struct CreateEdgeArgs',
        name: 'args',
        type: 'tuple',
      },
    ],
    name: 'createLayerZeroEdge',
    outputs: [
      { internalType: 'bytes32', name: '', type: 'bytes32' },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'edgeId', type: 'bytes32' },
    ],
    name: 'edgeExists',
    outputs: [
      { internalType: 'bool', name: '', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'edgeId', type: 'bytes32' },
    ],
    name: 'edgeLength',
    outputs: [
      { internalType: 'uint256', name: '', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'excessStakeReceiver',
    outputs: [
      { internalType: 'address', name: '', type: 'address' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'mutualId', type: 'bytes32' },
    ],
    name: 'firstRival',
    outputs: [
      { internalType: 'bytes32', name: '', type: 'bytes32' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'edgeId', type: 'bytes32' },
    ],
    name: 'getEdge',
    outputs: [
      {
        components: [
          { internalType: 'bytes32', name: 'originId', type: 'bytes32' },
          { internalType: 'bytes32', name: 'startHistoryRoot', type: 'bytes32' },
          { internalType: 'uint256', name: 'startHeight', type: 'uint256' },
          { internalType: 'bytes32', name: 'endHistoryRoot', type: 'bytes32' },
          { internalType: 'uint256', name: 'endHeight', type: 'uint256' },
          { internalType: 'bytes32', name: 'lowerChildId', type: 'bytes32' },
          { internalType: 'bytes32', name: 'upperChildId', type: 'bytes32' },
          { internalType: 'bytes32', name: 'claimId', type: 'bytes32' },
          { internalType: 'address', name: 'staker', type: 'address' },
          { internalType: 'uint64', name: 'createdAtBlock', type: 'uint64' },
          { internalType: 'uint64', name: 'confirmedAtBlock', type: 'uint64' },
          { internalType: 'enum EdgeStatus', name: 'status', type: 'uint8' },
          { internalType: 'uint8', name: 'level', type: 'uint8' },
          { internalType: 'bool', name: 'refunded', type: 'bool' },
          { internalType: 'uint64', name: 'totalTimeUnrivaledCache', type: 'uint64' },
        ],
        internalType: 'struct ChallengeEdge',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'enum EdgeType', name: 'eType', type: 'uint8' },
    ],
    name: 'getLayerZeroEndHeight',
    outputs: [
      { internalType: 'uint256', name: '', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'edgeId', type: 'bytes32' },
    ],
    name: 'getPrevAssertionHash',
    outputs: [
      { internalType: 'bytes32', name: '', type: 'bytes32' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'edgeId', type: 'bytes32' },
    ],
    name: 'hasLengthOneRival',
    outputs: [
      { internalType: 'bool', name: '', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'account', type: 'address' },
      { internalType: 'bytes32', name: 'mutualId', type: 'bytes32' },
    ],
    name: 'hasMadeLayerZeroRival',
    outputs: [
      { internalType: 'bool', name: '', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'edgeId', type: 'bytes32' },
    ],
    name: 'hasRival',
    outputs: [
      { internalType: 'bool', name: '', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'contract IAssertionChain', name: '_assertionChain', type: 'address' },
      { internalType: 'uint64', name: '_challengePeriodBlocks', type: 'uint64' },
      { internalType: 'contract IOneStepProofEntry', name: '_oneStepProofEntry', type: 'address' },
      { internalType: 'uint256', name: 'layerZeroBlockEdgeHeight', type: 'uint256' },
      { internalType: 'uint256', name: 'layerZeroBigStepEdgeHeight', type: 'uint256' },
      { internalType: 'uint256', name: 'layerZeroSmallStepEdgeHeight', type: 'uint256' },
      { internalType: 'contract IERC20', name: '_stakeToken', type: 'address' },
      { internalType: 'address', name: '_excessStakeReceiver', type: 'address' },
      { internalType: 'uint8', name: '_numBigStepLevel', type: 'uint8' },
      { internalType: 'uint256[]', name: '_stakeAmounts', type: 'uint256[]' },
    ],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32[]', name: 'edgeIds', type: 'bytes32[]' },
      { internalType: 'uint256', name: 'maximumCachedTime', type: 'uint256' },
    ],
    name: 'multiUpdateTimeCacheByChildren',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'oneStepProofEntry',
    outputs: [
      { internalType: 'contract IOneStepProofEntry', name: '', type: 'address' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'edgeId', type: 'bytes32' },
    ],
    name: 'refundStake',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: '', type: 'uint256' },
    ],
    name: 'stakeAmounts',
    outputs: [
      { internalType: 'uint256', name: '', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'stakeToken',
    outputs: [
      { internalType: 'contract IERC20', name: '', type: 'address' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'edgeId', type: 'bytes32' },
    ],
    name: 'timeUnrivaled',
    outputs: [
      { internalType: 'uint256', name: '', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'edgeId', type: 'bytes32' },
      { internalType: 'uint256', name: 'maximumCachedTime', type: 'uint256' },
    ],
    name: 'updateTimerCacheByChildren',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'edgeId', type: 'bytes32' },
      { internalType: 'bytes32', name: 'claimingEdgeId', type: 'bytes32' },
      { internalType: 'uint256', name: 'maximumCachedTime', type: 'uint256' },
    ],
    name: 'updateTimerCacheByClaim',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;
