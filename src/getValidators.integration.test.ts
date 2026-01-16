import { describe, it, expect } from 'vitest';
import { Address, createPublicClient, http } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

import { nitroTestnodeL2 } from './chains';
import { rollupAdminLogicPublicActions } from './decorators/rollupAdminLogicPublicActions';
import {
  getInformationFromTestnode,
  getNitroTestnodePrivateKeyAccounts,
  testHelper_getRollupCreatorVersionFromEnv,
} from './testHelpers';
import { getValidators } from './getValidators';

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

async function setValidator(validator: Address, state: boolean) {
  const tx = await client.rollupAdminLogicPrepareTransactionRequest({
    functionName: 'setValidator',
    args: [[validator], [state]],
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
}

// Tests can be enabled once we run one node per integration test
describe('successfully get validators', () => {
  it('when disabling the same validator multiple times', async () => {
    const randomAccount = privateKeyToAccount(generatePrivateKey()).address;

    const { isAccurate: isAccurateInitially, validators: initialValidators } = await getValidators(
      client,
      {
        rollup: l3Rollup,
      },
    );

    expect(initialValidators).toHaveLength(expectedInitialValidators);
    expect(isAccurateInitially).toBeTruthy();

    await setValidator(randomAccount, false);
    await setValidator(randomAccount, false);

    const { isAccurate: isStillAccurate, validators: newValidators } = await getValidators(client, {
      rollup: l3Rollup,
    });
    // Setting the same validator multiple time to false doesn't add new validators
    expect(newValidators).toEqual(initialValidators);
    expect(isStillAccurate).toBeTruthy();

    await setValidator(randomAccount, true);
    const { validators, isAccurate } = await getValidators(client, { rollup: l3Rollup });
    expect(validators).toEqual(initialValidators.concat(randomAccount));
    expect(isAccurate).toBeTruthy();

    // Reset state for future tests
    await setValidator(randomAccount, false);
    const { isAccurate: isAccurateFinal, validators: validatorsFinal } = await getValidators(
      client,
      {
        rollup: l3Rollup,
      },
    );
    expect(validatorsFinal).toEqual(initialValidators);
    expect(isAccurateFinal).toBeTruthy();
  });

  it('when enabling the same validators multiple times', async () => {
    const randomAccount = privateKeyToAccount(generatePrivateKey()).address;

    const { isAccurate: isAccurateInitially, validators: initialValidators } = await getValidators(
      client,
      {
        rollup: l3Rollup,
      },
    );

    expect(initialValidators).toHaveLength(expectedInitialValidators);
    expect(isAccurateInitially).toBeTruthy();

    await setValidator(randomAccount, true);
    await setValidator(randomAccount, true);
    const { isAccurate: isStillAccurate, validators: newValidators } = await getValidators(client, {
      rollup: l3Rollup,
    });

    expect(newValidators).toEqual(initialValidators.concat(randomAccount));
    expect(isStillAccurate).toBeTruthy();

    // Reset state for futures tests
    await setValidator(randomAccount, false);
    const { validators, isAccurate } = await getValidators(client, { rollup: l3Rollup });
    expect(validators).toEqual(initialValidators);
    expect(isAccurate).toBeTruthy();
  });

  it('when adding an existing validator', async () => {
    const { isAccurate: isAccurateInitially, validators: initialValidators } = await getValidators(
      client,
      { rollup: l3Rollup },
    );

    expect(initialValidators).toHaveLength(expectedInitialValidators);
    expect(isAccurateInitially).toBeTruthy();

    const firstValidator = initialValidators[0];
    await setValidator(firstValidator, true);

    const { isAccurate, validators } = await getValidators(client, { rollup: l3Rollup });
    expect(validators).toEqual(initialValidators);
    expect(isAccurate).toBeTruthy();
  });

  it('when removing an existing validator', async () => {
    const { isAccurate: isAccurateInitially, validators: initialValidators } = await getValidators(
      client,
      { rollup: l3Rollup },
    );

    expect(initialValidators).toHaveLength(expectedInitialValidators);
    expect(isAccurateInitially).toBeTruthy();

    const lastValidator = initialValidators[initialValidators.length - 1];
    await setValidator(lastValidator, false);
    const { isAccurate, validators } = await getValidators(client, { rollup: l3Rollup });
    expect(validators).toEqual(initialValidators.slice(0, -1));
    expect(isAccurate).toBeTruthy();

    await setValidator(lastValidator, true);
    const { isAccurate: isAccurateFinal, validators: validatorsFinal } = await getValidators(
      client,
      { rollup: l3Rollup },
    );
    expect(validatorsFinal).toEqual(initialValidators);
    expect(isAccurateFinal).toBeTruthy();
  });
});
