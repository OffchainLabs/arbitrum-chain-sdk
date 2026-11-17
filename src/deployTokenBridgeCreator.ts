import { Abi, Address, Hex, WalletClient, publicActions } from 'viem';

import {
  WaveTransaction,
  callTransaction,
  deployTransaction,
  sendWave,
} from './utils/deployContract';

import ProxyAdmin from '@arbitrum/nitro-contracts/build/contracts/@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol/ProxyAdmin.json';
import TransparentUpgradeableProxy from '@arbitrum/nitro-contracts/build/contracts/@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol/TransparentUpgradeableProxy.json';
import UpgradeExecutor from '@offchainlabs/upgrade-executor/build/contracts/src/UpgradeExecutor.sol/UpgradeExecutor.json';

import ArbMulticall2 from '@arbitrum/token-bridge-contracts/build/contracts/contracts/rpc-utils/MulticallV2.sol/ArbMulticall2.json';
import Multicall2 from '@arbitrum/token-bridge-contracts/build/contracts/contracts/rpc-utils/MulticallV2.sol/Multicall2.json';
import L1AtomicTokenBridgeCreator from '@arbitrum/token-bridge-contracts/build/contracts/contracts/tokenbridge/ethereum/L1AtomicTokenBridgeCreator.sol/L1AtomicTokenBridgeCreator.json';
import L1TokenBridgeRetryableSender from '@arbitrum/token-bridge-contracts/build/contracts/contracts/tokenbridge/ethereum/L1TokenBridgeRetryableSender.sol/L1TokenBridgeRetryableSender.json';
import L1GatewayRouter from '@arbitrum/token-bridge-contracts/build/contracts/contracts/tokenbridge/ethereum/gateway/L1GatewayRouter.sol/L1GatewayRouter.json';
import L1ERC20Gateway from '@arbitrum/token-bridge-contracts/build/contracts/contracts/tokenbridge/ethereum/gateway/L1ERC20Gateway.sol/L1ERC20Gateway.json';
import L1CustomGateway from '@arbitrum/token-bridge-contracts/build/contracts/contracts/tokenbridge/ethereum/gateway/L1CustomGateway.sol/L1CustomGateway.json';
import L1WethGateway from '@arbitrum/token-bridge-contracts/build/contracts/contracts/tokenbridge/ethereum/gateway/L1WethGateway.sol/L1WethGateway.json';
import L1OrbitGatewayRouter from '@arbitrum/token-bridge-contracts/build/contracts/contracts/tokenbridge/ethereum/gateway/L1OrbitGatewayRouter.sol/L1OrbitGatewayRouter.json';
import L1OrbitERC20Gateway from '@arbitrum/token-bridge-contracts/build/contracts/contracts/tokenbridge/ethereum/gateway/L1OrbitERC20Gateway.sol/L1OrbitERC20Gateway.json';
import L1OrbitCustomGateway from '@arbitrum/token-bridge-contracts/build/contracts/contracts/tokenbridge/ethereum/gateway/L1OrbitCustomGateway.sol/L1OrbitCustomGateway.json';
import L2AtomicTokenBridgeFactory from '@arbitrum/token-bridge-contracts/build/contracts/contracts/tokenbridge/arbitrum/L2AtomicTokenBridgeFactory.sol/L2AtomicTokenBridgeFactory.json';
import L2GatewayRouter from '@arbitrum/token-bridge-contracts/build/contracts/contracts/tokenbridge/arbitrum/gateway/L2GatewayRouter.sol/L2GatewayRouter.json';
import L2ERC20Gateway from '@arbitrum/token-bridge-contracts/build/contracts/contracts/tokenbridge/arbitrum/gateway/L2ERC20Gateway.sol/L2ERC20Gateway.json';
import L2CustomGateway from '@arbitrum/token-bridge-contracts/build/contracts/contracts/tokenbridge/arbitrum/gateway/L2CustomGateway.sol/L2CustomGateway.json';
import L2WethGateway from '@arbitrum/token-bridge-contracts/build/contracts/contracts/tokenbridge/arbitrum/gateway/L2WethGateway.sol/L2WethGateway.json';
import aeWETH from '@arbitrum/token-bridge-contracts/build/contracts/contracts/tokenbridge/libraries/aeWETH.sol/aeWETH.json';

// The templates are only cloned by the creator later, never called; they are initialized here with
// throwaway data purely to lock them (so nobody else can initialize the template instances).
const ADDRESS_DEAD = '0x000000000000000000000000000000000000dEaD' as Address;

const DUMMY_CLONEABLE_PROXY_HASH =
  '0x0000000000000000000000000000000000000000000000000000000000000001' as Hex;

const GAS_LIMIT_FOR_L2_FACTORY_DEPLOYMENT = 10_000_000n;

export type DeployTokenBridgeCreatorParams = {
  walletClient: WalletClient;
  l1Weth: Address;
};

