import { describe, it, expect } from 'vitest';
import { createPublicClient, encodeFunctionData, http, zeroAddress, parseAbi } from 'viem';

import { nitroTestnodeL1, nitroTestnodeL2, nitroTestnodeL3 } from './chains';
import {
  getInformationFromTestnode,
  getNitroTestnodePrivateKeyAccounts,
  PrivateKeyAccountWithPrivateKey,
} from './testHelpers';
import { createTokenBridgePrepareTransactionRequest } from './createTokenBridgePrepareTransactionRequest';
import { createTokenBridgePrepareTransactionReceipt } from './createTokenBridgePrepareTransactionReceipt';
import { deployTokenBridgeCreator } from './createTokenBridge-testHelpers';
import { deployTokenBridgeCreator as deployAnvilTokenBridgeCreator } from './integrationTestHelpers/anvilHarnessHelpers';
import { CreateTokenBridgeEnoughCustomFeeTokenAllowanceParams } from './createTokenBridgeEnoughCustomFeeTokenAllowance';
import { createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequest } from './createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequest';
import { erc20ABI } from './contracts/ERC20';
import { createTokenBridgePrepareSetWethGatewayTransactionRequest } from './createTokenBridgePrepareSetWethGatewayTransactionRequest';
import { createTokenBridgePrepareSetWethGatewayTransactionReceipt } from './createTokenBridgePrepareSetWethGatewayTransactionReceipt';
import { createTokenBridge } from './createTokenBridge';
import { TokenBridgeContracts } from './types/TokenBridgeContracts';
import { scaleFrom18DecimalsToNativeTokenDecimals } from './utils/decimals';
import { getWethAddress } from './utils/getWethAddress';
import { isAnvilTestMode, getAnvilTestStack } from './integrationTestHelpers/injectedMode';
import { Address } from 'viem';

const env = isAnvilTestMode() ? getAnvilTestStack() : undefined;

let l2Rollup: Address;
let l2RollupOwner: PrivateKeyAccountWithPrivateKey;
let l3Rollup: Address;
let l3RollupOwner: PrivateKeyAccountWithPrivateKey;
let l3TokenBridgeDeployer: PrivateKeyAccountWithPrivateKey;
let l3NativeToken: Address;

if (env) {
  l2Rollup = env.l2.rollup;
  l2RollupOwner = env.l2.accounts.rollupOwner;
  l3RollupOwner = env.l3.accounts.rollupOwner;
  l3TokenBridgeDeployer = env.l3.accounts.tokenBridgeDeployer;
  l3NativeToken = env.l3.nativeToken;
  l3Rollup = env.l3.rollup;
} else {
  const testnodeAccounts = getNitroTestnodePrivateKeyAccounts();
  l2RollupOwner = testnodeAccounts.l2RollupOwner;
  l3RollupOwner = testnodeAccounts.l3RollupOwner;
  l3TokenBridgeDeployer = testnodeAccounts.l3TokenBridgeDeployer;

  const testnodeInformation = getInformationFromTestnode();
  l2Rollup = testnodeInformation.rollup;
  l3Rollup = testnodeInformation.l3Rollup;
  l3NativeToken = testnodeInformation.l3NativeToken;
}

const l1Client = createPublicClient({
  chain: env ? env.l1.chain : nitroTestnodeL1,
  transport: env ? http(env.l1.rpcUrl) : http(nitroTestnodeL1.rpcUrls.default.http[0]),
});

const l2Client = createPublicClient({
  chain: env ? env.l2.chain : nitroTestnodeL2,
  transport: env ? http(env.l2.rpcUrl) : http(nitroTestnodeL2.rpcUrls.default.http[0]),
});

const l3Client = createPublicClient({
  chain: env ? env.l3.chain : nitroTestnodeL3,
  transport: env ? http(env.l3.rpcUrl) : http(nitroTestnodeL3.rpcUrls.default.http[0]),
});

