import { z } from 'zod';
import { hexSchema } from './common';
import { ConsensusVersion, WasmModuleRoot } from '../../wasmModuleRoot';

export const getConsensusReleaseByVersionSchema = z
  .strictObject({
    consensusVersion: z.number(),
  })
  .transform((input): [ConsensusVersion] => [input.consensusVersion as ConsensusVersion]);

export const getConsensusReleaseByWasmModuleRootSchema = z
  .strictObject({
    wasmModuleRoot: hexSchema,
  })
  .transform((input): [WasmModuleRoot] => [input.wasmModuleRoot as WasmModuleRoot]);

export const isKnownWasmModuleRootSchema = z
  .strictObject({
    wasmModuleRoot: hexSchema,
  })
  .transform(
    (input): Parameters<typeof import('../../wasmModuleRoot').isKnownWasmModuleRoot> => [
      input.wasmModuleRoot,
    ],
  );
