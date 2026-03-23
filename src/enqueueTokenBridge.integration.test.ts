import { describe, it, expect } from 'vitest';
import { createPublicClient, http, zeroAddress, parseAbi } from 'viem';

import { nitroTestnodeL1, nitroTestnodeL2 } from './chains';
import { getInformationFromTestnode, getNitroTestnodePrivateKeyAccounts } from './testHelpers';
import { enqueueTokenBridgePrepareTransactionRequest } from './enqueueTokenBridgePrepareTransactionRequest';
import { createTokenBridgePrepareTransactionReceipt } from './createTokenBridgePrepareTransactionReceipt';
import { deployTokenBridgeCreator } from './createTokenBridge-testHelpers';
import { enqueueTokenBridgePrepareSetWethGatewayTransactionRequest } from './enqueueTokenBridgePrepareSetWethGatewayTransactionRequest';
import { createTokenBridgePrepareSetWethGatewayTransactionReceipt } from './createTokenBridgePrepareSetWethGatewayTransactionReceipt';
import { TokenBridgeContracts } from './types/TokenBridgeContracts';
import { registerNewNetwork } from './utils/registerNewNetwork';
import { publicClientToProvider } from './ethers-compat/publicClientToProvider';

const testnodeAccounts = getNitroTestnodePrivateKeyAccounts();
const l2RollupOwner = testnodeAccounts.l2RollupOwner;

const nitroTestnodeL1Client = createPublicClient({
  chain: nitroTestnodeL1,
  transport: http(nitroTestnodeL1.rpcUrls.default.http[0]),
});

const nitroTestnodeL2Client = createPublicClient({
  chain: nitroTestnodeL2,
  transport: http(nitroTestnodeL2.rpcUrls.default.http[0]),
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

async function checkWethGateways(tokenBridgeContracts: TokenBridgeContracts) {
  // verify weth gateway (parent chain)
  const registeredWethGatewayOnParentChain = await nitroTestnodeL1Client.readContract({
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
  const registeredWethGatewayOnOrbitChain = await nitroTestnodeL2Client.readContract({
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

describe('enqueueTokenBridge', () => {
  it(`successfully deploys token bridge contracts through token bridge creator`, async () => {
    const testnodeInformation = getInformationFromTestnode();

    // deploy a fresh token bridge creator, because it is only possible to deploy one token bridge per rollup per token bridge creator
    const tokenBridgeCreator = await deployTokenBridgeCreator({
      publicClient: nitroTestnodeL1Client,
    });

    const txRequest = await enqueueTokenBridgePrepareTransactionRequest({
      params: {
        rollup: testnodeInformation.rollup,
        rollupOwner: l2RollupOwner.address,
      },
      parentChainPublicClient: nitroTestnodeL1Client,
      account: l2RollupOwner.address,
      maxGasForContracts: 20_000_000n,
      maxGasForFactory: 20_000_000n,
      maxSubmissionCostForFactory: 4_000_000_000_000n,
      maxSubmissionCostForContracts: 4_000_000_000_000n,
      gasOverrides: {
        gasLimit: {
          base: 6_000_000n,
        },
      },
      tokenBridgeCreatorAddressOverride: tokenBridgeCreator,
    });

    // sign and send the transaction
    const txHash = await nitroTestnodeL1Client.sendRawTransaction({
      serializedTransaction: await l2RollupOwner.signTransaction(txRequest),
    });

    // get the transaction receipt after waiting for the transaction to complete
    const txReceipt = createTokenBridgePrepareTransactionReceipt(
      await nitroTestnodeL1Client.waitForTransactionReceipt({ hash: txHash }),
    );
    expect(txReceipt.status).toEqual('success');

    // register the orbit chain network with @arbitrum/sdk (needed for waitForRetryables)
    await registerNewNetwork(
      publicClientToProvider(nitroTestnodeL1Client),
      publicClientToProvider(nitroTestnodeL2Client),
      testnodeInformation.rollup,
    );

    // checking retryables execution
    const orbitChainRetryableReceipts = await txReceipt.waitForRetryables({
      orbitPublicClient: nitroTestnodeL2Client,
    });
    expect(orbitChainRetryableReceipts).toHaveLength(2);
    expect(orbitChainRetryableReceipts[0].status).toEqual('success');
    expect(orbitChainRetryableReceipts[1].status).toEqual('success');

    // get contracts
    const tokenBridgeContracts = await txReceipt.getTokenBridgeContracts({
      parentChainPublicClient: nitroTestnodeL1Client,
    });
    checkTokenBridgeContracts(tokenBridgeContracts);

    // set weth gateway
    const setWethGatewayTxRequest = await enqueueTokenBridgePrepareSetWethGatewayTransactionRequest(
      {
        rollup: testnodeInformation.rollup,
        parentChainPublicClient: nitroTestnodeL1Client,
        account: l2RollupOwner.address,
        gasLimit: 100_000n,
        maxGasPrice: 200_000_000n,
        maxSubmissionCost: 4_000_000_000_000n,
        tokenBridgeCreatorAddressOverride: tokenBridgeCreator,
      },
    );

    // sign and send the transaction
    const setWethGatewayTxHash = await nitroTestnodeL1Client.sendRawTransaction({
      serializedTransaction: await l2RollupOwner.signTransaction(setWethGatewayTxRequest),
    });

    // get the transaction receipt after waiting for the transaction to complete
    const setWethGatewayTxReceipt = createTokenBridgePrepareSetWethGatewayTransactionReceipt(
      await nitroTestnodeL1Client.waitForTransactionReceipt({ hash: setWethGatewayTxHash }),
    );

    // checking retryables execution
    const orbitChainSetGatewayRetryableReceipt = await setWethGatewayTxReceipt.waitForRetryables({
      orbitPublicClient: nitroTestnodeL2Client,
    });
    expect(orbitChainSetGatewayRetryableReceipt).toHaveLength(1);
    expect(orbitChainSetGatewayRetryableReceipt[0].status).toEqual('success');

    await checkWethGateways(tokenBridgeContracts);
  });
});
