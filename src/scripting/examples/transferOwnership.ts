import { z } from 'zod';
import {
  concatHex,
  createWalletClient,
  custom,
  defineChain,
  encodeFunctionData,
  parseAbi,
  toHex,
  zeroAddress,
} from 'viem';
import { runScript } from '../runScript';
import { addressSchema, bigintSchema, privateKeySchema } from '../schemas/common';
import { toPublicClient, toAccount, toWalletClient, findChain } from '../viemTransforms';
import { upgradeExecutorPrepareAddExecutorTransactionRequest } from '../../upgradeExecutorPrepareAddExecutorTransactionRequest';
import { upgradeExecutorPrepareRemoveExecutorTransactionRequest } from '../../upgradeExecutorPrepareRemoveExecutorTransactionRequest';
import {
  UPGRADE_EXECUTOR_ROLE_EXECUTOR,
  upgradeExecutorEncodeFunctionData,
} from '../../upgradeExecutorEncodeFunctionData';
import { upgradeExecutorABI } from '../../contracts/UpgradeExecutor';
import { arbOwnerABI, arbOwnerAddress } from '../../contracts/ArbOwner';

const createRetryableTicketEthABI = parseAbi([
  'function createRetryableTicket(address to, uint256 l2CallValue, uint256 maxSubmissionCost, address excessFeeRefundAddress, address callValueRefundAddress, uint256 gasLimit, uint256 maxFeePerGas, bytes data) payable returns (uint256)',
]);
const createRetryableTicketErc20ABI = parseAbi([
  'function createRetryableTicket(address to, uint256 l2CallValue, uint256 maxSubmissionCost, address excessFeeRefundAddress, address callValueRefundAddress, uint256 gasLimit, uint256 maxFeePerGas, uint256 tokenTotalFeeAmount, bytes data) returns (uint256)',
]);
const sendL2MessageABI = parseAbi(['function sendL2Message(bytes messageData) returns (uint256)']);
const inboxSubmissionFeeABI = parseAbi([
  'function calculateRetryableSubmissionFee(uint256 dataLength, uint256 baseFee) view returns (uint256)',
]);

const DEFAULT_GAS_LIMIT = 100_000n;
const BUFFER_PERCENT = 50n; // 50% buffer

function applyBuffer(value: bigint): bigint {
  return value + (value * BUFFER_PERCENT) / 100n;
}

type Input = z.output<typeof schema>;

async function calculateMaxSubmissionCost(
  { publicClient, inboxAddress }: Input,
  data: `0x${string}`,
) {
  const gasPrice = await publicClient.getGasPrice();
  return publicClient.readContract({
    address: inboxAddress,
    abi: inboxSubmissionFeeABI,
    functionName: 'calculateRetryableSubmissionFee',
    args: [BigInt(Math.ceil((data.length - 2) / 2)), applyBuffer(gasPrice)],
  });
}

async function sendRetryableViaUpgradeExecutor(
  input: Input,
  to: `0x${string}`,
  data: `0x${string}`,
) {
  const {
    publicClient,
    walletClient,
    account,
    upgradeExecutorAddress,
    inboxAddress,
    refundAddress,
    maxGasPrice,
    nativeToken,
  } = input;
  const isErc20 = nativeToken !== zeroAddress;
  const createRetryableTicketAbi = isErc20
    ? createRetryableTicketErc20ABI
    : createRetryableTicketEthABI;

  const maxSubmissionCost = applyBuffer(await calculateMaxSubmissionCost(input, data));
  const gasLimit = applyBuffer(DEFAULT_GAS_LIMIT);
  const deposit = maxSubmissionCost + gasLimit * maxGasPrice;

  const retryableArgs: unknown[] = [
    to,
    0n,
    maxSubmissionCost,
    refundAddress,
    refundAddress,
    gasLimit,
    maxGasPrice,
  ];
  if (isErc20) retryableArgs.push(deposit);
  retryableArgs.push(data);

  const createRetryableTicketData = encodeFunctionData({
    abi: createRetryableTicketAbi,
    functionName: 'createRetryableTicket',
    args: retryableArgs as never,
  });

  const { request } = await publicClient.simulateContract({
    account: account.address,
    address: upgradeExecutorAddress,
    abi: upgradeExecutorABI,
    functionName: 'executeCall',
    args: [inboxAddress, createRetryableTicketData],
    // executeCall ABI is missing payable modifier but the contract accepts value
    ...(!isErc20 && { value: deposit }),
  } as Parameters<typeof publicClient.simulateContract>[0]);

  const txHash = await walletClient.writeContract(request);
  await publicClient.waitForTransactionReceipt({ hash: txHash });
  return txHash;
}

