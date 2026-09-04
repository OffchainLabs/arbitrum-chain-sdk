import { z } from 'zod';

import { type GenerateGenesisParameters } from '../../generateGenesis';
import { addressSchema, bigintSchema } from './common';

const optionalBooleanString = (value: boolean | undefined) =>
  value === undefined ? undefined : String(value);

export const generateGenesisSchema = z
  .object({
    chainId: bigintSchema,
    arbosVersion: bigintSchema,
    chainOwner: addressSchema,
    l1BaseFee: bigintSchema,
    isAnyTrust: z.boolean().optional(),
    loadDefaultPredeploys: z.boolean().optional(),
    enableNativeTokenSupply: z.boolean().optional(),
    enableTransactionFiltering: z.boolean().optional(),
    customAllocAccountFile: z.string().min(1).optional(),
    maxCodeSize: bigintSchema.prefault('24576'),
    maxInitCodeSize: bigintSchema.prefault('49152'),
  })
  .strict()
  .transform((input): [GenerateGenesisParameters] => [
    {
      chainId: input.chainId.toString(),
      arbosVersion: input.arbosVersion.toString(),
      chainOwner: input.chainOwner,
      l1BaseFee: input.l1BaseFee.toString(),
      isAnyTrust: optionalBooleanString(input.isAnyTrust),
      loadDefaultPredeploys: optionalBooleanString(input.loadDefaultPredeploys),
      enableNativeTokenSupply: optionalBooleanString(input.enableNativeTokenSupply),
      enableTransactionFiltering: optionalBooleanString(input.enableTransactionFiltering),
      customAllocAccountFile: input.customAllocAccountFile,
      maxCodeSize: input.maxCodeSize.toString(),
      maxInitCodeSize: input.maxInitCodeSize.toString(),
    },
  ]);
