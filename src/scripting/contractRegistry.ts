import type { Abi } from 'viem';
import type { ZodType } from 'zod';

import { arbAggregatorABI } from '../contracts/ArbAggregator';
import { schemas as arbAggregatorSchemas } from '../contracts/ArbAggregator.schemas';
import { arbGasInfoABI } from '../contracts/ArbGasInfo';
import { schemas as arbGasInfoSchemas } from '../contracts/ArbGasInfo.schemas';
import { arbOwnerABI } from '../contracts/ArbOwner';
import { schemas as arbOwnerSchemas } from '../contracts/ArbOwner.schemas';
import { arbOwnerPublicABI } from '../contracts/ArbOwnerPublic';
import { schemas as arbOwnerPublicSchemas } from '../contracts/ArbOwnerPublic.schemas';
import { erc20ABI } from '../contracts/ERC20';
import { schemas as erc20Schemas } from '../contracts/ERC20.schemas';
import { gnosisSafeL2ABI } from '../contracts/GnosisSafeL2';
import { schemas as gnosisSafeL2Schemas } from '../contracts/GnosisSafeL2.schemas';
import { upgradeExecutorABI } from '../contracts/UpgradeExecutor';
import { schemas as upgradeExecutorSchemas } from '../contracts/UpgradeExecutor.schemas';

import { inboxABI as inboxV32ABI } from '../contracts/Inbox/v3.2';
import { schemas as inboxV32Schemas } from '../contracts/Inbox/v3.2.schemas';

import { rollupABI as rollupV11ABI } from '../contracts/Rollup/v1.1';
import { schemas as rollupV11Schemas } from '../contracts/Rollup/v1.1.schemas';
import { rollupABI as rollupV21ABI } from '../contracts/Rollup/v2.1';
import { schemas as rollupV21Schemas } from '../contracts/Rollup/v2.1.schemas';
import { rollupABI as rollupV31ABI } from '../contracts/Rollup/v3.1';
import { schemas as rollupV31Schemas } from '../contracts/Rollup/v3.1.schemas';
import { rollupABI as rollupV32ABI } from '../contracts/Rollup/v3.2';
import { schemas as rollupV32Schemas } from '../contracts/Rollup/v3.2.schemas';

import { rollupCreatorABI as rollupCreatorV11ABI } from '../contracts/RollupCreator/v1.1';
import { schemas as rollupCreatorV11Schemas } from '../contracts/RollupCreator/v1.1.schemas';
import { rollupCreatorABI as rollupCreatorV21ABI } from '../contracts/RollupCreator/v2.1';
import { schemas as rollupCreatorV21Schemas } from '../contracts/RollupCreator/v2.1.schemas';
import { rollupCreatorABI as rollupCreatorV31ABI } from '../contracts/RollupCreator/v3.1';
import { schemas as rollupCreatorV31Schemas } from '../contracts/RollupCreator/v3.1.schemas';
import { rollupCreatorABI as rollupCreatorV32ABI } from '../contracts/RollupCreator/v3.2';
import { schemas as rollupCreatorV32Schemas } from '../contracts/RollupCreator/v3.2.schemas';

import { sequencerInboxABI as sequencerInboxV11ABI } from '../contracts/SequencerInbox/v1.1';
import { schemas as sequencerInboxV11Schemas } from '../contracts/SequencerInbox/v1.1.schemas';
import { sequencerInboxABI as sequencerInboxV21ABI } from '../contracts/SequencerInbox/v2.1';
import { schemas as sequencerInboxV21Schemas } from '../contracts/SequencerInbox/v2.1.schemas';
import { sequencerInboxABI as sequencerInboxV31ABI } from '../contracts/SequencerInbox/v3.1';
import { schemas as sequencerInboxV31Schemas } from '../contracts/SequencerInbox/v3.1.schemas';
import { sequencerInboxABI as sequencerInboxV32ABI } from '../contracts/SequencerInbox/v3.2';
import { schemas as sequencerInboxV32Schemas } from '../contracts/SequencerInbox/v3.2.schemas';

import { tokenBridgeCreatorABI as tokenBridgeCreatorV12ABI } from '../contracts/TokenBridgeCreator/v1.2';
import { schemas as tokenBridgeCreatorV12Schemas } from '../contracts/TokenBridgeCreator/v1.2.schemas';

export type ContractRegistryEntry = {
  name: string;
  abi: Abi;
  schemas: Record<string, ZodType>;
};

export const contractRegistry: readonly ContractRegistryEntry[] = [
  { name: 'ArbAggregator', abi: arbAggregatorABI, schemas: arbAggregatorSchemas },
  { name: 'ArbGasInfo', abi: arbGasInfoABI, schemas: arbGasInfoSchemas },
  { name: 'ArbOwner', abi: arbOwnerABI, schemas: arbOwnerSchemas },
  { name: 'ArbOwnerPublic', abi: arbOwnerPublicABI, schemas: arbOwnerPublicSchemas },
  { name: 'ERC20', abi: erc20ABI, schemas: erc20Schemas },
  { name: 'GnosisSafeL2', abi: gnosisSafeL2ABI, schemas: gnosisSafeL2Schemas },
  { name: 'UpgradeExecutor', abi: upgradeExecutorABI, schemas: upgradeExecutorSchemas },

  { name: 'Inbox@v3.2', abi: inboxV32ABI, schemas: inboxV32Schemas },
  { name: 'Inbox', abi: inboxV32ABI, schemas: inboxV32Schemas },

  { name: 'Rollup@v1.1', abi: rollupV11ABI, schemas: rollupV11Schemas },
  { name: 'Rollup@v2.1', abi: rollupV21ABI, schemas: rollupV21Schemas },
  { name: 'Rollup@v3.1', abi: rollupV31ABI, schemas: rollupV31Schemas },
  { name: 'Rollup@v3.2', abi: rollupV32ABI, schemas: rollupV32Schemas },
  { name: 'Rollup', abi: rollupV32ABI, schemas: rollupV32Schemas },

  { name: 'RollupCreator@v1.1', abi: rollupCreatorV11ABI, schemas: rollupCreatorV11Schemas },
  { name: 'RollupCreator@v2.1', abi: rollupCreatorV21ABI, schemas: rollupCreatorV21Schemas },
  { name: 'RollupCreator@v3.1', abi: rollupCreatorV31ABI, schemas: rollupCreatorV31Schemas },
  { name: 'RollupCreator@v3.2', abi: rollupCreatorV32ABI, schemas: rollupCreatorV32Schemas },
  { name: 'RollupCreator', abi: rollupCreatorV32ABI, schemas: rollupCreatorV32Schemas },

  { name: 'SequencerInbox@v1.1', abi: sequencerInboxV11ABI, schemas: sequencerInboxV11Schemas },
  { name: 'SequencerInbox@v2.1', abi: sequencerInboxV21ABI, schemas: sequencerInboxV21Schemas },
  { name: 'SequencerInbox@v3.1', abi: sequencerInboxV31ABI, schemas: sequencerInboxV31Schemas },
  { name: 'SequencerInbox@v3.2', abi: sequencerInboxV32ABI, schemas: sequencerInboxV32Schemas },
  { name: 'SequencerInbox', abi: sequencerInboxV32ABI, schemas: sequencerInboxV32Schemas },

  {
    name: 'TokenBridgeCreator@v1.2',
    abi: tokenBridgeCreatorV12ABI,
    schemas: tokenBridgeCreatorV12Schemas,
  },
  {
    name: 'TokenBridgeCreator',
    abi: tokenBridgeCreatorV12ABI,
    schemas: tokenBridgeCreatorV12Schemas,
  },
];
