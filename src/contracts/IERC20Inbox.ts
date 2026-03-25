export const erc20InboxABI = [
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [{ name: 'amount', type: 'uint256' }],
    name: 'depositERC20',
    outputs: [],
  },
] as const;
