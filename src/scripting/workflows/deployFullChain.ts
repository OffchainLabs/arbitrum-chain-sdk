import { z } from 'zod';
import { parseAbi, zeroAddress } from 'viem';

import { createRollupDefaultSchema } from '../schemas/createRollup';
import { hexSchema, bigintSchema, addressSchema } from '../schemas/common';
import { paramsV3Dot2Schema } from '../schemas/createRollupPrepareDeploymentParamsConfig';
import { prepareChainConfigInputSchema } from '../schemas/prepareChainConfig';
import { toPublicClient, toAccount, toWalletClient, findChain } from '../viemTransforms';
import { createRollupPrepareDeploymentParamsConfig } from '../../createRollupPrepareDeploymentParamsConfig';
import { prepareChainConfig } from '../../prepareChainConfig';
import { getArbOSVersion } from '../../utils/getArbOSVersion';
import { generateChainId } from '../../utils/generateChainId';
import { ChainConfig } from '../../types/ChainConfig';
import { execute as deployNewChainExecute } from './deployNewChain';
import {
  inputSchema as createTokenBridgeInputSchema,
  execute as createTokenBridgeExecute,
} from './createTokenBridgeAndWethGateway';
import {
  inputSchema as transferOwnershipInputSchema,
  execute as transferOwnershipExecute,
} from './transferOwnership';

const { params: createRollupBaseParams, ...baseFields } = createRollupDefaultSchema.shape;

export const inputSchema = z
  .object({
    ...baseFields,
    chainName: z.string(),
    createRollupParams: createRollupBaseParams
      .extend({
        config: paramsV3Dot2Schema
          .extend({
            chainId: bigintSchema.prefault(() => String(generateChainId())),
            chainConfig: prepareChainConfigInputSchema.optional(),
          })
          .strict(),
        nativeToken: addressSchema.default(zeroAddress),
        keyset: hexSchema.optional(),
      })
      .strict(),
    tokenBridgeParams: z
      .object({
        gasOverrides: createTokenBridgeInputSchema.shape.gasOverrides,
        retryableGasOverrides: createTokenBridgeInputSchema.shape.retryableGasOverrides,
        tokenBridgeCreatorAddressOverride:
          createTokenBridgeInputSchema.shape.tokenBridgeCreatorAddressOverride,
      })
      .strict()
      .default({}),
    ownershipTransferParams: z
      .object({
        newOwnerAddress: transferOwnershipInputSchema.shape.newOwnerAddress,
        maxGasPrice: transferOwnershipInputSchema.shape.maxGasPrice,
        refundAddress: transferOwnershipInputSchema.shape.refundAddress,
      })
      .strict()
      .optional(),
  })
  .strict();

export const schema = inputSchema
  .superRefine((data, ctx) => {
    const isAnytrust =
      data.createRollupParams.config.chainConfig?.arbitrum?.DataAvailabilityCommittee === true;
    if (data.createRollupParams.keyset && !isAnytrust) {
      ctx.addIssue({
        code: 'custom',
        path: ['createRollupParams', 'keyset'],
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
    } = input.createRollupParams;

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
      gasOverrides: input.tokenBridgeParams.gasOverrides,
      retryableGasOverrides: input.tokenBridgeParams.retryableGasOverrides,
      tokenBridgeCreatorAddressOverride: input.tokenBridgeParams.tokenBridgeCreatorAddressOverride,
      ownershipTransfer: input.ownershipTransferParams
        ? {
            newOwnerAddress: input.ownershipTransferParams.newOwnerAddress,
            maxGasPrice: input.ownershipTransferParams.maxGasPrice,
            refundAddress:
              input.ownershipTransferParams.refundAddress ??
              input.ownershipTransferParams.newOwnerAddress,
          }
        : undefined,
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
    ownershipTransfer,
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
    rollupDeploymentBlockNumber: coreContracts.deployedAtBlockNumber
      ? BigInt(coreContracts.deployedAtBlockNumber)
      : undefined,
  });

  // Step 3: Transfer ownership (optional)
  if (ownershipTransfer) {
    const childUpgradeExecutorAddress = tokenBridgeContracts.orbitChainContracts.upgradeExecutor;
    await transferOwnershipExecute({
      upgradeExecutorAddress: coreContracts.upgradeExecutor,
      newOwnerAddress: ownershipTransfer.newOwnerAddress,
      inboxAddress: coreContracts.inbox,
      childUpgradeExecutorAddress,
      childChainId: Number(rawConfig.chainId),
      nativeToken: restParams.nativeToken,
      maxGasPrice: ownershipTransfer.maxGasPrice,
      publicClient: parentChainPublicClient,
      account,
      refundAddress: ownershipTransfer.refundAddress,
    });
  }

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
    coreContracts,
    tokenBridgeContracts,
  };
};
