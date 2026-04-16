import { Cli, z } from 'incur';
import type { PublicClient, Transport, Chain, WalletClient } from 'viem';

import {
  envSchema,
  varsSchema,
  resolveClients,
  requirePublicClient,
  requireAccount,
  requireParentChainClient,
  requireCrossChain,
  requireParentChainWalletClient,
  requireChildChainWalletClient,
} from './middleware';

import {
  addressSchema,
  hexSchema,
  bigintSchema,
  rollupCreatorVersionSchema,
  coreContractsSchema,
  gasLimitSchema,
  tokenBridgeRetryableGasOverridesSchema,
  setWethGatewayGasOverridesSchema,
  prepareChainConfigArbitrumParamsSchema,
  chainConfigSchema,
} from './primitives';

import { findChain } from './connections';

// SDK function imports
import {
  getValidators,
  getBatchPosters,
  getKeysets,
  isAnyTrust,
  createRollupFetchTransactionHash,
  createRollupFetchCoreContracts,
  upgradeExecutorFetchPrivilegedAccounts,
  createRollupGetRetryablesFees,
  upgradeExecutorPrepareAddExecutorTransactionRequest,
  upgradeExecutorPrepareRemoveExecutorTransactionRequest,
  setValidKeysetPrepareTransactionRequest,
  createRollupEnoughCustomFeeTokenAllowance,
  createRollupPrepareCustomFeeTokenApprovalTransactionRequest,
  createTokenBridgeEnoughCustomFeeTokenAllowance,
  createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequest,
  setAnyTrustFastConfirmerPrepareTransactionRequest,
  createSafePrepareTransactionRequest,
  getBridgeUiConfig,
  setValidKeyset,
  isTokenBridgeDeployed,
  createTokenBridgePrepareTransactionRequest,
  createTokenBridgePrepareSetWethGatewayTransactionRequest,
  feeRouterDeployRewardDistributor,
  feeRouterDeployChildToParentRewardRouter,
  prepareChainConfig,
  prepareKeyset,
  prepareKeysetHash,
  prepareNodeConfig,
} from '@arbitrum/chain-sdk';

// Helper casts — the vars schema types PublicClient with Chain | undefined,
// but most SDK functions require Chain. The middleware guarantees a chain
// is present when requirePublicClient / requireParentChainClient passes.
type PC = PublicClient<Transport, Chain>;
type WC = WalletClient<Transport, Chain>;

