import { it, expect } from 'vitest';
import { createPublicClient, http } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

import { nitroTestnodeL2 } from '../chains';
import { rollupAdminLogicPublicActions } from './rollupAdminLogicPublicActions';
import {
  getInformationFromTestnode,
  getNitroTestnodePrivateKeyAccounts,
  testHelper_getRollupCreatorVersionFromEnv,
} from '../testHelpers';
import { getValidators } from '../getValidators';

const { l3RollupOwner } = getNitroTestnodePrivateKeyAccounts();
const { l3Rollup, l3UpgradeExecutor } = getInformationFromTestnode();

const rollupCreatorVersion = testHelper_getRollupCreatorVersionFromEnv();
// https://github.com/OffchainLabs/nitro-testnode/blob/release/test-node.bash#L634
// https://github.com/OffchainLabs/nitro-contracts/blob/v3.1.1/scripts/rollupCreation.ts#L250-L257
// https://github.com/OffchainLabs/nitro-contracts/blob/v2.1.3/scripts/rollupCreation.ts#L237-L243
const expectedInitialValidators = rollupCreatorVersion === 'v3.2' ? 11 : 10;

const client = createPublicClient({
  chain: nitroTestnodeL2,
  transport: http(),
}).extend(
  rollupAdminLogicPublicActions({
    rollup: l3Rollup,
  }),
);

it('successfully set validators', async () => {
  const randomAccounts = [
    privateKeyToAccount(generatePrivateKey()).address,
    privateKeyToAccount(generatePrivateKey()).address,
  ];

  const { validators: initialValidators, isAccurate: isAccurateInitially } = await getValidators(
    client,
    {
      rollup: l3Rollup,
    },
  );

  expect(initialValidators).toHaveLength(expectedInitialValidators);
  expect(isAccurateInitially).toBeTruthy();

  const tx = await client.rollupAdminLogicPrepareTransactionRequest({
    functionName: 'setValidator',
    args: [randomAccounts, [true, false]],
    account: l3RollupOwner.address,
    upgradeExecutor: l3UpgradeExecutor,
    rollup: l3Rollup,
  });

  const txHash = await client.sendRawTransaction({
    serializedTransaction: await l3RollupOwner.signTransaction(tx),
  });

  await client.waitForTransactionReceipt({
    hash: txHash,
  });

  const validators = await Promise.all([
    client.rollupAdminLogicReadContract({
      functionName: 'isValidator',
      args: [randomAccounts[0]],
      rollup: l3Rollup,
    }),
    client.rollupAdminLogicReadContract({
      functionName: 'isValidator',
      args: [randomAccounts[1]],
      rollup: l3Rollup,
    }),
  ]);

  const { validators: currentValidators, isAccurate: currentIsAccurate } = await getValidators(
    client,
    { rollup: l3Rollup },
  );
  expect(validators).toEqual([true, false]);
  expect(currentValidators).toEqual(initialValidators.concat(randomAccounts[0]));
  expect(currentIsAccurate).toBeTruthy();

  const revertTx = await client.rollupAdminLogicPrepareTransactionRequest({
    functionName: 'setValidator',
    args: [randomAccounts, [false, false]],
    account: l3RollupOwner.address,
    upgradeExecutor: l3UpgradeExecutor,
    rollup: l3Rollup,
  });

  const revertTxHash = await client.sendRawTransaction({
    serializedTransaction: await l3RollupOwner.signTransaction(revertTx),
  });
  await client.waitForTransactionReceipt({
    hash: revertTxHash,
  });

  const { validators: revertedValidators, isAccurate: revertedIsAccurate } = await getValidators(
    client,
    {
      rollup: l3Rollup,
    },
  );
  expect(revertedValidators).toEqual(initialValidators);
  expect(revertedIsAccurate).toBeTruthy();
});

it('successfully enable/disable whitelist', async () => {
  const whitelistDisabledBefore = await client.rollupAdminLogicReadContract({
    functionName: 'validatorWhitelistDisabled',
  });

  // By default whitelist is not disabled
  expect(whitelistDisabledBefore).toEqual(false);

  const tx = await client.rollupAdminLogicPrepareTransactionRequest({
    functionName: 'setValidatorWhitelistDisabled',
    args: [true],
    account: l3RollupOwner.address,
    rollup: l3Rollup,
    upgradeExecutor: l3UpgradeExecutor,
  });

  const txHash = await client.sendRawTransaction({
    serializedTransaction: await l3RollupOwner.signTransaction(tx),
  });
  await client.waitForTransactionReceipt({
    hash: txHash,
  });

  const whitelistDisabled = await client.rollupAdminLogicReadContract({
    functionName: 'validatorWhitelistDisabled',
    rollup: l3Rollup,
  });

  expect(whitelistDisabled).toEqual(true);

  // Revert changes, so test can be run multiple time without issues
  const revertTx = await client.rollupAdminLogicPrepareTransactionRequest({
    functionName: 'setValidatorWhitelistDisabled',
    args: [false],
    account: l3RollupOwner.address,
    rollup: l3Rollup,
    upgradeExecutor: l3UpgradeExecutor,
  });

  const revertTxHash = await client.sendRawTransaction({
    serializedTransaction: await l3RollupOwner.signTransaction(revertTx),
  });
  await client.waitForTransactionReceipt({
    hash: revertTxHash,
  });
});
