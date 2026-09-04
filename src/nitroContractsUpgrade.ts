import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';

import {
  Address,
  Chain,
  Hex,
  PrepareTransactionRequestReturnType,
  PrivateKeyAccount,
  PublicClient,
  TransactionReceipt,
  Transport,
  encodeFunctionData,
  getAddress,
  isAddress,
  isHex,
  maxUint256,
  parseAbi,
} from 'viem';
import { z } from 'zod';

import { upgradeExecutorEncodeFunctionData } from './upgradeExecutorEncodeFunctionData';
import { runForgeScript } from './utils/runForgeScript';

const upgradeConfigurations = {
  '3.2.0': {
    deployScript: require.resolve(
      '@arbitrum/chain-actions/scripts/foundry/contract-upgrades/3.2.0/DeployNitroContracts3Point2Point0UpgradeAction.s.sol',
    ),
    upgradeActionAbi: parseAbi(['function perform(address rollup)']),
    verificationAbi: parseAbi([
      'function owner() view returns (address)',
      'function increaseBaseStake(uint256 newBaseStake)',
    ]),
  },
} as const;

export type NitroContractsUpgradeVersion = keyof typeof upgradeConfigurations;

type NitroContractsUpgradeParameters<TChain extends Chain | undefined> = {
  version: NitroContractsUpgradeVersion;
  parentChainPublicClient: PublicClient<Transport, TChain>;
};

export type NitroContractsUpgradeTransactionRequest = PrepareTransactionRequestReturnType & {
  chainId: number;
};

// Deploy
export type DeployNitroContractsUpgradeActionPrepareTransactionRequestParameters<
  TChain extends Chain | undefined,
> = NitroContractsUpgradeParameters<TChain> & {
  account: Address;
};

export type DeployNitroContractsUpgradeActionParameters<TChain extends Chain | undefined> = Omit<
  DeployNitroContractsUpgradeActionPrepareTransactionRequestParameters<TChain>,
  'account'
> & {
  account: PrivateKeyAccount;
};

export type DeployNitroContractsUpgradeActionPrepareTransactionRequestResult = {
  transactionRequest: NitroContractsUpgradeTransactionRequest;
  upgradeActionAddress: Address;
};

export type DeployNitroContractsUpgradeActionResult = {
  transactionHash: Hex;
  transactionReceipt: TransactionReceipt;
  upgradeActionAddress: Address;
};

// Execute
export type ExecuteNitroContractsUpgradePrepareTransactionRequestParameters<
  TChain extends Chain | undefined,
> = NitroContractsUpgradeParameters<TChain> & {
  account: Address;
  rollupAddress: Address;
  parentUpgradeExecutorAddress: Address;
  upgradeActionAddress: Address;
};

export type ExecuteNitroContractsUpgradeParameters<TChain extends Chain | undefined> = Omit<
  ExecuteNitroContractsUpgradePrepareTransactionRequestParameters<TChain>,
  'account'
> & {
  account: PrivateKeyAccount;
};

export type ExecuteNitroContractsUpgradeResult = {
  transactionHash: Hex;
  transactionReceipt: TransactionReceipt;
};

// Verify
export type VerifyNitroContractsUpgradeParameters<TChain extends Chain | undefined> =
  NitroContractsUpgradeParameters<TChain> & {
    rollupAddress: Address;
  };

const addressSchema = z
  .string()
  .refine(isAddress)
  .transform((value) => value as Address);
  
const hexSchema = z
  .string()
  .refine(isHex)
  .transform((value) => value as Hex);

const forgeDeploymentSchema = z.object({
  transactions: z.tuple([
    z.object({
      transactionType: z.literal('CREATE2'),
      contractAddress: addressSchema,
      transaction: z.object({
        from: addressSchema,
        to: addressSchema,
        value: hexSchema,
        input: hexSchema,
      }),
    }),
  ]),
});

async function sendPreparedTransaction<TChain extends Chain | undefined>(
  account: PrivateKeyAccount,
  publicClient: PublicClient<Transport, TChain>,
  transactionRequest: NitroContractsUpgradeTransactionRequest,
): Promise<ExecuteNitroContractsUpgradeResult> {
  const serializedTransaction = await account.signTransaction(transactionRequest);

  const transactionHash = await publicClient.sendRawTransaction({ serializedTransaction });

  const transactionReceipt = await publicClient.waitForTransactionReceipt({
    hash: transactionHash,
  });

  if (transactionReceipt.status === 'reverted') {
    throw new Error(`Nitro contracts upgrade transaction ${transactionHash} reverted`);
  }

  return { transactionHash, transactionReceipt };
}

/** Prepares the CREATE2 transaction that deploys the upgrade action without broadcasting it. */
export async function deployNitroContractsUpgradeActionPrepareTransactionRequest<
  TChain extends Chain | undefined,
