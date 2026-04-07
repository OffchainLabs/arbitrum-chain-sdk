import { it, expectTypeOf } from 'vitest';
import { z } from 'zod';
import { PrivateKeyAccount, PublicClient, WalletClient } from 'viem';

import { createRollup } from '../../createRollup';
import { setValidKeyset } from '../../setValidKeyset';
import { createTokenBridge } from '../../createTokenBridge';
import { getKeysets } from '../../getKeysets';
import { getValidators } from '../../getValidators';
import { getBatchPosters } from '../../getBatchPosters';
import { upgradeExecutorFetchPrivilegedAccounts } from '../../upgradeExecutorFetchPrivilegedAccounts';
import { setAnyTrustFastConfirmerPrepareTransactionRequest } from '../../setAnyTrustFastConfirmerPrepareTransactionRequest';
import { prepareNodeConfig } from '../../prepareNodeConfig';
import { feeRouterDeployRewardDistributor } from '../../feeRouterDeployRewardDistributor';
import { feeRouterDeployChildToParentRewardRouter } from '../../feeRouterDeployChildToParentRewardRouter';
import { getBridgeUiConfig } from '../../getBridgeUiConfig';
import { isAnyTrust } from '../../isAnyTrust';
import { createRollupFetchTransactionHash } from '../../createRollupFetchTransactionHash';
import { createRollupFetchCoreContracts } from '../../createRollupFetchCoreContracts';
import { isTokenBridgeDeployed } from '../../isTokenBridgeDeployed';
import { createTokenBridgePrepareTransactionRequest } from '../../createTokenBridgePrepareTransactionRequest';
import { createTokenBridgePrepareSetWethGatewayTransactionRequest } from '../../createTokenBridgePrepareSetWethGatewayTransactionRequest';
import { setValidKeysetPrepareTransactionRequest } from '../../setValidKeysetPrepareTransactionRequest';
import { createRollupPrepareTransactionRequest } from '../../createRollupPrepareTransactionRequest';
import { createSafePrepareTransactionRequest } from '../../createSafePrepareTransactionRequest';
import { createRollupEnoughCustomFeeTokenAllowance } from '../../createRollupEnoughCustomFeeTokenAllowance';
import { createRollupPrepareCustomFeeTokenApprovalTransactionRequest } from '../../createRollupPrepareCustomFeeTokenApprovalTransactionRequest';
import { createTokenBridgeEnoughCustomFeeTokenAllowance } from '../../createTokenBridgeEnoughCustomFeeTokenAllowance';
import { createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequest } from '../../createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequest';
import { prepareKeyset } from '../../prepareKeyset';
import { prepareKeysetHash } from '../../prepareKeysetHash';
import { getDefaultConfirmPeriodBlocks } from '../../getDefaultConfirmPeriodBlocks';
import {
  createRollupGetRetryablesFees,
  createRollupGetRetryablesFeesWithDefaults,
} from '../../createRollupGetRetryablesFees';
import { fetchAllowance, fetchDecimals } from '../../utils/erc20';
import { CoreContracts } from '../../types/CoreContracts';
import { ChainConfig } from '../../types/ChainConfig';
import { CreateRollupPrepareDeploymentParamsConfigParams } from '../../createRollupPrepareDeploymentParamsConfig';
import { prepareChainConfig } from '../../prepareChainConfig';
import { upgradeExecutorPrepareAddExecutorTransactionRequest } from '../../upgradeExecutorPrepareAddExecutorTransactionRequest';

