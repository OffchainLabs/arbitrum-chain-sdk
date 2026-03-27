import {
  Address,
  Chain,
  ChainContract,
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  Hex,
  http,
  parseEther,
  parseGwei,
} from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import { ethers } from 'ethers';

import { arbOwnerABI, arbOwnerAddress } from '../contracts/ArbOwner';
import { erc20ABI } from '../contracts/ERC20';
import { inboxABI } from '../contracts/Inbox';
import { erc20InboxABI } from '../contracts/ERC20Inbox';
import { tokenBridgeCreatorAddress } from '../contracts/TokenBridgeCreator';
import { testConstants } from './constants';
import {
  dockerAsync,
  getIntTestContractsImage,
  getRollupCreatorDockerArgs,
  getTokenBridgeCreatorDockerArgs,
} from './dockerHelpers';
import type { PrivateKeyAccountWithPrivateKey } from '../testHelpers';

export type ContractArtifact = {
  abi: ethers.ContractInterface;
  bytecode: string;
};

type PublicClient = ReturnType<typeof createPublicClient>;
type WalletClient = ReturnType<typeof createWalletClient>;

export type BlockAdvancer = {
  publicClient: PublicClient;
  walletClient: WalletClient;
  account: PrivateKeyAccountWithPrivateKey;
  stop(): Promise<void>;
};

type BlockAdvancingState = {
  stopAdvancing(): void;
  done: Promise<void>;
};

type CreateBlockAdvancerParams = {
  publicClient: PublicClient;
  walletClient: WalletClient;
  account: PrivateKeyAccountWithPrivateKey;
};

const blockAdvancingStates = new WeakMap<BlockAdvancer, BlockAdvancingState>();

type DeployRollupCreatorParams = {
  rpcUrl: string;
  deployerPrivateKey: `0x${string}`;
  factoryOwner: Address;
  maxDataSize: number;
  chainId: number;
  blockAdvancer: BlockAdvancer;
};

type DeployTokenBridgeCreatorParams = {
  rpcUrl: string;
  deployerPrivateKey: `0x${string}`;
  wethAddress: Address;
  blockAdvancer?: BlockAdvancer;
};

const rpcUrlToChain = new Map<string, Chain>();