>({
  account,
  parentChainPublicClient,
  version,
}: DeployNitroContractsUpgradeActionPrepareTransactionRequestParameters<TChain>): Promise<DeployNitroContractsUpgradeActionPrepareTransactionRequestResult> {
  const outputRoot = await mkdtemp(join(tmpdir(), 'arbitrum-chain-sdk-forge-'));

  try {
    const chainActionsRoot = resolve(
      dirname(require.resolve('@arbitrum/chain-actions')),
      '../../..',
    );
    const upgradeExecutorRoot = resolve(
      dirname(
        require.resolve('@offchainlabs/upgrade-executor/src/IUpgradeExecutor.sol', {
          paths: [chainActionsRoot],
        }),
      ),
      '..',
    );
    const { deployScript } = upgradeConfigurations[version];
    const chainId = await parentChainPublicClient.getChainId();
    const { url: rpcUrl } = parentChainPublicClient.transport as { url?: unknown };

    if (typeof rpcUrl !== 'string') {
      throw new Error(
        'An HTTP parent chain public client is required to prepare the Forge deployment',
      );
    }

    await runForgeScript({
      script: deployScript,
      rpcUrl,
      forgeArgs: [
        '--root',
        chainActionsRoot,
        '--out',
        join(outputRoot, 'out'),
        '--cache-path',
        join(outputRoot, 'cache'),
        '--remappings',
        `@offchainlabs/upgrade-executor/=${upgradeExecutorRoot}/`,
        '--sender',
        account,
      ],
      env: { FOUNDRY_BROADCAST: join(outputRoot, 'broadcast') },
    });

    const broadcastPath = join(
      outputRoot,
      'broadcast',
      basename(deployScript),
      String(chainId),
      'dry-run',
      'run-latest.json',
    );

    const { transactions } = forgeDeploymentSchema.parse(
      JSON.parse(await readFile(broadcastPath, 'utf8')),
    );

    const [{ contractAddress, transaction }] = transactions;

    if (getAddress(transaction.from) !== getAddress(account)) {
      throw new Error('Forge prepared the deployment for an unexpected sender');
    }

    // @ts-expect-error -- viem cannot resolve formatter types for generic chains
    const transactionRequest = await parentChainPublicClient.prepareTransactionRequest({
      account,
      chain: parentChainPublicClient.chain,
      data: transaction.input,
      to: transaction.to,
      value: BigInt(transaction.value),
    });

    return {
      transactionRequest: { ...transactionRequest, chainId },
      upgradeActionAddress: getAddress(contractAddress),
    };
  } finally {
    await rm(outputRoot, { recursive: true, force: true });
  }
}

/** Deploys the upgrade action using a viem private-key account. */
export async function deployNitroContractsUpgradeAction<TChain extends Chain | undefined>({
  account,
  ...prepareParams
}: DeployNitroContractsUpgradeActionParameters<TChain>): Promise<DeployNitroContractsUpgradeActionResult> {
  const { parentChainPublicClient } = prepareParams;

  const { transactionRequest, upgradeActionAddress } =
    await deployNitroContractsUpgradeActionPrepareTransactionRequest({
      ...prepareParams,
      account: account.address,
    });

  const result = await sendPreparedTransaction(
    account,
    parentChainPublicClient,
    transactionRequest,
  );

  const deployedBytecode = await parentChainPublicClient.getBytecode({
    address: upgradeActionAddress,
  });

  if (!deployedBytecode || deployedBytecode === '0x') {
    throw new Error(`Upgrade action was not deployed at ${upgradeActionAddress}`);
  }

  return { ...result, upgradeActionAddress };
}

/** Prepares the UpgradeExecutor transaction without broadcasting it. */
export async function executeNitroContractsUpgradePrepareTransactionRequest<
  TChain extends Chain | undefined,
>({
  account,
  parentChainPublicClient,
  parentUpgradeExecutorAddress,
  rollupAddress,
  upgradeActionAddress,
  version,
}: ExecuteNitroContractsUpgradePrepareTransactionRequestParameters<TChain>): Promise<NitroContractsUpgradeTransactionRequest> {
  const { upgradeActionAbi } = upgradeConfigurations[version];

  const upgradeActionBytecode = await parentChainPublicClient.getBytecode({
    address: upgradeActionAddress,
  });

  if (!upgradeActionBytecode || upgradeActionBytecode === '0x') {
    throw new Error(`Upgrade action contract not found at ${upgradeActionAddress}`);
  }

  const upgradeCalldata = encodeFunctionData({
    abi: upgradeActionAbi,
    functionName: 'perform',
    args: [rollupAddress],
  });

  // @ts-expect-error -- viem cannot resolve formatter types for generic chains
  const transactionRequest = await parentChainPublicClient.prepareTransactionRequest({
    account,
    chain: parentChainPublicClient.chain,
    to: parentUpgradeExecutorAddress,
    data: upgradeExecutorEncodeFunctionData({
      functionName: 'execute',
      args: [upgradeActionAddress, upgradeCalldata],
    }),
  });

  return { ...transactionRequest, chainId: await parentChainPublicClient.getChainId() };
}

/** Executes a Nitro contracts upgrade using a viem private-key account. */
export async function executeNitroContractsUpgrade<TChain extends Chain | undefined>({
  account,
  ...prepareParams
}: ExecuteNitroContractsUpgradeParameters<TChain>): Promise<ExecuteNitroContractsUpgradeResult> {
  const transactionRequest = await executeNitroContractsUpgradePrepareTransactionRequest({
    ...prepareParams,
    account: account.address,
  });

  return sendPreparedTransaction(
    account,
    prepareParams.parentChainPublicClient,
    transactionRequest,
  );
}

/** Verifies the upgrade by simulating a function introduced in Nitro contracts 3.2.0. */
export async function verifyNitroContractsUpgrade<TChain extends Chain | undefined>({
  parentChainPublicClient,
  rollupAddress,
  version,
}: VerifyNitroContractsUpgradeParameters<TChain>): Promise<void> {
  const { verificationAbi } = upgradeConfigurations[version];

  const owner = await parentChainPublicClient.readContract({
    abi: verificationAbi,
    address: rollupAddress,
    functionName: 'owner',
  });

  // @ts-expect-error -- viem cannot resolve formatter types for generic chains
  await parentChainPublicClient.simulateContract({
    abi: verificationAbi,
    account: owner,
    address: rollupAddress,
    functionName: 'increaseBaseStake',
    args: [maxUint256],
  });
}
