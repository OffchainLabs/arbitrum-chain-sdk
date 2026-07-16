import { Abi, Address, Hex, WalletClient } from 'viem';

import {
  DeployContext,
  deployContractChecked,
  sendAndWait,
  toDeployContext,
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

// Argument order must match setTemplates' ABI; the unit test round-trips it to catch a reorder.
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

async function deployAndInitL1Templates(ctx: DeployContext): Promise<L1TokenBridgeTemplates> {
  const routerTemplate = (await deployContractChecked(ctx, 'L1GatewayRouter', L1GatewayRouter))
    .address;
  await sendAndWait(ctx, 'L1GatewayRouter', {
    address: routerTemplate,
    abi: L1GatewayRouter.abi as Abi,
    functionName: 'initialize',
    args: [ADDRESS_DEAD, ADDRESS_DEAD, ADDRESS_DEAD, ADDRESS_DEAD, ADDRESS_DEAD],
  });

  const standardGatewayTemplate = (
    await deployContractChecked(ctx, 'L1ERC20Gateway', L1ERC20Gateway)
  ).address;
  await sendAndWait(ctx, 'L1ERC20Gateway', {
    address: standardGatewayTemplate,
    abi: L1ERC20Gateway.abi as Abi,
    functionName: 'initialize',
    args: [ADDRESS_DEAD, ADDRESS_DEAD, ADDRESS_DEAD, DUMMY_CLONEABLE_PROXY_HASH, ADDRESS_DEAD],
  });

  const customGatewayTemplate = (
    await deployContractChecked(ctx, 'L1CustomGateway', L1CustomGateway)
  ).address;
  await sendAndWait(ctx, 'L1CustomGateway', {
    address: customGatewayTemplate,
    abi: L1CustomGateway.abi as Abi,
    functionName: 'initialize',
    args: [ADDRESS_DEAD, ADDRESS_DEAD, ADDRESS_DEAD, ADDRESS_DEAD],
  });

  const wethGatewayTemplate = (await deployContractChecked(ctx, 'L1WethGateway', L1WethGateway))
    .address;
  await sendAndWait(ctx, 'L1WethGateway', {
    address: wethGatewayTemplate,
    abi: L1WethGateway.abi as Abi,
    functionName: 'initialize',
    args: [ADDRESS_DEAD, ADDRESS_DEAD, ADDRESS_DEAD, ADDRESS_DEAD, ADDRESS_DEAD],
  });

  const feeTokenBasedRouterTemplate = (
    await deployContractChecked(ctx, 'L1OrbitGatewayRouter', L1OrbitGatewayRouter)
  ).address;
  await sendAndWait(ctx, 'L1OrbitGatewayRouter', {
    address: feeTokenBasedRouterTemplate,
    abi: L1OrbitGatewayRouter.abi as Abi,
    functionName: 'initialize',
    args: [ADDRESS_DEAD, ADDRESS_DEAD, ADDRESS_DEAD, ADDRESS_DEAD, ADDRESS_DEAD],
  });

  const feeTokenBasedStandardGatewayTemplate = (
    await deployContractChecked(ctx, 'L1OrbitERC20Gateway', L1OrbitERC20Gateway)
  ).address;
  await sendAndWait(ctx, 'L1OrbitERC20Gateway', {
    address: feeTokenBasedStandardGatewayTemplate,
    abi: L1OrbitERC20Gateway.abi as Abi,
    functionName: 'initialize',
    args: [ADDRESS_DEAD, ADDRESS_DEAD, ADDRESS_DEAD, DUMMY_CLONEABLE_PROXY_HASH, ADDRESS_DEAD],
  });

  const feeTokenBasedCustomGatewayTemplate = (
    await deployContractChecked(ctx, 'L1OrbitCustomGateway', L1OrbitCustomGateway)
  ).address;
  await sendAndWait(ctx, 'L1OrbitCustomGateway', {
    address: feeTokenBasedCustomGatewayTemplate,
    abi: L1OrbitCustomGateway.abi as Abi,
    functionName: 'initialize',
    args: [ADDRESS_DEAD, ADDRESS_DEAD, ADDRESS_DEAD, ADDRESS_DEAD],
  });

  const upgradeExecutor = (await deployContractChecked(ctx, 'UpgradeExecutor', UpgradeExecutor))
    .address;

  return {
    routerTemplate,
    standardGatewayTemplate,
    customGatewayTemplate,
    wethGatewayTemplate,
    feeTokenBasedRouterTemplate,
    feeTokenBasedStandardGatewayTemplate,
    feeTokenBasedCustomGatewayTemplate,
    upgradeExecutor,
  };
}

type L2Placeholders = {
  factory: Address;
  router: Address;
  standardGateway: Address;
  customGateway: Address;
  wethGateway: Address;
  weth: Address;
};

// The L2-side contracts are deployed on the parent chain only as bytecode carriers: the creator
// reads their runtime code to build the L2 factory. They are initialized with throwaway data too.
async function deployAndInitL2Placeholders(ctx: DeployContext): Promise<L2Placeholders> {
  const factory = (
    await deployContractChecked(ctx, 'L2AtomicTokenBridgeFactory', L2AtomicTokenBridgeFactory)
  ).address;

  const router = (await deployContractChecked(ctx, 'L2GatewayRouter', L2GatewayRouter)).address;
  await sendAndWait(ctx, 'L2GatewayRouter', {
    address: router,
    abi: L2GatewayRouter.abi as Abi,
    functionName: 'initialize',
    args: [ADDRESS_DEAD, ADDRESS_DEAD],
  });

  const standardGateway = (await deployContractChecked(ctx, 'L2ERC20Gateway', L2ERC20Gateway))
    .address;
  await sendAndWait(ctx, 'L2ERC20Gateway', {
    address: standardGateway,
    abi: L2ERC20Gateway.abi as Abi,
    functionName: 'initialize',
    args: [ADDRESS_DEAD, ADDRESS_DEAD, ADDRESS_DEAD],
  });

  const customGateway = (await deployContractChecked(ctx, 'L2CustomGateway', L2CustomGateway))
    .address;
  await sendAndWait(ctx, 'L2CustomGateway', {
    address: customGateway,
    abi: L2CustomGateway.abi as Abi,
    functionName: 'initialize',
    args: [ADDRESS_DEAD, ADDRESS_DEAD],
  });

  const wethGateway = (await deployContractChecked(ctx, 'L2WethGateway', L2WethGateway)).address;
  await sendAndWait(ctx, 'L2WethGateway', {
    address: wethGateway,
    abi: L2WethGateway.abi as Abi,
    functionName: 'initialize',
    args: [ADDRESS_DEAD, ADDRESS_DEAD, ADDRESS_DEAD, ADDRESS_DEAD],
  });

  const weth = (await deployContractChecked(ctx, 'aeWETH', aeWETH)).address;

  return { factory, router, standardGateway, customGateway, wethGateway, weth };
}

// Ports token-bridge-contracts' deployL1TokenBridgeCreator to viem. The creator is used later by
// createTokenBridge; the L2-side contracts are deployed here on the parent chain only as bytecode
// carriers, and the canonical L2 factory address is computed on-chain by the creator's initialize.
export async function deployTokenBridgeCreator({
  walletClient,
  l1Weth,
}: DeployTokenBridgeCreatorParams): Promise<DeployTokenBridgeCreatorResult> {
  const ctx = toDeployContext(walletClient, 'deployTokenBridgeCreator');

  const l2Multicall = (await deployContractChecked(ctx, 'ArbMulticall2', ArbMulticall2)).address;
  const proxyAdmin = (await deployContractChecked(ctx, 'ProxyAdmin', ProxyAdmin)).address;

  const creatorLogic = (
    await deployContractChecked(ctx, 'L1AtomicTokenBridgeCreator logic', L1AtomicTokenBridgeCreator)
  ).address;
  const { address: tokenBridgeCreator, transactionHash } = await deployContractChecked(
    ctx,
    'L1AtomicTokenBridgeCreator proxy',
    TransparentUpgradeableProxy,
    [creatorLogic, proxyAdmin, '0x'],
  );

  const retryableSenderLogic = (
    await deployContractChecked(
      ctx,
      'L1TokenBridgeRetryableSender logic',
      L1TokenBridgeRetryableSender,
    )
  ).address;
  const retryableSender = (
    await deployContractChecked(
      ctx,
      'L1TokenBridgeRetryableSender proxy',
      TransparentUpgradeableProxy,
      [retryableSenderLogic, proxyAdmin, '0x'],
    )
  ).address;

  // Lock the retryable sender logic contract, then initialize the creator (which wires the sender).
  await sendAndWait(ctx, 'L1TokenBridgeRetryableSender.initialize (logic)', {
    address: retryableSenderLogic,
    abi: L1TokenBridgeRetryableSender.abi as Abi,
    functionName: 'initialize',
    args: [],
  });
  await sendAndWait(ctx, 'L1AtomicTokenBridgeCreator.initialize', {
    address: tokenBridgeCreator,
    abi: L1AtomicTokenBridgeCreator.abi as Abi,
    functionName: 'initialize',
    args: [retryableSender],
  });

  const l1Templates = await deployAndInitL1Templates(ctx);
  const l2 = await deployAndInitL2Placeholders(ctx);
  const l1Multicall = (await deployContractChecked(ctx, 'Multicall2', Multicall2)).address;

  const setTemplatesArgs = buildSetTemplatesArgs({
    l1Templates,
    l2TokenBridgeFactory: l2.factory,
    l2GatewayRouter: l2.router,
    l2StandardGateway: l2.standardGateway,
    l2CustomGateway: l2.customGateway,
    l2WethGateway: l2.wethGateway,
    l2Weth: l2.weth,
    l2Multicall,
    l1Weth,
    l1Multicall,
    gasLimitForL2FactoryDeployment: GAS_LIMIT_FOR_L2_FACTORY_DEPLOYMENT,
  });
  await sendAndWait(ctx, 'L1AtomicTokenBridgeCreator.setTemplates', {
    address: tokenBridgeCreator,
    abi: L1AtomicTokenBridgeCreator.abi as Abi,
    functionName: 'setTemplates',
    args: setTemplatesArgs,
  });

  return { tokenBridgeCreator, retryableSender, proxyAdmin, transactionHash };
}
