import { it, expectTypeOf } from 'vitest';
import { z } from 'zod';
import { PrivateKeyAccount, PublicClient, WalletClient } from 'viem';

import { createRollup } from '../../createRollup';
import { setValidKeyset } from '../../setValidKeyset';
import { createTokenBridge } from '../../createTokenBridge';
import { getKeysets } from '../../getKeysets';
import { CoreContracts } from '../../types/CoreContracts';
import { ChainConfig } from '../../types/ChainConfig';
import { CreateRollupPrepareDeploymentParamsConfigParams } from '../../createRollupPrepareDeploymentParamsConfig';
import { prepareChainConfig, PrepareChainConfigParams } from '../../prepareChainConfig';

import { createRollupTransformedSchema } from './createRollup';
import { setValidKeysetTransform } from './setValidKeyset';
import { createTokenBridgeTransform } from './createTokenBridge';
import { getKeysetsTransform } from './getKeysets';
import {
  prepareDeploymentParamsConfigV32Transform,
  prepareDeploymentParamsConfigV21Transform,
} from './createRollupPrepareDeploymentParamsConfig';
import { prepareChainConfigTransform } from './prepareChainConfig';
import { coreContractsSchema, chainConfigSchema } from './common';

// ------------------------------------------------------------------
// DeepNormalize<T>
//
// Transforms a type into a canonical form so that zod schema output
// types and SDK function parameter types can be compared with
// toEqualTypeOf. Without normalization, three kinds of superficial
// differences cause false negatives:
//
// 1. Viem client generic parameters
//    The SDK declares `publicClient: PublicClient<Transport, TChain>`.
//    After generic resolution this differs structurally from the
//    concrete type our zod transform produces. We detect viem types
//    by value (`extends PublicClient`, etc.) and replace them with
//    bare canonical types so both sides match:
//
//      Schema:   parentChainPublicClient: PublicClient<HttpTransport, undefined>
//      SDK:      parentChainPublicClient: PublicClient<Transport, Chain | undefined>
//      Both ->   parentChainPublicClient: PublicClient
//
// 2. Optionality representation
//    TypeScript has two ways to express "maybe undefined":
//      field?: T             -- optional key
//      field: T | undefined  -- required key, value includes undefined
//    SDK types (via Prettify) and zod (.optional()) use these
//    inconsistently. We normalize both by:
//      a. Checking `undefined extends T[K]` to detect either form
//      b. Stripping the ? with -? and removing undefined with NonNullable
//      c. Wrapping the result in Optional<> to preserve the distinction
//
//      Schema:   nativeToken?: Address          (zod .optional())
//      SDK:      nativeToken?: Address          (Prettify<Partial<...>>)
//      Both ->   nativeToken: Optional<Address>
//
//    If one side is optional and the other isn't, the mismatch is caught:
//      Schema:   keyset?: Hex                   (wrongly optional)
//      SDK:      keyset: Hex                    (required)
//      Schema -> keyset: Optional<Hex>
//      SDK    -> keyset: Hex                    <-- toEqualTypeOf fails
//
// 3. Readonly arrays
//    ABI-derived types have `readonly T[]`, zod produces `T[]`.
//    We strip readonly so both compare as `T[]`:
//
//      Schema:   miniStakeValues: bigint[]
//      SDK:      miniStakeValues: readonly bigint[]
//      Both ->   miniStakeValues: bigint[]
// ------------------------------------------------------------------

// Wraps a type to indicate the original field was optional.
// Used to preserve optionality information after -? removes it from keys.
//
//   Optional<Address>  means "this field was optional"
//   Address            means "this field was required"
type Optional<T> = { __optional: T };

// If V is a viem type, returns its bare canonical form.
// Returns `never` for non-viem types, allowing callers to fall through.
//
//   ToCanonicalViem<PublicClient<HttpTransport, undefined>>  ->  PublicClient
//   ToCanonicalViem<WalletClient<Transport, Chain>>          ->  WalletClient
//   ToCanonicalViem<PrivateKeyAccount>                       ->  PrivateKeyAccount
//   ToCanonicalViem<string>                                  ->  never
type ToCanonicalViem<V> = V extends PublicClient
  ? PublicClient
  : V extends WalletClient
    ? WalletClient
    : V extends PrivateKeyAccount
      ? PrivateKeyAccount
      : never;

// Normalizes a value type recursively.
//
//   NormalizeValue<readonly bigint[]>        ->  bigint[]          (strips readonly)
//   NormalizeValue<{ foo: string }>          ->  DeepNormalize<{ foo: string }>
//   NormalizeValue<bigint>                   ->  bigint            (passthrough)
type NormalizeValue<V> = V extends readonly (infer U)[]
  ? U[]
  : V extends object
    ? DeepNormalize<V>
    : V;