import { createRollupTransformedSchema } from './createRollup';
import { setValidKeysetTransform } from './setValidKeyset';
import { createTokenBridgeTransform } from './createTokenBridge';
import { getKeysetsTransform } from './getKeysets';
import { getValidatorsTransform } from './getValidators';
import { getBatchPostersTransform } from './getBatchPosters';
import {
  prepareDeploymentParamsConfigV32Transform,
  prepareDeploymentParamsConfigV21Transform,
} from './createRollupPrepareDeploymentParamsConfig';
import { prepareChainConfigTransform } from './prepareChainConfig';
import {
  upgradeExecutorPrepareTransactionRequestTransform,
  upgradeExecutorFetchPrivilegedAccountsTransform,
} from './upgradeExecutor';
import { setAnyTrustFastConfirmerTransform } from './setAnyTrustFastConfirmer';
import { prepareNodeConfigTransform } from './prepareNodeConfig';
import {
  feeRouterDeployRewardDistributorTransform,
  feeRouterDeployChildToParentRewardRouterTransform,
} from './feeRouter';
import { getBridgeUiConfigTransform } from './getBridgeUiConfig';
import { isAnyTrustTransform } from './isAnyTrust';
import { createRollupFetchTransactionHashTransform } from './createRollupFetchTransactionHash';
import { createRollupFetchCoreContractsTransform } from './createRollupFetchCoreContracts';
import { isTokenBridgeDeployedTransform } from './isTokenBridgeDeployed';
import { createTokenBridgePrepareTransactionRequestTransform } from './createTokenBridgePrepareTransactionRequest';
import { createTokenBridgePrepareSetWethGatewayTransactionRequestTransform } from './createTokenBridgePrepareSetWethGatewayTransactionRequest';
import { setValidKeysetPrepareTransactionRequestTransform } from './setValidKeysetPrepareTransactionRequest';
import { createRollupPrepareTransactionRequestTransformedSchema } from './createRollupPrepareTransactionRequest';
import { createSafePrepareTransactionRequestTransform } from './createSafePrepareTransactionRequest';
import {
  createRollupEnoughCustomFeeTokenAllowanceTransform,
  createRollupPrepareCustomFeeTokenApprovalTransactionRequestTransform,
  createTokenBridgeEnoughCustomFeeTokenAllowanceTransform,
  createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequestTransform,
} from './customFeeToken';
import { prepareKeysetTransform } from './prepareKeyset';
import { prepareKeysetHashTransform } from './prepareKeysetHash';
import { getDefaultsTransform } from './getDefaults';
import { createRollupGetRetryablesFeesTransform } from './createRollupGetRetryablesFees';
import { fetchAllowanceTransform, fetchDecimalsTransform } from './erc20';
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
type NormalizeField<T, K extends keyof T> = ToCanonicalViem<NonNullable<T[K]>> extends never
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DeepNormalize<T> = T extends any
  ? { -readonly [K in keyof T]-?: NormalizeField<T, K> }
  : never;

it('createRollupTransformedSchema output matches createRollup params', () => {
  type SchemaOutput = z.output<typeof createRollupTransformedSchema>;
  type FunctionParam = Parameters<typeof createRollup>[0];

  type SO_v21 = DeepNormalize<
    Extract<SchemaOutput, readonly [{ rollupCreatorVersion: 'v2.1' }]>[0]
  >;
  type SO_v32 = DeepNormalize<
    Extract<SchemaOutput, readonly [{ rollupCreatorVersion: 'v3.2' }]>[0]
  >;
  type SO_default = DeepNormalize<
    Extract<SchemaOutput, readonly [{ rollupCreatorVersion?: never }]>[0]
  >;

  type FP_v21 = DeepNormalize<Extract<FunctionParam, { rollupCreatorVersion: 'v2.1' }>>;
  type FP_v32 = DeepNormalize<Extract<FunctionParam, { rollupCreatorVersion: 'v3.2' }>>;
  type FP_default = DeepNormalize<Extract<FunctionParam, { rollupCreatorVersion?: never }>>;

  expectTypeOf<SO_v21>().toEqualTypeOf<FP_v21>();
  expectTypeOf<SO_v32>().toEqualTypeOf<FP_v32>();
  expectTypeOf<SO_default>().toEqualTypeOf<FP_default>();
});

it('setValidKeysetTransform output matches setValidKeyset params', () =>
  expectTypeOf<DeepNormalize<ReturnType<typeof setValidKeysetTransform>>>().toEqualTypeOf<
    DeepNormalize<Parameters<typeof setValidKeyset>>
  >());

