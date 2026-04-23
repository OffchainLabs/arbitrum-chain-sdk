import { Transport, Chain, PublicClient, Address } from 'viem';
import { PrepareTransactionRequestReturnTypeWithChainId } from '../types/Actions';

import {
  rollupAdminLogicReadContract,
  RollupAdminLogicReadContractParameters,
  RollupAdminLogicReadContractReturnType,
} from '../rollupAdminLogicReadContract';
import {
  rollupAdminLogicPrepareTransactionRequest,
  RollupAdminLogicPrepareTransactionRequestParameters,
} from '../rollupAdminLogicPrepareTransactionRequest';

// Distribute `Omit<..., 'rollup'>` over the distributed union so each branch keeps its
// discriminant after the conditional type.
type DistributeOmitRollup<T> = T extends unknown ? Omit<T, 'rollup'> : never;

type RollupAdminLogicReadContractArgs<TRollupAdminLogic extends Address | undefined> =
  TRollupAdminLogic extends Address
    ? DistributeOmitRollup<RollupAdminLogicReadContractParameters> & {
        rollup?: Address;
      }
    : RollupAdminLogicReadContractParameters;

type RollupAdminLogicPrepareTransactionRequestArgs<TRollupAdminLogic extends Address | undefined> =
  TRollupAdminLogic extends Address
    ? DistributeOmitRollup<RollupAdminLogicPrepareTransactionRequestParameters> & {
        rollup?: Address;
      }
    : RollupAdminLogicPrepareTransactionRequestParameters;

export type RollupAdminLogicActions<TRollupAdminLogic extends Address | undefined> = {
  rollupAdminLogicReadContract: (
    args: RollupAdminLogicReadContractArgs<TRollupAdminLogic>,
  ) => Promise<RollupAdminLogicReadContractReturnType>;

  rollupAdminLogicPrepareTransactionRequest: (
    args: RollupAdminLogicPrepareTransactionRequestArgs<TRollupAdminLogic>,
  ) => Promise<PrepareTransactionRequestReturnTypeWithChainId>;
};

export function rollupAdminLogicPublicActions<
  TParams extends { rollup?: Address },
  TTransport extends Transport = Transport,
  TChain extends Chain | undefined = Chain,
>({
  rollup,
}: TParams): (
  client: PublicClient<TTransport, TChain>,
) => RollupAdminLogicActions<TParams['rollup']> {
  return function rollupAdminLogicActionsWithRollupAdminLogicAddress(
    client: PublicClient<TTransport, TChain>,
  ) {
    return {
      rollupAdminLogicReadContract: (args) => {
        return rollupAdminLogicReadContract(client, {
          ...args,
          rollup: (args.rollup ?? rollup) as Address,
        });
      },
      rollupAdminLogicPrepareTransactionRequest: (args) => {
        return rollupAdminLogicPrepareTransactionRequest(client, {
          ...args,
          rollup: (args.rollup ?? rollup) as Address,
        });
      },
    };
  };
}