export function registerChainForRpcUrl(params: { rpcUrl: string; chain: Chain }) {
  rpcUrlToChain.set(params.rpcUrl, params.chain);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getRequiredRetryableFunding(
  l1Client: PublicClient,
  l2Client: PublicClient,
  inbox: Address,
): Promise<{ maxSubmissionCost: bigint; l2MaxFeePerGas: bigint }> {
  const block = await l1Client.getBlock();
  const l1BaseFeePerGas = block.baseFeePerGas ?? 1n;

  const retryableSubmissionFee = await l1Client.readContract({
    address: inbox,
    abi: inboxABI,
    functionName: 'calculateRetryableSubmissionFee',
    args: [0n, l1BaseFeePerGas],
  });

  const l2GasPrice = await l2Client.getGasPrice();

  return {
    maxSubmissionCost: retryableSubmissionFee * 5n,
    l2MaxFeePerGas: l2GasPrice > 0n ? l2GasPrice * 5n : 1n,
  };
}

function parseRollupCreatorAddress(stdout: string): Address {
  const match = stdout.match(/\* RollupCreator created at address: (0x[0-9a-fA-F]{40})/);
  if (!match) {
    throw new Error(`Failed to parse RollupCreator address from Nitro deploy output:\n${stdout}`);
  }

  return match[1] as Address;
}

function parseTokenBridgeCreatorAddress(stdout: string): Address {
  const match = stdout.match(/L1TokenBridgeCreator:\s*(0x[0-9a-fA-F]{40})/);
  if (!match) {
    throw new Error(
      `Failed to parse TokenBridgeCreator address from token bridge deploy output:\n${stdout}`,
    );
  }

  return match[1] as Address;
}

export function createAccount(privateKey?: Hex): PrivateKeyAccountWithPrivateKey {
  const normalizedPrivateKey = privateKey ?? generatePrivateKey();
  return {
    ...privateKeyToAccount(normalizedPrivateKey),
    privateKey: normalizedPrivateKey,
  };
}

export function createBlockAdvancer(params: CreateBlockAdvancerParams): BlockAdvancer {
  const blockAdvancer: BlockAdvancer = {
    ...params,
    async stop() {
      const state = blockAdvancingStates.get(blockAdvancer);
      if (!state) {
        return;
      }

      state.stopAdvancing();
      await state.done;
    },
  };

  return blockAdvancer;
}

export async function ensureCreate2Factory(params: {
  publicClient: PublicClient;
  walletClient: WalletClient;
  fundingAccount: PrivateKeyAccountWithPrivateKey;
}) {
  const { publicClient, walletClient, fundingAccount } = params;
  const code = await publicClient.getBytecode({
    address: testConstants.CREATE2_FACTORY as Address,
  });
  if (code && code !== '0x') {
    return;
  }

  const balance = await publicClient.getBalance({
    address: testConstants.CREATE2_DEPLOYER as Address,
  });
  if (balance < parseEther('0.01')) {
    const fundingTxHash = await walletClient.sendTransaction({
      account: fundingAccount,
      chain: walletClient.chain,
      to: testConstants.CREATE2_DEPLOYER as Address,
      value: parseEther('0.02'),
    });
    await publicClient.waitForTransactionReceipt({ hash: fundingTxHash });
  }

  const deploymentTxHash = await publicClient.sendRawTransaction({
    serializedTransaction: testConstants.CREATE2_DEPLOYER_TX as `0x${string}`,
  });
  await publicClient.waitForTransactionReceipt({ hash: deploymentTxHash });

  const deployedCode = await publicClient.getBytecode({
    address: testConstants.CREATE2_FACTORY as Address,
  });
  if (!deployedCode || deployedCode === '0x') {
    throw new Error(`Failed to deploy Create2 factory at ${testConstants.CREATE2_FACTORY}`);
  }
}

export async function fundL2Deployer(params: {
  l1RpcUrl: string;
  l2RpcUrl: string;
  l2Chain: Chain;
  deployer: PrivateKeyAccountWithPrivateKey;
  inbox: Address;
}) {
  const { l1RpcUrl, l2RpcUrl, l2Chain, deployer, inbox } = params;

  const l1Client = createPublicClient({
    chain: sepolia,
    transport: http(l1RpcUrl),
    pollingInterval: testConstants.POLLING_INTERVAL,
  });

  const l1WalletClient = createWalletClient({
    chain: sepolia,
    transport: http(l1RpcUrl),
    account: deployer,
    pollingInterval: testConstants.POLLING_INTERVAL,
  });

  const l2Client = createPublicClient({
    chain: l2Chain,
    transport: http(l2RpcUrl),
    pollingInterval: testConstants.POLLING_INTERVAL,
  });

  const fundAmount = parseEther('1000');
  const retryableGasLimit = BigInt(100_000);

  let currentBalance = await l2Client.getBalance({ address: deployer.address });
  if (currentBalance >= fundAmount) {
    return;
  }

  const { maxSubmissionCost, l2MaxFeePerGas } = await getRequiredRetryableFunding(
    l1Client,
    l2Client,
    inbox,
  );

  const txHash = await l1WalletClient.sendTransaction({
    account: deployer,
    chain: sepolia,
    to: inbox,
    value: fundAmount + maxSubmissionCost + retryableGasLimit * l2MaxFeePerGas,
    data: encodeFunctionData({
      abi: inboxABI,
      functionName: 'createRetryableTicketNoRefundAliasRewrite',
      args: [
        deployer.address,
        fundAmount,
        maxSubmissionCost,
        deployer.address,
        deployer.address,
        retryableGasLimit,
        l2MaxFeePerGas,
        '0x',
      ],
    }),
  });

  await l1Client.waitForTransactionReceipt({ hash: txHash });

  const startedAt = Date.now();

  while (Date.now() - startedAt < 60_000) {
    currentBalance = await l2Client.getBalance({ address: deployer.address });
    if (currentBalance >= fundAmount) {
      return currentBalance;
    }

    await sleep(100);
  }

  throw new Error(
    `Timed out funding ${deployer.address} on orbit chain through inbox ${inbox}. Current balance: ${currentBalance}`,
  );
}

export async function bridgeNativeTokenToOrbitChain(params: {
  parentPublicClient: PublicClient;
  parentWalletClient: WalletClient;
  childPublicClient: PublicClient;
  depositor: PrivateKeyAccountWithPrivateKey;
  inbox: Address;
  nativeToken: Address;
  amount: bigint;
}) {
  const {
    parentPublicClient,
    parentWalletClient,
    childPublicClient,
    depositor,
    inbox,
    nativeToken,
    amount,
  } = params;

  const balanceBefore = await childPublicClient.getBalance({ address: depositor.address });
  const targetBalance = balanceBefore + amount;

  const approveHash = await parentWalletClient.writeContract({
    account: depositor,
    chain: parentWalletClient.chain,
    address: nativeToken,
    abi: erc20ABI,
    functionName: 'approve',
    args: [inbox, amount],
  });

  await parentPublicClient.waitForTransactionReceipt({ hash: approveHash });

  const depositHash = await parentWalletClient.writeContract({
    account: depositor,
    chain: parentWalletClient.chain,
    address: inbox,
    abi: erc20InboxABI,
    functionName: 'depositERC20',
    args: [amount],
  });

  await parentPublicClient.waitForTransactionReceipt({ hash: depositHash });

  const startedAt = Date.now();

  while (Date.now() - startedAt < 60_000) {
    const updatedBalance = await childPublicClient.getBalance({ address: depositor.address });
    if (updatedBalance >= targetBalance) {
      return updatedBalance;
    }
    await sleep(100);
  }

  const finalBalance = await childPublicClient.getBalance({ address: depositor.address });
  throw new Error(
    `Timed out bridging native token to ${depositor.address} on orbit chain through inbox ${inbox}. Current balance: ${finalBalance}`,
  );
}

export async function configureL2Fees(
  publicClient: PublicClient,
  walletClient: WalletClient,
  owner: PrivateKeyAccountWithPrivateKey,
) {
  const sendFeeUpdate = async (
    functionName:
      | 'setMinimumL2BaseFee'
      | 'setL2BaseFee'
      | 'setL1PricePerUnit'
      | 'setPerBatchGasCharge',
    value: bigint,
  ) => {
    const hash = await walletClient.sendTransaction({
      account: owner,
      chain: walletClient.chain,
      to: arbOwnerAddress,
      gas: 4_000_000n,
      maxFeePerGas: parseGwei('0.1'),
      maxPriorityFeePerGas: 0n,
      data: encodeFunctionData({
        abi: arbOwnerABI,
        functionName,
        args: [value],
      }),
    });
    await publicClient.waitForTransactionReceipt({ hash });
  };

  await sendFeeUpdate('setMinimumL2BaseFee', 2n);
  await sendFeeUpdate('setL2BaseFee', 1n);
  await sendFeeUpdate('setL1PricePerUnit', 0n);
  await sendFeeUpdate('setPerBatchGasCharge', 0n);
}

export async function setBalanceOnL1(params: {
  rpcUrl: string;
  address: Address;
  balance: bigint;
}) {
  const publicClient = createPublicClient({
    transport: http(params.rpcUrl),
    pollingInterval: testConstants.POLLING_INTERVAL,
  });
  await publicClient.request({
    method: 'anvil_setBalance' as never,
    params: [params.address, `0x${params.balance.toString(16)}`] as never,
  });
}

export async function refreshForkTime(params: { rpcUrl: string }) {
  const publicClient = createPublicClient({
    transport: http(params.rpcUrl),
    pollingInterval: testConstants.POLLING_INTERVAL,
  });
  const now = Math.floor(Date.now() / 1000);

  await publicClient.request({
    method: 'evm_setNextBlockTimestamp' as never,
    params: [now] as never,
  });
  await publicClient.request({
    method: 'evm_mine' as never,
    params: [] as never,
  });
}

export async function deployContract(
  signer: ethers.Signer,
  artifact: ContractArtifact,
  args: unknown[] = [],
): Promise<ethers.Contract> {
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, signer);
  const contract = await factory.deploy(...args, testConstants.LOW_L2_FEE_OVERRIDES);
  await contract.deployTransaction.wait();
  return contract;
}

