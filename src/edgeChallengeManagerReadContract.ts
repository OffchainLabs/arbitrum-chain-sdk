import {
  Address,
  Chain,
  GetFunctionArgs,
  PublicClient,
  ReadContractReturnType,
  Transport,
} from 'viem';

import { edgeChallengeManagerABI } from './contracts/EdgeChallengeManager';
import {
  EdgeChallengeManagerAbi,
  EdgeChallengeManagerFunctionName,
} from './edgeChallengeManagerPrepareTransactionRequest';

export type EdgeChallengeManagerReadContractParameters<
  TFunctionName extends EdgeChallengeManagerFunctionName,
> = {
  functionName: TFunctionName;
  challengeManager: Address;
} & GetFunctionArgs<EdgeChallengeManagerAbi, TFunctionName>;

export type EdgeChallengeManagerReadContractReturnType<
  TFunctionName extends EdgeChallengeManagerFunctionName,
> = ReadContractReturnType<EdgeChallengeManagerAbi, TFunctionName>;

export function edgeChallengeManagerReadContract<
  TChain extends Chain | undefined,
  TFunctionName extends EdgeChallengeManagerFunctionName,
>(
  client: PublicClient<Transport, TChain>,
  params: EdgeChallengeManagerReadContractParameters<TFunctionName>,
): Promise<EdgeChallengeManagerReadContractReturnType<TFunctionName>> {
  // @ts-expect-error -- todo: fix viem type issue
  return client.readContract({
    address: params.challengeManager,
    abi: edgeChallengeManagerABI,
    functionName: params.functionName,
    args: params.args,
  });
}
