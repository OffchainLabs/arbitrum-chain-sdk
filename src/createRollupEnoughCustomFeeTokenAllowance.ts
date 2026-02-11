import { Address, PublicClient, Transport, Chain } from 'viem';

import { fetchAllowance, fetchDecimals } from './utils/erc20';
import { getRollupCreatorAddress } from './utils/getRollupCreatorAddress';

import { Prettify } from './types/utils';
import { RollupCreatorSupportedVersion } from './types/createRollupTypes';

import { createRollupGetRetryablesFeesWithDefaults } from './createRollupGetRetryablesFees';
import { scaleFrom18DecimalsToNativeTokenDecimals } from './utils/decimals';

export type CreateRollupEnoughCustomFeeTokenAllowanceParams<TChain extends Chain | undefined> =
  Prettify<{
    nativeToken: Address;
    maxFeePerGasForRetryables?: bigint;
    account: Address;
    publicClient: PublicClient<Transport, TChain>;
    rollupCreatorAddressOverride?: Address;
    rollupCreatorVersion?: RollupCreatorSupportedVersion;
  }>;

export async function createRollupEnoughCustomFeeTokenAllowance<TChain extends Chain | undefined>({
  nativeToken,
  maxFeePerGasForRetryables,
  account,
  publicClient,
  rollupCreatorAddressOverride,
  rollupCreatorVersion = 'v3.2',
}: CreateRollupEnoughCustomFeeTokenAllowanceParams<TChain>) {
  const allowance = await fetchAllowance({
    address: nativeToken,
    owner: account,
    spender:
      rollupCreatorAddressOverride ?? getRollupCreatorAddress(publicClient, rollupCreatorVersion),
    publicClient,
  });

  const fees = await createRollupGetRetryablesFeesWithDefaults(
    publicClient,
    {
      account,
      nativeToken,
      maxFeePerGasForRetryables,
    },
    rollupCreatorVersion,
  );

  const decimals = await fetchDecimals({
    address: nativeToken,
    publicClient,
  });

  return allowance >= scaleFrom18DecimalsToNativeTokenDecimals({ amount: fees, decimals });
}
