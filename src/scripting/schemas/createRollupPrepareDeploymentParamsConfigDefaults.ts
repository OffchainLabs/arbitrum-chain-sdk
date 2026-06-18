import { z } from 'zod';
import { rollupCreatorVersionSchema } from './common';
import { RollupCreatorSupportedVersion } from '../../types/createRollupTypes';

export const createRollupPrepareDeploymentParamsConfigDefaultsSchema = z
  .strictObject({
    rollupCreatorVersion: rollupCreatorVersionSchema.optional(),
  })
  .transform((input): [RollupCreatorSupportedVersion] | [] =>
    input.rollupCreatorVersion ? [input.rollupCreatorVersion] : [],
  );
