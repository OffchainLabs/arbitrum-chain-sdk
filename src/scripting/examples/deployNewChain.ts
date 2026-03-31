import { runScript } from '../runScript';
import { createRollupDefaultSchema, createRollupTransform } from '../schemas/createRollup';
import { hexSchema } from '../schemas/common';
import { toWalletClient } from '../viemTransforms';
import { createRollup } from '../../createRollup';
import { setValidKeyset } from '../../setValidKeyset';

const deployNewChainSchema = createRollupDefaultSchema
  .extend({ keyset: hexSchema.optional() })
  .transform((input) => ({
    createRollupArgs: createRollupTransform(input),
    keyset: input.keyset,
    walletClient: toWalletClient(input.parentChainRpcUrl, input.privateKey),
  }));

runScript({
  input: deployNewChainSchema,
  async run(input) {
    const result = await createRollup(...input.createRollupArgs);
    const coreContracts = result.coreContracts;

    if (input.keyset) {
      const [createRollupArgs] = input.createRollupArgs
      await setValidKeyset({
        keyset: input.keyset,
        publicClient: createRollupArgs.parentChainPublicClient,
        walletClient: input.walletClient,
        coreContracts,
      });
    }

    return coreContracts;
  },
});
