import { describe, it, expect } from 'vitest';
import { getInformationFromTestnode, getNitroTestnodePrivateKeyAccounts } from '../testHelpers';
import { Address, Hex, createPublicClient, http } from 'viem';
import { constants } from 'ethers';
import { nitroTestnodeL2 } from '../chains';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { getConfirmPeriodBlocks } from './getConfirmPeriodBlocks';
import { buildSetConfirmPeriodBlocks } from './buildSetConfirmPeriodBlocks';
import { getWasmModuleRoot } from './getWasmModuleRoot';
import { buildSetWasmModuleRoot } from './buildSetWasmModuleRoot';
import { buildSetExtraChallengeTimeBlocks } from './buildSetExtraChallengeTimeBlocks';
import { getExtraChallengeTimeBlocks } from './getExtraChallengeTimeBlocks';
import { buildSetMinimumAssertionPeriod } from './buildSetMinimumAssertionPeriod';
import { getMinimumAssertionPeriod } from './getMinimumAssertionPeriod';
import { buildSetValidators } from './buildSetValidator';
import { getValidators } from '../getValidators';
import { rollupABI } from '../contracts/Rollup';
import {
  buildDisableValidatorWhitelist,
  buildEnableValidatorWhitelist,
} from './buildSetValidatorWhitelistDisabled';

const { l3Rollup, l3UpgradeExecutor } = getInformationFromTestnode();
const { l3RollupOwner } = getNitroTestnodePrivateKeyAccounts();

const client = createPublicClient({
  chain: nitroTestnodeL2,
  transport: http(),
});

describe('Confirm period blocks', () => {
  it('getConfirmPeriodBlocks and buildSetConfirmPeriodBlocks get and update confirm period blocks', async () => {
    async function changePeriodBlocks(newPeriod: bigint) {
      const transactionRequest = await buildSetConfirmPeriodBlocks(client, {
        rollupAdminLogic: l3Rollup,
        account: l3RollupOwner.address,
        upgradeExecutor: l3UpgradeExecutor,
        params: {
          newPeriod,
        },
      });
      const txHash = await client.sendRawTransaction({
        serializedTransaction: await l3RollupOwner.signTransaction(transactionRequest),
      });
      await client.waitForTransactionReceipt({ hash: txHash });
    }

    expect(await getConfirmPeriodBlocks(client, { rollupAdminLogic: l3Rollup })).toEqual(20n);

    await changePeriodBlocks(40n);
    expect(await getConfirmPeriodBlocks(client, { rollupAdminLogic: l3Rollup })).toEqual(40n);

    await changePeriodBlocks(20n);
    expect(await getConfirmPeriodBlocks(client, { rollupAdminLogic: l3Rollup })).toEqual(20n);
  });

  it('getExtraChallengeTimeBlocks and buildSetExtraChallengeTimeBlocks get and update extra challenge time blocks', async () => {
    async function changeExtraChallengeTimeBlocks(newExtraTimeBlocks: bigint) {
      const transactionRequest = await buildSetExtraChallengeTimeBlocks(client, {
        rollupAdminLogic: l3Rollup,
        account: l3RollupOwner.address,
        upgradeExecutor: l3UpgradeExecutor,
        params: {
          newExtraTimeBlocks,
        },
      });
      const txHash = await client.sendRawTransaction({
        serializedTransaction: await l3RollupOwner.signTransaction(transactionRequest),
      });
      await client.waitForTransactionReceipt({ hash: txHash });
    }

    expect(await getExtraChallengeTimeBlocks(client, { rollupAdminLogic: l3Rollup })).toEqual(200n);

    await changeExtraChallengeTimeBlocks(400n);
    expect(await getExtraChallengeTimeBlocks(client, { rollupAdminLogic: l3Rollup })).toEqual(400n);

    await changeExtraChallengeTimeBlocks(200n);
    expect(await getExtraChallengeTimeBlocks(client, { rollupAdminLogic: l3Rollup })).toEqual(200n);
  });
});

describe('WASM module root', () => {
  it('getWasmModuleRoot and buildSetWasmModuleRoot get and update confirm period blocks', async () => {
    async function changeWasmModuleRoot(newWasmModuleRoot: Hex) {
      const transactionRequest = await buildSetWasmModuleRoot(client, {
        rollupAdminLogic: l3Rollup,
        account: l3RollupOwner.address,
        upgradeExecutor: l3UpgradeExecutor,
        params: {
          newWasmModuleRoot,
        },
      });
      const txHash = await client.sendRawTransaction({
        serializedTransaction: await l3RollupOwner.signTransaction(transactionRequest),
      });
      await client.waitForTransactionReceipt({ hash: txHash });
    }
    const initialWasmModuleRoot = await getWasmModuleRoot(client, { rollupAdminLogic: l3Rollup });

    await changeWasmModuleRoot(constants.HashZero);
    expect(await getWasmModuleRoot(client, { rollupAdminLogic: l3Rollup })).toEqual(
      constants.HashZero,
    );

    await changeWasmModuleRoot(initialWasmModuleRoot);
    expect(await getWasmModuleRoot(client, { rollupAdminLogic: l3Rollup })).toEqual(
      initialWasmModuleRoot,
    );
  });
});

