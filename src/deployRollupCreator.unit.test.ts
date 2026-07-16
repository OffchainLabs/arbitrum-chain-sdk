import { describe, it, expect } from 'vitest';
import { encodeAbiParameters, decodeAbiParameters } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

import BridgeCreator from '@arbitrum/nitro-contracts/build/contracts/src/rollup/BridgeCreator.sol/BridgeCreator.json';
import SequencerInbox from '@arbitrum/nitro-contracts/build/contracts/src/bridge/SequencerInbox.sol/SequencerInbox.json';
import RollupCreator from '@arbitrum/nitro-contracts/build/contracts/src/rollup/RollupCreator.sol/RollupCreator.json';
import OneStepProofEntry from '@arbitrum/nitro-contracts/build/contracts/src/osp/OneStepProofEntry.sol/OneStepProofEntry.json';
import UpgradeExecutor from '@offchainlabs/upgrade-executor/build/contracts/src/UpgradeExecutor.sol/UpgradeExecutor.json';
import Reader4844 from '@arbitrum/nitro-contracts/out/yul/Reader4844.yul/Reader4844.json';

import { buildBridgeCreatorTemplates } from './deployRollupCreator';

type AbiInput = { name?: string; type: string };
type EncodeParams = Parameters<typeof encodeAbiParameters>[0];

function constructorInputs(abi: unknown): AbiInput[] {
  const entries = abi as { type: string; inputs?: AbiInput[] }[];
  const constructor = entries.find((entry) => entry.type === 'constructor');
  if (!constructor?.inputs) throw new Error('no constructor inputs');
  return constructor.inputs;
}

const randomAddress = () => privateKeyToAccount(generatePrivateKey()).address;

describe('buildBridgeCreatorTemplates', () => {
  // Round-trip the assembled tuples through the real BridgeCreator ABI. Distinct addresses per field
  // mean a misordered tuple would decode a value into the wrong named field and fail here, not at deploy.
  it('assembles tuples that decode back to the named struct fields', () => {
    const eth = {
      bridge: randomAddress(),
      sequencerInbox: randomAddress(),
      delayBufferableSequencerInbox: randomAddress(),
      inbox: randomAddress(),
      rollupEventInbox: randomAddress(),
      outbox: randomAddress(),
    };
    const erc20 = {
      bridge: randomAddress(),
      sequencerInbox: randomAddress(),
      delayBufferableSequencerInbox: randomAddress(),
      inbox: randomAddress(),
      rollupEventInbox: randomAddress(),
      outbox: randomAddress(),
    };

    const templates = buildBridgeCreatorTemplates(eth, erc20);
    const params = constructorInputs(BridgeCreator.abi) as unknown as EncodeParams;
    const encoded = encodeAbiParameters(params, [...templates] as unknown[]);
    const decoded = decodeAbiParameters(params, encoded);

    expect(decoded[0]).toEqual(eth);
    expect(decoded[1]).toEqual(erc20);
  });
});

describe('deployRollupCreator artifact wiring', () => {
  it('passes SequencerInbox constructor args in the (maxDataSize, reader4844, isUsingFeeToken, isDelayBufferable) order', () => {
    expect(constructorInputs(SequencerInbox.abi).map((input) => input.type)).toEqual([
      'uint256',
      'address',
      'bool',
      'bool',
    ]);
  });

  it('passes RollupCreator constructor args in the order the deploy assembles them', () => {
    expect(constructorInputs(RollupCreator.abi).map((input) => input.name)).toEqual([
      'initialOwner',
      '_bridgeCreator',
      '_osp',
      '_challengeManagerLogic',
      '_rollupAdminLogic',
      '_rollupUserLogic',
      '_upgradeExecutorLogic',
      '_validatorWalletCreator',
      '_l2FactoriesDeployer',
    ]);
  });

  it('resolves the key artifacts with populated bytecode', () => {
    const artifacts: [string, { bytecode: string }][] = [
      ['RollupCreator', RollupCreator],
      ['BridgeCreator', BridgeCreator],
      ['OneStepProofEntry', OneStepProofEntry],
      ['UpgradeExecutor', UpgradeExecutor],
    ];
    for (const [name, artifact] of artifacts) {
      expect(artifact.bytecode.startsWith('0x'), name).toBe(true);
      expect(artifact.bytecode.length, name).toBeGreaterThan(2);
    }
  });

  // Reader4844 is a Yul artifact, so its bytecode lives under `bytecode.object`, not `bytecode`.
  it('resolves the Reader4844 Yul artifact with populated bytecode', () => {
    expect(Reader4844.bytecode.object.startsWith('0x')).toBe(true);
    expect(Reader4844.bytecode.object.length).toBeGreaterThan(2);
  });
});
