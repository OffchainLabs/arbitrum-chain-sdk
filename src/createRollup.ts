import { Address, Chain, PrivateKeyAccount, PublicClient, Transport, zeroAddress } from 'viem';

import { CoreContracts } from './types/CoreContracts';
import { createRollupPrepareTransactionRequest } from './createRollupPrepareTransactionRequest';
import {
  CreateRollupTransactionReceipt,
  createRollupPrepareTransactionReceipt,
} from './createRollupPrepareTransactionReceipt';
import { createRollupEnoughCustomFeeTokenAllowance } from './createRollupEnoughCustomFeeTokenAllowance';
import { createRollupPrepareCustomFeeTokenApprovalTransactionRequest } from './createRollupPrepareCustomFeeTokenApprovalTransactionRequest';
import { getBlockExplorerUrl } from './utils/getBlockExplorerUrl';
import {
  CreateRollupTransaction,
  createRollupPrepareTransaction,
} from './createRollupPrepareTransaction';
import { CreateRollupParams, RollupCreatorSupportedVersion } from './types/createRollupTypes';
import { validateParentChain } from './types/ParentChain';

type EnsureCustomGasTokenAllowanceGrantedToRollupCreatorParams<TChain extends Chain | undefined> = {
  nativeToken: Address;
  parentChainPublicClient: PublicClient<Transport, TChain>;
  account: PrivateKeyAccount;
  rollupCreatorVersion?: RollupCreatorSupportedVersion;
};

/**
 * Check if the Rollup Creator address has been granted enough
 * allowance by the rollupOwner address to spend the custom fee token to
 * pay for the rollup creation retryable ticket.
 *
 * If not, perform an approval transaction to grant the custom fee token
 * spend allowance to the Rollup Creator address.
 */
async function ensureCustomGasTokenAllowanceGrantedToRollupCreator<
  TChain extends Chain | undefined,
>({
  nativeToken,
  parentChainPublicClient,
  account,
  rollupCreatorVersion = 'v3.2',
}: EnsureCustomGasTokenAllowanceGrantedToRollupCreatorParams<TChain>) {
  const allowanceParams = {
    nativeToken,
    account: account.address,
    publicClient: parentChainPublicClient,
    rollupCreatorVersion,
  };

  if (!(await createRollupEnoughCustomFeeTokenAllowance(allowanceParams))) {
    const approvalTxRequest = await createRollupPrepareCustomFeeTokenApprovalTransactionRequest(
      allowanceParams,
    );

    // sign and send the transaction
    console.log(`Approving custom fee token allowance for RollupCreator...`);
    const approvalTxHash = await parentChainPublicClient.sendRawTransaction({
      serializedTransaction: await account.signTransaction(approvalTxRequest),
    });

    // get the transaction receipt after waiting for the transaction to complete
    const approvalTxReceipt = createRollupPrepareTransactionReceipt(
      await parentChainPublicClient.waitForTransactionReceipt({
        hash: approvalTxHash,
      }),
    );

    console.log(
      `Tokens approved in ${getBlockExplorerUrl(parentChainPublicClient.chain)}/tx/${
        approvalTxReceipt.transactionHash
      }`,
    );
    console.log(`Approval transaction hash is ${approvalTxReceipt.transactionHash}`);
  }
}

/**
 * This type is for the params of the createRollup function
 */
export type CreateRollupFunctionParams<TChain extends Chain | undefined> =
  | {
      params: CreateRollupParams<'v2.1'>;
      account: PrivateKeyAccount;
      parentChainPublicClient: PublicClient<Transport, TChain>;
      rollupCreatorVersion: 'v2.1';
    }
  | {
      params: CreateRollupParams<'v3.2'>;
      account: PrivateKeyAccount;
      parentChainPublicClient: PublicClient<Transport, TChain>;
      rollupCreatorVersion: 'v3.2';
    }
  | {
      params: CreateRollupParams<'v3.2'>;
      account: PrivateKeyAccount;
      parentChainPublicClient: PublicClient<Transport, TChain>;
      rollupCreatorVersion?: never;
    };

/**
 * @param {Object} createRollupResults - results of the createRollup function
 * @param {Object} createRollupResults.transaction - the transaction for deploying the core contracts
 * @param {Object} createRollupResults.txReceipt - the transaction receipt
 * @param {Object} createRollupResults.coreContracts - the core contracts
 */
export type CreateRollupResults = {
  transaction: CreateRollupTransaction;
  transactionReceipt: CreateRollupTransactionReceipt;
  coreContracts: CoreContracts;
};

