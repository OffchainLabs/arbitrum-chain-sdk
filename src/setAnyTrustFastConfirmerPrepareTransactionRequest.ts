import {
  Address,
  Chain,
  PrivateKeyAccount,
  PublicClient,
  Transport,
  encodeFunctionData,
  parseAbi,
} from 'viem';
import { validateChain } from './utils/validateChain';
import { upgradeExecutorEncodeFunctionData } from './upgradeExecutorEncodeFunctionData';

/**
 * This type is for the parameters of the setAnyTrustFastConfirmerPrepareTransactionRequest function
 */
export type SetAnyTrustFastConfirmerPrepareTransactionRequestParams<
  TChain extends Chain | undefined,
> = {
  publicClient: PublicClient<Transport, TChain>;
  account: PrivateKeyAccount;
  rollup: Address;
  upgradeExecutor: Address;
  fastConfirmer: Address;
};

/**
 * Prepares the transaction to set the AnyTrust fast confirmer address in the rollup contract
 *
 * Returns the transaction to sign and send to the blockchain.
 *
 * @param {SetAnyTrustFastConfirmerPrepareTransactionRequestParams} setAnyTrustFastConfirmerPrepareTransactionRequestParams {@link SetAnyTrustFastConfirmerPrepareTransactionRequestParams}
 * @param {PublicClient} setAnyTrustFastConfirmerPrepareTransactionRequestParams.publicClient - A Viem Public Client
 * @param {PrivateKeyAccount} setAnyTrustFastConfirmerPrepareTransactionRequestParams.account - The private key of the chain owner or an account with the executor role in the UpgradeExecutor
 * @param {Address} setAnyTrustFastConfirmerPrepareTransactionRequestParams.rollup - Address of the Rollup contract
 * @param {Address} setAnyTrustFastConfirmerPrepareTransactionRequestParams.upgradeExecutor - Address of the UpgradeExecutor contract
 * @param {Address} setAnyTrustFastConfirmerPrepareTransactionRequestParams.fastConfirmer - Address of the fast confirmer validator (usually a Safe multisig)
 *
 * @returns Promise<{@link TransactionRequest}> - the transaction to sign and send to the blockchain.
 */
export async function setAnyTrustFastConfirmerPrepareTransactionRequest<
  TChain extends Chain | undefined,
>({
  publicClient,
  account,
  rollup,
  upgradeExecutor,
  fastConfirmer,
}: SetAnyTrustFastConfirmerPrepareTransactionRequestParams<TChain>) {
  const chainId = validateChain(publicClient);

  // prepare the rollup transaction calldata
  const setAnyTrustFastConfirmerCalldata = encodeFunctionData({
    abi: parseAbi(['function setAnyTrustFastConfirmer(address _anyTrustFastConfirmer)']),
    functionName: 'setAnyTrustFastConfirmer',
    args: [fastConfirmer],
  });

  if (publicClient.chain === undefined) {
    throw new Error(
      '[setAnyTrustFastConfirmerPrepareTransactionRequest] publicClient.chain is undefined',
    );
  }
  const chain: Chain = publicClient.chain;

  const request = await publicClient.prepareTransactionRequest({
    chain,
    type: 'eip1559',
    to: upgradeExecutor,
    data: upgradeExecutorEncodeFunctionData({
      functionName: 'executeCall',
      args: [rollup, setAnyTrustFastConfirmerCalldata],
    }),
    account,
  });

  return { ...request, chainId };
}
