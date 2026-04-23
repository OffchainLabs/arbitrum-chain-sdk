import {
  Chain,
  DecodeFunctionDataReturnType,
  GetTransactionReturnType,
  Transaction,
  decodeFunctionData,
} from 'viem';

import { rollupCreatorABI as rollupCreatorV3Dot2ABI } from './contracts/RollupCreator/v3.2';
import { rollupCreatorABI as rollupCreatorV3Dot1ABI } from './contracts/RollupCreator/v3.1';
import { rollupCreatorABI as rollupCreatorV2Dot1ABI } from './contracts/RollupCreator/v2.1';
import { rollupCreatorABI as rollupCreatorV1Dot1ABI } from './contracts/RollupCreator/v1.1';

import {
  CreateRollupFunctionInputs,
  RollupCreatorABI,
  RollupCreatorVersion,
  RollupCreatorLatestVersion,
} from './types/createRollupTypes';

function createRollupDecodeFunctionData<TAbi extends RollupCreatorABI<RollupCreatorVersion>>(
  data: `0x${string}`,
): DecodeFunctionDataReturnType<TAbi> {
  let result: DecodeFunctionDataReturnType<TAbi> | null = null;

  // try parsing from multiple RollupCreator versions
  [
    // v3.2
    rollupCreatorV3Dot2ABI,
    // v3.1
    rollupCreatorV3Dot1ABI,
    // v2.1
    rollupCreatorV2Dot1ABI,
    // v1.1
    rollupCreatorV1Dot1ABI,
  ].forEach((abi) => {
    try {
      result = decodeFunctionData({ abi, data }) as DecodeFunctionDataReturnType<TAbi>;
    } catch {
      // do nothing
    }
  });

  if (result === null) {
    throw new Error(`[createRollupPrepareTransaction] failed to decode function data`);
  }

  return result;
}

// viem v2's `FormattedTransaction<TChain, 'latest'>` has all `Transaction` fields but with
// an optional `yParity`; callers may pass either shape. The public `CreateRollupTransaction`
// is defined as the raw `Transaction` intersection so consumers keep the v1-style narrow
// shape. Since internally we only read `tx.input`, the runtime is fine either way.
export type CreateRollupTransaction = Transaction & {
  getInputs<
    TVersion extends RollupCreatorVersion = RollupCreatorLatestVersion,
  >(): CreateRollupFunctionInputs<TVersion>;
};

type CreateRollupPrepareTransactionInput<TChain extends Chain | undefined = Chain | undefined> =
  | Transaction
  | GetTransactionReturnType<TChain, 'latest'>;

export function createRollupPrepareTransaction<
  TChain extends Chain | undefined = Chain | undefined,
>(tx: CreateRollupPrepareTransactionInput<TChain>): CreateRollupTransaction {
  // The input is either `Transaction` or viem v2's `FormattedTransaction<TChain, 'latest'>`;
  // the latter has a broader type for `yParity`/`typeHex`. We only read `tx.input`, so
  // widen the local alias to satisfy the `Transaction & {...}` return shape without a spread
  // that keeps the wider fields.
  const base = tx as Transaction;
  return {
    ...base,
    getInputs: function <TVersion extends RollupCreatorVersion = RollupCreatorLatestVersion>() {
      const { functionName, args } = createRollupDecodeFunctionData(tx.input);

      if (functionName !== 'createRollup') {
        throw new Error(`
          [createRollupPrepareTransaction] expected function name to be "createRollup" but got "${functionName}"
        `);
      }

      if (typeof args === 'undefined') {
        throw new Error(`[createRollupPrepareTransaction] failed to decode function data`);
      }

      // System boundary cast: `args` is the decoded calldata from one of four RollupCreator
      // ABIs (runtime-discriminated by trial decoding). The caller asserts which version
      // they want via the `TVersion` generic; the static-type narrowing can't be proven
      // here because the runtime shape is selected by value, not by type.
      return args as CreateRollupFunctionInputs<TVersion>;
    },
  };
}
