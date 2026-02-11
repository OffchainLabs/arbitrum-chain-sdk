import { Chain, PublicClient, Transport, Address } from 'viem';

import { createRollupGetRetryablesFeesWithDefaults } from './createRollupGetRetryablesFees';
import { isNonZeroAddress } from './utils/isNonZeroAddress';

import { RollupCreatorSupportedVersion } from './types/createRollupTypes';

export async function createRollupGetCallValue<TChain extends Chain | undefined>(
  publicClient: PublicClient<Transport, TChain>,
  params: {
    account: Address;
    nativeToken: Address;
    deployFactoriesToL2: boolean;
  },
  rollupCreatorVersion: RollupCreatorSupportedVersion = 'v3.2',
): Promise<bigint> {
  // when not deploying deterministic factories to L2, no callvalue is necessary, as no retryable tickets will be created
  if (!params.deployFactoriesToL2) {
    return BigInt(0);
  }

  // when using a custom fee token, the retryable tickets will be paid for in the custom fee token, so no callvalue is necessary
  if (isNonZeroAddress(params.nativeToken)) {
    return BigInt(0);
  }

  return createRollupGetRetryablesFeesWithDefaults(publicClient, params, rollupCreatorVersion);
}