describe('Minimum assertion period', () => {
  it('getMinimumAssertionPeriod and buildSetMinimumAssertionPeriod get and update minimum assertion period', async () => {
    async function changeMinimumAssertionPeriod(newPeriod: bigint) {
      const transactionRequest = await buildSetMinimumAssertionPeriod(client, {
        rollupAdminLogic: l3Rollup,
        account: l3RollupOwner.address,
        upgradeExecutor: l3UpgradeExecutor,
        params: {
          newPeriod,
        },
      });
      const txHash = await client.sendRawTransaction({
        serializedTransaction: await l3RollupOwner.signTransaction(transactionRequest),
      });
      await client.waitForTransactionReceipt({ hash: txHash });
    }

    expect(await getMinimumAssertionPeriod(client, { rollupAdminLogic: l3Rollup })).toEqual(75n);

    await changeMinimumAssertionPeriod(150n);
    expect(await getMinimumAssertionPeriod(client, { rollupAdminLogic: l3Rollup })).toEqual(150n);

    await changeMinimumAssertionPeriod(75n);
    expect(await getMinimumAssertionPeriod(client, { rollupAdminLogic: l3Rollup })).toEqual(75n);
  });
});

describe('Validators', () => {
  it('getValidators and buildSetValidators get and update validators', async () => {
    async function changeValidators({
      newValidators,
      deletedValidators,
    }: {
      newValidators: Address[];
      deletedValidators: Address[];
    }) {
      const transactionRequest = await buildSetValidators(client, {
        rollupAdminLogic: l3Rollup,
        account: l3RollupOwner.address,
        upgradeExecutor: l3UpgradeExecutor,
        params: {
          add: newValidators,
          remove: deletedValidators,
        },
      });
      const txHash = await client.sendRawTransaction({
        serializedTransaction: await l3RollupOwner.signTransaction(transactionRequest),
      });
      await client.waitForTransactionReceipt({ hash: txHash });
    }

    const { validators: initialValidators } = await getValidators(client, { rollup: l3Rollup });
    expect(initialValidators).toEqual([
      '0x09a51aAcd25f79D7955d2060320Ca1A7dBbCf361',
      '0xB6b3A591C68422dFFeeB2beC93a5d7CF36a9E7ca',
      '0xb02B307C54Dc6f68885739DB101115b26cb5cD2C',
      '0xdB19208f4184dcA5f9C448C3ECafDAba5F0a4C07',
      '0x99e9FaE46fC914f875c180C618c2248b28077806',
      '0xD7Eb2ca8a71edbdFC8e694e0c95d255F48D4c8b1',
      '0x24E8cf09bDB46997E865cFFD3bbCC3aDB8D4CFBd',
      '0x5eB70c2B0603A7567CD0426FC04a2fCbAcc1AEd5',
      '0xFe079d3Ed5fdA9070423B409dE0bbaFe14C64147',
      '0x7c7535AC6268F06FCA544d0b5C584265055ED4eF',
    ]);

    const randomAddress = privateKeyToAccount(generatePrivateKey()).address;
    await changeValidators({
      newValidators: [randomAddress],
      deletedValidators: ['0x7c7535AC6268F06FCA544d0b5C584265055ED4eF'],
    });

    expect((await getValidators(client, { rollup: l3Rollup })).validators).toEqual([
      ...initialValidators.slice(0, -1),
      randomAddress,
    ]);

    await changeValidators({
      newValidators: ['0x7c7535ac6268f06fca544d0b5c584265055ed4ef'],
      deletedValidators: [randomAddress],
    });
    expect((await getValidators(client, { rollup: l3Rollup })).validators).toEqual(
      initialValidators,
    );
  });
});

describe('Validators whitelist', () => {
  it('Enable and disable validators whitelist', async () => {
    function getValidatorWhitelist() {
      return client.readContract({
        address: l3Rollup,
        abi: rollupABI,
        functionName: 'validatorWhitelistDisabled',
      });
    }
    async function updateWhitelist(whitelist: boolean) {
      const fn = whitelist ? buildEnableValidatorWhitelist : buildDisableValidatorWhitelist;
      const transactionRequest = await fn(client, {
        rollupAdminLogic: l3Rollup,
        account: l3RollupOwner.address,
        upgradeExecutor: l3UpgradeExecutor,
      });
      const txHash = await client.sendRawTransaction({
        serializedTransaction: await l3RollupOwner.signTransaction(transactionRequest),
      });
      await client.waitForTransactionReceipt({ hash: txHash });
    }

    expect(await getValidatorWhitelist()).toBeFalsy();

    await updateWhitelist(true);
    expect(await getValidatorWhitelist()).toBeTruthy();

    await updateWhitelist(false);
    expect(await getValidatorWhitelist()).toBeFalsy();
  });
});
