import { dirname, resolve } from 'node:path';

import type { Address } from 'viem';

import { runForgeScript, type RunForgeScriptResult } from './utils/runForgeScript';

export enum NitroContractsUpgradeVersion {
  V3_2_0 = '3.2.0',
}

export type DeployNitroContractsUpgradeActionParameters = {
  version: NitroContractsUpgradeVersion;
  parentChainRpcUrl: string;
  forgeArgs?: string[];
};

export type ExecuteNitroContractsUpgradeParameters = DeployNitroContractsUpgradeActionParameters & {
  rollupAddress: Address;
  parentUpgradeExecutorAddress: Address;
  upgradeActionAddress: Address;
};

export type VerifyNitroContractsUpgradeParameters = DeployNitroContractsUpgradeActionParameters & {
  rollupAddress: Address;
};

type UpgradeOperation = 'Deploy' | 'Execute' | 'Verify';

const upgradeScripts = {
  [NitroContractsUpgradeVersion.V3_2_0]: {
    Deploy: require.resolve(
      '@arbitrum/chain-actions/scripts/foundry/contract-upgrades/3.2.0/DeployNitroContracts3Point2Point0UpgradeAction.s.sol',
    ),
    Execute: require.resolve(
      '@arbitrum/chain-actions/scripts/foundry/contract-upgrades/3.2.0/ExecuteNitroContracts3Point2Point0Upgrade.s.sol',
    ),
    Verify: require.resolve(
      '@arbitrum/chain-actions/scripts/foundry/contract-upgrades/3.2.0/VerifyNitroContracts3Point2Point0Upgrade.s.sol',
    ),
  },
} satisfies Record<NitroContractsUpgradeVersion, Record<UpgradeOperation, string>>;

function runUpgradeScript(
  operation: UpgradeOperation,
  params: DeployNitroContractsUpgradeActionParameters,
  scriptEnvironment: Record<string, string> = {},
): Promise<RunForgeScriptResult> {
  const chainActionsRoot = resolve(dirname(require.resolve('@arbitrum/chain-actions')), '../../..');
  const upgradeExecutorRoot = resolve(
    dirname(
      require.resolve('@offchainlabs/upgrade-executor/src/IUpgradeExecutor.sol', {
        paths: [chainActionsRoot],
      }),
    ),
    '..',
  );

  return runForgeScript({
    script: upgradeScripts[params.version][operation],
    rpcUrl: params.parentChainRpcUrl,
    forgeArgs: [
      '--root',
      chainActionsRoot,
      '--remappings',
      `@offchainlabs/upgrade-executor/=${upgradeExecutorRoot}/`,
      ...(params.forgeArgs ?? []),
    ],
    env: scriptEnvironment,
  });
}

/** Deploys the upgrade action for a Nitro contracts version. */
export function deployNitroContractsUpgradeAction(
  params: DeployNitroContractsUpgradeActionParameters,
): Promise<RunForgeScriptResult> {
  return runUpgradeScript('Deploy', params);
}

/** Executes a Nitro contracts upgrade through the parent chain UpgradeExecutor. */
export function executeNitroContractsUpgrade(
  params: ExecuteNitroContractsUpgradeParameters,
): Promise<RunForgeScriptResult> {
  return runUpgradeScript('Execute', params, {
    ROLLUP_ADDRESS: params.rollupAddress,
    PARENT_UPGRADE_EXECUTOR_ADDRESS: params.parentUpgradeExecutorAddress,
    UPGRADE_ACTION_ADDRESS: params.upgradeActionAddress,
  });
}

/** Verifies that a Nitro contracts upgrade was applied to the rollup. */
export function verifyNitroContractsUpgrade(
  params: VerifyNitroContractsUpgradeParameters,
): Promise<RunForgeScriptResult> {
  return runUpgradeScript('Verify', params, {
    ROLLUP_ADDRESS: params.rollupAddress,
  });
}
