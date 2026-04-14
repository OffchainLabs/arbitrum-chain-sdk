import { z } from 'zod';
import { hexSchema } from './common';
import { ConsensusVersion, WasmModuleRoot } from '../../wasmModuleRoot';

export const getConsensusReleaseByVersionSchema = z.strictObject({
  consensusVersion: z.number(),
});

export const getConsensusReleaseByVersionTransform = (
  input: z.output<typeof getConsensusReleaseByVersionSchema>,
): [ConsensusVersion] => [input.consensusVersion as ConsensusVersion];

export const getConsensusReleaseByWasmModuleRootSchema = z.strictObject({
  wasmModuleRoot: hexSchema,
});

export const getConsensusReleaseByWasmModuleRootTransform = (
  input: z.output<typeof getConsensusReleaseByWasmModuleRootSchema>,
): [WasmModuleRoot] => [input.wasmModuleRoot as WasmModuleRoot];

export const isKnownWasmModuleRootSchema = z.strictObject({
  wasmModuleRoot: hexSchema,
});

export const isKnownWasmModuleRootTransform = (
  input: z.output<typeof isKnownWasmModuleRootSchema>,
): Parameters<typeof import('../../wasmModuleRoot').isKnownWasmModuleRoot> => [
  input.wasmModuleRoot,
];
