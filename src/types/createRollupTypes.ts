import { ContractFunctionArgs } from 'viem';

import { rollupCreatorABI as rollupCreatorV3Dot2ABI } from '../contracts/RollupCreator/v3.2';
import { rollupCreatorABI as rollupCreatorV3Dot1ABI } from '../contracts/RollupCreator/v3.1';
import { rollupCreatorABI as rollupCreatorV2Dot1ABI } from '../contracts/RollupCreator/v2.1';
import { rollupCreatorABI as rollupCreatorV1Dot1ABI } from '../contracts/RollupCreator/v1.1';

import { Prettify } from './utils';

export type RollupCreatorVersion = 'v3.2' | 'v3.1' | 'v2.1' | 'v1.1';
export type RollupCreatorLatestVersion = Extract<RollupCreatorVersion, 'v3.2'>;
export type RollupCreatorSupportedVersion = Extract<RollupCreatorVersion, 'v3.2' | 'v2.1'>;

export type RollupCreatorABI<TVersion extends RollupCreatorVersion = RollupCreatorLatestVersion> =
  //
  TVersion extends 'v3.2'
    ? typeof rollupCreatorV3Dot2ABI
    : TVersion extends 'v3.1'
    ? typeof rollupCreatorV3Dot1ABI
    : TVersion extends 'v2.1'
    ? typeof rollupCreatorV2Dot1ABI
    : TVersion extends 'v1.1'
    ? typeof rollupCreatorV1Dot1ABI
    : never;

// Per-version specialization. viem v2 `ContractFunctionArgs`' function-name generic is
// constrained by `ContractFunctionName<TAbi, TMut>`. When `TAbi` is the conditional
// `RollupCreatorABI<TVersion>` and `TVersion` is still generic, TS can't prove that
// `'createRollup'` satisfies the constraint for every branch — so we resolve the ABI
// before passing it in, using `TVersion`-matching fixed alternatives.
type CreateRollupArgsForVersion<TVersion extends RollupCreatorVersion> = TVersion extends 'v3.2'
  ? ContractFunctionArgs<typeof rollupCreatorV3Dot2ABI, 'payable', 'createRollup'>
  : TVersion extends 'v3.1'
  ? ContractFunctionArgs<typeof rollupCreatorV3Dot1ABI, 'payable', 'createRollup'>
  : TVersion extends 'v2.1'
  ? ContractFunctionArgs<typeof rollupCreatorV2Dot1ABI, 'payable', 'createRollup'>
  : TVersion extends 'v1.1'
  ? ContractFunctionArgs<typeof rollupCreatorV1Dot1ABI, 'payable', 'createRollup'>
  : never;

export type CreateRollupFunctionInputs<
  TVersion extends RollupCreatorVersion = RollupCreatorLatestVersion,
> = CreateRollupArgsForVersion<TVersion> & readonly unknown[]; // this tells TypeScript that the type is also an indexable array

type GetCreateRollupRequiredKeys<
  TVersion extends RollupCreatorVersion = RollupCreatorLatestVersion,
> =
  //
  TVersion extends 'v3.2'
    ? Extract<
        keyof CreateRollupFunctionInputs<TVersion>[0],
        'config' | 'batchPosters' | 'validators'
      >
    : TVersion extends 'v3.1'
    ? Extract<
        keyof CreateRollupFunctionInputs<TVersion>[0],
        'config' | 'batchPosters' | 'validators'
      >
    : TVersion extends 'v2.1'
    ? Extract<
        keyof CreateRollupFunctionInputs<TVersion>[0],
        'config' | 'batchPosters' | 'validators'
      >
    : TVersion extends 'v1.1'
    ? Extract<
        keyof CreateRollupFunctionInputs<TVersion>[0],
        'config' | 'batchPoster' | 'validators'
      >
    : never;

export type CreateRollupParams<TVersion extends RollupCreatorVersion = RollupCreatorLatestVersion> =
  Prettify<
    Pick<CreateRollupFunctionInputs<TVersion>[0], GetCreateRollupRequiredKeys<TVersion>> &
      Partial<Omit<CreateRollupFunctionInputs<TVersion>[0], GetCreateRollupRequiredKeys<TVersion>>>
  >;
