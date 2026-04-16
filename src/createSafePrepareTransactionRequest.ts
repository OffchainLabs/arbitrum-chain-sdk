import { z } from 'zod';
import {
  Address,
  Chain,
  PrivateKeyAccount,
  PublicClient,
  Transport,
  encodeFunctionData,
  PrepareTransactionRequestParameters,
} from 'viem';
import { addressSchema } from './schemas/primitives';
import {
  DEFAULT_SAFE_VERSION,
  SafeAccountConfig,
  SafeFactory,
  encodeSetupCallData,
  getSafeContract,
} from '@safe-global/protocol-kit';
import {
  getChainSpecificDefaultSaltNonce,
  validateSafeAccountConfig,
} from '@safe-global/protocol-kit/dist/src/contracts/utils';
import { validateChain } from './utils/validateChain';

export const SafeProxyFactoryAbi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'contract GnosisSafeProxy',
        name: 'proxy',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'singleton',
        type: 'address',
      },
    ],
    name: 'ProxyCreation',
    type: 'event',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_singleton',
        type: 'address',
      },
      {
        internalType: 'bytes',
        name: 'initializer',
        type: 'bytes',
      },
      {
        internalType: 'uint256',
        name: 'saltNonce',
        type: 'uint256',
      },
    ],
    name: 'createProxyWithNonce',
    outputs: [
      {
        internalType: 'contract GnosisSafeProxy',
        name: 'proxy',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

/**
 * This type is for the parameters of the createSafePrepareTransactionRequest function
 */
export type CreateSafePrepareTransactionRequestParams<TChain extends Chain | undefined> = {
  publicClient: PublicClient<Transport, TChain>;
  account: PrivateKeyAccount;
  owners: Address[];
  threshold: number;
  saltNonce?: bigint;
};

/**
 * Prepares the transaction to create a new Safe using the default SafeFactory
 *
 * It leverages the [Protocol Kit](https://docs.safe.global/sdk/protocol-kit) from the Safe{Core} SDK.
 *
 * Returns the transaction to sign and send to the blockchain.
 *
 * @param {CreateSafePrepareTransactionRequestParams} createSafePrepareTransactionRequestParams {@link CreateSafePrepareTransactionRequestParams}
 * @param {PublicClient} createSafePrepareTransactionRequestParams.publicClient - A Viem Public Client
 * @param {PrivateKeyAccount} createSafePrepareTransactionRequestParams.account - The private key of the deployer of the new Safe
 * @param {Address[]} createSafePrepareTransactionRequestParams.owners - Array of addresses of the signers of the Safe
 * @param {number} createSafePrepareTransactionRequestParams.threshold - Number of signatures needed to validate a transaction in the Safe
 * @param {bigint} createSafePrepareTransactionRequestParams.saltNonce - Optional salt nonce for the call to Create2
 *
 * @returns Promise<{@link TransactionRequest}> - the transaction to sign and send to the blockchain.
 */
export const createSafePrepareTransactionRequestParams = z.object({
  owners: z.array(addressSchema),
  threshold: z.number(),
});

export async function createSafePrepareTransactionRequest<TChain extends Chain | undefined>({
  publicClient,
  account,
  owners,
  threshold,
  saltNonce,
}: CreateSafePrepareTransactionRequestParams<TChain>) {
  createSafePrepareTransactionRequestParams.parse({ owners, threshold });
  const chainId = validateChain(publicClient);

  // set and validate Safe configuration
  const safeAccountConfig: SafeAccountConfig = {
    owners,
    threshold,
  };
  validateSafeAccountConfig(safeAccountConfig);

  // instantiate Safe Factory
  const safeFactory = await SafeFactory.init({
    provider: publicClient.chain!.rpcUrls.default.http[0],
  });

  // instantiate Safe Contract
  const safeContract = await getSafeContract({
    safeProvider: safeFactory.getSafeProvider(),
    safeVersion: DEFAULT_SAFE_VERSION,
  });

  // get Safe Proxy Factory address
  const safeProxyFactoryAddress = (await safeFactory.getAddress()) as Address;

  // get Safe Contract address
  const safeContractAddress = (await safeContract.getAddress()) as Address;

  // initializer calldata
  const initializer = (await encodeSetupCallData({
    safeProvider: safeFactory.getSafeProvider(),
    safeAccountConfig,
    safeContract,
  })) as `0x${string}`;

  // salt nonce
  if (!saltNonce) {
    saltNonce = BigInt(getChainSpecificDefaultSaltNonce(BigInt(chainId)));
  }

  // prepare the transaction request
  const request = await publicClient.prepareTransactionRequest({
    chain: publicClient.chain,
    to: safeProxyFactoryAddress,
    data: encodeFunctionData({
      abi: SafeProxyFactoryAbi,
      functionName: 'createProxyWithNonce',
      args: [
        safeContractAddress, // _singleton
        initializer, // initializer
        saltNonce, // saltNonce
      ],
    }),
    account,
  } satisfies PrepareTransactionRequestParameters);

  return { ...request, chainId };
}
