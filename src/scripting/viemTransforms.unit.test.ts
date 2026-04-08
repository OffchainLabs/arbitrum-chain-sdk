import { it, expect } from 'vitest';
import { toPublicClient, toAccount, toWalletClient } from './viemTransforms';

// A valid private key (anvil default account #0)
const testPrivateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const testRpcUrl = 'http://localhost:8545';

it('toPublicClient creates a PublicClient from an RPC URL', () => {
  const client = toPublicClient(testRpcUrl);
  expect(client).toBeDefined();
  expect(client.transport).toBeDefined();
});

it('toAccount creates a PrivateKeyAccount from a private key', () => {
  const account = toAccount(testPrivateKey);
  expect(account).toBeDefined();
  expect(account.address).toBeDefined();
});

it('toAccount handles private key without 0x prefix', () => {
  const account = toAccount(testPrivateKey.slice(2));
  expect(account).toBeDefined();
  expect(account.address).toBeDefined();
});

it('toWalletClient creates a WalletClient from an RPC URL and private key', () => {
  const client = toWalletClient(testRpcUrl, testPrivateKey);
  expect(client).toBeDefined();
  expect(client.account).toBeDefined();
  expect(client.transport).toBeDefined();
});
