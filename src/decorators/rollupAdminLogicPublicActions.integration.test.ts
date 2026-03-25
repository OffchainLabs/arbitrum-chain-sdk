import { it, expect } from 'vitest';
import { Address, createPublicClient, http } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

import { nitroTestnodeL2 } from '../chains';
import { rollupAdminLogicPublicActions } from './rollupAdminLogicPublicActions';
import {
  getInformationFromTestnode,
  getNitroTestnodePrivateKeyAccounts,
  PrivateKeyAccountWithPrivateKey,
  testHelper_getRollupCreatorVersionFromEnv,
} from '../testHelpers';
import { getValidators } from '../getValidators';
import { getAnvilTestStack, isAnvilTestMode } from '../integrationTestHelpers/injectedMode';

// const { l3RollupOwner } = getNitroTestnodePrivateKeyAccounts();
// const { l3Rollup, l3UpgradeExecutor } = getInformationFromTestnode();

const env = isAnvilTestMode() ? getAnvilTestStack() : undefined;

const rollupCreatorVersion = testHelper_getRollupCreatorVersionFromEnv();
// https://github.com/OffchainLabs/nitro-testnode/blob/release/test-node.bash#L634
// https://github.com/OffchainLabs/nitro-contracts/blob/v3.2.0/scripts/rollupCreation.ts#L254-L261
// https://github.com/OffchainLabs/nitro-contracts/blob/v2.1.3/scripts/rollupCreation.ts#L237-L243
const expectedInitialValidators = rollupCreatorVersion === 'v3.2' ? 11 : 10;

let l3RollupOwner: PrivateKeyAccountWithPrivateKey;
let l3Rollup: Address;
let l3UpgradeExecutor: Address;

if (env) {
  l3RollupOwner = env.l3.accounts.rollupOwner;
  l3Rollup = env.l3.rollup;
  l3UpgradeExecutor = env.l3.parentChainUpgradeExecutor;
} else {
  l3RollupOwner = getNitroTestnodePrivateKeyAccounts().l3RollupOwner;

  const testNodeInformation = getInformationFromTestnode();
  l3Rollup = testNodeInformation.l3Rollup;
  l3UpgradeExecutor = testNodeInformation.l3UpgradeExecutor;
}

const l2Client = createPublicClient({
  chain: env ? env.l2.chain : nitroTestnodeL2,
  transport: http(),
}).extend(
  rollupAdminLogicPublicActions({
    rollup: l3Rollup,
  }),
);

// const client = createPublicClient({
//   chain: nitroTestnodeL2,
//   transport: http(),
// }).extend(
//   rollupAdminLogicPublicActions({
//     rollup: l3Rollup,
//   }),
// );

it('successfully set validators', async () => {
  const randomAccounts = [
    privateKeyToAccount(generatePrivateKey()).address,
    privateKeyToAccount(generatePrivateKey()).address,
  ];

  const { validators: initialValidators, isAccurate: isAccurateInitially } = await getValidators(
    l2Client,
    {
      rollup: l3Rollup,
    },
  );

  expect(initialValidators).toHaveLength(expectedInitialValidators);
  expect(isAccurateInitially).toBeTruthy();

  const tx = await l2Client.rollupAdminLogicPrepareTransactionRequest({
    functionName: 'setValidator',
    args: [randomAccounts, [true, false]],
    account: l3RollupOwner.address,
    upgradeExecutor: l3UpgradeExecutor,
    rollup: l3Rollup,
  });

  const txHash = await l2Client.sendRawTransaction({
    serializedTransaction: await l3RollupOwner.signTransaction(tx),
  });

  await l2Client.waitForTransactionReceipt({
    hash: txHash,
  });

  const validators = await Promise.all([
    l2Client.rollupAdminLogicReadContract({
      functionName: 'isValidator',
      args: [randomAccounts[0]],
      rollup: l3Rollup,
    }),
    l2Client.rollupAdminLogicReadContract({
      functionName: 'isValidator',
      args: [randomAccounts[1]],
      rollup: l3Rollup,
    }),
  ]);

  const { validators: currentValidators, isAccurate: currentIsAccurate } = await getValidators(
    l2Client,
    { rollup: l3Rollup },
  );
  expect(validators).toEqual([true, false]);
  expect(currentValidators).toEqual(initialValidators.concat(randomAccounts[0]));
  expect(currentIsAccurate).toBeTruthy();

  const revertTx = await l2Client.rollupAdminLogicPrepareTransactionRequest({
    functionName: 'setValidator',
    args: [randomAccounts, [false, false]],
    account: l3RollupOwner.address,
    upgradeExecutor: l3UpgradeExecutor,
    rollup: l3Rollup,
  });

  const revertTxHash = await l2Client.sendRawTransaction({
    serializedTransaction: await l3RollupOwner.signTransaction(revertTx),
  });
  await l2Client.waitForTransactionReceipt({
    hash: revertTxHash,
  });

  const { validators: revertedValidators, isAccurate: revertedIsAccurate } = await getValidators(
    l2Client,
    {
      rollup: l3Rollup,
    },
  );
  expect(revertedValidators).toEqual(initialValidators);
  expect(revertedIsAccurate).toBeTruthy();
});

it('successfully enable/disable whitelist', async () => {
  const whitelistDisabledBefore = await l2Client.rollupAdminLogicReadContract({
    functionName: 'validatorWhitelistDisabled',
  });

  // By default whitelist is not disabled
  expect(whitelistDisabledBefore).toEqual(false);

  const tx = await l2Client.rollupAdminLogicPrepareTransactionRequest({
    functionName: 'setValidatorWhitelistDisabled',
    args: [true],
    account: l3RollupOwner.address,
    rollup: l3Rollup,
    upgradeExecutor: l3UpgradeExecutor,
  });

  const txHash = await l2Client.sendRawTransaction({
    serializedTransaction: await l3RollupOwner.signTransaction(tx),
  });
  await l2Client.waitForTransactionReceipt({
    hash: txHash,
  });

  const whitelistDisabled = await l2Client.rollupAdminLogicReadContract({
    functionName: 'validatorWhitelistDisabled',
    rollup: l3Rollup,
  });

  expect(whitelistDisabled).toEqual(true);

  // Revert changes, so test can be run multiple time without issues
  const revertTx = await l2Client.rollupAdminLogicPrepareTransactionRequest({
    functionName: 'setValidatorWhitelistDisabled',
    args: [false],
    account: l3RollupOwner.address,
    rollup: l3Rollup,
    upgradeExecutor: l3UpgradeExecutor,
  });

  const revertTxHash = await l2Client.sendRawTransaction({
    serializedTransaction: await l3RollupOwner.signTransaction(revertTx),
  });
  await l2Client.waitForTransactionReceipt({
    hash: revertTxHash,
  });
});