export type L1TokenBridgeTemplates = {
  routerTemplate: Address;
  standardGatewayTemplate: Address;
  customGatewayTemplate: Address;
  wethGatewayTemplate: Address;
  feeTokenBasedRouterTemplate: Address;
  feeTokenBasedStandardGatewayTemplate: Address;
  feeTokenBasedCustomGatewayTemplate: Address;
  upgradeExecutor: Address;
};

export type SetTemplatesInputs = {
  l1Templates: L1TokenBridgeTemplates;
  l2TokenBridgeFactory: Address;
  l2GatewayRouter: Address;
  l2StandardGateway: Address;
  l2CustomGateway: Address;
  l2WethGateway: Address;
  l2Weth: Address;
  l2Multicall: Address;
  l1Weth: Address;
  l1Multicall: Address;
  gasLimitForL2FactoryDeployment: bigint;
};

export type DeployTokenBridgeCreatorResult = {
  tokenBridgeCreator: Address;
  retryableSender: Address;
  proxyAdmin: Address;
  transactionHash: Hex;
};

/**
 * Argument order must match setTemplates' ABI; the unit test round-trips it to catch a reorder.
 */
export function buildSetTemplatesArgs(inputs: SetTemplatesInputs): readonly unknown[] {
  return [
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
  ];
}

function initializeTransaction(
  name: string,
  address: Address,
  abi: unknown,
  args: readonly unknown[],
): WaveTransaction {
  return callTransaction(`${name}.initialize`, {
    address,
    abi: abi as Abi,
    functionName: 'initialize',
    args,
  });
}

/**
 * viem port of https://github.com/OffchainLabs/token-bridge-contracts/blob/v1.2.2/scripts/atomicTokenBridgeDeployer.ts#L224
 *
 * The 36 transactions go out in four waves; each wave is sent at once and mined together, and only
 * touches contracts mined by an earlier wave.
 */