it('createTokenBridgeTransform output matches createTokenBridge params', () =>
  expectTypeOf<DeepNormalize<ReturnType<typeof createTokenBridgeTransform>>>().toEqualTypeOf<
    DeepNormalize<Parameters<typeof createTokenBridge>>
  >());

it('getKeysetsTransform output matches getKeysets params', () =>
  expectTypeOf<DeepNormalize<ReturnType<typeof getKeysetsTransform>>>().toEqualTypeOf<
    DeepNormalize<Parameters<typeof getKeysets>>
  >());

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
  expectTypeOf<DeepNormalize<ReturnType<typeof prepareChainConfigTransform>>>().toEqualTypeOf<
    DeepNormalize<Parameters<typeof prepareChainConfig>>
  >());

it('upgradeExecutorPrepareTransactionRequestTransform output matches upgradeExecutorPrepareAddExecutorTransactionRequest params', () =>
  expectTypeOf<
    DeepNormalize<ReturnType<typeof upgradeExecutorPrepareTransactionRequestTransform>>
  >().toEqualTypeOf<
    DeepNormalize<Parameters<typeof upgradeExecutorPrepareAddExecutorTransactionRequest>>
  >());

it('getValidatorsTransform output matches getValidators params', () =>
  expectTypeOf<DeepNormalize<ReturnType<typeof getValidatorsTransform>>>().toEqualTypeOf<
    DeepNormalize<Parameters<typeof getValidators>>
  >());

it('getBatchPostersTransform output matches getBatchPosters params', () =>
  expectTypeOf<DeepNormalize<ReturnType<typeof getBatchPostersTransform>>>().toEqualTypeOf<
    DeepNormalize<Parameters<typeof getBatchPosters>>
  >());

it('upgradeExecutorFetchPrivilegedAccountsTransform output matches upgradeExecutorFetchPrivilegedAccounts params', () =>
  expectTypeOf<
    DeepNormalize<ReturnType<typeof upgradeExecutorFetchPrivilegedAccountsTransform>>
  >().toEqualTypeOf<DeepNormalize<Parameters<typeof upgradeExecutorFetchPrivilegedAccounts>>>());

it('setAnyTrustFastConfirmerTransform output matches setAnyTrustFastConfirmerPrepareTransactionRequest params', () =>
  expectTypeOf<DeepNormalize<ReturnType<typeof setAnyTrustFastConfirmerTransform>>>().toEqualTypeOf<
    DeepNormalize<Parameters<typeof setAnyTrustFastConfirmerPrepareTransactionRequest>>
  >());

it('prepareNodeConfigTransform output matches prepareNodeConfig params', () =>
  expectTypeOf<DeepNormalize<ReturnType<typeof prepareNodeConfigTransform>>>().toEqualTypeOf<
    DeepNormalize<Parameters<typeof prepareNodeConfig>>
  >());

it('feeRouterDeployRewardDistributorTransform output matches feeRouterDeployRewardDistributor params', () =>
  expectTypeOf<
    DeepNormalize<ReturnType<typeof feeRouterDeployRewardDistributorTransform>>
  >().toEqualTypeOf<DeepNormalize<Parameters<typeof feeRouterDeployRewardDistributor>>>());

it('feeRouterDeployChildToParentRewardRouterTransform output matches feeRouterDeployChildToParentRewardRouter params', () =>
  expectTypeOf<
    DeepNormalize<ReturnType<typeof feeRouterDeployChildToParentRewardRouterTransform>>
  >().toEqualTypeOf<DeepNormalize<Parameters<typeof feeRouterDeployChildToParentRewardRouter>>>());

it('getBridgeUiConfigTransform output matches getBridgeUiConfig params', () =>
  expectTypeOf<DeepNormalize<ReturnType<typeof getBridgeUiConfigTransform>>>().toEqualTypeOf<
    DeepNormalize<Parameters<typeof getBridgeUiConfig>>
  >());

