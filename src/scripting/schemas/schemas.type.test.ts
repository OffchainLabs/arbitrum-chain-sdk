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

import { buildSetIsBatchPoster } from '../../actions/buildSetIsBatchPoster';
import { buildSetValidKeyset } from '../../actions/buildSetValidKeyset';
import { buildInvalidateKeysetHash } from '../../actions/buildInvalidateKeysetHash';
import { buildSetMaxTimeVariation } from '../../actions/buildSetMaxTimeVariation';
import { buildScheduleArbOSUpgrade } from '../../actions/buildScheduleArbOSUpgrade';
import { isBatchPoster } from '../../actions/isBatchPoster';
import { isValidKeysetHash } from '../../actions/isValidKeysetHash';
import { getMaxTimeVariation } from '../../actions/getMaxTimeVariation';

import { createRollupTransformedSchema } from './createRollup';
import { setValidKeysetTransform } from './setValidKeyset';
import { createTokenBridgeResolver } from './createTokenBridge';
import { getKeysetsTransform } from './getKeysets';
import { getValidatorsTransform } from './getValidators';
import { getBatchPostersTransform } from './getBatchPosters';
import {
  prepareDeploymentParamsConfigV32Transform,
  prepareDeploymentParamsConfigV21Transform,
} from './createRollupPrepareDeploymentParamsConfig';
import { prepareChainConfigTransform } from './prepareChainConfig';
import {
  upgradeExecutorPrepareTransactionRequestSchema,
  upgradeExecutorFetchPrivilegedAccountsTransform,
} from './upgradeExecutor';
import { setAnyTrustFastConfirmerSchema } from './setAnyTrustFastConfirmer';
import { prepareNodeConfigTransform } from './prepareNodeConfig';
import {
  feeRouterDeployRewardDistributorSchema,
  feeRouterDeployChildToParentRewardRouterSchema,
} from './feeRouter';
import { getBridgeUiConfigTransform } from './getBridgeUiConfig';
import { isAnyTrustSchema } from './isAnyTrust';
import { createRollupFetchTransactionHashSchema } from './createRollupFetchTransactionHash';
import { createRollupFetchCoreContractsSchema } from './createRollupFetchCoreContracts';
import { isTokenBridgeDeployedTransform } from './isTokenBridgeDeployed';
import { createTokenBridgePrepareTransactionRequestSchema } from './createTokenBridgePrepareTransactionRequest';
import { createTokenBridgePrepareSetWethGatewayTransactionRequestSchema } from './createTokenBridgePrepareSetWethGatewayTransactionRequest';
import { setValidKeysetPrepareTransactionRequestSchema } from './setValidKeysetPrepareTransactionRequest';
import { createRollupPrepareTransactionRequestTransformedSchema } from './createRollupPrepareTransactionRequest';
import { createSafePrepareTransactionRequestSchema } from './createSafePrepareTransactionRequest';
import {
  createRollupEnoughCustomFeeTokenAllowanceSchema,
  createRollupPrepareCustomFeeTokenApprovalTransactionRequestSchema,
  createTokenBridgeEnoughCustomFeeTokenAllowanceSchema,
  createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequestSchema,
} from './customFeeToken';
import {
  withPublicClient,
  withParentChainPublicClient,
  withChainSign,
  withChildChainSign,
  withParentReadChildSign,
} from '../viemTransforms';
import { prepareKeysetTransform } from './prepareKeyset';
import { prepareKeysetHashTransform } from './prepareKeysetHash';
import { getDefaultsTransform } from './getDefaults';
import { createRollupGetRetryablesFeesTransform } from './createRollupGetRetryablesFees';
import { fetchAllowanceTransform, fetchDecimalsTransform } from './erc20';
import { coreContractsSchema, chainConfigSchema } from './common';
import { parentChainIsArbitrumTransform } from './parentChainIsArbitrum';
import { parentChainIsArbitrum } from '../../parentChainIsArbitrum';
import {
  getConsensusReleaseByVersion,
  getConsensusReleaseByWasmModuleRoot,
  isKnownWasmModuleRoot,
} from '../../wasmModuleRoot';
import {
  getConsensusReleaseByVersionTransform,
  getConsensusReleaseByWasmModuleRootTransform,
  isKnownWasmModuleRootTransform,
} from './wasmModuleRoot';
import {
  buildSetIsBatchPosterTransform,
  buildSetValidKeysetTransform,
  buildInvalidateKeysetHashTransform,
  buildSetMaxTimeVariationTransform,
  buildScheduleArbOSUpgradeTransform,
  isBatchPosterTransform,
  isValidKeysetHashTransform,
  getMaxTimeVariationTransform,
} from './actions';

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

