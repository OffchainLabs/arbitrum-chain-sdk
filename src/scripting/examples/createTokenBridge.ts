import { z } from 'zod';
import { runScript } from '../runScript';
import { enqueueTokenBridgePrepareTransactionRequestSchema, enqueueTokenBridgePrepareTransactionRequestTransform } from '../schemas/enqueueTokenBridgePrepareTransactionRequest';
import { enqueueTokenBridgePrepareTransactionRequest } from '../../enqueueTokenBridgePrepareTransactionRequest';
import { privateKeyToAccount } from 'viem/accounts';
import { createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequest, createTokenBridgePrepareSetWethGatewayTransactionReceipt, createTokenBridgePrepareTransactionReceipt } from '../..';
import { addressSchema } from '../schemas';
import { zeroAddress } from 'viem';
import { createTokenBridgeEnoughCustomFeeTokenAllowance } from '../../createTokenBridgeEnoughCustomFeeTokenAllowance';
import { enqueueTokenBridgePrepareSetWethGatewayTransactionRequest } from '../../enqueueTokenBridgePrepareSetWethGatewayTransactionRequest';
import { enqueueTokenBridgePrepareSetWethGatewayTransactionRequestSchema, enqueueTokenBridgePrepareSetWethGatewayTransactionRequestTransform } from '../schemas/enqueueTokenBridgePrepareSetWethGatewayTransactionRequest';

const schema = z.object({
    ...enqueueTokenBridgePrepareTransactionRequestSchema.shape,
    ...enqueueTokenBridgePrepareSetWethGatewayTransactionRequestSchema.shape,
  })
  .extend({
    privateKey: z.string().startsWith('0x'),
    nativeToken: addressSchema.default(zeroAddress),
  })
  .transform((input) => {
    const signer = privateKeyToAccount(input.privateKey as `0x${string}`);
    const createTokenBridgeTransformedInput = enqueueTokenBridgePrepareTransactionRequestTransform(input);
    const setWethGatewayTransformedInput = enqueueTokenBridgePrepareSetWethGatewayTransactionRequestTransform(input);
    return {
      createTokenBridgeParams: createTokenBridgeTransformedInput[0],
      setWethGatewayParams: setWethGatewayTransformedInput[0],
      signer,
      nativeToken: input.nativeToken,
    };
  });

runScript(schema, async (input) => {
  const deployer = input.signer;
  const nativeToken = input.nativeToken;
  const createTokenBridgeParams = input.createTokenBridgeParams;
  const setWethGatewayParams = input.setWethGatewayParams;
  
  const parentChainPublicClient = createTokenBridgeParams.parentChainPublicClient;

  if (nativeToken != zeroAddress) {
    // prepare transaction to approve custom fee token spend
    const allowanceParams = {
      nativeToken: nativeToken,
      owner: deployer.address,
      publicClient: parentChainPublicClient,
    };
    if (!(await createTokenBridgeEnoughCustomFeeTokenAllowance(allowanceParams))) {
      const approvalTxRequest =
        await createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequest(allowanceParams);

      // sign and send the transaction
      const approvalTxHash = await parentChainPublicClient.sendRawTransaction({
        serializedTransaction: await deployer.signTransaction(approvalTxRequest),
      });

      // get the transaction receipt after waiting for the transaction to complete
      await parentChainPublicClient.waitForTransactionReceipt({
        hash: approvalTxHash,
      });
    }
  }

  // Deploy the TokenBridge contracts
  const transactionRequest = await enqueueTokenBridgePrepareTransactionRequest(createTokenBridgeParams);
  
  // sign and send the transaction
  const txHash = await parentChainPublicClient.sendRawTransaction({
    serializedTransaction: await deployer.signTransaction(transactionRequest),
  });

  // get the transaction receipt after waiting for the transaction to complete
  const txReceipt = createTokenBridgePrepareTransactionReceipt(
    await parentChainPublicClient.waitForTransactionReceipt({ hash: txHash }),
  );

  // fetching the TokenBridge contracts
  const tokenBridgeContracts = await txReceipt.getTokenBridgeContracts({
    parentChainPublicClient,
  });

  // If the nativeToken is the zero address, we also set the WETH gateway
  if (nativeToken == zeroAddress) {
    const setWethGatewayTransactionRequest =
      await enqueueTokenBridgePrepareSetWethGatewayTransactionRequest({
        rollup: setWethGatewayParams.rollup,
        account: deployer.address,
        parentChainPublicClient,
        rollupDeploymentBlockNumber: txReceipt.blockNumber,
      });

    // sign and send the transaction
    const setWethGatewayTxHash = await parentChainPublicClient.sendRawTransaction({
      serializedTransaction: await deployer.signTransaction(setWethGatewayTransactionRequest),
    });

    // get the transaction receipt after waiting for the transaction to complete
    createTokenBridgePrepareSetWethGatewayTransactionReceipt(
      await parentChainPublicClient.waitForTransactionReceipt({ hash: setWethGatewayTxHash }),
    );
  }

  return tokenBridgeContracts;
});
