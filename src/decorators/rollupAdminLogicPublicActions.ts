import { Transport, Chain, PrepareTransactionRequestReturnType, PublicClient, Address } from 'viem';
import { RollupAdminLogic__factory } from '@arbitrum/sdk/dist/lib/abi/factories/RollupAdminLogic__factory';

import {
  createContractRead,
  ContractReadFunctionName,
  ContractReadParameters,
  ContractReadReturnType,
} from '../contractRead';
import {
  RollupAdminLogicAbi,
  RollupAdminLogicFunctionName,
  rollupAdminLogicPrepareTransactionRequest,
  RollupAdminLogicPrepareTransactionRequestParameters,
} from '../rollupAdminLogicPrepareTransactionRequest';

type RollupAdminLogicAddressParameters = { rollup: Address };
type RollupAdminLogicReadFunctionName = ContractReadFunctionName<RollupAdminLogicAbi>;
type RollupAdminLogicReadContractParameters<
  TFunctionName extends RollupAdminLogicReadFunctionName,
> = ContractReadParameters<RollupAdminLogicAbi, TFunctionName, RollupAdminLogicAddressParameters>;
type RollupAdminLogicReadContractReturnType<
  TFunctionName extends RollupAdminLogicReadFunctionName,
> = ContractReadReturnType<RollupAdminLogicAbi, TFunctionName>;

const rollupAdminLogicReadContract = createContractRead<
  RollupAdminLogicAbi,
  RollupAdminLogicAddressParameters
>(RollupAdminLogic__factory.abi as unknown as RollupAdminLogicAbi, ({ rollup }) => rollup);

type RollupAdminLogicReadContractArgs<
  TRollupAdminLogic extends Address | undefined,
  TFunctionName extends RollupAdminLogicReadFunctionName,
> = TRollupAdminLogic extends Address
  ? Omit<RollupAdminLogicReadContractParameters<TFunctionName>, 'rollup'> & {
      rollup?: Address;
    }
  : RollupAdminLogicReadContractParameters<TFunctionName>;
type rollupAdminLogicPrepareTransactionRequestArgs<
  TRollupAdminLogic extends Address | undefined,
  TFunctionName extends RollupAdminLogicFunctionName,
> = TRollupAdminLogic extends Address
  ? Omit<RollupAdminLogicPrepareTransactionRequestParameters<TFunctionName>, 'rollup'> & {
      rollup?: Address;
    }
  : RollupAdminLogicPrepareTransactionRequestParameters<TFunctionName>;

export type RollupAdminLogicActions<
  TRollupAdminLogic extends Address | undefined,
  TChain extends Chain | undefined = Chain | undefined,
> = {
  rollupAdminLogicReadContract: <TFunctionName extends RollupAdminLogicReadFunctionName>(
    args: RollupAdminLogicReadContractArgs<TRollupAdminLogic, TFunctionName>,
  ) => Promise<RollupAdminLogicReadContractReturnType<TFunctionName>>;

  rollupAdminLogicPrepareTransactionRequest: <TFunctionName extends RollupAdminLogicFunctionName>(
    args: rollupAdminLogicPrepareTransactionRequestArgs<TRollupAdminLogic, TFunctionName>,
  ) => Promise<PrepareTransactionRequestReturnType<TChain> & { chainId: number }>;
};

export function rollupAdminLogicPublicActions<
  TParams extends { rollup?: Address },
  TTransport extends Transport = Transport,
  TChain extends Chain | undefined = Chain,
>({
  rollup,
}: TParams): (
  client: PublicClient<TTransport, TChain>,
) => RollupAdminLogicActions<TParams['rollup'], TChain> {
  return function rollupAdminLogicActionsWithRollupAdminLogicAddress(
    client: PublicClient<TTransport, TChain>,
  ) {
    const rollupAdminLogicExtensions: RollupAdminLogicActions<TParams['rollup'], TChain> = {
      rollupAdminLogicReadContract: <TFunctionName extends RollupAdminLogicReadFunctionName>(
        args: RollupAdminLogicReadContractArgs<TParams['rollup'], TFunctionName>,
      ) => {
        return rollupAdminLogicReadContract(client, {
          ...args,
          rollup: args.rollup || rollup,
        } as RollupAdminLogicReadContractParameters<TFunctionName>);
      },
      rollupAdminLogicPrepareTransactionRequest: <
        TFunctionName extends RollupAdminLogicFunctionName,
      >(
        args: rollupAdminLogicPrepareTransactionRequestArgs<TParams['rollup'], TFunctionName>,
      ) => {
        return rollupAdminLogicPrepareTransactionRequest(client, {
          ...args,
          rollup: args.rollup || rollup,
        } as RollupAdminLogicPrepareTransactionRequestParameters<TFunctionName>);
      },
    };
    return rollupAdminLogicExtensions;
  };
}