it('createTokenBridgeResolver output matches createTokenBridge params', () =>
  expectTypeOf<DeepNormalize<ReturnType<typeof createTokenBridgeResolver>>>().toEqualTypeOf<
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
  expectTypeOf<DeepNormalize<TransformOutput[1]>>().toEqualTypeOf<
    DeepNormalize<CreateRollupPrepareDeploymentParamsConfigParams>
  >();
});

it('prepareDeploymentParamsConfigV21Transform params match CreateRollupPrepareDeploymentParamsConfigParams<v2.1>', () => {
  type TransformOutput = ReturnType<typeof prepareDeploymentParamsConfigV21Transform>;
  expectTypeOf<DeepNormalize<TransformOutput[1]>>().toEqualTypeOf<
    DeepNormalize<CreateRollupPrepareDeploymentParamsConfigParams<'v2.1'>>
  >();
});

it('prepareChainConfigTransform output matches prepareChainConfig params', () =>
  expectTypeOf<DeepNormalize<ReturnType<typeof prepareChainConfigTransform>>>().toEqualTypeOf<
    DeepNormalize<Parameters<typeof prepareChainConfig>>
  >());

it('upgradeExecutorPrepareTransactionRequestResolver output matches upgradeExecutorPrepareAddExecutorTransactionRequest params', () => {
  const transformed = upgradeExecutorPrepareTransactionRequestSchema.transform(withPublicClient);
  expectTypeOf<
    DeepNormalize<z.output<typeof transformed>>
  >().toEqualTypeOf<
    DeepNormalize<Parameters<typeof upgradeExecutorPrepareAddExecutorTransactionRequest>>
  >();
});

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

it('setAnyTrustFastConfirmerResolver output matches setAnyTrustFastConfirmerPrepareTransactionRequest params', () => {
  const transformed = setAnyTrustFastConfirmerSchema.transform(withChainSign);
  expectTypeOf<
    DeepNormalize<z.output<typeof transformed>>
  >().toEqualTypeOf<
    DeepNormalize<Parameters<typeof setAnyTrustFastConfirmerPrepareTransactionRequest>>
  >();
});

it('prepareNodeConfigTransform output matches prepareNodeConfig params', () =>
  expectTypeOf<DeepNormalize<ReturnType<typeof prepareNodeConfigTransform>>>().toEqualTypeOf<
    DeepNormalize<Parameters<typeof prepareNodeConfig>>
  >());

it('feeRouterDeployRewardDistributorResolver output matches feeRouterDeployRewardDistributor params', () => {
  const transformed = feeRouterDeployRewardDistributorSchema.transform(withChildChainSign);
  expectTypeOf<
    DeepNormalize<z.output<typeof transformed>>
  >().toEqualTypeOf<DeepNormalize<Parameters<typeof feeRouterDeployRewardDistributor>>>();
});

it('feeRouterDeployChildToParentRewardRouterResolver output matches feeRouterDeployChildToParentRewardRouter params', () => {
  const transformed = feeRouterDeployChildToParentRewardRouterSchema.transform(withParentReadChildSign);
  expectTypeOf<
    DeepNormalize<z.output<typeof transformed>>
  >().toEqualTypeOf<DeepNormalize<Parameters<typeof feeRouterDeployChildToParentRewardRouter>>>();
});

it('getBridgeUiConfigTransform output matches getBridgeUiConfig params', () =>
  expectTypeOf<DeepNormalize<ReturnType<typeof getBridgeUiConfigTransform>>>().toEqualTypeOf<
    DeepNormalize<Parameters<typeof getBridgeUiConfig>>
  >());

it('isAnyTrustResolver output matches isAnyTrust params', () => {
  const transformed = isAnyTrustSchema.transform(withPublicClient);
  expectTypeOf<
    DeepNormalize<z.output<typeof transformed>>
  >().toEqualTypeOf<DeepNormalize<Parameters<typeof isAnyTrust>>>();
});