// Normalizes a single field of T. Processing order:
//   1. If the value is a viem type, replace with its canonical form
//   2. Otherwise, if the field was optional (undefined in the value type),
//      normalize the value and wrap in Optional<>
//   3. Otherwise, normalize the value directly
//
//   NormalizeField<{ pc: PublicClient<HttpTransport> }, 'pc'>  ->  PublicClient
//   NormalizeField<{ n?: Address }, 'n'>                       ->  Optional<Address>
//   NormalizeField<{ x: bigint }, 'x'>                         ->  bigint
type NormalizeField<T, K extends keyof T> =
  ToCanonicalViem<NonNullable<T[K]>> extends never
    ? undefined extends T[K]
      ? Optional<NormalizeValue<NonNullable<T[K]>>>
      : NormalizeValue<NonNullable<T[K]>>
    : ToCanonicalViem<NonNullable<T[K]>>;

// Normalizes every field in T using NormalizeField.
//   -?  makes all keys required (Optional<> already records which were optional)
//   `T extends any` distributes over unions so each variant is normalized
//   independently -- without this, mapped types collapse unions to their
//   common keys.
//
//   DeepNormalize<{ a: PublicClient<HttpTransport>; b?: bigint }>
//     ->  { a: PublicClient; b: Optional<bigint> }
type DeepNormalize<T> = T extends any
  ? { -readonly [K in keyof T]-?: NormalizeField<T, K> }
  : never;

it('createRollupTransformedSchema output matches createRollup params', () => {
  type SchemaOutput = z.output<typeof createRollupTransformedSchema>;
  type FunctionParam = Parameters<typeof createRollup>[0];

  type SO_v21 = DeepNormalize<Extract<SchemaOutput, readonly [{ rollupCreatorVersion: 'v2.1' }]>[0]>;
  type SO_v32 = DeepNormalize<Extract<SchemaOutput, readonly [{ rollupCreatorVersion: 'v3.2' }]>[0]>;
  type SO_default = DeepNormalize<Extract<SchemaOutput, readonly [{ rollupCreatorVersion?: never }]>[0]>;

  type FP_v21 = DeepNormalize<Extract<FunctionParam, { rollupCreatorVersion: 'v2.1' }>>;
  type FP_v32 = DeepNormalize<Extract<FunctionParam, { rollupCreatorVersion: 'v3.2' }>>;
  type FP_default = DeepNormalize<Extract<FunctionParam, { rollupCreatorVersion?: never }>>;

  expectTypeOf<SO_v21>().toEqualTypeOf<FP_v21>();
  expectTypeOf<SO_v32>().toEqualTypeOf<FP_v32>();
  expectTypeOf<SO_default>().toEqualTypeOf<FP_default>();
});

it('setValidKeysetTransform output matches setValidKeyset params', () =>
  expectTypeOf<DeepNormalize<ReturnType<typeof setValidKeysetTransform>>>()
    .toEqualTypeOf<DeepNormalize<Parameters<typeof setValidKeyset>>>());

it('createTokenBridgeTransform output matches createTokenBridge params', () =>
  expectTypeOf<DeepNormalize<ReturnType<typeof createTokenBridgeTransform>>>()
    .toEqualTypeOf<DeepNormalize<Parameters<typeof createTokenBridge>>>());

it('getKeysetsTransform output matches getKeysets params', () =>
  expectTypeOf<DeepNormalize<ReturnType<typeof getKeysetsTransform>>>()
    .toEqualTypeOf<DeepNormalize<Parameters<typeof getKeysets>>>());

it('coreContractsSchema matches CoreContracts', () =>
  expectTypeOf<z.output<typeof coreContractsSchema>>().toEqualTypeOf<CoreContracts>());

it('chainConfigSchema matches ChainConfig', () =>
  expectTypeOf<z.output<typeof chainConfigSchema>>().toEqualTypeOf<ChainConfig>());

it('prepareDeploymentParamsConfigV32Transform params match CreateRollupPrepareDeploymentParamsConfigParams', () => {
  type TransformOutput = ReturnType<typeof prepareDeploymentParamsConfigV32Transform>;
  expectTypeOf<DeepNormalize<TransformOutput[1]>>()
    .toEqualTypeOf<DeepNormalize<CreateRollupPrepareDeploymentParamsConfigParams>>();
});

it('prepareDeploymentParamsConfigV21Transform params match CreateRollupPrepareDeploymentParamsConfigParams<v2.1>', () => {
  type TransformOutput = ReturnType<typeof prepareDeploymentParamsConfigV21Transform>;
  expectTypeOf<DeepNormalize<TransformOutput[1]>>()
    .toEqualTypeOf<DeepNormalize<CreateRollupPrepareDeploymentParamsConfigParams<'v2.1'>>>();
});

it('prepareChainConfigTransform output matches prepareChainConfig params', () =>
  expectTypeOf<DeepNormalize<ReturnType<typeof prepareChainConfigTransform>>>()
    .toEqualTypeOf<DeepNormalize<Parameters<typeof prepareChainConfig>>>());

