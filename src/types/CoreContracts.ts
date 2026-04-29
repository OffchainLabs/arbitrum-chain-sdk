import { Address } from 'viem';

export type CoreContracts = {
  rollup: Address;
  nativeToken: Address;
  inbox: Address;
  outbox: Address;
  rollupEventInbox: Address;
  challengeManager: Address;
  adminProxy: Address;
  sequencerInbox: Address;
  bridge: Address;
  upgradeExecutor: Address;
  validatorUtils?: Address;
  validatorWalletCreator: Address;
  deployedAtBlockNumber: number;
};
