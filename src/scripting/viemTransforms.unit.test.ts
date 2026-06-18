import { it, expect } from 'vitest';
import {
  toPublicClient,
  toAccount,
  toWalletClient,
  withPublicClient,
  withParentChainPublicClient,
  withChainSign,
  withParentChainSign,
  withChildChainSign,
  withParentReadChildSign,
} from './viemTransforms';

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

// Arbitrum One chainId for connection transform tests
const arbChainId = 42161;

it('withPublicClient strips rpcUrl/chainId and adds publicClient', () => {
  const [result] = withPublicClient({ rpcUrl: testRpcUrl, chainId: arbChainId, rollup: '0x1' });
  expect(result.publicClient).toBeDefined();
  expect(result).toHaveProperty('rollup', '0x1');
  expect(result).not.toHaveProperty('rpcUrl');
  expect(result).not.toHaveProperty('chainId');
});

it('withParentChainPublicClient strips parentChain fields and adds parentChainPublicClient', () => {
  const [result] = withParentChainPublicClient({
    parentChainRpcUrl: testRpcUrl,
    parentChainId: arbChainId,
    rollup: '0x1',
  });
  expect(result.parentChainPublicClient).toBeDefined();
  expect(result).toHaveProperty('rollup', '0x1');
  expect(result).not.toHaveProperty('parentChainRpcUrl');
  expect(result).not.toHaveProperty('parentChainId');
});

it('withChainSign strips connection+privateKey and adds publicClient+account', () => {
  const [result] = withChainSign({
    rpcUrl: testRpcUrl,
    chainId: arbChainId,
    privateKey: testPrivateKey,
    rollup: '0x1',
  });
  expect(result.publicClient).toBeDefined();
  expect(result.account).toBeDefined();
  expect(result.account.address).toBeDefined();
  expect(result).toHaveProperty('rollup', '0x1');
  expect(result).not.toHaveProperty('rpcUrl');
  expect(result).not.toHaveProperty('privateKey');
});

it('withParentChainSign strips parentChain+privateKey and adds parentChainPublicClient+account', () => {
  const [result] = withParentChainSign({
    parentChainRpcUrl: testRpcUrl,
    parentChainId: arbChainId,
    privateKey: testPrivateKey,
    rollup: '0x1',
  });
  expect(result.parentChainPublicClient).toBeDefined();
  expect(result.account).toBeDefined();
  expect(result).toHaveProperty('rollup', '0x1');
  expect(result).not.toHaveProperty('parentChainRpcUrl');
  expect(result).not.toHaveProperty('privateKey');
});

it('withChildChainSign strips orbitChain+privateKey and adds orbitChainWalletClient', () => {
  const [result] = withChildChainSign({
    orbitChainRpcUrl: testRpcUrl,
    orbitChainId: arbChainId,
    privateKey: testPrivateKey,
    extra: 'data',
  });
  expect(result.orbitChainWalletClient).toBeDefined();
  expect(result.orbitChainWalletClient.account).toBeDefined();
  expect(result).toHaveProperty('extra', 'data');
  expect(result).not.toHaveProperty('orbitChainRpcUrl');
  expect(result).not.toHaveProperty('privateKey');
});

it('withParentReadChildSign strips both chains+privateKey and adds both clients', () => {
  const [result] = withParentReadChildSign({
    parentChainRpcUrl: testRpcUrl,
    parentChainId: arbChainId,
    orbitChainRpcUrl: testRpcUrl,
    privateKey: testPrivateKey,
    extra: 'data',
  });
  expect(result.parentChainPublicClient).toBeDefined();
  expect(result.orbitChainWalletClient).toBeDefined();
  expect(result).toHaveProperty('extra', 'data');
  expect(result).not.toHaveProperty('parentChainRpcUrl');
  expect(result).not.toHaveProperty('orbitChainRpcUrl');
  expect(result).not.toHaveProperty('privateKey');
});
