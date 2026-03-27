export const inboxABI = [
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [
      { name: 'dataLength', type: 'uint256' },
      { name: 'baseFee', type: 'uint256' },
    ],
    name: 'calculateRetryableSubmissionFee',
    outputs: [{ type: 'uint256' }],
  },
  {
    stateMutability: 'payable',
    type: 'function',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'l2CallValue', type: 'uint256' },
      { name: 'maxSubmissionCost', type: 'uint256' },
      { name: 'excessFeeRefundAddress', type: 'address' },
      { name: 'callValueRefundAddress', type: 'address' },
      { name: 'gasLimit', type: 'uint256' },
      { name: 'maxFeePerGas', type: 'uint256' },
      { name: 'data', type: 'bytes' },
    ],
    name: 'createRetryableTicketNoRefundAliasRewrite',
    outputs: [{ type: 'uint256' }],
  },
] as const;
