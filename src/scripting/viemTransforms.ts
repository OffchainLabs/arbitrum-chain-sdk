import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sanitizePrivateKey } from '../utils/sanitizePrivateKey';

export function toPublicClient(rpcUrl: string) {
  return createPublicClient({ transport: http(rpcUrl) });
}

export function toAccount(privateKey: string) {
  return privateKeyToAccount(sanitizePrivateKey(privateKey));
}

export function toWalletClient(rpcUrl: string, privateKey: string) {
  const account = privateKeyToAccount(sanitizePrivateKey(privateKey));
  return createWalletClient({ account, transport: http(rpcUrl) });
}
