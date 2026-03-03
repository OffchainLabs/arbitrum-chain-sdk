import { Address, PublicClient, Transport, Chain, WalletClient, encodeFunctionData } from 'viem';

import { erc20ABI } from '../contracts/ERC20';

function approveEncodeFunctionData({ spender, amount }: { spender: Address; amount: bigint }) {
  return encodeFunctionData({
    abi: erc20ABI,
    functionName: 'approve',
    args: [spender, amount],
  });
}

export type ApprovePrepareTransactionRequestProps<TChain extends Chain | undefined> = {
  address: Address;
  owner: Address;
  spender: Address;
  amount: bigint;
  publicClient: PublicClient<Transport, TChain>;
};

export async function approvePrepareTransactionRequest<TChain extends Chain | undefined>({
  address,
  owner,
  spender,
  amount,
  publicClient,
}: ApprovePrepareTransactionRequestProps<TChain>) {
  // @ts-expect-error -- todo: fix viem type issue
  return await publicClient.prepareTransactionRequest({
    chain: publicClient.chain,
    to: address,
    data: approveEncodeFunctionData({ spender, amount }),
    value: BigInt(0),
    account: owner,
  });
}

export type ApproveProps<TChain extends Chain | undefined> = {
  address: Address;
  spender: Address;
  amount: bigint;
  publicClient: PublicClient<Transport, TChain>;
  walletClient: WalletClient;
};

export async function approve<TChain extends Chain | undefined>({
  address,
  spender,
  amount,
  publicClient,
  walletClient,
}: ApproveProps<TChain>) {
  const account = walletClient.account?.address;

  if (typeof account === 'undefined') {
    throw new Error('[utils/erc20::approve] account is undefined');
  }

  // @ts-expect-error -- todo: fix viem type issue
  const { request } = await publicClient.simulateContract({
    address: address,
    abi: erc20ABI,
    functionName: 'approve',
    args: [spender, amount],
    account,
  });

  const hash = await walletClient.writeContract(request);
  return await publicClient.waitForTransactionReceipt({ hash: hash });
}

export type FetchAllowanceProps<TChain extends Chain | undefined> = {
  address: Address;
  owner: Address;
  spender: Address;
  publicClient: PublicClient<Transport, TChain>;
};

export async function fetchAllowance<TChain extends Chain | undefined>({
  address,
  owner,
  spender,
  publicClient,
}: FetchAllowanceProps<TChain>) {
  return publicClient.readContract({
    address,
    abi: erc20ABI,
    functionName: 'allowance',
    args: [owner, spender],
  });
}

export type FetchDecimalsProps<TChain extends Chain | undefined> = {
  address: Address;
  publicClient: PublicClient<Transport, TChain>;
};

export function fetchDecimals<TChain extends Chain | undefined>({
  address,
  publicClient,
}: FetchDecimalsProps<TChain>) {
  return publicClient.readContract({
    address,
    abi: erc20ABI,
    functionName: 'decimals',
  });
}