export async function advanceBlock(params: {
  publicClient: PublicClient;
  walletClient: WalletClient;
  account: PrivateKeyAccountWithPrivateKey;
}) {
  const hash = await params.walletClient.sendTransaction({
    account: params.account,
    chain: params.walletClient.chain,
    to: params.account.address,
    value: 0n,
  });

  await params.publicClient.waitForTransactionReceipt({ hash });
}

export function startBlockAdvancing(blockAdvancer: BlockAdvancer): void {
  if (blockAdvancingStates.has(blockAdvancer)) {
    return;
  }

  let keepAdvancingBlocks = true;
  const state: BlockAdvancingState = {
    stopAdvancing() {
      keepAdvancingBlocks = false;
    },
    done: Promise.resolve(),
  };

  state.done = (async () => {
    try {
      while (keepAdvancingBlocks) {
        try {
          await advanceBlock(blockAdvancer);
        } catch {
          // ignore and keep advancing blocks
        }

        await sleep(100);
      }
    } finally {
      if (blockAdvancingStates.get(blockAdvancer) === state) {
        blockAdvancingStates.delete(blockAdvancer);
      }
    }
  })();

  blockAdvancingStates.set(blockAdvancer, state);
}

async function withBlockAdvancing<T>(
  blockAdvancer: BlockAdvancer,
  fn: () => Promise<T>,
): Promise<T> {
  startBlockAdvancing(blockAdvancer);

  try {
    return await fn();
  } finally {
    await blockAdvancer.stop();
  }
}

