import { Address, PublicClient, Transport, Chain } from 'viem';
import { BigNumber, ContractFactory, ethers, ContractInterface } from 'ethers';
import { ParentToChildMessageGasEstimator } from '@arbitrum/sdk';
import { getBaseFee } from '@arbitrum/sdk/dist/lib/utils/lib';
import { RollupAdminLogic__factory } from '@arbitrum/sdk/dist/lib/abi/factories/RollupAdminLogic__factory';
import L1AtomicTokenBridgeCreator from '@arbitrum/token-bridge-contracts/build/contracts/contracts/tokenbridge/ethereum/L1AtomicTokenBridgeCreator.sol/L1AtomicTokenBridgeCreator.json';
import L2AtomicTokenBridgeFactory from '@arbitrum/token-bridge-contracts/build/contracts/contracts/tokenbridge/arbitrum/L2AtomicTokenBridgeFactory.sol/L2AtomicTokenBridgeFactory.json';
import { applyPercentIncrease } from './utils/gasOverrides';
import { TransactionRequestRetryableGasOverrides } from './createTokenBridgePrepareTransactionRequest';
import { registerNewNetwork } from './utils/registerNewNetwork';
import { publicClientToProvider } from './ethers-compat/publicClientToProvider';

type NamedFactory = ContractFactory & { contractName: string };
const NamedFactoryInstance = (contractJson: {
  abi: ContractInterface;
  bytecode: string;
  contractName: string;
}): NamedFactory => {
  const factory = new ContractFactory(contractJson.abi, contractJson.bytecode) as NamedFactory;
  factory['contractName'] = contractJson.contractName;
  return factory;
};

// import from token-bridge-contracts directly to make sure the bytecode is the same
const L2AtomicTokenBridgeFactory__factory = NamedFactoryInstance(L2AtomicTokenBridgeFactory);

export type CreateTokenBridgeGetInputsResult = {
  inbox: Address;
  maxGasForContracts: bigint;
  maxGasPrice: bigint;
  retryableFee: bigint;
};

export async function createTokenBridgeGetInputs<
  TParentChain extends Chain | undefined,
  TOrbitChain extends Chain | undefined,
>(
  l1PublicClient: PublicClient<Transport, TParentChain>,
  l2PublicClient: PublicClient<Transport, TOrbitChain>,
  l1TokenBridgeCreatorAddress: string,
  rollupAddress: string,
  retryableGasOverrides?: TransactionRequestRetryableGasOverrides,
): Promise<CreateTokenBridgeGetInputsResult> {
  const l1Provider = publicClientToProvider(l1PublicClient);
  const l2Provider = publicClientToProvider(l2PublicClient);

  await registerNewNetwork(l1Provider, l2Provider, rollupAddress);

  //// run retryable estimate for deploying L2 factory
  const {
    maxSubmissionCost: maxSubmissionCostForFactoryEstimation,
    maxGas: maxGasForFactoryEstimation,
  } = await getEstimateForDeployingFactory(l1TokenBridgeCreatorAddress, l1Provider, l2Provider);

  const {
    maxSubmissionCost: maxSubmissionCostForContractsEstimation,
    maxGas: maxGasForContractsEstimation,
  } = await getEstimateForDeployingContracts(l1TokenBridgeCreatorAddress, l1Provider, l2Provider);

  //// apply gas overrides
  const maxSubmissionCostForFactory =
    retryableGasOverrides && retryableGasOverrides.maxSubmissionCostForFactory
      ? BigNumber.from(
          applyPercentIncrease({
            base:
              retryableGasOverrides.maxSubmissionCostForFactory.base ??
              BigInt(maxSubmissionCostForFactoryEstimation.toHexString()),
            percentIncrease: retryableGasOverrides.maxSubmissionCostForFactory.percentIncrease,
          }),
        )
      : maxSubmissionCostForFactoryEstimation;

  const maxGasForFactory =
    retryableGasOverrides && retryableGasOverrides.maxGasForFactory
      ? BigNumber.from(
          applyPercentIncrease({
            base:
              retryableGasOverrides.maxGasForFactory.base ??
              BigInt(maxGasForFactoryEstimation.toHexString()),
            percentIncrease: retryableGasOverrides.maxGasForFactory.percentIncrease,
          }),
        )
      : maxGasForFactoryEstimation;

  const maxSubmissionCostForContracts =
    retryableGasOverrides && retryableGasOverrides.maxSubmissionCostForContracts
      ? BigNumber.from(
          applyPercentIncrease({
            base:
              retryableGasOverrides.maxSubmissionCostForContracts.base ??
              BigInt(maxSubmissionCostForContractsEstimation.toHexString()),
            percentIncrease: retryableGasOverrides.maxSubmissionCostForContracts.percentIncrease,
          }),
        )
      : maxSubmissionCostForContractsEstimation;

  const maxGasForContracts =
    retryableGasOverrides && retryableGasOverrides.maxGasForContracts
      ? BigNumber.from(
          applyPercentIncrease({
            base:
              retryableGasOverrides.maxGasForContracts.base ??
              BigInt(maxGasForContractsEstimation.toHexString()),
            percentIncrease: retryableGasOverrides.maxGasForContracts.percentIncrease,
          }),
        )
      : maxGasForContractsEstimation;

  const maxGasPrice =
    retryableGasOverrides && retryableGasOverrides.maxGasPrice
      ? BigNumber.from(retryableGasOverrides.maxGasPrice)
      : await l2Provider.getGasPrice();

  const retryableFee = maxSubmissionCostForFactory
    .add(maxSubmissionCostForContracts)
    .add(maxGasForFactory.mul(maxGasPrice))
    .add(maxGasForContracts.mul(maxGasPrice));

  // get inbox from rollup contract
  const inbox = await RollupAdminLogic__factory.connect(rollupAddress, l1Provider).inbox();

  return {
    inbox: inbox as Address,
    maxGasForContracts: maxGasForContracts.toBigInt(),
    maxGasPrice: maxGasPrice.toBigInt(),
    retryableFee: retryableFee.toBigInt(),
  };
}

