import { Transport, Chain, PrepareTransactionRequestReturnType, PublicClient, Address } from 'viem';

import {
  edgeChallengeManagerReadContract,
  EdgeChallengeManagerReadContractParameters,
  EdgeChallengeManagerReadContractReturnType,
} from '../edgeChallengeManagerReadContract';
import {
  EdgeChallengeManagerFunctionName,
  edgeChallengeManagerPrepareTransactionRequest,
  EdgeChallengeManagerPrepareTransactionRequestParameters,
} from '../edgeChallengeManagerPrepareTransactionRequest';

type EdgeChallengeManagerReadContractArgs<
  TChallengeManager extends Address | undefined,
  TFunctionName extends EdgeChallengeManagerFunctionName,
> = TChallengeManager extends Address
  ? Omit<EdgeChallengeManagerReadContractParameters<TFunctionName>, 'challengeManager'> & {
      challengeManager?: Address;
    }
  : EdgeChallengeManagerReadContractParameters<TFunctionName>;
type EdgeChallengeManagerPrepareTransactionRequestArgs<
  TChallengeManager extends Address | undefined,
  TFunctionName extends EdgeChallengeManagerFunctionName,
> = TChallengeManager extends Address
  ? Omit<
      EdgeChallengeManagerPrepareTransactionRequestParameters<TFunctionName>,
      'challengeManager'
    > & {
      challengeManager?: Address;
    }
  : EdgeChallengeManagerPrepareTransactionRequestParameters<TFunctionName>;

export type EdgeChallengeManagerActions<
  TChallengeManager extends Address | undefined,
  TChain extends Chain | undefined = Chain | undefined,
> = {
  edgeChallengeManagerReadContract: <TFunctionName extends EdgeChallengeManagerFunctionName>(
    args: EdgeChallengeManagerReadContractArgs<TChallengeManager, TFunctionName>,
  ) => Promise<EdgeChallengeManagerReadContractReturnType<TFunctionName>>;

  edgeChallengeManagerPrepareTransactionRequest: <
    TFunctionName extends EdgeChallengeManagerFunctionName,
  >(
    args: EdgeChallengeManagerPrepareTransactionRequestArgs<TChallengeManager, TFunctionName>,
  ) => Promise<PrepareTransactionRequestReturnType<TChain> & { chainId: number }>;
};

export function edgeChallengeManagerActions<
  TParams extends { challengeManager?: Address },
  TTransport extends Transport = Transport,
  TChain extends Chain | undefined = Chain | undefined,
>({ challengeManager }: TParams) {
  return function edgeChallengeManagerActionsWithChallengeManager(
    client: PublicClient<TTransport, TChain>,
  ) {
    const edgeChallengeManagerExtensions: EdgeChallengeManagerActions<
      TParams['challengeManager'],
      TChain
    > = {
      edgeChallengeManagerReadContract: <TFunctionName extends EdgeChallengeManagerFunctionName>(
        args: EdgeChallengeManagerReadContractArgs<TParams['challengeManager'], TFunctionName>,
      ) => {
        return edgeChallengeManagerReadContract(client, {
          ...args,
          challengeManager: args.challengeManager || challengeManager,
        } as EdgeChallengeManagerReadContractParameters<TFunctionName>);
      },
      edgeChallengeManagerPrepareTransactionRequest: <
        TFunctionName extends EdgeChallengeManagerFunctionName,
      >(
        args: EdgeChallengeManagerPrepareTransactionRequestArgs<
          TParams['challengeManager'],
          TFunctionName
        >,
      ) => {
        return edgeChallengeManagerPrepareTransactionRequest(client, {
          ...args,
          challengeManager: args.challengeManager || challengeManager,
        } as EdgeChallengeManagerPrepareTransactionRequestParameters<TFunctionName>);
      },
    };
    return edgeChallengeManagerExtensions;
  };
}