it('isAnyTrustTransform output matches isAnyTrust params', () =>
  expectTypeOf<DeepNormalize<ReturnType<typeof isAnyTrustTransform>>>().toEqualTypeOf<
    DeepNormalize<Parameters<typeof isAnyTrust>>
  >());

it('createRollupFetchTransactionHashTransform output matches createRollupFetchTransactionHash params', () =>
  expectTypeOf<
    DeepNormalize<ReturnType<typeof createRollupFetchTransactionHashTransform>>
  >().toEqualTypeOf<DeepNormalize<Parameters<typeof createRollupFetchTransactionHash>>>());

it('createRollupFetchCoreContractsTransform output matches createRollupFetchCoreContracts params', () =>
  expectTypeOf<
    DeepNormalize<ReturnType<typeof createRollupFetchCoreContractsTransform>>
  >().toEqualTypeOf<DeepNormalize<Parameters<typeof createRollupFetchCoreContracts>>>());

it('isTokenBridgeDeployedTransform output matches isTokenBridgeDeployed params', () =>
  expectTypeOf<DeepNormalize<ReturnType<typeof isTokenBridgeDeployedTransform>>>().toEqualTypeOf<
    DeepNormalize<Parameters<typeof isTokenBridgeDeployed>>
  >());

it('createTokenBridgePrepareTransactionRequestTransform output matches createTokenBridgePrepareTransactionRequest params', () =>
  expectTypeOf<
    DeepNormalize<ReturnType<typeof createTokenBridgePrepareTransactionRequestTransform>>
  >().toEqualTypeOf<
    DeepNormalize<Parameters<typeof createTokenBridgePrepareTransactionRequest>>
  >());

it('createTokenBridgePrepareSetWethGatewayTransactionRequestTransform output matches createTokenBridgePrepareSetWethGatewayTransactionRequest params', () =>
  expectTypeOf<
    DeepNormalize<
      ReturnType<typeof createTokenBridgePrepareSetWethGatewayTransactionRequestTransform>
    >
  >().toEqualTypeOf<
    DeepNormalize<Parameters<typeof createTokenBridgePrepareSetWethGatewayTransactionRequest>>
  >());

it('setValidKeysetPrepareTransactionRequestTransform output matches setValidKeysetPrepareTransactionRequest params', () =>
  expectTypeOf<
    DeepNormalize<ReturnType<typeof setValidKeysetPrepareTransactionRequestTransform>>
  >().toEqualTypeOf<DeepNormalize<Parameters<typeof setValidKeysetPrepareTransactionRequest>>>());

it('createRollupPrepareTransactionRequestTransformedSchema output matches createRollupPrepareTransactionRequest params', () => {
  type SchemaOutput = z.output<typeof createRollupPrepareTransactionRequestTransformedSchema>;
  type FunctionParam = Parameters<typeof createRollupPrepareTransactionRequest>[0];

  type SO_v21 = DeepNormalize<
    Extract<SchemaOutput, readonly [{ rollupCreatorVersion: 'v2.1' }]>[0]
  >;
  type SO_v32 = DeepNormalize<
    Extract<SchemaOutput, readonly [{ rollupCreatorVersion: 'v3.2' }]>[0]
  >;
  type SO_default = DeepNormalize<
    Extract<SchemaOutput, readonly [{ rollupCreatorVersion?: never }]>[0]
  >;

  type FP_v21 = DeepNormalize<Extract<FunctionParam, { rollupCreatorVersion: 'v2.1' }>>;
  type FP_v32 = DeepNormalize<Extract<FunctionParam, { rollupCreatorVersion: 'v3.2' }>>;
  type FP_default = DeepNormalize<Extract<FunctionParam, { rollupCreatorVersion?: never }>>;

  expectTypeOf<SO_v21>().toEqualTypeOf<FP_v21>();
  expectTypeOf<SO_v32>().toEqualTypeOf<FP_v32>();
  expectTypeOf<SO_default>().toEqualTypeOf<FP_default>();
});

it('createSafePrepareTransactionRequestTransform output matches createSafePrepareTransactionRequest params', () =>
  expectTypeOf<
    DeepNormalize<ReturnType<typeof createSafePrepareTransactionRequestTransform>>
  >().toEqualTypeOf<DeepNormalize<Parameters<typeof createSafePrepareTransactionRequest>>>());

