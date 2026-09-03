import { describe, it, expect } from 'vitest';
import { Abi, decodeFunctionData, encodeFunctionData } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

import L1AtomicTokenBridgeCreator from '@arbitrum/token-bridge-contracts/build/contracts/contracts/tokenbridge/ethereum/L1AtomicTokenBridgeCreator.sol/L1AtomicTokenBridgeCreator.json';
import L2AtomicTokenBridgeFactory from '@arbitrum/token-bridge-contracts/build/contracts/contracts/tokenbridge/arbitrum/L2AtomicTokenBridgeFactory.sol/L2AtomicTokenBridgeFactory.json';
import aeWETH from '@arbitrum/token-bridge-contracts/build/contracts/contracts/tokenbridge/libraries/aeWETH.sol/aeWETH.json';
import UpgradeExecutor from '@offchainlabs/upgrade-executor/build/contracts/src/UpgradeExecutor.sol/UpgradeExecutor.json';

import { buildSetTemplatesArgs } from './deployTokenBridgeCreator';

const randomAddress = () => privateKeyToAccount(generatePrivateKey()).address;

describe('buildSetTemplatesArgs', () => {
  // Round-trip the assembled args through the real setTemplates ABI. Distinct addresses per field
  // mean a reordered argument or renamed L1Templates struct field would decode into the wrong slot
  // and fail here, not silently mis-wire the creator at deploy time.
  it('assembles setTemplates args that decode back to the same values', () => {
    const inputs = {
      l1Templates: {
        routerTemplate: randomAddress(),
        standardGatewayTemplate: randomAddress(),
        customGatewayTemplate: randomAddress(),
        wethGatewayTemplate: randomAddress(),
        feeTokenBasedRouterTemplate: randomAddress(),
        feeTokenBasedStandardGatewayTemplate: randomAddress(),
        feeTokenBasedCustomGatewayTemplate: randomAddress(),
        upgradeExecutor: randomAddress(),
      },
      l2TokenBridgeFactory: randomAddress(),
      l2GatewayRouter: randomAddress(),
      l2StandardGateway: randomAddress(),
      l2CustomGateway: randomAddress(),
      l2WethGateway: randomAddress(),
      l2Weth: randomAddress(),
      l2Multicall: randomAddress(),
      l1Weth: randomAddress(),
      l1Multicall: randomAddress(),
      gasLimitForL2FactoryDeployment: 10_000_000n,
    };

    const abi = L1AtomicTokenBridgeCreator.abi as Abi;
    const data = encodeFunctionData({
      abi,
      functionName: 'setTemplates',
      args: buildSetTemplatesArgs(inputs),
    });
    const decoded = decodeFunctionData({ abi, data });

    expect(decoded.functionName).toEqual('setTemplates');
    expect(decoded.args).toEqual([
      inputs.l1Templates,
      inputs.l2TokenBridgeFactory,
      inputs.l2GatewayRouter,
      inputs.l2StandardGateway,
      inputs.l2CustomGateway,
      inputs.l2WethGateway,
      inputs.l2Weth,
      inputs.l2Multicall,
      inputs.l1Weth,
      inputs.l1Multicall,
      inputs.gasLimitForL2FactoryDeployment,
    ]);
  });
});

describe('deployTokenBridgeCreator artifacts', () => {
  it('resolves the key artifacts with populated bytecode', () => {
    const artifacts: [string, { bytecode: string }][] = [
      ['L1AtomicTokenBridgeCreator', L1AtomicTokenBridgeCreator],
      ['L2AtomicTokenBridgeFactory', L2AtomicTokenBridgeFactory],
      ['aeWETH', aeWETH],
      ['UpgradeExecutor', UpgradeExecutor],
    ];
    for (const [name, artifact] of artifacts) {
      expect(artifact.bytecode.startsWith('0x'), name).toBe(true);
      expect(artifact.bytecode.length, name).toBeGreaterThan(2);
    }
  });
});