async function sendL2Message(
  { publicClient, walletClient, account, inboxAddress, childChainId, maxGasPrice }: Input,
  to: `0x${string}`,
  data: `0x${string}`,
  nonce: number,
) {
  const childChain = defineChain({
    id: childChainId,
    name: 'Child Chain',
    network: 'child-chain',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
      default: { http: ['http://localhost'] },
      public: { http: ['http://localhost'] },
    },
  });

  const mockedWalletClient = createWalletClient({
    account,
    chain: childChain,
    transport: custom({
      async request({ method }) {
        if (method === 'eth_chainId') return toHex(childChainId);
        throw new Error(`Unexpected RPC call: ${method}`);
      },
    }),
  });

  const signedTx = await mockedWalletClient.signTransaction({
    to,
    data,
    nonce,
    gas: DEFAULT_GAS_LIMIT,
    maxFeePerGas: maxGasPrice,
    maxPriorityFeePerGas: 0n,
  });

  // InboxMessageKind.L2MessageType_signedTx = 4
  const message = concatHex([toHex(4, { size: 1 }), signedTx]);

  const { request } = await publicClient.simulateContract({
    account: account.address,
    address: inboxAddress,
    abi: sendL2MessageABI,
    functionName: 'sendL2Message',
    args: [message],
  });

  const txHash = await walletClient.writeContract(request);
  await publicClient.waitForTransactionReceipt({ hash: txHash });
  return txHash;
}

const schema = z
  .object({
    rpcUrl: z.string().url(),
    chainId: z.number(),
    privateKey: privateKeySchema,
    upgradeExecutorAddress: addressSchema,
    newOwnerAddress: addressSchema,
    inboxAddress: addressSchema,
    childUpgradeExecutorAddress: addressSchema,
    childChainId: z.number(),
    nativeToken: addressSchema.default(zeroAddress),
    maxGasPrice: bigintSchema,
    refundAddress: addressSchema.optional(),
  })
  .transform(({ rpcUrl, chainId, privateKey, refundAddress, newOwnerAddress, ...rest }) => ({
    ...rest,
    publicClient: toPublicClient(rpcUrl, findChain(chainId)),
    account: toAccount(privateKey),
    walletClient: toWalletClient(rpcUrl, privateKey, findChain(chainId)),
    refundAddress: refundAddress ?? newOwnerAddress,
    newOwnerAddress,
  }));

runScript(schema, async (input) => {
  const {
    publicClient,
    account,
    upgradeExecutorAddress,
    newOwnerAddress,
    childUpgradeExecutorAddress,
  } = input;

  // Step 1: Add new owner as executor on parent-chain UpgradeExecutor
  const addParentExecutorTxRequest = await upgradeExecutorPrepareAddExecutorTransactionRequest({
    account: newOwnerAddress,
    upgradeExecutorAddress,
    executorAccountAddress: account.address,
    publicClient,
  });
  const step1TxHash = await publicClient.sendRawTransaction({
    serializedTransaction: await account.signTransaction(addParentExecutorTxRequest),
  });
  await publicClient.waitForTransactionReceipt({ hash: step1TxHash });

  // Step 2: Grant executor role on child-chain UpgradeExecutor (via retryable)
  const grantRoleCalldata = encodeFunctionData({
    abi: upgradeExecutorABI,
    functionName: 'grantRole',
    args: [UPGRADE_EXECUTOR_ROLE_EXECUTOR, newOwnerAddress],
  });
  const addChildExecutorData = upgradeExecutorEncodeFunctionData({
    functionName: 'executeCall',
    args: [childUpgradeExecutorAddress, grantRoleCalldata],
  });
  const step2TxHash = await sendRetryableViaUpgradeExecutor(
    input,
    childUpgradeExecutorAddress,
    addChildExecutorData,
  );

  // Step 3: Add child-chain UpgradeExecutor as chain owner (via sendL2Message)
  const addChainOwnerCalldata = encodeFunctionData({
    abi: arbOwnerABI,
    functionName: 'addChainOwner',
    args: [childUpgradeExecutorAddress],
  });
  const step3TxHash = await sendL2Message(input, arbOwnerAddress, addChainOwnerCalldata, 0);

  // Step 4: Remove deployer as chain owner (via sendL2Message)
  const removeChainOwnerCalldata = encodeFunctionData({
    abi: arbOwnerABI,
    functionName: 'removeChainOwner',
    args: [account.address],
  });
  const step4TxHash = await sendL2Message(input, arbOwnerAddress, removeChainOwnerCalldata, 1);

  // Step 5: Revoke deployer's executor role on child-chain UpgradeExecutor (via retryable)
  const revokeRoleCalldata = encodeFunctionData({
    abi: upgradeExecutorABI,
    functionName: 'revokeRole',
    args: [UPGRADE_EXECUTOR_ROLE_EXECUTOR, account.address],
  });
  const removeChildExecutorData = upgradeExecutorEncodeFunctionData({
    functionName: 'executeCall',
    args: [childUpgradeExecutorAddress, revokeRoleCalldata],
  });
  const step5TxHash = await sendRetryableViaUpgradeExecutor(
    input,
    childUpgradeExecutorAddress,
    removeChildExecutorData,
  );

  // Step 6: Remove deployer as executor on parent-chain UpgradeExecutor
  const removeParentExecutorTxRequest =
    await upgradeExecutorPrepareRemoveExecutorTransactionRequest({
      account: account.address,
      upgradeExecutorAddress,
      executorAccountAddress: account.address,
      publicClient,
    });
  const step6TxHash = await publicClient.sendRawTransaction({
    serializedTransaction: await account.signTransaction(removeParentExecutorTxRequest),
  });
  await publicClient.waitForTransactionReceipt({ hash: step6TxHash });

  return {
    step1TxHash,
    step2TxHash,
    step3TxHash,
    step4TxHash,
    step5TxHash,
    step6TxHash,
  };
});
