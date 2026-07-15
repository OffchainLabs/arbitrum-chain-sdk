import { Address, Hex, WalletClient, parseAbi, zeroAddress } from 'viem';

import {
  DeployArtifact,
  DeployClient,
  DeployContext,
  deployContractChecked,
  toDeployContext,
} from './utils/deployContract';

import Bridge from '@arbitrum/nitro-contracts/build/contracts/src/bridge/Bridge.sol/Bridge.json';
import SequencerInbox from '@arbitrum/nitro-contracts/build/contracts/src/bridge/SequencerInbox.sol/SequencerInbox.json';
import Inbox from '@arbitrum/nitro-contracts/build/contracts/src/bridge/Inbox.sol/Inbox.json';
import RollupEventInbox from '@arbitrum/nitro-contracts/build/contracts/src/rollup/RollupEventInbox.sol/RollupEventInbox.json';
import Outbox from '@arbitrum/nitro-contracts/build/contracts/src/bridge/Outbox.sol/Outbox.json';
import ERC20Bridge from '@arbitrum/nitro-contracts/build/contracts/src/bridge/ERC20Bridge.sol/ERC20Bridge.json';
import ERC20Inbox from '@arbitrum/nitro-contracts/build/contracts/src/bridge/ERC20Inbox.sol/ERC20Inbox.json';
import ERC20RollupEventInbox from '@arbitrum/nitro-contracts/build/contracts/src/rollup/ERC20RollupEventInbox.sol/ERC20RollupEventInbox.json';
import ERC20Outbox from '@arbitrum/nitro-contracts/build/contracts/src/bridge/ERC20Outbox.sol/ERC20Outbox.json';
import BridgeCreator from '@arbitrum/nitro-contracts/build/contracts/src/rollup/BridgeCreator.sol/BridgeCreator.json';
import OneStepProver0 from '@arbitrum/nitro-contracts/build/contracts/src/osp/OneStepProver0.sol/OneStepProver0.json';
import OneStepProverMemory from '@arbitrum/nitro-contracts/build/contracts/src/osp/OneStepProverMemory.sol/OneStepProverMemory.json';
import OneStepProverMath from '@arbitrum/nitro-contracts/build/contracts/src/osp/OneStepProverMath.sol/OneStepProverMath.json';
import OneStepProverHostIo from '@arbitrum/nitro-contracts/build/contracts/src/osp/OneStepProverHostIo.sol/OneStepProverHostIo.json';
import OneStepProofEntry from '@arbitrum/nitro-contracts/build/contracts/src/osp/OneStepProofEntry.sol/OneStepProofEntry.json';
import EdgeChallengeManager from '@arbitrum/nitro-contracts/build/contracts/src/challengeV2/EdgeChallengeManager.sol/EdgeChallengeManager.json';
import RollupAdminLogic from '@arbitrum/nitro-contracts/build/contracts/src/rollup/RollupAdminLogic.sol/RollupAdminLogic.json';
import RollupUserLogic from '@arbitrum/nitro-contracts/build/contracts/src/rollup/RollupUserLogic.sol/RollupUserLogic.json';
import ValidatorWalletCreator from '@arbitrum/nitro-contracts/build/contracts/src/rollup/ValidatorWalletCreator.sol/ValidatorWalletCreator.json';
import DeployHelper from '@arbitrum/nitro-contracts/build/contracts/src/rollup/DeployHelper.sol/DeployHelper.json';
import RollupCreator from '@arbitrum/nitro-contracts/build/contracts/src/rollup/RollupCreator.sol/RollupCreator.json';
import UpgradeExecutor from '@offchainlabs/upgrade-executor/build/contracts/src/UpgradeExecutor.sol/UpgradeExecutor.json';

// Non-Ethereum-L1 maxDataSize (L1 uses 117964); deploying on L1 is out of scope.
const MAX_DATA_SIZE = 104857n;

// SequencerInbox requires a non-zero reader4844 on non-Arbitrum chains; the dead address is the
// upstream sentinel for "no EIP-4844 blob support". On Arbitrum chains address(0) is required instead.
const READER_4844_NON_ARBITRUM = '0x000000000000000000000000000000000000dead' as Address;

const ARB_SYS_ADDRESS = '0x0000000000000000000000000000000000000064' as Address;

export type DeployRollupCreatorParams = {
  walletClient: WalletClient;
};

export type DeployRollupCreatorResult = {
  rollupCreator: Address;
  bridgeCreator: Address;
  osp: Address;
  challengeManager: Address;
  rollupAdminLogic: Address;
  rollupUserLogic: Address;
  upgradeExecutor: Address;
  validatorWalletCreator: Address;
  deployHelper: Address;
  transactionHash: Hex;
};

export type BridgeContractTemplates = {
  bridge: Address;
  sequencerInbox: Address;
  delayBufferableSequencerInbox: Address;
  inbox: Address;
  rollupEventInbox: Address;
  outbox: Address;
};

// Field order must match BridgeCreator's ABI tuple; the unit test round-trips it to catch a reorder.
export function buildBridgeCreatorTemplates(
  eth: BridgeContractTemplates,
  erc20: BridgeContractTemplates,
): readonly [readonly Address[], readonly Address[]] {
  const toTuple = (templates: BridgeContractTemplates): readonly Address[] => [
    templates.bridge,
    templates.sequencerInbox,
    templates.delayBufferableSequencerInbox,
    templates.inbox,
    templates.rollupEventInbox,
    templates.outbox,
  ];
  return [toTuple(eth), toTuple(erc20)];
}

