import { z } from 'zod';
import { rollupCreatorVersionSchema } from './common';
import { RollupCreatorSupportedVersion } from '../../types/createRollupTypes';

export const createRollupPrepareDeploymentParamsConfigDefaultsSchema = z.strictObject({
  rollupCreatorVersion: rollupCreatorVersionSchema.optional(),
});

export const createRollupPrepareDeploymentParamsConfigDefaultsTransform = (
  input: z.output<typeof createRollupPrepareDeploymentParamsConfigDefaultsSchema>,
): [RollupCreatorSupportedVersion] | [] =>
  input.rollupCreatorVersion ? [input.rollupCreatorVersion] : [];