it('createRollupFetchTransactionHashResolver output matches createRollupFetchTransactionHash params', () => {
  const transformed = createRollupFetchTransactionHashSchema.transform(withPublicClient);
  expectTypeOf<
    DeepNormalize<z.output<typeof transformed>>
  >().toEqualTypeOf<DeepNormalize<Parameters<typeof createRollupFetchTransactionHash>>>();
});

it('createRollupFetchCoreContractsResolver output matches createRollupFetchCoreContracts params', () => {
  const transformed = createRollupFetchCoreContractsSchema.transform(withPublicClient);
  expectTypeOf<
    DeepNormalize<z.output<typeof transformed>>
  >().toEqualTypeOf<DeepNormalize<Parameters<typeof createRollupFetchCoreContracts>>>();
});

it('isTokenBridgeDeployedTransform output matches isTokenBridgeDeployed params', () =>
  expectTypeOf<DeepNormalize<ReturnType<typeof isTokenBridgeDeployedTransform>>>().toEqualTypeOf<
    DeepNormalize<Parameters<typeof isTokenBridgeDeployed>>
  >());

it('createTokenBridgePrepareTransactionRequestResolver output matches createTokenBridgePrepareTransactionRequest params', () => {
  const transformed = createTokenBridgePrepareTransactionRequestSchema.transform(withParentChainPublicClient);
  expectTypeOf<
    DeepNormalize<z.output<typeof transformed>>
  >().toEqualTypeOf<
    DeepNormalize<Parameters<typeof createTokenBridgePrepareTransactionRequest>>
  >();
});

it('createTokenBridgePrepareSetWethGatewayTransactionRequestResolver output matches createTokenBridgePrepareSetWethGatewayTransactionRequest params', () => {
  const transformed = createTokenBridgePrepareSetWethGatewayTransactionRequestSchema.transform(withParentChainPublicClient);
  expectTypeOf<
    DeepNormalize<z.output<typeof transformed>>
  >().toEqualTypeOf<
    DeepNormalize<Parameters<typeof createTokenBridgePrepareSetWethGatewayTransactionRequest>>
  >();
});

it('setValidKeysetPrepareTransactionRequestResolver output matches setValidKeysetPrepareTransactionRequest params', () => {
  const transformed = setValidKeysetPrepareTransactionRequestSchema.transform(withPublicClient);
  expectTypeOf<
    DeepNormalize<z.output<typeof transformed>>
  >().toEqualTypeOf<DeepNormalize<Parameters<typeof setValidKeysetPrepareTransactionRequest>>>();
});

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

it('createSafePrepareTransactionRequestResolver output matches createSafePrepareTransactionRequest params', () => {
  const transformed = createSafePrepareTransactionRequestSchema.transform(withChainSign);
  expectTypeOf<
    DeepNormalize<z.output<typeof transformed>>
  >().toEqualTypeOf<DeepNormalize<Parameters<typeof createSafePrepareTransactionRequest>>>();
});

it('createRollupEnoughCustomFeeTokenAllowanceResolver output matches createRollupEnoughCustomFeeTokenAllowance params', () => {
  const transformed = createRollupEnoughCustomFeeTokenAllowanceSchema.transform(withPublicClient);
  expectTypeOf<
    DeepNormalize<z.output<typeof transformed>>
  >().toEqualTypeOf<DeepNormalize<Parameters<typeof createRollupEnoughCustomFeeTokenAllowance>>>();
});

it('createRollupPrepareCustomFeeTokenApprovalTransactionRequestResolver output matches createRollupPrepareCustomFeeTokenApprovalTransactionRequest params', () => {
  const transformed = createRollupPrepareCustomFeeTokenApprovalTransactionRequestSchema.transform(withPublicClient);
  expectTypeOf<
    DeepNormalize<z.output<typeof transformed>>
  >().toEqualTypeOf<
    DeepNormalize<Parameters<typeof createRollupPrepareCustomFeeTokenApprovalTransactionRequest>>
  >();
});

it('createTokenBridgeEnoughCustomFeeTokenAllowanceResolver output matches createTokenBridgeEnoughCustomFeeTokenAllowance params', () => {
  const transformed = createTokenBridgeEnoughCustomFeeTokenAllowanceSchema.transform(withPublicClient);
  expectTypeOf<
    DeepNormalize<z.output<typeof transformed>>
  >().toEqualTypeOf<
    DeepNormalize<Parameters<typeof createTokenBridgeEnoughCustomFeeTokenAllowance>>
  >();
});

