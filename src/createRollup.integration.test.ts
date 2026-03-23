import { describe, it, expect } from 'vitest';
import { type Address, createPublicClient, http, parseGwei, zeroAddress } from 'viem';

import { nitroTestnodeL2 } from './chains';
import {
  createRollupHelper,
  getNitroTestnodePrivateKeyAccounts,
  getInformationFromTestnode,
  type PrivateKeyAccountWithPrivateKey,
} from './testHelpers';
import { createRollupFetchTransactionHash } from './createRollupFetchTransactionHash';
import { getInitializedAnvilTestStackEnv } from './integrationTestHelpers/anvilHarness';
import { isAnvilIntegrationTestMode } from './integrationTestHelpers/injectedMode';

const env = isAnvilIntegrationTestMode() ? getInitializedAnvilTestStackEnv() : undefined;

const parentChainPublicClient = createPublicClient({
  chain: env ? env.l2.chain : nitroTestnodeL2,
  transport: http(),
});

let l3TokenBridgeDeployer: PrivateKeyAccountWithPrivateKey;
let batchPosters: Address[];
let validators: Address[];

if (env) {
  l3TokenBridgeDeployer = env.l3.accounts.tokenBridgeDeployer;
  batchPosters = [env.l2.accounts.deployer.address];
  validators = [env.l2.accounts.deployer.address];
} else {
  const testnodeAccounts = getNitroTestnodePrivateKeyAccounts();
  l3TokenBridgeDeployer = testnodeAccounts.l3TokenBridgeDeployer;
  batchPosters = [testnodeAccounts.deployer.address];
  validators = [testnodeAccounts.deployer.address];
}

describe(`create an AnyTrust chain that uses ETH as gas token`, async () => {
  const { createRollupConfig, createRollupInformation } = await createRollupHelper({
    deployer: l3TokenBridgeDeployer,
    batchPosters,
    validators,
    nativeToken: zeroAddress,
    client: parentChainPublicClient,
    customParentTimingParams: env?.l2.timingParams,
    maxDataSize: env ? 104_857n : undefined,
  });

  it(`successfully deploys core contracts through rollup creator`, async () => {
    // assert all inputs are correct
    const [arg] = createRollupInformation.transaction.getInputs();
    expect(arg.config).toEqual(createRollupConfig);
    expect(arg.batchPosters).toEqual(batchPosters);
    expect(arg.validators).toEqual(validators);
    expect(arg.maxDataSize).toEqual(104_857n);
    expect(arg.nativeToken).toEqual(zeroAddress);
    expect(arg.deployFactoriesToL2).toEqual(true);
    expect(arg.maxFeePerGasForRetryables).toEqual(parseGwei('0.1'));

    // assert the transaction executed successfully
    expect(createRollupInformation.transactionReceipt.status).toEqual('success');

    // assert the core contracts were successfully obtained
    expect(createRollupInformation.coreContracts).toBeDefined();
  });

  it(`finds the transaction hash that created a specified deployed rollup contract`, async () => {
    const transactionHash = await createRollupFetchTransactionHash({
      rollup: createRollupInformation.coreContracts.rollup,
      publicClient: parentChainPublicClient,
    });

    expect(transactionHash).toEqual(createRollupInformation.transactionReceipt.transactionHash);
  });
});

describe(`create an AnyTrust chain that uses a custom gas token`, async () => {
  const nativeToken = env ? env.l3.nativeToken : getInformationFromTestnode().l3NativeToken;

  const { createRollupConfig, createRollupInformation } = await createRollupHelper({
    deployer: l3TokenBridgeDeployer,
    batchPosters,
    validators,
    nativeToken,
    client: parentChainPublicClient,
    customParentTimingParams: env?.l2.timingParams,
    maxDataSize: env ? 104_857n : undefined,
  });

  it(`successfully deploys core contracts through rollup creator`, async () => {
    // assert all inputs are correct
    const [arg] = createRollupInformation.transaction.getInputs();
    expect(arg.config).toEqual(createRollupConfig);
    expect(arg.batchPosters).toEqual(batchPosters);
    expect(arg.validators).toEqual(validators);
    expect(arg.maxDataSize).toEqual(104_857n);
    expect(arg.nativeToken).toEqual(nativeToken);
    expect(arg.deployFactoriesToL2).toEqual(true);
    expect(arg.maxFeePerGasForRetryables).toEqual(parseGwei('0.1'));

    // assert the transaction executed successfully
    expect(createRollupInformation.transactionReceipt.status).toEqual('success');

    // assert the core contracts were successfully obtained
    expect(createRollupInformation.coreContracts).toBeDefined();
  });

  it(`finds the transaction hash that created a specified deployed rollup contract`, async () => {
    const transactionHash = await createRollupFetchTransactionHash({
      rollup: createRollupInformation.coreContracts.rollup,
      publicClient: parentChainPublicClient,
    });

    expect(transactionHash).toEqual(createRollupInformation.transactionReceipt.transactionHash);
  });
});