export const cli = Cli.create('orbit', {
  description: 'Arbitrum Orbit SDK CLI',
  version: '0.26.0',
  env: envSchema,
  vars: varsSchema,
})
  .use(resolveClients)

  // ── chainRead commands — middleware: [requirePublicClient] ──

  .command('get-validators', {
    description: 'Get the list of validators for a rollup',
    args: z.object({ rollup: addressSchema }),
    middleware: [requirePublicClient],
    run: (c) => getValidators(c.var.publicClient! as PC, { rollup: c.args.rollup }),
  })

  .command('get-batch-posters', {
    description: 'Get the list of batch posters for a rollup',
    args: z.object({ rollup: addressSchema, sequencerInbox: addressSchema }),
    middleware: [requirePublicClient],
    run: (c) =>
      getBatchPosters(c.var.publicClient! as PC, {
        rollup: c.args.rollup,
        sequencerInbox: c.args.sequencerInbox,
      }),
  })

  .command('get-keysets', {
    description: 'Get the keysets for a sequencer inbox',
    args: z.object({ sequencerInbox: addressSchema }),
    middleware: [requirePublicClient],
    run: (c) => getKeysets(c.var.publicClient! as PC, { sequencerInbox: c.args.sequencerInbox }),
  })

  .command('is-any-trust', {
    description: 'Check whether a rollup is configured as AnyTrust',
    args: z.object({ rollup: addressSchema }),
    middleware: [requirePublicClient],
    run: (c) => isAnyTrust({ rollup: c.args.rollup, publicClient: c.var.publicClient! as PC }),
  })

  .command('fetch-transaction-hash', {
    description: 'Fetch the create-rollup transaction hash for a rollup',
    args: z.object({ rollup: addressSchema, fromBlock: bigintSchema.optional() }),
    middleware: [requirePublicClient],
    run: (c) =>
      createRollupFetchTransactionHash({
        rollup: c.args.rollup,
        publicClient: c.var.publicClient! as PC,
        fromBlock: c.args.fromBlock,
      }),
  })

  .command('fetch-core-contracts', {
    description: 'Fetch the core contracts deployed alongside a rollup',
    args: z.object({
      rollup: addressSchema,
      rollupDeploymentBlockNumber: bigintSchema.optional(),
    }),
    middleware: [requirePublicClient],
    run: (c) =>
      createRollupFetchCoreContracts({
        rollup: c.args.rollup,
        publicClient: c.var.publicClient! as PC,
        rollupDeploymentBlockNumber: c.args.rollupDeploymentBlockNumber,
      }),
  })

  .command('fetch-privileged-accounts', {
    description: 'Fetch the privileged accounts from an UpgradeExecutor',
    args: z.object({ upgradeExecutorAddress: addressSchema }),
    middleware: [requirePublicClient],
    run: (c) =>
      upgradeExecutorFetchPrivilegedAccounts({
        upgradeExecutorAddress: c.args.upgradeExecutorAddress,
        publicClient: c.var.publicClient! as PC,
      }),
  })

  .command('get-retryables-fees', {
    description: 'Get the retryable fees required to create a rollup',
    args: z.object({
      account: addressSchema,
      nativeToken: addressSchema.optional(),
      maxFeePerGasForRetryables: bigintSchema.optional(),
      rollupCreatorVersion: rollupCreatorVersionSchema.optional(),
    }),
    middleware: [requirePublicClient],
    run: (c) =>
      createRollupGetRetryablesFees(
        c.var.publicClient! as PC,
        {
          account: c.args.account,
          nativeToken: c.args.nativeToken,
          maxFeePerGasForRetryables: c.args.maxFeePerGasForRetryables,
        },
        c.args.rollupCreatorVersion,
      ),
  })

  .command('add-executor', {
    description: 'Prepare a transaction to add an executor to an UpgradeExecutor',
    args: z.object({
      account: addressSchema,
      upgradeExecutorAddress: addressSchema,
      executorAccountAddress: addressSchema,
    }),
    middleware: [requirePublicClient],
    run: (c) =>
      upgradeExecutorPrepareAddExecutorTransactionRequest({
        ...c.args,
        publicClient: c.var.publicClient! as PC,
      }),
  })

  .command('remove-executor', {
    description: 'Prepare a transaction to remove an executor from an UpgradeExecutor',
    args: z.object({
      account: addressSchema,
      upgradeExecutorAddress: addressSchema,
      executorAccountAddress: addressSchema,
    }),
    middleware: [requirePublicClient],
    run: (c) =>
      upgradeExecutorPrepareRemoveExecutorTransactionRequest({
        ...c.args,
        publicClient: c.var.publicClient! as PC,
      }),
  })

  .command('set-valid-keyset-prepare-tx', {
    description: 'Prepare a transaction to set a valid keyset on a SequencerInbox',
    args: z.object({
      coreContracts: coreContractsSchema.pick({ upgradeExecutor: true, sequencerInbox: true }),
      keyset: hexSchema,
      account: addressSchema,
    }),
    middleware: [requirePublicClient],
    run: (c) =>
      setValidKeysetPrepareTransactionRequest({
        ...c.args,
        publicClient: c.var.publicClient! as PC,
      }),
  })

  .command('rollup-enough-allowance', {
    description: 'Check if there is enough custom fee token allowance for rollup creation',
    args: z.object({
      account: addressSchema,
      nativeToken: addressSchema,
      maxFeePerGasForRetryables: bigintSchema.optional(),
      rollupCreatorAddressOverride: addressSchema.optional(),
      rollupCreatorVersion: rollupCreatorVersionSchema.optional(),
    }),
    middleware: [requirePublicClient],
    run: (c) =>
      createRollupEnoughCustomFeeTokenAllowance({
        ...c.args,
        publicClient: c.var.publicClient! as PC,
      }),
  })

  .command('rollup-approve-fee-token', {
    description: 'Prepare a transaction to approve the custom fee token for rollup creation',
    args: z.object({
      account: addressSchema,
      nativeToken: addressSchema,
      maxFeePerGasForRetryables: bigintSchema.optional(),
      rollupCreatorAddressOverride: addressSchema.optional(),
      rollupCreatorVersion: rollupCreatorVersionSchema.optional(),
      amount: bigintSchema.optional(),
    }),
    middleware: [requirePublicClient],
    run: (c) =>
      createRollupPrepareCustomFeeTokenApprovalTransactionRequest({
        ...c.args,
        publicClient: c.var.publicClient! as PC,
      }),
  })

  .command('bridge-enough-allowance', {
    description: 'Check if there is enough custom fee token allowance for token bridge creation',
    args: z.object({
      nativeToken: addressSchema,
      owner: addressSchema,
      tokenBridgeCreatorAddressOverride: addressSchema.optional(),
    }),
    middleware: [requirePublicClient],
    run: (c) =>
      createTokenBridgeEnoughCustomFeeTokenAllowance({
        ...c.args,
        publicClient: c.var.publicClient! as PC,
      }),
  })

  .command('bridge-approve-fee-token', {
    description: 'Prepare a transaction to approve the custom fee token for token bridge creation',
    args: z.object({
      nativeToken: addressSchema,
      owner: addressSchema,
      tokenBridgeCreatorAddressOverride: addressSchema.optional(),
      amount: bigintSchema.optional(),
    }),
    middleware: [requirePublicClient],
    run: (c) =>
      createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequest({
        ...c.args,
        publicClient: c.var.publicClient! as PC,
      }),
  })

  // ── chainSign commands — middleware: [requirePublicClient, requireAccount] ──

  .command('set-fast-confirmer', {
    description: 'Prepare a transaction to set the fast confirmer on an AnyTrust rollup',
    args: z.object({
      rollup: addressSchema,
      upgradeExecutor: addressSchema,
      fastConfirmer: addressSchema,
    }),
    middleware: [requirePublicClient, requireAccount],
    run: (c) =>
      setAnyTrustFastConfirmerPrepareTransactionRequest({
        publicClient: c.var.publicClient! as PC,
        account: c.var.account!,
        ...c.args,
      }),
  })

  .command('create-safe', {
    description: 'Prepare a transaction to deploy a new Gnosis Safe',
    args: z.object({
      owners: z.array(addressSchema),
      threshold: z.number(),
      saltNonce: bigintSchema.optional(),
    }),
    middleware: [requirePublicClient, requireAccount],
    run: (c) =>
      createSafePrepareTransactionRequest({
        publicClient: c.var.publicClient! as PC,
        account: c.var.account!,
        ...c.args,
      }),
  })

  // ── parentChainRead commands — middleware: [requireParentChainClient] ──

  .command('get-bridge-ui-config', {
    description: 'Generate a bridge UI configuration from a deployment transaction',
    args: z.object({
      deploymentTxHash: hexSchema,
      parentChainId: z.number(),
      chainName: z.string().optional(),
      rpcUrl: z.url().optional(),
      explorerUrl: z.url().optional(),
    }),
    middleware: [requireParentChainClient],
    run: (c) => {
      const parentChain = findChain(c.args.parentChainId);
      return getBridgeUiConfig({
        params: { parentChain, ...c.args },
        parentChainPublicClient: c.var.parentChainPublicClient! as PC,
      });
    },
  })

  // ── parentChainSign commands — middleware: [requireParentChainWalletClient, requireParentChainClient] ──

  .command('set-valid-keyset', {
    description: 'Set a valid keyset on the SequencerInbox via the parent chain',
    args: z.object({
      coreContracts: coreContractsSchema.pick({ upgradeExecutor: true, sequencerInbox: true }),
      keyset: hexSchema,
    }),
    middleware: [requireParentChainWalletClient, requireParentChainClient],
    run: (c) =>
      setValidKeyset({
        ...c.args,
        publicClient: c.var.parentChainPublicClient! as PC,
        walletClient: c.var.parentChainWalletClient! as WC,
      }),
  })

  // ── crossChainRead commands — middleware: [requireCrossChain] ──

  .command('is-token-bridge-deployed', {
    description: 'Check whether a token bridge has been deployed for a rollup',
    args: z.object({
      rollup: addressSchema,
      tokenBridgeCreatorAddressOverride: addressSchema.optional(),
    }),
    middleware: [requireCrossChain],
    run: (c) =>
      isTokenBridgeDeployed({
        ...c.args,
        parentChainPublicClient: c.var.parentChainPublicClient! as PC,
        orbitChainPublicClient: c.var.orbitChainPublicClient! as PC,
      }),
  })

  // ── crossChain + account commands — middleware: [requireCrossChain, requireAccount] ──

  .command('create-token-bridge-prepare-tx', {
    description: 'Prepare a transaction to create a token bridge for a rollup',
    args: z.object({
      params: z.object({ rollup: addressSchema, rollupOwner: addressSchema }),
      account: addressSchema,
      gasOverrides: gasLimitSchema.optional(),
      retryableGasOverrides: tokenBridgeRetryableGasOverridesSchema.optional(),
      tokenBridgeCreatorAddressOverride: addressSchema.optional(),
    }),
    middleware: [requireCrossChain, requireAccount],
    run: (c) =>
      createTokenBridgePrepareTransactionRequest({
        ...c.args,
        parentChainPublicClient: c.var.parentChainPublicClient! as PC,
        orbitChainPublicClient: c.var.orbitChainPublicClient! as PC,
      }),
  })

  .command('create-token-bridge-prepare-weth-gateway-tx', {
    description: 'Prepare a transaction to set the WETH gateway on a token bridge',
    args: z.object({
      rollup: addressSchema,
      rollupDeploymentBlockNumber: bigintSchema.optional(),
      account: addressSchema,
      retryableGasOverrides: setWethGatewayGasOverridesSchema.optional(),
      tokenBridgeCreatorAddressOverride: addressSchema.optional(),
    }),
    middleware: [requireCrossChain, requireAccount],
    run: (c) =>
      createTokenBridgePrepareSetWethGatewayTransactionRequest({
        ...c.args,
        parentChainPublicClient: c.var.parentChainPublicClient! as PC,
        orbitChainPublicClient: c.var.orbitChainPublicClient! as PC,
      }),
  })

  // ── childChainWallet commands — middleware: [requireChildChainWalletClient] ──

  .command('deploy-reward-distributor', {
    description: 'Deploy a reward distributor contract on the orbit chain',
    args: z.object({
      recipients: z.array(z.object({ account: addressSchema, weight: bigintSchema })),
    }),
    middleware: [requireChildChainWalletClient],
    run: (c) =>
      feeRouterDeployRewardDistributor({
        orbitChainWalletClient: c.var.orbitChainWalletClient! as WC,
        recipients: c.args.recipients,
      }),
  })

  // ── parentChainRead + childChainWallet — middleware: [requireParentChainClient, requireChildChainWalletClient] ──

  .command('deploy-child-to-parent-reward-router', {
    description: 'Deploy a child-to-parent reward router on the orbit chain',
    args: z.object({
      parentChainTargetAddress: addressSchema,
      minDistributionInvervalSeconds: bigintSchema.optional(),
      rollup: addressSchema.optional(),
      parentChainTokenAddress: addressSchema.optional(),
      tokenBridgeCreatorAddressOverride: addressSchema.optional(),
    }),
    middleware: [requireParentChainClient, requireChildChainWalletClient],
    run: (c) =>
      feeRouterDeployChildToParentRewardRouter({
        parentChainPublicClient: c.var.parentChainPublicClient! as PC,
        orbitChainWalletClient: c.var.orbitChainWalletClient! as WC,
        ...c.args,
      }),
  })

  // ── Pure commands — no middleware ──

  .command('prepare-chain-config', {
    description: 'Prepare a chain configuration object for a new Orbit chain',
    args: z.object({
      chainId: z.number(),
      arbitrum: prepareChainConfigArbitrumParamsSchema,
    }),
    run: (c) => prepareChainConfig(c.args),
  })

  .command('prepare-keyset', {
    description: 'Prepare a keyset from public keys and an assumed honest count',
    args: z.object({
      publicKeys: z.array(z.string()),
      assumedHonest: z.number(),
    }),
    run: (c) => prepareKeyset(c.args.publicKeys, c.args.assumedHonest),
  })

  .command('prepare-keyset-hash', {
    description: 'Compute the hash of a keyset',
    args: z.object({ keysetBytes: z.string() }),
    run: (c) => prepareKeysetHash(c.args.keysetBytes),
  })

  .command('prepare-node-config', {
    description: 'Generate a node configuration for an Orbit chain',
    args: z.object({
      chainName: z.string(),
      chainConfig: chainConfigSchema,
      coreContracts: coreContractsSchema,
      batchPosterPrivateKey: z.string(),
      validatorPrivateKey: z.string(),
      stakeToken: z.string(),
      parentChainId: z.number(),
      parentChainIsArbitrum: z.boolean().optional(),
      parentChainRpcUrl: z.url(),
      parentChainBeaconRpcUrl: z.url().optional(),
      dasServerUrl: z.url().optional(),
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- parentChainId needs ParentChainId cast
    run: (c) => prepareNodeConfig(c.args as any),
  });
