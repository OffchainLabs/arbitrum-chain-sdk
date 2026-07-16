import { describe, it, expect } from 'vitest';
import { ChainContract, createPublicClient, createWalletClient, http } from 'viem';

import { nitroTestnodeL2, registerCustomParentChain } from '../../chains';
import { getNitroTestnodePrivateKeyAccounts } from '../../testHelpers';
import { validateParentChain } from '../../types/ParentChain';
import { generateChainId } from '../../utils';
import { getDefaultConfirmPeriodBlocks } from '../../getDefaultConfirmPeriodBlocks';
import { getDefaultChallengeGracePeriodBlocks } from '../../getDefaultChallengeGracePeriodBlocks';
import { getDefaultMinimumAssertionPeriod } from '../../getDefaultMinimumAssertionPeriod';
import { getDefaultValidatorAfkBlocks } from '../../getDefaultValidatorAfkBlocks';
import { getDefaultSequencerInboxMaxTimeVariation } from '../../getDefaultSequencerInboxMaxTimeVariation';
import { deployWeth } from '../../deployWeth';
import { deployRollupCreator, DEFAULT_MAX_DATA_SIZE } from '../../deployRollupCreator';
import { deployTokenBridgeCreator } from '../../deployTokenBridgeCreator';
import { findChain } from '../viemTransforms';
import { schema, execute } from './deployFullChain';

const deployer = getNitroTestnodePrivateKeyAccounts().deployer;
const rpcUrl = nitroTestnodeL2.rpcUrls.default.http[0];

const parentChainPublicClient = createPublicClient({
  chain: nitroTestnodeL2,
  transport: http(rpcUrl),
});
const walletClient = createWalletClient({
  chain: nitroTestnodeL2,
  transport: http(rpcUrl),
  account: deployer,
});

const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';

describe('deployFullChain on a custom parent chain', () => {
  // Uses the nitro-testnode L2 as an arbitrary parent chain: deploy the factories on it, register it
  // as a custom parent (shadowing the built-in entry), and deploy a full chain through those factories
  // -- proving the custom-parent path, not the baked-in address table.
  it('deploys the factories, registers the parent, then deploys a rollup + token bridge through them', async () => {
    // The getDefault* helpers throw for a custom parent chain, so capture the built-in L2 defaults
    // now, before the registration below turns 412346 custom.
    const confirmPeriodBlocks = getDefaultConfirmPeriodBlocks(parentChainPublicClient);
    const challengeGracePeriodBlocks =
      getDefaultChallengeGracePeriodBlocks(parentChainPublicClient);
    const minimumAssertionPeriod = getDefaultMinimumAssertionPeriod(parentChainPublicClient);
    const validatorAfkBlocks = getDefaultValidatorAfkBlocks(parentChainPublicClient);
    const mtv = getDefaultSequencerInboxMaxTimeVariation(parentChainPublicClient);

    const { weth } = await deployWeth({ walletClient });
    const { rollupCreator } = await deployRollupCreator({ walletClient });
    const { tokenBridgeCreator } = await deployTokenBridgeCreator({ walletClient, l1Weth: weth });

    // Register the L2 as a custom parent chain, deliberately shadowing the built-in entry.
    registerCustomParentChain({
      ...nitroTestnodeL2,
      contracts: {
        rollupCreator: { address: rollupCreator },
        tokenBridgeCreator: { address: tokenBridgeCreator },
        weth: { address: weth },
      },
    });

    expect(validateParentChain(parentChainPublicClient).isCustom).toEqual(true);
    // custom-first resolution returns our freshly deployed creator, not the contract-less built-in
    const resolvedRollupCreator = findChain(nitroTestnodeL2.id).contracts?.rollupCreator as
      | ChainContract
      | undefined;
    expect(resolvedRollupCreator?.address).toEqual(rollupCreator);

    // Deploy a full chain (parent-side only, no child node needed). Custom parents require the five
    // timing params; stakeToken defaults to the registered weth.
    const childChainId = generateChainId();
    const input = {
      parentChainRpcUrl: rpcUrl,
      parentChainId: nitroTestnodeL2.id,
      privateKey: deployer.privateKey,
      chainName: 'custom-parent-e2e',
      createRollupParams: {
        config: {
          chainId: String(childChainId),
          confirmPeriodBlocks: String(confirmPeriodBlocks),
          challengeGracePeriodBlocks: String(challengeGracePeriodBlocks),
          minimumAssertionPeriod: String(minimumAssertionPeriod),
          validatorAfkBlocks: String(validatorAfkBlocks),
          sequencerInboxMaxTimeVariation: {
            delayBlocks: String(mtv.delayBlocks),
            futureBlocks: String(mtv.futureBlocks),
            delaySeconds: String(mtv.delaySeconds),
            futureSeconds: String(mtv.futureSeconds),
          },
        },
        batchPosters: [deployer.address],
        validators: [deployer.address],
        // custom parents also require maxDataSize; it must match the value the SequencerInbox
        // templates were deployed with (deployRollupCreator's default here).
        maxDataSize: String(DEFAULT_MAX_DATA_SIZE),
      },
    };

    const result = await execute(schema.parse(input));

    expect(result.coreContracts.rollup).not.toEqual(ADDRESS_ZERO);
    expect(result.coreContracts.inbox).not.toEqual(ADDRESS_ZERO);
    expect(result.coreContracts.bridge).not.toEqual(ADDRESS_ZERO);
    expect(result.coreContracts.upgradeExecutor).not.toEqual(ADDRESS_ZERO);

    expect(result.tokenBridgeContracts.parentChainContracts.router).not.toEqual(ADDRESS_ZERO);
    expect(result.tokenBridgeContracts.parentChainContracts.standardGateway).not.toEqual(
      ADDRESS_ZERO,
    );
    expect(result.tokenBridgeContracts.parentChainContracts.customGateway).not.toEqual(
      ADDRESS_ZERO,
    );
  });
});
