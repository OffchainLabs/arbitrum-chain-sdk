import { expect, it } from 'vitest';
import { createPublicClient, http } from 'viem';
import { sepolia, arbitrumSepolia } from 'viem/chains';

import { isAnyTrust } from './isAnyTrust';

it('should return true for AnyTrust chain (RollupCreator v1.1)', async () => {
  const client = createPublicClient({
    chain: arbitrumSepolia,
    transport: http(),
  });
  // https://sepolia.arbiscan.io/tx/0xc21f011b46ce87e34a2f6328f6adf20aa60f4c07a972fab0b34ae9c1b9847ff0
  const isAnyTrustChain = await isAnyTrust({
    publicClient: client,
    rollup: '0xc83d107F43740bD572b299B1C5251CeB79c7fc0a',
  });
  expect(isAnyTrustChain).toBeTruthy();
});

it('should return true for AnyTrust chain (RollupCreator v2.1)', async () => {
  const client = createPublicClient({
    chain: arbitrumSepolia,
    transport: http(),
  });
  // https://sepolia.arbiscan.io/tx/0xc1d9513cee57252ab9a0987e3ac4bf23aca7f5c58478a29439ecb1ef815cd379
  const isAnyTrustChain = await isAnyTrust({
    publicClient: client,
    rollup: '0x66Ef747DFDb01a0c0A3a2CB308216704E64B4A78',
  });
  expect(isAnyTrustChain).toBeTruthy();
});

it('should return true for AnyTrust chain (RollupCreator v3.1)', async () => {
  const client = createPublicClient({
    chain: sepolia,
    transport: http('https://sepolia.gateway.tenderly.co'),
  });
  // https://sepolia.etherscan.io/tx/0xa9d3653df519f230d7b2995c13a7bca2667cefdd82ae0c1c76c834ffb92d8291
  const isAnyTrustChain = await isAnyTrust({
    publicClient: client,
    rollup: '0x0F52486d49959C6b568746dD4D8A7BBa0702AC9D',
  });
  expect(isAnyTrustChain).toBeTruthy();
});

it('should return true for AnyTrust chain (RollupCreator v3.2)', async () => {
  const client = createPublicClient({
    chain: arbitrumSepolia,
    transport: http(),
  });
  // https://sepolia.arbiscan.io/tx/0x6389de2ebc6ab31a4fa45385261a821abcdfd75ffed99d420fefc1f273254acb
  const isAnyTrustChain = await isAnyTrust({
    publicClient: client,
    rollup: '0x02F5266d43aa3FAD50EfA1B6EE413a284aC0B974',
  });
  expect(isAnyTrustChain).toBeTruthy();
});

it('should return false for non AnyTrust chain (RollupCreator v1.1)', async () => {
  const client = createPublicClient({
    chain: arbitrumSepolia,
    transport: http(),
  });
  // https://sepolia.arbiscan.io/tx/0x0bbb740d8b0286654b3d0f63175ec882dcbb7714cbf5207357a4a72a4d2dc640
  const isAnyTrustChain = await isAnyTrust({
    publicClient: client,
    rollup: '0xd0c7b5c4e8f72e0750ed9dc70a10cf6f5afd4787',
  });
  expect(isAnyTrustChain).toBeFalsy();
});

it('should return false for non AnyTrust chain (RollupCreator v2.1)', async () => {
  const client = createPublicClient({
    chain: arbitrumSepolia,
    transport: http(),
  });
  // https://sepolia.arbiscan.io/tx/0xfd638529dec24963075ee8fcd9df0d319c21190a9e3f3cb5e91d7da353666b06
  const isAnyTrustChain = await isAnyTrust({
    publicClient: client,
    rollup: '0xD0c7B5C4E8f72E0750ed9dc70A10cf6F5Afd4787',
  });
  expect(isAnyTrustChain).toBeFalsy();
});

it('should return false for non AnyTrust chain (RollupCreator v3.1)', async () => {
  const client = createPublicClient({
    chain: sepolia,
    transport: http('https://sepolia.gateway.tenderly.co'),
  });
  // https://sepolia.etherscan.io/tx/0x751f1b2bab2806769f663db2141d434e4d8c9b65bc4a5d7ca10ed597f918191f
  const isAnyTrustChain = await isAnyTrust({
    publicClient: client,
    rollup: '0x6677e09F9475Bb66C320Cd50C5db8Ae75D9E42b7',
  });
  expect(isAnyTrustChain).toBeFalsy();
});

it('should return false for non AnyTrust chain (RollupCreator v3.2)', async () => {
  const client = createPublicClient({
    chain: arbitrumSepolia,
    transport: http(),
  });
  // https://sepolia.arbiscan.io/tx/0x529e68fae1aad9d06a469fe93874c4d3dbc4c0260a70a5f9fff8f5f89032c325
  const isAnyTrustChain = await isAnyTrust({
    publicClient: client,
    rollup: '0xE0ed4C1E3e49015052761994755F07c7440a1B44',
  });
  expect(isAnyTrustChain).toBeFalsy();
});
