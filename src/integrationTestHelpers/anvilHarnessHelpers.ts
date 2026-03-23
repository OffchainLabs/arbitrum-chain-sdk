import {
  Address,
  Chain,
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  Hex,
  http,
  parseEther,
} from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import { ethers } from 'ethers';

import { arbOwnerABI, arbOwnerAddress } from '../contracts/ArbOwner';
import { testConstants } from './constants';
import { dockerAsync, getNitroContractsImage } from './dockerHelpers';
import type { PrivateKeyAccountWithPrivateKey } from '../testHelpers';

export type ContractArtifact = {
  abi: ethers.ContractInterface;
  bytecode: string;
};

type PublicClient = ReturnType<typeof createPublicClient>;
type WalletClient = ReturnType<typeof createWalletClient>;

type BlockAdvancer = {
  publicClient: PublicClient;
  walletClient: WalletClient;
  account: PrivateKeyAccountWithPrivateKey;
  tickMs?: number;
};

type DeployRollupCreatorParams = {
  networkName: string;
  rpcUrl: string;
  deployerPrivateKey: `0x${string}`;
  factoryOwner: Address;
  maxDataSize: number;
  chainId: number;
};

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
    abi: testConstants.inboxFundingAbi,
    functionName: 'calculateRetryableSubmissionFee',
    args: [0n, l1BaseFeePerGas],
  });

  const l2GasPrice = await l2Client.getGasPrice();

  return {
    maxSubmissionCost: retryableSubmissionFee * 5n,
    l2MaxFeePerGas: l2GasPrice > 0n ? l2GasPrice * 5n : 1n,
  };
}

function getRollupCreatorDockerArgs(
  params: Omit<DeployRollupCreatorParams, 'blockAdvancer'>,
  nitroContractsImage: string,
) {
  return [
    'run',
    '--rm',
    '--network',
    params.networkName,
    '-e',
    `CUSTOM_RPC_URL=${params.rpcUrl}`,
    '-e',
    `CUSTOM_PRIVKEY=${params.deployerPrivateKey}`,
    '-e',
    `CUSTOM_CHAINID=${params.chainId}`,
    '-e',
    `FACTORY_OWNER=${params.factoryOwner}`,
    '-e',
    `MAX_DATA_SIZE=${params.maxDataSize}`,
    '-e',
    `POLLING_INTERVAL=${testConstants.NITRO_DEPLOY_POLLING_INTERVAL_MS}`,
    '-e',
    'DISABLE_VERIFICATION=true',
    '-e',
    'IGNORE_MAX_DATA_SIZE_WARNING=true',
    nitroContractsImage,
    'deploy-factory',
    '--network',
    'custom',
  ];
}

function parseRollupCreatorAddress(stdout: string): Address {
  const match = stdout.match(/\* RollupCreator created at address: (0x[0-9a-fA-F]{40})/);
  if (!match) {
    throw new Error(`Failed to parse RollupCreator address from Nitro deploy output:\n${stdout}`);
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
  const l1Client = createPublicClient({ chain: sepolia, transport: http(l1RpcUrl) });
  const l1WalletClient = createWalletClient({
    chain: sepolia,
    transport: http(l1RpcUrl),
    account: deployer,
  });
  const l2Client = createPublicClient({ chain: l2Chain, transport: http(l2RpcUrl) });

  const fundAmount = parseEther('1000');
  const retryableGasLimit = BigInt(100_000);

  let currentBalance = await l2Client.getBalance({ address: deployer.address });
  if (currentBalance >= fundAmount) {
    return;
  }

  const previousBalance = currentBalance;
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
      abi: testConstants.inboxFundingAbi,
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
    if (currentBalance > previousBalance) {
      return currentBalance;
    }

    await sleep(1000);
  }

  throw new Error(
    `Timed out funding ${deployer.address} on orbit chain through inbox ${inbox}. Current balance: ${currentBalance}`,
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
      data: encodeFunctionData({
        abi: arbOwnerABI,
        functionName,
        args: [value],
      }),
    });
    await publicClient.waitForTransactionReceipt({ hash });
  };

  await sendFeeUpdate('setMinimumL2BaseFee', 1n);
  await sendFeeUpdate('setL2BaseFee', 1n);
  await sendFeeUpdate('setL1PricePerUnit', 0n);
  await sendFeeUpdate('setPerBatchGasCharge', 0n);
}

export async function setBalanceOnL1(params: {
  rpcUrl: string;
  address: Address;
  balance: bigint;
}) {
  const publicClient = createPublicClient({ transport: http(params.rpcUrl) });
  await publicClient.request({
    method: 'anvil_setBalance' as never,
    params: [params.address, `0x${params.balance.toString(16)}`],
  });
}

export async function refreshForkTime(params: { rpcUrl: string }) {
  const publicClient = createPublicClient({ transport: http(params.rpcUrl) });
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

async function withBackgroundBlockAdvancing<T>(
  blockAdvancer: BlockAdvancer,
  fn: () => Promise<T>,
): Promise<T> {
  const tickMs = blockAdvancer.tickMs ?? 1_000;
  let keepAdvancingBlocks = true;

  const backgroundWork = (async () => {
    while (keepAdvancingBlocks) {
      try {
        await advanceBlock(blockAdvancer);
      } catch {
        // ignore and keep advancing blocks
      }

      await sleep(tickMs);
    }
  })();

  try {
    return await fn();
  } finally {
    keepAdvancingBlocks = false;
    await backgroundWork;
  }
}

export async function deployRollupCreator(
  params: DeployRollupCreatorParams,
  blockAdvancer: BlockAdvancer,
): Promise<Address> {
  const nitroContractsImage = getNitroContractsImage();
  const dockerRunStartedAt = Date.now();
  const stdout = await withBackgroundBlockAdvancing(blockAdvancer, () =>
    dockerAsync(
      getRollupCreatorDockerArgs(
        {
          networkName: params.networkName,
          rpcUrl: params.rpcUrl,
          deployerPrivateKey: params.deployerPrivateKey,
          factoryOwner: params.factoryOwner,
          maxDataSize: params.maxDataSize,
          chainId: params.chainId,
        },
        nitroContractsImage,
      ),
    ),
  );
  console.log(
    `[${new Date().toISOString()}] rollup creator docker run finished after ${
      Date.now() - dockerRunStartedAt
    }ms`,
  );

  return parseRollupCreatorAddress(stdout);
}
