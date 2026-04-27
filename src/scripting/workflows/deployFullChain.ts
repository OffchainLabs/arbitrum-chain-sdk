import { z } from 'zod';
import { parseAbi, zeroAddress, isAddressEqual } from 'viem';

import { createRollupDefaultSchema } from '../schemas/createRollup';
import {
  hexSchema,
  bigintSchema,
  addressSchema,
  privateKeySchema,
  prepareChainConfigArbitrumParamsSchema,
} from '../schemas/common';
import {
  paramsV3Dot2Schema,
  refineV3Dot2CustomGenesis,
} from '../schemas/createRollupPrepareDeploymentParamsConfig';
import { toPublicClient, toAccount, toWalletClient, findChain } from '../viemTransforms';
import { createRollupPrepareDeploymentParamsConfig } from '../../createRollupPrepareDeploymentParamsConfig';
import { prepareChainConfig } from '../../prepareChainConfig';
import { prepareNodeConfig } from '../../prepareNodeConfig';
import { getArbOSVersion } from '../../utils/getArbOSVersion';
import { getParentChainLayer } from '../../utils/getParentChainLayer';
import { generateChainId } from '../../utils/generateChainId';
import { ChainConfig } from '../../types/ChainConfig';
import { ParentChainId } from '../../types/ParentChain';
import { execute as deployNewChainExecute } from './deployNewChain';
import {
  inputSchema as initializeTokenBridgeInputSchema,
  execute as initializeTokenBridgeExecute,
} from './initializeTokenBridge';
import {
  inputSchema as transferOwnershipInputSchema,
  execute as transferOwnershipExecute,
} from './transferOwnership';

const { params: createRollupBaseParams, ...baseFields } = createRollupDefaultSchema.shape;

// InitialChainOwner defaults to the deployer address in the workflow transform.
const chainConfigInputSchemaWithOptionalOwner = z.strictObject({
  chainId: z.number(),
  arbitrum: prepareChainConfigArbitrumParamsSchema
    .omit({ InitialChainOwner: true })
    .extend({ InitialChainOwner: addressSchema.optional() })
    .optional(),
});

export const inputSchema = z
  .object({
    ...baseFields,
    chainName: z.string(),
    createRollupParams: createRollupBaseParams
      .extend({
        config: paramsV3Dot2Schema
          .extend({
            owner: addressSchema.optional(),
            chainId: bigintSchema.prefault(() => String(generateChainId())),
            chainConfig: chainConfigInputSchemaWithOptionalOwner.optional(),
          })
          .strict(),
        nativeToken: addressSchema.default(zeroAddress),
        keyset: hexSchema.optional(),
      })
      .strict(),
    tokenBridgeParams: z
      .object({
        gasOverrides: initializeTokenBridgeInputSchema.shape.gasOverrides,
        retryableGasOverrides: initializeTokenBridgeInputSchema.shape.retryableGasOverrides,
        tokenBridgeCreatorAddressOverride:
          initializeTokenBridgeInputSchema.shape.tokenBridgeCreatorAddressOverride,
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
    nodeConfigParams: z
      .object({
        batchPosterPrivateKey: privateKeySchema.optional(),
        validatorPrivateKey: privateKeySchema.optional(),
        parentChainBeaconRpcUrl: z.url().optional(),
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

    refineV3Dot2CustomGenesis(data.createRollupParams.config, ctx, [
      'createRollupParams',
      'config',
    ]);

    if (
      data.nodeConfigParams &&
      getParentChainLayer(data.parentChainId as ParentChainId) === 1 &&
      !data.nodeConfigParams.parentChainBeaconRpcUrl
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['nodeConfigParams', 'parentChainBeaconRpcUrl'],
        message: 'parentChainBeaconRpcUrl is required when parent chain is L1',
      });
    }

    // ownershipTransferParams assumes the deployer holds both the parent-chain EXECUTOR
    // role and the child-chain ArbOwner role. Supplying a non-deployer owner breaks that
    // assumption -- the transfer step would attempt to sign as deployer and revert.
    if (data.ownershipTransferParams) {
      const deployerAddress = toAccount(data.privateKey).address;
      const explicitOwner = data.createRollupParams.config.owner;
      const explicitInitialChainOwner =
        data.createRollupParams.config.chainConfig?.arbitrum?.InitialChainOwner;

      if (explicitOwner && !isAddressEqual(explicitOwner, deployerAddress)) {
        ctx.addIssue({
          code: 'custom',
          path: ['createRollupParams', 'config', 'owner'],
          message:
            'createRollupParams.config.owner is incompatible with ownershipTransferParams: leave it unset (defaults to the deployer) or omit ownershipTransferParams',
        });
      }

      if (
        explicitInitialChainOwner &&
        !isAddressEqual(explicitInitialChainOwner, deployerAddress)
      ) {
        ctx.addIssue({
          code: 'custom',
          path: ['createRollupParams', 'config', 'chainConfig', 'arbitrum', 'InitialChainOwner'],
          message:
            'chainConfig.arbitrum.InitialChainOwner is incompatible with ownershipTransferParams: leave it unset (defaults to the deployer) or omit ownershipTransferParams',
        });
      }
    }
  })
  .transform((input) => {
    const parentChainPublicClient = toPublicClient(
      input.parentChainRpcUrl,
      findChain(input.parentChainId),
    );
    const account = toAccount(input.privateKey);
    const {
      config: { chainConfig: rawChainConfigParams, owner: rawOwner, ...restConfigRest },
      keyset,
      ...restParams
    } = input.createRollupParams;

    const restConfig = { ...restConfigRest, owner: rawOwner ?? account.address };
    const chainConfigParams = rawChainConfigParams
      ? {
          ...rawChainConfigParams,
          arbitrum: {
            ...rawChainConfigParams.arbitrum,
            InitialChainOwner: rawChainConfigParams.arbitrum?.InitialChainOwner ?? account.address,
          },
        }
      : undefined;

    const isAnytrust = chainConfigParams?.arbitrum?.DataAvailabilityCommittee === true;

    const DEFAULT_KEYSET: `0x${string}` =
      '0x00000000000000010000000000000001012160000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';

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
      nodeConfigParams: input.nodeConfigParams,
      parentChainRpcUrl: input.parentChainRpcUrl,
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
    nodeConfigParams,
    parentChainRpcUrl,
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
  const tokenBridgeContracts = await initializeTokenBridgeExecute({
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

  const nodeConfig =
    nodeConfigParams && chainConfig
      ? prepareNodeConfig({
          chainName,
          chainConfig,
          coreContracts: { ...coreContracts, nativeToken: restParams.nativeToken },
          batchPosterPrivateKey: nodeConfigParams.batchPosterPrivateKey,
          validatorPrivateKey: nodeConfigParams.validatorPrivateKey,
          stakeToken,
          parentChainId: parentChainId as ParentChainId,
          parentChainIsArbitrum,
          parentChainRpcUrl,
          parentChainBeaconRpcUrl: nodeConfigParams.parentChainBeaconRpcUrl,
        })
      : undefined;

  return {
    chainName,
    chainId: chainConfig?.chainId ?? 0,
    chainConfig,
    parentChainId,
    parentChainIsArbitrum,
    coreContracts: { ...coreContracts, stakeToken },
    tokenBridgeContracts,
    nodeConfig,
  };
};