/**
 * Performs the tx to deploy the chain's core contracts.
 *
 * Before creating a custom gas token chain, it checks the custom gas
 * token allowance granted to the rollup creator contract. Runs an approval
 * tx for insufficient allowance.
 *
 * Accepts rollup creation config, rollup owner, and the parent chain public client.
 *
 * Returns the transaction, the transaction receipt, and the core contracts.
 *
 * - Example 1: [Create an ETH gas token chain](https://github.com/OffchainLabs/arbitrum-orbit-sdk/blob/main/examples/create-rollup-eth/index.ts)
 * - Example 2: [Create a custom gas token chain](https://github.com/OffchainLabs/arbitrum-orbit-sdk/blob/main/examples/create-rollup-custom-fee-token/index.ts)
 *
 * @param {CreateRollupFunctionParams} createRollupFunctionParams {@link CreateRollupFunctionParams}
 * @param {Object} createRollupFunctionParams.params - {@link CreateRollupParams}
 * @param {Object} createRollupFunctionParams.params.config - The chain config
 * @param {string} createRollupFunctionParams.params.batchPoster - The batchPoster address
 * @param {Array<string>} createRollupFunctionParams.params.validators - The validator(s) address array
 * @param {boolean} [createRollupFunctionParams.params.deployFactoriesToL2=] - Optional, defaults to true.
 * Deploying factories via retryable tickets at rollup creation time is the most reliable method to
 * do it since it doesn't require paying the L1 gas. If deployment is not done as part of rollup
 * creation TX, there is a risk that anyone can try to deploy factories and potentially burn
 * the nonce 0 (ie. due to gas price spike when doing direct child chain TX). That would mean we
 * permanently lost capability to deploy deterministic factory at expected address.
 * @param {string} [createRollupFunctionParams.params.nativeToken=] - The native token address, optional, defaults to ETH
 * @param {number} [createRollupFunctionParams.params.maxDataSize=] - The max calldata size, optional, defaults to 104_857 B for Orbit chains
 * @param {number} [createRollupFunctionParams.params.maxFeePerGasForRetryables=] - The max fee per gas for retryables, optional, defaults to 0.1 gwei
 * @param {Object} createRollupFunctionParams.account - The rollup owner private key account
 * @param {Object} createRollupFunctionParams.parentChainPublicClient - The parent chain Viem Public Client
 *
 * @returns Promise<{@link CreateRollupResults}> - the transaction, the transaction receipt, and the core contracts.
 *
 * @example
 * const createRollupConfig = createRollupPrepareDeploymentParamsConfig(parentChainPublicClient, {
 *   chainId: BigInt(chainId),
 *   owner: deployer.address,
 *   chainConfig: prepareChainConfig({
 *     chainId,
 *     arbitrum: {
 *       InitialChainOwner: deployer.address,
 *       DataAvailabilityCommittee: true,
 *     },
 *   }),
 * });
 *
 * const {
 *   transaction,
 *   transactionReceipt,
 *   coreContracts,
 * } = await createRollup({
 *   params: {
 *     config: createRollupConfig,
 *     batchPosters,
 *     validators,
 *  },
 *  account: deployer,
 *  parentChainPublicClient,
 * });
 */
export async function createRollup<TChain extends Chain | undefined>({
  params,
  account,
  parentChainPublicClient,
  rollupCreatorVersion = 'v3.2',
}: CreateRollupFunctionParams<TChain>): Promise<CreateRollupResults> {
  validateParentChain(parentChainPublicClient);

  const parentChain = parentChainPublicClient.chain;
  const nativeToken = params.nativeToken ?? zeroAddress;

  if (nativeToken !== zeroAddress) {
    // check Rollup Creator custom gas token spending allowance and approve if necessary
    await ensureCustomGasTokenAllowanceGrantedToRollupCreator({
      nativeToken,
      parentChainPublicClient,
      account,
      rollupCreatorVersion,
    });
  }

  // prepare the transaction for deploying the core contracts
  const txRequest =
    rollupCreatorVersion === 'v2.1'
      ? await createRollupPrepareTransactionRequest({
          params: params as CreateRollupParams<'v2.1'>,
          account: account.address,
          publicClient: parentChainPublicClient,
          rollupCreatorVersion: 'v2.1',
        })
      : await createRollupPrepareTransactionRequest({
          params: params as CreateRollupParams<'v3.2'>,
          account: account.address,
          publicClient: parentChainPublicClient,
          rollupCreatorVersion: 'v3.2',
        });

  // sign and send the transaction
  console.log(`Deploying the Rollup...`);
  const txHash = await parentChainPublicClient.sendRawTransaction({
    serializedTransaction: await account.signTransaction(txRequest),
  });

  // get the transaction receipt after waiting for the transaction to complete
  const txReceipt = createRollupPrepareTransactionReceipt(
    await parentChainPublicClient.waitForTransactionReceipt({ hash: txHash }),
  );

  // get the transaction
  // (we get the transaction after waiting for the receipt, to prevent `TransactionNotFoundError`s coming
  // from RPCs that use load balancing and caching. More information can be found here:
  // https://github.com/wevm/viem/issues/1056#issuecomment-1689800265 )
  const tx = createRollupPrepareTransaction(
    // @ts-ignore (todo: fix viem type issue)
    await parentChainPublicClient.getTransaction({ hash: txHash }),
  );

  console.log(`Deployed in ${getBlockExplorerUrl(parentChain)}/tx/${txReceipt.transactionHash}`);
  console.log(`Deployment transaction hash is ${txReceipt.transactionHash}`);

  const coreContracts = txReceipt.getCoreContracts();

  return {
    transaction: tx,
    transactionReceipt: txReceipt,
    coreContracts,
  };
}