function checkTokenBridgeContracts(tokenBridgeContracts: TokenBridgeContracts) {
  expect(Object.keys(tokenBridgeContracts)).toHaveLength(2);

  // parent chain contracts
  expect(Object.keys(tokenBridgeContracts.parentChainContracts)).toHaveLength(6);
  expect(tokenBridgeContracts.parentChainContracts.router).not.toEqual(zeroAddress);
  expect(tokenBridgeContracts.parentChainContracts.standardGateway).not.toEqual(zeroAddress);
  expect(tokenBridgeContracts.parentChainContracts.customGateway).not.toEqual(zeroAddress);
  expect(tokenBridgeContracts.parentChainContracts.multicall).not.toEqual(zeroAddress);

  // orbit chain contracts
  expect(Object.keys(tokenBridgeContracts.orbitChainContracts)).toHaveLength(9);
  expect(tokenBridgeContracts.orbitChainContracts.router).not.toEqual(zeroAddress);
  expect(tokenBridgeContracts.orbitChainContracts.standardGateway).not.toEqual(zeroAddress);
  expect(tokenBridgeContracts.orbitChainContracts.customGateway).not.toEqual(zeroAddress);
  expect(tokenBridgeContracts.orbitChainContracts.proxyAdmin).not.toEqual(zeroAddress);
  expect(tokenBridgeContracts.orbitChainContracts.beaconProxyFactory).not.toEqual(zeroAddress);
  expect(tokenBridgeContracts.orbitChainContracts.upgradeExecutor).not.toEqual(zeroAddress);
  expect(tokenBridgeContracts.orbitChainContracts.multicall).not.toEqual(zeroAddress);
}

async function checkWethGateways(
  tokenBridgeContracts: TokenBridgeContracts,
  { customFeeToken }: { customFeeToken: boolean },
) {
  if (customFeeToken) {
    // wethGateway and weth should be the zeroAddress on custom-fee-token chains
    expect(tokenBridgeContracts.orbitChainContracts.wethGateway).toEqual(zeroAddress);
    expect(tokenBridgeContracts.orbitChainContracts.weth).toEqual(zeroAddress);
    expect(tokenBridgeContracts.parentChainContracts.wethGateway).toEqual(zeroAddress);
    expect(tokenBridgeContracts.parentChainContracts.weth).toEqual(zeroAddress);
    return;
  }

  // verify weth gateway (parent chain)
  const registeredWethGatewayOnParentChain = await l1Client.readContract({
    address: tokenBridgeContracts.parentChainContracts.router,
    abi: parseAbi(['function l1TokenToGateway(address) view returns (address)']),
    functionName: 'l1TokenToGateway',
    args: [tokenBridgeContracts.parentChainContracts.weth],
  });
  expect(registeredWethGatewayOnParentChain).toEqual(
    tokenBridgeContracts.parentChainContracts.wethGateway,
  );

  // verify weth gateway (orbit chain)
  // Note: we pass the address of the token on the parent chain when asking for the registered gateway on the orbit chain
  const registeredWethGatewayOnOrbitChain = await l2Client.readContract({
    address: tokenBridgeContracts.orbitChainContracts.router,
    abi: parseAbi(['function l1TokenToGateway(address) view returns (address)']),
    functionName: 'l1TokenToGateway',
    args: [tokenBridgeContracts.parentChainContracts.weth],
  });
  expect(registeredWethGatewayOnOrbitChain).toEqual(
    tokenBridgeContracts.orbitChainContracts.wethGateway,
  );

  expect(tokenBridgeContracts.parentChainContracts.weth).not.toEqual(zeroAddress);
  expect(tokenBridgeContracts.parentChainContracts.wethGateway).not.toEqual(zeroAddress);
  expect(tokenBridgeContracts.orbitChainContracts.weth).not.toEqual(zeroAddress);
  expect(tokenBridgeContracts.orbitChainContracts.wethGateway).not.toEqual(zeroAddress);
}

const nativeTokenDecimals = process.env.INTEGRATION_TEST_DECIMALS
  ? Number(process.env.INTEGRATION_TEST_DECIMALS)
  : 18;

