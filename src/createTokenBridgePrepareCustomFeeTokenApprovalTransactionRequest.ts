import { Address, PublicClient, Transport, Chain } from 'viem';

import { approvePrepareTransactionRequest, fetchDecimals } from './utils/erc20';

import { Prettify } from './types/utils';
import { validateParentChain } from './types/ParentChain';
import { WithTokenBridgeCreatorAddressOverride } from './types/createTokenBridgeTypes';
import { getTokenBridgeCreatorAddress } from './utils/getTokenBridgeCreatorAddress';
import { createTokenBridgeDefaultRetryablesFees } from './constants';
import { scaleFrom18DecimalsToNativeTokenDecimals } from './utils/decimals';

export type CreateTokenBridgePrepareCustomFeeTokenApprovalTransactionRequestParams<
  TChain extends Chain | undefined,
> = Prettify<
  WithTokenBridgeCreatorAddressOverride<{
    amount?: bigint;
    nativeToken: Address;
    owner: Address;
    publicClient: PublicClient<Transport, TChain>;
  }>
>;

export async function createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequest<
  TChain extends Chain | undefined,
>({
  amount,
  nativeToken,
  owner,
  publicClient,
  tokenBridgeCreatorAddressOverride,
}: CreateTokenBridgePrepareCustomFeeTokenApprovalTransactionRequestParams<TChain>) {
  const { chainId } = validateParentChain(publicClient);

  const decimals = await fetchDecimals({
    address: nativeToken,
    publicClient,
  });

  const request = await approvePrepareTransactionRequest({
    address: nativeToken,
    owner,
    spender: tokenBridgeCreatorAddressOverride ?? getTokenBridgeCreatorAddress(publicClient),
    amount:
      amount ??
      scaleFrom18DecimalsToNativeTokenDecimals({
        amount: createTokenBridgeDefaultRetryablesFees,
        decimals,
      }),
    publicClient,
  });

  return { ...request, chainId };
}
