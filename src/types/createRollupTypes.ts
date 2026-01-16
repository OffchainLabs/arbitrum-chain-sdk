import { GetFunctionArgs } from 'viem';

import { rollupCreatorABI as rollupCreatorV3Dot2ABI } from '../contracts/RollupCreator';
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

export type CreateRollupFunctionInputs<
  TVersion extends RollupCreatorVersion = RollupCreatorLatestVersion,
> = GetFunctionArgs<RollupCreatorABI<TVersion>, 'createRollup'>['args'] & readonly unknown[]; // this tells TypeScript that the type is also an indexable array

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