describe('createTokenBridge utils function', () => {
  it(`successfully deploys token bridge contracts through token bridge creator`, async () => {
    // deploy a fresh token bridge creator, because it is only possible to deploy one token bridge per rollup per token bridge creator
    const tokenBridgeCreator = env
      ? await deployAnvilTokenBridgeCreator({
          rpcUrl: env.l1.rpcUrl,
          deployerPrivateKey: env.l2.accounts.deployer.privateKey,
          wethAddress: getWethAddress(l1Client),
        })
      : await deployTokenBridgeCreator({
          publicClient: l1Client,
        });

    const txRequest = await createTokenBridgePrepareTransactionRequest({
      params: {
        rollup: l2Rollup,
        rollupOwner: l2RollupOwner.address,
      },
      parentChainPublicClient: l1Client,
      orbitChainPublicClient: l2Client,
      account: l2RollupOwner.address,
      gasOverrides: {
        gasLimit: {
          base: 6_000_000n,
        },
      },
      retryableGasOverrides: {
        maxGasForFactory: {
          base: 20_000_000n,
        },
        maxGasForContracts: {
          base: 20_000_000n,
        },
        maxSubmissionCostForFactory: {
          base: 4_000_000_000_000n,
        },
        maxSubmissionCostForContracts: {
          base: 4_000_000_000_000n,
        },
      },
      tokenBridgeCreatorAddressOverride: tokenBridgeCreator,
    });
    // sign and send the transaction
    const txHash = await l1Client.sendRawTransaction({
      serializedTransaction: await l2RollupOwner.signTransaction(txRequest),
    });

    // get the transaction receipt after waiting for the transaction to complete
    const txReceipt = createTokenBridgePrepareTransactionReceipt(
      await l1Client.waitForTransactionReceipt({ hash: txHash }),
    );
    expect(txReceipt.status).toEqual('success');

    // checking retryables execution
    const orbitChainRetryableReceipts = await txReceipt.waitForRetryables({
      orbitPublicClient: l2Client,
    });
    expect(orbitChainRetryableReceipts).toHaveLength(2);
    expect(orbitChainRetryableReceipts[0].status).toEqual('success');
    expect(orbitChainRetryableReceipts[1].status).toEqual('success');

    // get contracts
    const tokenBridgeContracts = await txReceipt.getTokenBridgeContracts({
      parentChainPublicClient: l1Client,
    });
    checkTokenBridgeContracts(tokenBridgeContracts);

    // set weth gateway
    const setWethGatewayTxRequest = await createTokenBridgePrepareSetWethGatewayTransactionRequest({
      rollup: l2Rollup,
      parentChainPublicClient: l1Client,
      orbitChainPublicClient: l2Client,
      account: l2RollupOwner.address,
      retryableGasOverrides: {
        gasLimit: {
          base: 100_000n,
        },
      },
      tokenBridgeCreatorAddressOverride: tokenBridgeCreator,
    });
    // sign and send the transaction
    const setWethGatewayTxHash = await l1Client.sendRawTransaction({
      serializedTransaction: await l2RollupOwner.signTransaction(setWethGatewayTxRequest),
    });

    // get the transaction receipt after waiting for the transaction to complete
    const setWethGatewayTxReceipt = createTokenBridgePrepareSetWethGatewayTransactionReceipt(
      await l1Client.waitForTransactionReceipt({ hash: setWethGatewayTxHash }),
    );

    // checking retryables execution
    const orbitChainSetGatewayRetryableReceipt = await setWethGatewayTxReceipt.waitForRetryables({
      orbitPublicClient: l2Client,
    });
    expect(orbitChainSetGatewayRetryableReceipt).toHaveLength(1);
    expect(orbitChainSetGatewayRetryableReceipt[0].status).toEqual('success');

    checkWethGateways(tokenBridgeContracts, { customFeeToken: false });
  });

  it(`successfully deploys token bridge contracts with a custom fee token through token bridge creator`, async () => {
    // deploy a fresh token bridge creator, because it is only possible to deploy one token bridge per rollup per token bridge creator
    const tokenBridgeCreator = env
      ? await deployAnvilTokenBridgeCreator({
          rpcUrl: env.l2.rpcUrl,
          deployerPrivateKey: env.l2.accounts.deployer.privateKey,
          wethAddress: (env.l2.chain.contracts as { weth: { address: Address } }).weth.address,
          blockAdvancer: env.l2.blockAdvancer,
        })
      : await deployTokenBridgeCreator({
          publicClient: l2Client,
        });

    // -----------------------------
    // 1. fund l3deployer account
    const fundTxRequestRaw = await l2Client.prepareTransactionRequest({
      chain: l2Client.chain,
      to: l3NativeToken,
      data: encodeFunctionData({
        abi: erc20ABI,
        functionName: 'transfer',
        args: [
          l3RollupOwner.address,
          scaleFrom18DecimalsToNativeTokenDecimals({ amount: 500n, decimals: nativeTokenDecimals }),
        ],
      }),
      value: BigInt(0),
      account: l3TokenBridgeDeployer,
    });

    // sign and send the transaction
    const fundTxRequest = { ...fundTxRequestRaw, chainId: l2Client.chain.id };
    const fundTxHash = await l2Client.sendRawTransaction({
      serializedTransaction: await l3TokenBridgeDeployer.signTransaction(fundTxRequest),
    });

    // get the transaction receipt after waiting for the transaction to complete
    const fundTxReceipt = await l2Client.waitForTransactionReceipt({
      hash: fundTxHash,
    });
    expect(fundTxReceipt.status).toEqual('success');

    // -----------------------------
    // 2. approve custom fee token to be spent by the TokenBridgeCreator
    const allowanceParams: CreateTokenBridgeEnoughCustomFeeTokenAllowanceParams<
      typeof nitroTestnodeL2
    > = {
      nativeToken: l3NativeToken,
      owner: l3RollupOwner.address,
      publicClient: l2Client,
      tokenBridgeCreatorAddressOverride: tokenBridgeCreator,
    };

    // sign and send the transaction
    const approvalForTokenBridgeCreatorTxHash = await l2Client.sendRawTransaction({
      serializedTransaction: await l3RollupOwner.signTransaction(
        await createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequest(allowanceParams),
      ),
    });

    // get the transaction receipt after waiting for the transaction to complete
    const approvalForNewTokenBridgeCreatorTxReceipt = await l2Client.waitForTransactionReceipt({
      hash: approvalForTokenBridgeCreatorTxHash,
    });
    expect(approvalForNewTokenBridgeCreatorTxReceipt.status).toEqual('success');

    // -----------------------------
    // 3. create the token bridge
    const txRequest = await createTokenBridgePrepareTransactionRequest({
      params: {
        rollup: l3Rollup,
        rollupOwner: l3RollupOwner.address,
      },
      parentChainPublicClient: l2Client,
      orbitChainPublicClient: l3Client,
      account: l3RollupOwner.address,
      gasOverrides: {
        gasLimit: {
          base: 6_000_000n,
        },
      },
      retryableGasOverrides: {
        maxGasForFactory: {
          base: 20_000_000n,
        },
        maxGasForContracts: {
          base: 20_000_000n,
        },
        maxSubmissionCostForFactory: {
          base: 4_000_000_000_000n,
        },
        maxSubmissionCostForContracts: {
          base: 4_000_000_000_000n,
        },
      },
      tokenBridgeCreatorAddressOverride: tokenBridgeCreator,
    });

    // sign and send the transaction
    const txHash = await l2Client.sendRawTransaction({
      serializedTransaction: await l3RollupOwner.signTransaction(txRequest),
    });

    // get the transaction receipt after waiting for the transaction to complete
    const txReceipt = createTokenBridgePrepareTransactionReceipt(
      await l2Client.waitForTransactionReceipt({ hash: txHash }),
    );
    expect(txReceipt.status).toEqual('success');

    // checking retryables execution
    const orbitChainRetryableReceipts = await txReceipt.waitForRetryables({
      orbitPublicClient: l3Client,
    });
    expect(orbitChainRetryableReceipts).toHaveLength(2);
    expect(orbitChainRetryableReceipts[0].status).toEqual('success');
    expect(orbitChainRetryableReceipts[1].status).toEqual('success');

    // get contracts
    const tokenBridgeContracts = await txReceipt.getTokenBridgeContracts({
      parentChainPublicClient: l2Client,
    });

    checkTokenBridgeContracts(tokenBridgeContracts);
    checkWethGateways(tokenBridgeContracts, { customFeeToken: true });
  });
});