export function getFactoryDeploymentDataSize(): number {
  return ethers.utils.hexDataLength(L2AtomicTokenBridgeFactory__factory.bytecode);
}

export async function getContractsDeploymentData(
  l1TokenBridgeCreatorAddress: string,
  l1Provider: ethers.providers.Provider,
) {
  const l1TokenBridgeCreator = new ethers.Contract(
    l1TokenBridgeCreatorAddress,
    L1AtomicTokenBridgeCreator.abi,
  ).connect(l1Provider);

  const l2FactoryTemplate = L2AtomicTokenBridgeFactory__factory.attach(
    await l1TokenBridgeCreator.l2TokenBridgeFactoryTemplate(),
  ).connect(l1Provider);

  const l2Code = {
    router: await l1Provider.getCode(await l1TokenBridgeCreator.l2RouterTemplate()),
    standardGateway: await l1Provider.getCode(
      await l1TokenBridgeCreator.l2StandardGatewayTemplate(),
    ),
    customGateway: await l1Provider.getCode(await l1TokenBridgeCreator.l2CustomGatewayTemplate()),
    wethGateway: await l1Provider.getCode(await l1TokenBridgeCreator.l2WethGatewayTemplate()),
    aeWeth: await l1Provider.getCode(await l1TokenBridgeCreator.l2WethTemplate()),
    upgradeExecutor: await l1Provider.getCode(
      (
        await l1TokenBridgeCreator.l1Templates()
      ).upgradeExecutor,
    ),
    multicall: await l1Provider.getCode(await l1TokenBridgeCreator.l2MulticallTemplate()),
  };

  const calldata = l2FactoryTemplate.interface.encodeFunctionData('deployL2Contracts', [
    l2Code,
    ethers.Wallet.createRandom().address,
    ethers.Wallet.createRandom().address,
    ethers.Wallet.createRandom().address,
    ethers.Wallet.createRandom().address,
    ethers.Wallet.createRandom().address,
    ethers.Wallet.createRandom().address,
    ethers.Wallet.createRandom().address,
    ethers.Wallet.createRandom().address,
  ]);

  return {
    dataSize: ethers.utils.hexDataLength(calldata),
    l2Code,
    l2FactoryTemplate,
  };
}