it('createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequestResolver output matches createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequest params', () => {
  const transformed = createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequestSchema.transform(withPublicClient);
  expectTypeOf<
    DeepNormalize<z.output<typeof transformed>>
  >().toEqualTypeOf<
    DeepNormalize<
      Parameters<typeof createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequest>
    >
  >();
});

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

it('buildSetIsBatchPosterTransform output matches buildSetIsBatchPoster params', () =>
  expectTypeOf<DeepNormalize<ReturnType<typeof buildSetIsBatchPosterTransform>>>().toEqualTypeOf<
    DeepNormalize<Parameters<typeof buildSetIsBatchPoster>>
  >());

it('buildSetValidKeysetTransform output matches buildSetValidKeyset params', () =>
  expectTypeOf<DeepNormalize<ReturnType<typeof buildSetValidKeysetTransform>>>().toEqualTypeOf<
    DeepNormalize<Parameters<typeof buildSetValidKeyset>>
  >());

it('buildInvalidateKeysetHashTransform output matches buildInvalidateKeysetHash params', () =>
  expectTypeOf<
    DeepNormalize<ReturnType<typeof buildInvalidateKeysetHashTransform>>
  >().toEqualTypeOf<DeepNormalize<Parameters<typeof buildInvalidateKeysetHash>>>());

it('buildSetMaxTimeVariationTransform output matches buildSetMaxTimeVariation params', () =>
  expectTypeOf<DeepNormalize<ReturnType<typeof buildSetMaxTimeVariationTransform>>>().toEqualTypeOf<
    DeepNormalize<Parameters<typeof buildSetMaxTimeVariation>>
  >());

it('buildScheduleArbOSUpgradeTransform output matches buildScheduleArbOSUpgrade params', () =>
  expectTypeOf<
    DeepNormalize<ReturnType<typeof buildScheduleArbOSUpgradeTransform>>
  >().toEqualTypeOf<DeepNormalize<Parameters<typeof buildScheduleArbOSUpgrade>>>());

it('isBatchPosterTransform output matches isBatchPoster params', () =>
  expectTypeOf<DeepNormalize<ReturnType<typeof isBatchPosterTransform>>>().toEqualTypeOf<
    DeepNormalize<Parameters<typeof isBatchPoster>>
  >());

it('isValidKeysetHashTransform output matches isValidKeysetHash params', () =>
  expectTypeOf<DeepNormalize<ReturnType<typeof isValidKeysetHashTransform>>>().toEqualTypeOf<
    DeepNormalize<Parameters<typeof isValidKeysetHash>>
  >());

it('getMaxTimeVariationTransform output matches getMaxTimeVariation params', () =>
  expectTypeOf<DeepNormalize<ReturnType<typeof getMaxTimeVariationTransform>>>().toEqualTypeOf<
    DeepNormalize<Parameters<typeof getMaxTimeVariation>>
  >());

it('parentChainIsArbitrumTransform output matches parentChainIsArbitrum params', () =>
  expectTypeOf<DeepNormalize<ReturnType<typeof parentChainIsArbitrumTransform>>>().toEqualTypeOf<
    DeepNormalize<Parameters<typeof parentChainIsArbitrum>>
  >());

it('getConsensusReleaseByVersionTransform output matches getConsensusReleaseByVersion params', () =>
  expectTypeOf<
    DeepNormalize<ReturnType<typeof getConsensusReleaseByVersionTransform>>
  >().toEqualTypeOf<DeepNormalize<Parameters<typeof getConsensusReleaseByVersion>>>());

it('getConsensusReleaseByWasmModuleRootTransform output matches getConsensusReleaseByWasmModuleRoot params', () =>
  expectTypeOf<
    DeepNormalize<ReturnType<typeof getConsensusReleaseByWasmModuleRootTransform>>
  >().toEqualTypeOf<DeepNormalize<Parameters<typeof getConsensusReleaseByWasmModuleRoot>>>());

it('isKnownWasmModuleRootTransform output matches isKnownWasmModuleRoot params', () =>
  expectTypeOf<DeepNormalize<ReturnType<typeof isKnownWasmModuleRootTransform>>>().toEqualTypeOf<
    DeepNormalize<Parameters<typeof isKnownWasmModuleRoot>>
  >());
