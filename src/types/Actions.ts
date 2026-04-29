import { Address, PrepareTransactionRequestReturnType } from 'viem';
import { Prettify } from './utils';

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

export type PrepareTransactionRequestReturnTypeWithChainId = PrepareTransactionRequestReturnType & {
  chainId: number;
};