const getEstimateForDeployingFactory = async (
  l1TokenBridgeCreatorAddress: string,
  l1Provider: ethers.providers.Provider,
  l2Provider: ethers.providers.Provider,
): Promise<{
  maxSubmissionCost: BigNumber;
  maxGas: BigNumber;
}> => {
  const l1TokenBridgeCreator = new ethers.Contract(
    l1TokenBridgeCreatorAddress,
    L1AtomicTokenBridgeCreator.abi,
  ).connect(l1Provider);

  const l1ToL2MsgGasEstimate = new ParentToChildMessageGasEstimator(l2Provider);
  // 300% increase buffer is applied by the SDK
  const maxSubmissionCost = await l1ToL2MsgGasEstimate.estimateSubmissionFee(
    l1Provider,
    await getBaseFee(l1Provider),
    getFactoryDeploymentDataSize(),
  );

  const maxGas = (await l1TokenBridgeCreator.gasLimitForL2FactoryDeployment()) as BigNumber;

  return { maxSubmissionCost, maxGas };
};

async function getEstimateForDeployingContracts(
  l1TokenBridgeCreatorAddress: string,
  l1Provider: ethers.providers.Provider,
  l2Provider: ethers.providers.Provider,
): Promise<{
  maxSubmissionCost: BigNumber;
  maxGas: BigNumber;
}> {
  const { dataSize, l2Code, l2FactoryTemplate } = await getContractsDeploymentData(
    l1TokenBridgeCreatorAddress,
    l1Provider,
  );

  const l1ToL2MsgGasEstimate = new ParentToChildMessageGasEstimator(l2Provider);
  // 300% increase buffer is applied by the SDK
  const maxSubmissionCost = await l1ToL2MsgGasEstimate.estimateSubmissionFee(
    l1Provider,
    await l1Provider.getGasPrice(),
    dataSize,
  );

  const maxGas = await l2FactoryTemplate.estimateGas.deployL2Contracts(
    l2Code,
    ethers.Wallet.createRandom().address,
    ethers.Wallet.createRandom().address,
    ethers.Wallet.createRandom().address,
    ethers.Wallet.createRandom().address,
    ethers.Wallet.createRandom().address,
    ethers.Wallet.createRandom().address,
    ethers.Wallet.createRandom().address,
    ethers.Wallet.createRandom().address,
  );

  return {
    maxSubmissionCost,
    maxGas: maxGas.mul(2),
  };
}

export async function getEstimateForSettingGateway<
  TParentChain extends Chain | undefined,
  TOrbitChain extends Chain | undefined,
>(
  l1ChainOwnerAddress: Address,
  l1UpgradeExecutorAddress: Address,
  l1GatewayRouterAddress: Address,
  setGatewaysCalldata: `0x${string}`,
  parentChainPublicClient: PublicClient<Transport, TParentChain>,
  orbitChainPublicClient: PublicClient<Transport, TOrbitChain>,
) {
  // ethers providers
  const parentChainProvider = publicClientToProvider(parentChainPublicClient);
  const orbitChainProvider = publicClientToProvider(orbitChainPublicClient);

  // run retryable estimate for setting a token gateway in the router
  const l1ToL2MsgGasEstimate = new ParentToChildMessageGasEstimator(orbitChainProvider);

  const setGatewaysGasParams = await l1ToL2MsgGasEstimate.estimateAll(
    {
      from: l1UpgradeExecutorAddress,
      to: l1GatewayRouterAddress,
      l2CallValue: BigNumber.from(0),
      excessFeeRefundAddress: l1ChainOwnerAddress,
      callValueRefundAddress: l1ChainOwnerAddress,
      data: setGatewaysCalldata,
    },
    await getBaseFee(parentChainProvider),
    parentChainProvider,
  );

  return {
    gasLimit: setGatewaysGasParams.gasLimit.toBigInt(),
    maxFeePerGas: setGatewaysGasParams.maxFeePerGas.toBigInt(),
    maxSubmissionCost: setGatewaysGasParams.maxSubmissionCost.toBigInt(),
    deposit: setGatewaysGasParams.deposit.toBigInt(),
  };
}