// Probe the ArbSys precompile, which exists only on Arbitrum chains. Following nitro-contracts'
// _isRunningOnArbitrum: the call failing is the signal that ArbSys is absent (not Arbitrum), so the
// catch is intentional feature-detection, not error suppression.
async function isRunningOnArbitrum(client: DeployClient): Promise<boolean> {
  try {
    await client.readContract({
      address: ARB_SYS_ADDRESS,
      abi: parseAbi(['function arbOSVersion() view returns (uint64)']),
      functionName: 'arbOSVersion',
    });
    return true;
  } catch {
    return false;
  }
}

async function deployBridgeTemplatesAndCreator(
  ctx: DeployContext,
  maxDataSize: bigint,
  reader4844: Address,
): Promise<Address> {
  const deploy = (label: string, artifact: DeployArtifact, args?: readonly unknown[]) =>
    deployContractChecked(ctx, label, artifact, args).then((result) => result.address);

  const eth: BridgeContractTemplates = {
    bridge: await deploy('Bridge', Bridge),
    sequencerInbox: await deploy('SequencerInbox (eth)', SequencerInbox, [
      maxDataSize,
      reader4844,
      false,
      false,
    ]),
    delayBufferableSequencerInbox: await deploy(
      'SequencerInbox (eth, delay-bufferable)',
      SequencerInbox,
      [maxDataSize, reader4844, false, true],
    ),
    inbox: await deploy('Inbox', Inbox, [maxDataSize]),
    rollupEventInbox: await deploy('RollupEventInbox', RollupEventInbox),
    outbox: await deploy('Outbox', Outbox),
  };

  const erc20: BridgeContractTemplates = {
    bridge: await deploy('ERC20Bridge', ERC20Bridge),
    sequencerInbox: await deploy('SequencerInbox (erc20)', SequencerInbox, [
      maxDataSize,
      reader4844,
      true,
      false,
    ]),
    delayBufferableSequencerInbox: await deploy(
      'SequencerInbox (erc20, delay-bufferable)',
      SequencerInbox,
      [maxDataSize, reader4844, true, true],
    ),
    inbox: await deploy('ERC20Inbox', ERC20Inbox, [maxDataSize]),
    rollupEventInbox: await deploy('ERC20RollupEventInbox', ERC20RollupEventInbox),
    outbox: await deploy('ERC20Outbox', ERC20Outbox),
  };

  const templates = buildBridgeCreatorTemplates(eth, erc20);
  return deploy('BridgeCreator', BridgeCreator, templates);
}

async function deployOspStack(ctx: DeployContext): Promise<Address> {
  const deploy = (label: string, artifact: DeployArtifact, args?: readonly unknown[]) =>
    deployContractChecked(ctx, label, artifact, args).then((result) => result.address);

  const prover0 = await deploy('OneStepProver0', OneStepProver0);
  const proverMem = await deploy('OneStepProverMemory', OneStepProverMemory);
  const proverMath = await deploy('OneStepProverMath', OneStepProverMath);
  const proverHostIo = await deploy('OneStepProverHostIo', OneStepProverHostIo, [zeroAddress]);
  return deploy('OneStepProofEntry', OneStepProofEntry, [
    prover0,
    proverMem,
    proverMath,
    proverHostIo,
  ]);
}

// Ports nitro-contracts' deployAllContracts (v3.2). The v3.2 RollupCreator constructor sets its
// templates directly, so there is no follow-up setTemplates call; the deploying account becomes the
// RollupCreator owner. Deploying on Ethereum L1 (needs a real Reader4844) is out of scope.
export async function deployRollupCreator({
  walletClient,
}: DeployRollupCreatorParams): Promise<DeployRollupCreatorResult> {
  const ctx = toDeployContext(walletClient, 'deployRollupCreator');

  const reader4844 = (await isRunningOnArbitrum(ctx.client))
    ? zeroAddress
    : READER_4844_NON_ARBITRUM;

  const bridgeCreator = await deployBridgeTemplatesAndCreator(ctx, MAX_DATA_SIZE, reader4844);
  const osp = await deployOspStack(ctx);
  const challengeManager = (
    await deployContractChecked(ctx, 'EdgeChallengeManager', EdgeChallengeManager)
  ).address;
  const rollupAdminLogic = (await deployContractChecked(ctx, 'RollupAdminLogic', RollupAdminLogic))
    .address;
  const rollupUserLogic = (await deployContractChecked(ctx, 'RollupUserLogic', RollupUserLogic))
    .address;
  const upgradeExecutor = (await deployContractChecked(ctx, 'UpgradeExecutor', UpgradeExecutor))
    .address;
  const validatorWalletCreator = (
    await deployContractChecked(ctx, 'ValidatorWalletCreator', ValidatorWalletCreator)
  ).address;
  const deployHelper = (await deployContractChecked(ctx, 'DeployHelper', DeployHelper)).address;

  const { address: rollupCreator, transactionHash } = await deployContractChecked(
    ctx,
    'RollupCreator',
    RollupCreator,
    [
      ctx.account.address,
      bridgeCreator,
      osp,
      challengeManager,
      rollupAdminLogic,
      rollupUserLogic,
      upgradeExecutor,
      validatorWalletCreator,
      deployHelper,
    ],
  );

  return {
    rollupCreator,
    bridgeCreator,
    osp,
    challengeManager,
    rollupAdminLogic,
    rollupUserLogic,
    upgradeExecutor,
    validatorWalletCreator,
    deployHelper,
    transactionHash,
  };
}
