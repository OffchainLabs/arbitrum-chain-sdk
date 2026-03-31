import { Chain, createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sanitizePrivateKey } from '../utils/sanitizePrivateKey';

export function toPublicClient<TChain extends Chain | undefined = undefined>(
  rpcUrl: string,
  chain?: TChain,
) {
  return createPublicClient({ chain, transport: http(rpcUrl) });
}

export function toAccount(privateKey: string) {
  return privateKeyToAccount(sanitizePrivateKey(privateKey));
}

export function toWalletClient<TChain extends Chain | undefined = undefined>(
  rpcUrl: string,
  privateKey: string,
  chain?: TChain,
) {
  const account = privateKeyToAccount(sanitizePrivateKey(privateKey));
  return createWalletClient({ account, chain, transport: http(rpcUrl) });
}