it('createRollupEnoughCustomFeeTokenAllowanceTransform output matches createRollupEnoughCustomFeeTokenAllowance params', () =>
  expectTypeOf<
    DeepNormalize<ReturnType<typeof createRollupEnoughCustomFeeTokenAllowanceTransform>>
  >().toEqualTypeOf<DeepNormalize<Parameters<typeof createRollupEnoughCustomFeeTokenAllowance>>>());

it('createRollupPrepareCustomFeeTokenApprovalTransactionRequestTransform output matches createRollupPrepareCustomFeeTokenApprovalTransactionRequest params', () =>
  expectTypeOf<
    DeepNormalize<
      ReturnType<typeof createRollupPrepareCustomFeeTokenApprovalTransactionRequestTransform>
    >
  >().toEqualTypeOf<
    DeepNormalize<Parameters<typeof createRollupPrepareCustomFeeTokenApprovalTransactionRequest>>
  >());

it('createTokenBridgeEnoughCustomFeeTokenAllowanceTransform output matches createTokenBridgeEnoughCustomFeeTokenAllowance params', () =>
  expectTypeOf<
    DeepNormalize<ReturnType<typeof createTokenBridgeEnoughCustomFeeTokenAllowanceTransform>>
  >().toEqualTypeOf<
    DeepNormalize<Parameters<typeof createTokenBridgeEnoughCustomFeeTokenAllowance>>
  >());

it('createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequestTransform output matches createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequest params', () =>
  expectTypeOf<
    DeepNormalize<
      ReturnType<typeof createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequestTransform>
    >
  >().toEqualTypeOf<
    DeepNormalize<
      Parameters<typeof createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequest>
    >
  >());

it('prepareKeysetTransform output matches prepareKeyset params', () =>
  expectTypeOf<DeepNormalize<ReturnType<typeof prepareKeysetTransform>>>().toEqualTypeOf<
    DeepNormalize<Parameters<typeof prepareKeyset>>
  >());

it('prepareKeysetHashTransform output matches prepareKeysetHash params', () =>
  expectTypeOf<DeepNormalize<ReturnType<typeof prepareKeysetHashTransform>>>().toEqualTypeOf<
    DeepNormalize<Parameters<typeof prepareKeysetHash>>
  >());

it('getDefaultsTransform output matches getDefaultConfirmPeriodBlocks params', () =>
  expectTypeOf<DeepNormalize<ReturnType<typeof getDefaultsTransform>>>().toEqualTypeOf<
    DeepNormalize<Parameters<typeof getDefaultConfirmPeriodBlocks>>
  >());

it('createRollupGetRetryablesFeesTransform output matches createRollupGetRetryablesFees params', () =>
  expectTypeOf<
    DeepNormalize<ReturnType<typeof createRollupGetRetryablesFeesTransform>>
  >().toEqualTypeOf<DeepNormalize<Parameters<typeof createRollupGetRetryablesFees>>>());

it('createRollupGetRetryablesFeesTransform output matches createRollupGetRetryablesFeesWithDefaults params', () =>
  expectTypeOf<
    DeepNormalize<ReturnType<typeof createRollupGetRetryablesFeesTransform>>
  >().toEqualTypeOf<DeepNormalize<Parameters<typeof createRollupGetRetryablesFeesWithDefaults>>>());

it('fetchAllowanceTransform output matches fetchAllowance params', () =>
  expectTypeOf<DeepNormalize<ReturnType<typeof fetchAllowanceTransform>>>().toEqualTypeOf<
    DeepNormalize<Parameters<typeof fetchAllowance>>
  >());

it('fetchDecimalsTransform output matches fetchDecimals params', () =>
  expectTypeOf<DeepNormalize<ReturnType<typeof fetchDecimalsTransform>>>().toEqualTypeOf<
    DeepNormalize<Parameters<typeof fetchDecimals>>
  >());