describe('createTokenBridge', () => {
  it('successfully deploys token bridge contracts', async () => {
    // deploy a fresh token bridge creator, because it is only possible to deploy one token bridge per rollup per token bridge creator
    const tokenBridgeCreator = env
      ? await deployAnvilTokenBridgeCreator({
          rpcUrl: env.l1.rpcUrl,
          deployerPrivateKey: env.l2.accounts.deployer.privateKey,
          wethAddress: getWethAddress(l1Client),
        })
      : await deployTokenBridgeCreator({
          publicClient: l1Client,
        });

    const { tokenBridgeContracts } = await createTokenBridge({
      rollupOwner: l2RollupOwner.address,
      rollupAddress: l2Rollup,
      account: l2RollupOwner,
      parentChainPublicClient: l1Client,
      orbitChainPublicClient: l2Client,
      tokenBridgeCreatorAddressOverride: tokenBridgeCreator,
      gasOverrides: {
        gasLimit: {
          base: 6_000_000n,
        },
      },
      retryableGasOverrides: {
        maxGasForFactory: {
          base: 20_000_000n,
        },
        maxGasForContracts: {
          base: 20_000_000n,
        },
        maxSubmissionCostForFactory: {
          base: 4_000_000_000_000n,
        },
        maxSubmissionCostForContracts: {
          base: 4_000_000_000_000n,
        },
      },
      setWethGatewayGasOverrides: {
        gasLimit: {
          base: 100_000n,
        },
      },
    });

    checkTokenBridgeContracts(tokenBridgeContracts);
    checkWethGateways(tokenBridgeContracts, { customFeeToken: false });
  });

  it('successfully deploys token bridge contracts with a custom fee token', async () => {
    //   // deploy a fresh token bridge creator, because it is only possible to deploy one token bridge per rollup per token bridge creator
    const tokenBridgeCreator = env
      ? await deployAnvilTokenBridgeCreator({
          rpcUrl: env.l2.rpcUrl,
          deployerPrivateKey: env.l2.accounts.deployer.privateKey,
          wethAddress: (env.l2.chain.contracts as { weth: { address: Address } }).weth.address,
          blockAdvancer: env.l2.blockAdvancer,
        })
      : await deployTokenBridgeCreator({
          publicClient: l2Client,
        });

    // -----------------------------
    // 1. fund l3deployer account
    const fundTxRequestRaw = await l2Client.prepareTransactionRequest({
      chain: l2Client.chain,
      to: l3NativeToken,
      data: encodeFunctionData({
        abi: erc20ABI,
        functionName: 'transfer',
        args: [
          l3RollupOwner.address,
          scaleFrom18DecimalsToNativeTokenDecimals({ amount: 500n, decimals: nativeTokenDecimals }),
        ],
      }),
      value: BigInt(0),
      account: l3TokenBridgeDeployer,
    });

    // sign and send the transaction
    const fundTxRequest = { ...fundTxRequestRaw, chainId: l2Client.chain.id };
    const fundTxHash = await l2Client.sendRawTransaction({
      serializedTransaction: await l3TokenBridgeDeployer.signTransaction(fundTxRequest),
    });

    // get the transaction receipt after waiting for the transaction to complete
    const fundTxReceipt = await l2Client.waitForTransactionReceipt({
      hash: fundTxHash,
    });
    expect(fundTxReceipt.status).toEqual('success');

    // -----------------------------
    // 2. Deploy token bridge contracts
    const { tokenBridgeContracts } = await createTokenBridge({
      rollupOwner: l3RollupOwner.address,
      rollupAddress: l3Rollup,
      account: l3RollupOwner,
      parentChainPublicClient: l2Client,
      orbitChainPublicClient: l3Client,
      nativeTokenAddress: l3NativeToken,
      tokenBridgeCreatorAddressOverride: tokenBridgeCreator,
      gasOverrides: {
        gasLimit: {
          base: 6_000_000n,
        },
      },
      retryableGasOverrides: {
        maxGasForFactory: {
          base: 20_000_000n,
        },
        maxGasForContracts: {
          base: 20_000_000n,
        },
        maxSubmissionCostForFactory: {
          base: 4_000_000_000_000n,
        },
        maxSubmissionCostForContracts: {
          base: 4_000_000_000_000n,
        },
      },
    });

    checkTokenBridgeContracts(tokenBridgeContracts);
    checkWethGateways(tokenBridgeContracts, { customFeeToken: true });
  });

  it('should throw when createTokenBridge is called multiple times', async () => {
    const tokenBridgeCreator = env
      ? await deployAnvilTokenBridgeCreator({
          rpcUrl: env.l1.rpcUrl,
          deployerPrivateKey: env.l2.accounts.deployer.privateKey,
          wethAddress: getWethAddress(l1Client),
        })
      : await deployTokenBridgeCreator({
          publicClient: l1Client,
        });

    const cfg = {
      rollupOwner: l2RollupOwner.address,
      rollupAddress: l2Rollup,
      account: l2RollupOwner,
      parentChainPublicClient: l1Client,
      orbitChainPublicClient: l2Client,
      tokenBridgeCreatorAddressOverride: tokenBridgeCreator,
      gasOverrides: {
        gasLimit: {
          base: 6_000_000n,
        },
      },
      retryableGasOverrides: {
        maxGasForFactory: {
          base: 20_000_000n,
        },
        maxGasForContracts: {
          base: 20_000_000n,
        },
        maxSubmissionCostForFactory: {
          base: 4_000_000_000_000n,
        },
        maxSubmissionCostForContracts: {
          base: 4_000_000_000_000n,
        },
      },
      setWethGatewayGasOverrides: {
        gasLimit: {
          base: 100_000n,
        },
      },
    };
    const { tokenBridgeContracts } = await createTokenBridge(cfg);
    await expect(createTokenBridge(cfg)).rejects.toThrowError(
      `Token bridge contracts for Rollup ${l2Rollup} are already deployed`,
    );

    checkTokenBridgeContracts(tokenBridgeContracts);
    checkWethGateways(tokenBridgeContracts, { customFeeToken: false });
  });
});
