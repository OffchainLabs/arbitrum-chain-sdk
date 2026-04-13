import { z } from 'zod';
import { zeroAddress } from 'viem';
import { runScript } from '../scriptUtils';
import { createRollupDefaultSchema } from '../schemas/createRollup';
import {
  hexSchema,
  bigintSchema,
  addressSchema,
  gasLimitSchema,
  tokenBridgeRetryableGasOverridesSchema,
} from '../schemas/common';
import { paramsV3Dot2Schema } from '../schemas/createRollupPrepareDeploymentParamsConfig';
import { prepareChainConfigParamsSchema } from '../schemas/prepareChainConfig';
import { toPublicClient, toAccount, toWalletClient, findChain } from '../viemTransforms';
import { createRollupPrepareDeploymentParamsConfig } from '../../createRollupPrepareDeploymentParamsConfig';
import { prepareChainConfig } from '../../prepareChainConfig';
import { generateChainId } from '../../utils/generateChainId';
import { execute as deployNewChainExecute } from './deployNewChain';
import { execute as createTokenBridgeExecute } from './createTokenBridge';
import { execute as transferOwnershipExecute } from './transferOwnership';

export const schema = createRollupDefaultSchema
  .extend({
    params: createRollupDefaultSchema.shape.params.extend({
      config: paramsV3Dot2Schema.extend({
        chainId: bigintSchema.prefault(() => String(generateChainId())),
        chainConfig: prepareChainConfigParamsSchema.optional(),
      }),
      nativeToken: addressSchema.default(zeroAddress),
      keyset: hexSchema.optional(),
    }),
    // createTokenBridge options
    gasOverrides: gasLimitSchema.optional(),
    retryableGasOverrides: tokenBridgeRetryableGasOverridesSchema.optional(),
    tokenBridgeCreatorAddressOverride: addressSchema.optional(),
    // transferOwnership fields
    newOwnerAddress: addressSchema,
    childUpgradeExecutorAddress: addressSchema,
    maxGasPrice: bigintSchema,
    refundAddress: addressSchema.optional(),
  })
  .superRefine((data, ctx) => {
    const isAnytrust = data.params.config.chainConfig?.arbitrum?.DataAvailabilityCommittee === true;
    if (data.params.keyset && !isAnytrust) {
      ctx.addIssue({
        code: 'custom',
        path: ['params', 'keyset'],
        message:
          'keyset provided but chain is not AnyTrust (DataAvailabilityCommittee is not true)',
      });
    }
  })
  .transform((input) => {
    const parentChainPublicClient = toPublicClient(
      input.parentChainRpcUrl,
      findChain(input.parentChainId),
    );
    const {
      config: { chainConfig: chainConfigParams, ...restConfig },
      keyset,
      ...restParams
    } = input.params;

    const owner = restConfig.owner;
    const childChainId = Number(restConfig.chainId);

    const chainConfig = chainConfigParams ? prepareChainConfig(chainConfigParams) : undefined;
    const isAnytrust = chainConfigParams?.arbitrum?.DataAvailabilityCommittee === true;
    const config = createRollupPrepareDeploymentParamsConfig(parentChainPublicClient, {
      ...restConfig,
      chainConfig,
    });

    const DEFAULT_KEYSET: `0x${string}` =
      '0x00000000000000010000000000000001012160000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';

    const account = toAccount(input.privateKey);
    const walletClient = toWalletClient(
      input.parentChainRpcUrl,
      input.privateKey,
      findChain(input.parentChainId),
    );

    return {
      deployParams: { config, ...restParams },
      account,
      parentChainPublicClient,
      walletClient,
      keyset: isAnytrust ? keyset ?? DEFAULT_KEYSET : undefined,
      owner,
      gasOverrides: input.gasOverrides,
      retryableGasOverrides: input.retryableGasOverrides,
      tokenBridgeCreatorAddressOverride: input.tokenBridgeCreatorAddressOverride,
      newOwnerAddress: input.newOwnerAddress,
      childUpgradeExecutorAddress: input.childUpgradeExecutorAddress,
      childChainId,
      maxGasPrice: input.maxGasPrice,
      refundAddress: input.refundAddress ?? input.newOwnerAddress,
    };
  });

export const execute = async (input: z.output<typeof schema>) => {
  const {
    deployParams,
    account,
    parentChainPublicClient,
    walletClient,
    keyset,
    owner,
    gasOverrides,
    retryableGasOverrides,
    tokenBridgeCreatorAddressOverride,
    newOwnerAddress,
    childUpgradeExecutorAddress,
    childChainId,
    maxGasPrice,
    refundAddress,
  } = input;

  const coreContracts = await deployNewChainExecute({
    params: deployParams,
    account,
    parentChainPublicClient,
    walletClient,
    keyset,
  });

  const tokenBridgeContracts = await createTokenBridgeExecute({
    createTokenBridgeParams: {
      params: {
        rollup: coreContracts.rollup,
        rollupOwner: owner,
      },
      parentChainPublicClient,
      account: account.address,
      gasOverrides,
      retryableGasOverrides,
      tokenBridgeCreatorAddressOverride,
    },
    signer: account,
    nativeToken: deployParams.nativeToken,
  });

  const ownershipResult = await transferOwnershipExecute({
    upgradeExecutorAddress: coreContracts.upgradeExecutor,
    newOwnerAddress,
    inboxAddress: coreContracts.inbox,
    childUpgradeExecutorAddress,
    childChainId,
    nativeToken: deployParams.nativeToken,
    maxGasPrice,
    publicClient: parentChainPublicClient,
    account,
    walletClient,
    refundAddress,
  });

  return {
    coreContracts,
    tokenBridgeContracts,
    ...ownershipResult,
  };
};

runScript(schema, execute);
