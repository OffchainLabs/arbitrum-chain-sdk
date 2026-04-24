import { z } from 'zod';
import { parseAbi, zeroAddress } from 'viem';
import { createRollupDefaultSchema } from '../schemas/createRollup';
import {
  hexSchema,
  bigintSchema,
  addressSchema,
  gasLimitSchema,
  tokenBridgeRetryableGasOverridesSchema,
} from '../schemas/common';
import { paramsV3Dot2Schema } from '../schemas/createRollupPrepareDeploymentParamsConfig';
import { prepareChainConfigParamsBaseSchema } from '../schemas/prepareChainConfig';
import { toPublicClient, toAccount, toWalletClient, findChain } from '../viemTransforms';
import { createRollupPrepareDeploymentParamsConfig } from '../../createRollupPrepareDeploymentParamsConfig';
import { prepareChainConfig } from '../../prepareChainConfig';
import { getArbOSVersion } from '../../utils/getArbOSVersion';
import { generateChainId } from '../../utils/generateChainId';
import { ChainConfig } from '../../types/ChainConfig';
import { execute as deployNewChainExecute } from './deployNewChain';
import { execute as createTokenBridgeExecute } from './createTokenBridge';
import { execute as transferOwnershipExecute } from './transferOwnership';

export const schema = createRollupDefaultSchema
  .extend({
    params: createRollupDefaultSchema.shape.params.extend({
      config: paramsV3Dot2Schema.extend({
        chainId: bigintSchema.prefault(() => String(generateChainId())),
        chainConfig: prepareChainConfigParamsBaseSchema.optional(),
      }),
      nativeToken: addressSchema.default(zeroAddress),
      keyset: hexSchema.optional(),
    }),
    chainName: z.string(),
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

    const isAnytrust = chainConfigParams?.arbitrum?.DataAvailabilityCommittee === true;

    const DEFAULT_KEYSET: `0x${string}` =
      '0x00000000000000010000000000000001012160000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';

    const account = toAccount(input.privateKey);
    const walletClient = toWalletClient(
      input.parentChainRpcUrl,
      input.privateKey,
      findChain(input.parentChainId),
    );

    return {
      rawConfig: restConfig,
      chainConfigParams,
      restParams,
      keyset: isAnytrust ? keyset ?? DEFAULT_KEYSET : undefined,
      account,
      parentChainPublicClient,
      parentChainId: input.parentChainId,
      walletClient,
      chainName: input.chainName,
      gasOverrides: input.gasOverrides,
      retryableGasOverrides: input.retryableGasOverrides,
      tokenBridgeCreatorAddressOverride: input.tokenBridgeCreatorAddressOverride,
      newOwnerAddress: input.newOwnerAddress,
      childUpgradeExecutorAddress: input.childUpgradeExecutorAddress,
      maxGasPrice: input.maxGasPrice,
      refundAddress: input.refundAddress ?? input.newOwnerAddress,
    };
  });

export const execute = async (input: z.output<typeof schema>) => {
  const {
    rawConfig,
    chainConfigParams,
    restParams,
    keyset,
    account,
    parentChainPublicClient,
    parentChainId,
    walletClient,
    chainName,
    gasOverrides,
    retryableGasOverrides,
    tokenBridgeCreatorAddressOverride,
    newOwnerAddress,
    childUpgradeExecutorAddress,
    maxGasPrice,
    refundAddress,
  } = input;

  const chainConfig: ChainConfig | undefined = chainConfigParams
    ? prepareChainConfig(chainConfigParams)
    : undefined;
  const config = createRollupPrepareDeploymentParamsConfig(parentChainPublicClient, {
    ...rawConfig,
    chainConfig,
  });

  // Step 1: Deploy the chain
  const coreContracts = await deployNewChainExecute({
    params: { config, ...restParams },
    account,
    parentChainPublicClient,
    walletClient,
    keyset,
  });

  // Step 2: Create token bridge
  const tokenBridgeContracts = await createTokenBridgeExecute({
    createTokenBridgeParams: {
      params: {
        rollup: coreContracts.rollup,
        rollupOwner: rawConfig.owner,
      },
      parentChainPublicClient,
      account: account.address,
      gasOverrides,
      retryableGasOverrides,
      tokenBridgeCreatorAddressOverride,
    },
    signer: account,
    nativeToken: restParams.nativeToken,
  });

  // Step 3: Transfer ownership
  await transferOwnershipExecute({
    upgradeExecutorAddress: coreContracts.upgradeExecutor,
    newOwnerAddress,
    inboxAddress: coreContracts.inbox,
    childUpgradeExecutorAddress,
    childChainId: Number(rawConfig.chainId),
    nativeToken: restParams.nativeToken,
    maxGasPrice,
    publicClient: parentChainPublicClient,
    account,
    walletClient,
    refundAddress,
  });

  // Build getChainDeploymentInfo-shaped output
  const [stakeToken, parentChainIsArbitrum] = await Promise.all([
    parentChainPublicClient.readContract({
      address: coreContracts.rollup,
      abi: parseAbi(['function stakeToken() view returns (address)']),
      functionName: 'stakeToken',
    }),
    getArbOSVersion(parentChainPublicClient)
      .then(() => true)
      .catch(() => false),
  ]);

  return {
    chainInfo: {
      chainId: chainConfig?.chainId ?? 0,
      parentChainId,
      parentChainIsArbitrum,
      chainName,
      chainConfig,
      rollup: {
        rollup: coreContracts.rollup,
        bridge: coreContracts.bridge,
        inbox: coreContracts.inbox,
        sequencerInbox: coreContracts.sequencerInbox,
        validatorWalletCreator: coreContracts.validatorWalletCreator,
        stakeToken,
        deployedAtBlockNumber: coreContracts.deployedAtBlockNumber,
      },
    },
    tokenBridgeContracts,
  };
};
