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
import { addressSchema, bigintSchema } from '../schemas/common';
import { toPublicClient, toAccount, toWalletClient } from '../viemTransforms';
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
const sendL2MessageABI = parseAbi([
  'function sendL2Message(bytes messageData) returns (uint256)',
]);
const inboxSubmissionFeeABI = parseAbi([
  'function calculateRetryableSubmissionFee(uint256 dataLength, uint256 baseFee) view returns (uint256)',
]);

const DEFAULT_GAS_LIMIT = 100_000n;
const BUFFER_PERCENT = 50n; // 50% buffer

function applyBuffer(value: bigint): bigint {
  return value + (value * BUFFER_PERCENT) / 100n;
}

const schema = z.object({
    rpcUrl: z.string().url(),
    privateKey: z.string().startsWith('0x'),
    upgradeExecutorAddress: addressSchema,
    newOwnerAddress: addressSchema,
    inboxAddress: addressSchema,
    childUpgradeExecutorAddress: addressSchema,
    childChainId: z.number(),
    nativeToken: addressSchema.default(zeroAddress),
    maxGasPrice: bigintSchema,
  })
  .transform((input) => {
    const account = toAccount(input.privateKey);
    const publicClient = toPublicClient(input.rpcUrl);
    return {
      publicClient,
      account,
      walletClient: toWalletClient(input.rpcUrl, input.privateKey),
      upgradeExecutorAddress: input.upgradeExecutorAddress,
      newOwnerAddress: input.newOwnerAddress,
      inboxAddress: input.inboxAddress,
      childUpgradeExecutorAddress: input.childUpgradeExecutorAddress,
      childChainId: input.childChainId,
      nativeToken: input.nativeToken,
      maxGasPrice: input.maxGasPrice,
    };
  });

runScript({
  input: schema,
  async run(input) {
    const {
      publicClient, account, walletClient, upgradeExecutorAddress, newOwnerAddress,
      inboxAddress, childUpgradeExecutorAddress, childChainId, nativeToken, maxGasPrice,
    } = input;

    const isErc20 = nativeToken !== zeroAddress;
    const createRetryableTicketAbi = isErc20 ? createRetryableTicketErc20ABI : createRetryableTicketEthABI;

    // Helper: calculate submission cost from calldata
    const calculateMaxSubmissionCost = async (data: `0x${string}`) => {
      const gasPrice = await publicClient.getGasPrice();
      return publicClient.readContract({
        address: inboxAddress,
        abi: inboxSubmissionFeeABI,
        functionName: 'calculateRetryableSubmissionFee',
        args: [BigInt(Math.ceil((data.length - 2) / 2)), applyBuffer(gasPrice)],
      });
    };

    // Helper: send retryable ticket through parent-chain UpgradeExecutor
    const sendRetryableViaUpgradeExecutor = async (
      to: `0x${string}`,
      data: `0x${string}`,
    ) => {
      const maxSubmissionCost = applyBuffer(await calculateMaxSubmissionCost(data));
      const gasLimit = applyBuffer(DEFAULT_GAS_LIMIT);
      const deposit = maxSubmissionCost + gasLimit * maxGasPrice;

      const retryableArgs: unknown[] = [
        to, 0n, maxSubmissionCost, newOwnerAddress, newOwnerAddress,
        gasLimit, maxGasPrice,
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
    };

    // Helper: send signed child-chain tx via Inbox.sendL2Message
    const sendL2Message = async (
      to: `0x${string}`,
      data: `0x${string}`,
      nonce: number,
    ) => {
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
    };

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
    const step2TxHash = await sendRetryableViaUpgradeExecutor(childUpgradeExecutorAddress, addChildExecutorData);

    // Step 3: Add child-chain UpgradeExecutor as chain owner (via sendL2Message)
    const addChainOwnerCalldata = encodeFunctionData({
      abi: arbOwnerABI,
      functionName: 'addChainOwner',
      args: [childUpgradeExecutorAddress],
    });
    const step3TxHash = await sendL2Message(arbOwnerAddress, addChainOwnerCalldata, 0);

    // Step 4: Remove deployer as chain owner (via sendL2Message)
    const removeChainOwnerCalldata = encodeFunctionData({
      abi: arbOwnerABI,
      functionName: 'removeChainOwner',
      args: [account.address],
    });
    const step4TxHash = await sendL2Message(arbOwnerAddress, removeChainOwnerCalldata, 1);

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
    const step5TxHash = await sendRetryableViaUpgradeExecutor(childUpgradeExecutorAddress, removeChildExecutorData);

    // Step 6: Remove deployer as executor on parent-chain UpgradeExecutor
    const removeParentExecutorTxRequest = await upgradeExecutorPrepareRemoveExecutorTransactionRequest({
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
  },
});