export async function deployTokenBridgeCreator({
  walletClient,
  l1Weth,
}: DeployTokenBridgeCreatorParams): Promise<DeployTokenBridgeCreatorResult> {
  const ctx = { client: walletClient.extend(publicActions), label: 'deployTokenBridgeCreator' };

  // Wave 1: every contract whose constructor needs no other contract. That includes the L1
  // templates and the L2-side contracts, which live on the parent chain only as bytecode carriers
  // (the creator reads their runtime code to build the L2 factory).
  const contracts = await sendWave(ctx, {
    l2Multicall: deployTransaction('ArbMulticall2', ArbMulticall2),
    proxyAdmin: deployTransaction('ProxyAdmin', ProxyAdmin),
    creatorLogic: deployTransaction('L1AtomicTokenBridgeCreator logic', L1AtomicTokenBridgeCreator),
    retryableSenderLogic: deployTransaction(
      'L1TokenBridgeRetryableSender logic',
      L1TokenBridgeRetryableSender,
    ),
    routerTemplate: deployTransaction('L1GatewayRouter', L1GatewayRouter),
    standardGatewayTemplate: deployTransaction('L1ERC20Gateway', L1ERC20Gateway),
    customGatewayTemplate: deployTransaction('L1CustomGateway', L1CustomGateway),
    wethGatewayTemplate: deployTransaction('L1WethGateway', L1WethGateway),
    feeTokenBasedRouterTemplate: deployTransaction('L1OrbitGatewayRouter', L1OrbitGatewayRouter),
    feeTokenBasedStandardGatewayTemplate: deployTransaction(
      'L1OrbitERC20Gateway',
      L1OrbitERC20Gateway,
    ),
    feeTokenBasedCustomGatewayTemplate: deployTransaction(
      'L1OrbitCustomGateway',
      L1OrbitCustomGateway,
    ),
    upgradeExecutor: deployTransaction('UpgradeExecutor', UpgradeExecutor),
    l2Factory: deployTransaction('L2AtomicTokenBridgeFactory', L2AtomicTokenBridgeFactory),
    l2Router: deployTransaction('L2GatewayRouter', L2GatewayRouter),
    l2StandardGateway: deployTransaction('L2ERC20Gateway', L2ERC20Gateway),
    l2CustomGateway: deployTransaction('L2CustomGateway', L2CustomGateway),
    l2WethGateway: deployTransaction('L2WethGateway', L2WethGateway),
    l2Weth: deployTransaction('aeWETH', aeWETH),
    l1Multicall: deployTransaction('Multicall2', Multicall2),
  });
  const address = Object.fromEntries(
    Object.entries(contracts).map(([key, result]) => [key, result.address]),
  ) as Record<keyof typeof contracts, Address>;

  // Wave 2: the proxies (their constructors require the logic to be deployed), and the
  // initializers that lock the logic and template contracts with throwaway data.
  const dead = ADDRESS_DEAD;
  const { tokenBridgeCreator, retryableSender } = await sendWave(ctx, {
    tokenBridgeCreator: deployTransaction(
      'L1AtomicTokenBridgeCreator proxy',
      TransparentUpgradeableProxy,
      [address.creatorLogic, address.proxyAdmin, '0x'],
    ),
    retryableSender: deployTransaction(
      'L1TokenBridgeRetryableSender proxy',
      TransparentUpgradeableProxy,
      [address.retryableSenderLogic, address.proxyAdmin, '0x'],
    ),
    retryableSenderLogicInit: initializeTransaction(
      'L1TokenBridgeRetryableSender (logic)',
      address.retryableSenderLogic,
      L1TokenBridgeRetryableSender.abi,
      [],
    ),
    routerTemplateInit: initializeTransaction(
      'L1GatewayRouter',
      address.routerTemplate,
      L1GatewayRouter.abi,
      [dead, dead, dead, dead, dead],
    ),
    standardGatewayTemplateInit: initializeTransaction(
      'L1ERC20Gateway',
      address.standardGatewayTemplate,
      L1ERC20Gateway.abi,
      [dead, dead, dead, DUMMY_CLONEABLE_PROXY_HASH, dead],
    ),
    customGatewayTemplateInit: initializeTransaction(
      'L1CustomGateway',
      address.customGatewayTemplate,
      L1CustomGateway.abi,
      [dead, dead, dead, dead],
    ),
    wethGatewayTemplateInit: initializeTransaction(
      'L1WethGateway',
      address.wethGatewayTemplate,
      L1WethGateway.abi,
      [dead, dead, dead, dead, dead],
    ),
    feeTokenBasedRouterTemplateInit: initializeTransaction(
      'L1OrbitGatewayRouter',
      address.feeTokenBasedRouterTemplate,
      L1OrbitGatewayRouter.abi,
      [dead, dead, dead, dead, dead],
    ),
    feeTokenBasedStandardGatewayTemplateInit: initializeTransaction(
      'L1OrbitERC20Gateway',
      address.feeTokenBasedStandardGatewayTemplate,
      L1OrbitERC20Gateway.abi,
      [dead, dead, dead, DUMMY_CLONEABLE_PROXY_HASH, dead],
    ),
    feeTokenBasedCustomGatewayTemplateInit: initializeTransaction(
      'L1OrbitCustomGateway',
      address.feeTokenBasedCustomGatewayTemplate,
      L1OrbitCustomGateway.abi,
      [dead, dead, dead, dead],
    ),
    l2RouterInit: initializeTransaction('L2GatewayRouter', address.l2Router, L2GatewayRouter.abi, [
      dead,
      dead,
    ]),
    l2StandardGatewayInit: initializeTransaction(
      'L2ERC20Gateway',
      address.l2StandardGateway,
      L2ERC20Gateway.abi,
      [dead, dead, dead],
    ),
    l2CustomGatewayInit: initializeTransaction(
      'L2CustomGateway',
      address.l2CustomGateway,
      L2CustomGateway.abi,
      [dead, dead],
    ),
    l2WethGatewayInit: initializeTransaction(
      'L2WethGateway',
      address.l2WethGateway,
      L2WethGateway.abi,
      [dead, dead, dead, dead],
    ),
  });

  // Wave 3: initialize the creator proxy, which wires the retryable sender and makes the caller
  // the owner that setTemplates checks.
  await sendWave(ctx, {
    creatorInit: initializeTransaction(
      'L1AtomicTokenBridgeCreator',
      tokenBridgeCreator.address,
      L1AtomicTokenBridgeCreator.abi,
      [retryableSender.address],
    ),
  });

  // Wave 4: register the templates.
  const setTemplatesArgs = buildSetTemplatesArgs({
    l1Templates: {
      routerTemplate: address.routerTemplate,
      standardGatewayTemplate: address.standardGatewayTemplate,
      customGatewayTemplate: address.customGatewayTemplate,
      wethGatewayTemplate: address.wethGatewayTemplate,
      feeTokenBasedRouterTemplate: address.feeTokenBasedRouterTemplate,
      feeTokenBasedStandardGatewayTemplate: address.feeTokenBasedStandardGatewayTemplate,
      feeTokenBasedCustomGatewayTemplate: address.feeTokenBasedCustomGatewayTemplate,
      upgradeExecutor: address.upgradeExecutor,
    },
    l2TokenBridgeFactory: address.l2Factory,
    l2GatewayRouter: address.l2Router,
    l2StandardGateway: address.l2StandardGateway,
    l2CustomGateway: address.l2CustomGateway,
    l2WethGateway: address.l2WethGateway,
    l2Weth: address.l2Weth,
    l2Multicall: address.l2Multicall,
    l1Weth,
    l1Multicall: address.l1Multicall,
    gasLimitForL2FactoryDeployment: GAS_LIMIT_FOR_L2_FACTORY_DEPLOYMENT,
  });
  await sendWave(ctx, {
    setTemplates: callTransaction('L1AtomicTokenBridgeCreator.setTemplates', {
      address: tokenBridgeCreator.address,
      abi: L1AtomicTokenBridgeCreator.abi as Abi,
      functionName: 'setTemplates',
      args: setTemplatesArgs,
    }),
  });

  return {
    tokenBridgeCreator: tokenBridgeCreator.address,
    retryableSender: retryableSender.address,
    proxyAdmin: address.proxyAdmin,
    transactionHash: tokenBridgeCreator.transactionHash,
  };
}