export async function deployRollupCreator(params: DeployRollupCreatorParams): Promise<Address> {
  const intTestContractsImage = getIntTestContractsImage();
  const stdout = await withBlockAdvancing(params.blockAdvancer, () =>
    dockerAsync(
      getRollupCreatorDockerArgs(
        {
          rpcUrl: params.rpcUrl.replace(new URL(params.rpcUrl).hostname, 'host.docker.internal'),
          deployerPrivateKey: params.deployerPrivateKey,
          factoryOwner: params.factoryOwner,
          maxDataSize: params.maxDataSize,
          chainId: params.chainId,
        },
        intTestContractsImage,
      ),
    ),
  );

  return parseRollupCreatorAddress(stdout);
}

export async function deployTokenBridgeCreator(
  params: DeployTokenBridgeCreatorParams,
): Promise<Address> {
  const intTestContractsImage = getIntTestContractsImage();
  const hostname = new URL(params.rpcUrl).hostname;
  const rpcUrl = params.rpcUrl.replace(hostname, 'host.docker.internal');

  const deploy = () =>
    dockerAsync(
      getTokenBridgeCreatorDockerArgs(
        { ...params, rpcUrl, addHostDockerInternal: true },
        intTestContractsImage,
      ),
    );

  const stdout = params.blockAdvancer
    ? await withBlockAdvancing(params.blockAdvancer, deploy)
    : await deploy();
  const address = parseTokenBridgeCreatorAddress(stdout);
  const chain = rpcUrlToChain.get(params.rpcUrl);

  if (chain?.contracts?.tokenBridgeCreator) {
    (chain.contracts.tokenBridgeCreator as ChainContract).address = address;
  } else {
    const chainId =
      chain?.id ??
      (await createPublicClient({
        transport: http(params.rpcUrl),
        pollingInterval: testConstants.POLLING_INTERVAL,
      }).getChainId());
    (tokenBridgeCreatorAddress as Record<number, Address>)[chainId] = address;
  }

  return address;
}
