import { Chain, Client, Transport } from 'viem';

import { RollupCreatorSupportedVersion } from '../types/createRollupTypes';

import {
  createRollupPrepareDeploymentParamsConfig as createRollupPrepareDeploymentParamsConfigV2Dot1,
  CreateRollupPrepareDeploymentParamsConfigParams as CreateRollupPrepareDeploymentParamsConfigParamsV2Dot1,
  CreateRollupPrepareDeploymentParamsConfigResult as CreateRollupPrepareDeploymentParamsConfigResultV2Dot1,
} from './v2.1';

import {
  createRollupPrepareDeploymentParamsConfig as createRollupPrepareDeploymentParamsConfigV3Dot2,
  CreateRollupPrepareDeploymentParamsConfigParams as CreateRollupPrepareDeploymentParamsConfigParamsV3Dot2,
  CreateRollupPrepareDeploymentParamsConfigResult as CreateRollupPrepareDeploymentParamsConfigResultV3Dot2,
} from './v3.2';

export type CreateRollupPrepareDeploymentParamsConfigParams<
  TRollupCreatorVersion extends RollupCreatorSupportedVersion = 'v3.2',
> = TRollupCreatorVersion extends 'v2.1'
  ? CreateRollupPrepareDeploymentParamsConfigParamsV2Dot1
  : CreateRollupPrepareDeploymentParamsConfigParamsV3Dot2;

export type CreateRollupPrepareDeploymentParamsConfigResult<
  TRollupCreatorVersion extends RollupCreatorSupportedVersion = 'v3.2',
> = TRollupCreatorVersion extends 'v2.1'
  ? CreateRollupPrepareDeploymentParamsConfigResultV2Dot1
  : CreateRollupPrepareDeploymentParamsConfigResultV3Dot2;

export function createRollupPrepareDeploymentParamsConfig<
  TChain extends Chain | undefined,
  TRollupCreatorVersion extends RollupCreatorSupportedVersion | undefined = 'v3.2',
>(
  client: Client<Transport, TChain>,
  params: TRollupCreatorVersion extends 'v2.1'
    ? CreateRollupPrepareDeploymentParamsConfigParamsV2Dot1
    : CreateRollupPrepareDeploymentParamsConfigParamsV3Dot2,
  rollupCreatorVersion?: TRollupCreatorVersion,
): TRollupCreatorVersion extends 'v2.1'
  ? CreateRollupPrepareDeploymentParamsConfigResultV2Dot1
  : CreateRollupPrepareDeploymentParamsConfigResultV3Dot2 {
  const version = rollupCreatorVersion ?? 'v3.2';

  if (version === 'v2.1') {
    return createRollupPrepareDeploymentParamsConfigV2Dot1(
      client,
      params as CreateRollupPrepareDeploymentParamsConfigParamsV2Dot1,
    ) as TRollupCreatorVersion extends 'v2.1'
      ? CreateRollupPrepareDeploymentParamsConfigResultV2Dot1
      : CreateRollupPrepareDeploymentParamsConfigResultV3Dot2;
  }

  return createRollupPrepareDeploymentParamsConfigV3Dot2(
    client,
    params as CreateRollupPrepareDeploymentParamsConfigParamsV3Dot2,
  ) as TRollupCreatorVersion extends 'v2.1'
    ? CreateRollupPrepareDeploymentParamsConfigResultV2Dot1
    : CreateRollupPrepareDeploymentParamsConfigResultV3Dot2;
}
