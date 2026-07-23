import { it, expect } from 'vitest';

import { deployWethSchema } from './deployWeth';
import { deployRollupCreatorSchema } from './deployRollupCreator';
import { deployTokenBridgeCreatorSchema } from './deployTokenBridgeCreator';
import { parentChainContractsSchema } from './common';

const rpcUrl = 'http://localhost:8545';
const chainId = 412346;
const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const address = '0x1111111111111111111111111111111111111111';

it('deployWethSchema parses connection + signer into a wallet client', () => {
  const [result] = deployWethSchema.parse({ rpcUrl, chainId, privateKey });
  expect(result.walletClient).toBeDefined();
  expect(result.walletClient.account).toBeDefined();
});

it('deployRollupCreatorSchema parses connection + signer into a wallet client', () => {
  const [result] = deployRollupCreatorSchema.parse({ rpcUrl, chainId, privateKey });
  expect(result.walletClient).toBeDefined();
});

it('deployTokenBridgeCreatorSchema carries l1Weth alongside the wallet client', () => {
  const [result] = deployTokenBridgeCreatorSchema.parse({
    rpcUrl,
    chainId,
    privateKey,
    l1Weth: address,
  });
  expect(result.walletClient).toBeDefined();
  expect(result.l1Weth).toEqual(address);
});

it('deployTokenBridgeCreatorSchema requires l1Weth', () => {
  expect(deployTokenBridgeCreatorSchema.safeParse({ rpcUrl, chainId, privateKey }).success).toBe(
    false,
  );
});

it('parentChainContractsSchema is optional and includes only the requested required fields', () => {
  const schema = parentChainContractsSchema({ rollupCreator: true });

  expect(schema.parse(undefined)).toBeUndefined();
  expect(schema.parse({ rollupCreator: address })).toEqual({ rollupCreator: address });
  expect(schema.safeParse({}).success).toBe(false);
  // fields the command does not read are rejected (strict)
  expect(schema.safeParse({ rollupCreator: address, tokenBridgeCreator: address }).success).toBe(
    false,
  );
});
