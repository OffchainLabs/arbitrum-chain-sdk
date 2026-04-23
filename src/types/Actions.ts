import { Address, Chain, PrepareTransactionRequestReturnType } from 'viem';
import { Prettify } from './utils';

// Pin the transaction type to `eip1559` so viem's v2 `PrepareTransactionRequestReturnType`
// narrows its discriminated union to the EIP-1559 branch. This exposes the fee fields we
// always populate (gas / maxFeePerGas / maxPriorityFeePerGas) and makes the result
// assignable to `OneOf<TransactionSerializable>` for `signTransaction` / `sendRawTransaction`.
type Eip1559Request = { type: 'eip1559' };

type isEmptyObject<Args> = Args extends Record<string, never> ? true : false;

/**
 * Actions require contract address, but as part of decorators, the address might have been passed already to the decorator.
 *
 * If the address was passed to the decorator, it's now optional (we still allow overrides of the address per action).
 * If the action doesn't have any other parameters beside the contract address, then parameters can either be { contract: address } or void
 */
export type ActionParameters<Args, ContractName extends string, Curried extends boolean> = Prettify<
  Curried extends false
    ? isEmptyObject<Args> extends true
      ? { [key in ContractName]: Address } // Contract wasn't curried. Args is an empty object. Only requires the contract name
      : { params: Args } & { [key in ContractName]: Address } // Contract wasn't curried. Args is not empty. Requires both params and contract name
    : isEmptyObject<Args> extends true
    ? { [key in ContractName]: Address } | void // Contract was curried. Args is empty. Only requires the contract name. Allows no parameters
    : { params: Args } & { [key in ContractName]?: Address } // Contract was curried. Args is not empty. Requires params, contract name is optional
>;

export type WithAccount<Args> = Args & {
  account: Address;
};

export type WithUpgradeExecutor<Args> = Args & {
  upgradeExecutor: Address | false;
};

// Return shape for all `*PrepareTransactionRequest` helpers in the SDK. The SDK always calls
// these helpers with a bound `chain` and an `Address` account override (never a full Account),
// which is why we pin the generics: `Chain` for the client chain, `undefined` for the hoisted
// account, and `Address` for the account override. Narrowing `request` to `{ type: 'eip1559' }`
// makes the result:
//   1. Compatible with `signTransaction` / `sendRawTransaction` (assignable to
//      `OneOf<TransactionSerializable>` via the EIP-1559 branch).
//   2. Expose the `gas` / `maxFeePerGas` / `maxPriorityFeePerGas` fields for gas overrides.
// The `chainId` override intersects with viem's optional `chainId` to make it required —
// the SDK guarantees we populate it before returning.
export type PrepareTransactionRequestReturnTypeWithChainId = PrepareTransactionRequestReturnType<
  Chain,
  undefined,
  undefined,
  Address,
  Eip1559Request
> & {
  chainId: number;
};
