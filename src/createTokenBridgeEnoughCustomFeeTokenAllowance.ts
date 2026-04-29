import { Address, PublicClient, Transport, Chain } from 'viem';

import { fetchAllowance, fetchDecimals } from './utils/erc20';
import { createTokenBridgeDefaultRetryablesFees } from './constants';

import { Prettify } from './types/utils';
import { WithTokenBridgeCreatorAddressOverride } from './types/createTokenBridgeTypes';
import { getTokenBridgeCreatorAddress } from './utils/getTokenBridgeCreatorAddress';
import { scaleFrom18DecimalsToNativeTokenDecimals } from './utils/decimals';

export type CreateTokenBridgeEnoughCustomFeeTokenAllowanceParams<TChain extends Chain | undefined> =
  Prettify<
    WithTokenBridgeCreatorAddressOverride<{
      nativeToken: Address;
      owner: Address;
      publicClient: PublicClient<Transport, TChain>;
    }>
  >;

export async function createTokenBridgeEnoughCustomFeeTokenAllowance<
  TChain extends Chain | undefined,
>({
  nativeToken,
  owner,
  publicClient,
  tokenBridgeCreatorAddressOverride,
}: CreateTokenBridgeEnoughCustomFeeTokenAllowanceParams<TChain>) {
  const allowance = await fetchAllowance({
    address: nativeToken,
    owner,
    spender: tokenBridgeCreatorAddressOverride ?? getTokenBridgeCreatorAddress(publicClient),
    publicClient,
  });

  const decimals = await fetchDecimals({
    address: nativeToken,
    publicClient,
  });

  return (
    allowance >=
    scaleFrom18DecimalsToNativeTokenDecimals({
      amount: createTokenBridgeDefaultRetryablesFees,
      decimals,
    })
  );
}
