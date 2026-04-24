import { z } from 'zod';
import { withParentChainPublicClient, toAccount } from '../viemTransforms';
import { createTokenBridgePrepareTransactionRequest } from '../../createTokenBridgePrepareTransactionRequest';
import { createTokenBridgePrepareTransactionReceipt } from '../../createTokenBridgePrepareTransactionReceipt';
import { createTokenBridgePrepareSetWethGatewayTransactionReceipt } from '../../createTokenBridgePrepareSetWethGatewayTransactionReceipt';
import { createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequest } from '../../createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequest';
import {
  addressSchema,
  privateKeySchema,
  parentChainPublicClientSchema,
  gasLimitSchema,
  tokenBridgeRetryableGasOverridesSchema,
} from '../schemas/common';
import { zeroAddress } from 'viem';
import { createTokenBridgeEnoughCustomFeeTokenAllowance } from '../../createTokenBridgeEnoughCustomFeeTokenAllowance';
import { createTokenBridgePrepareSetWethGatewayTransactionRequest } from '../../createTokenBridgePrepareSetWethGatewayTransactionRequest';

export const inputSchema = parentChainPublicClientSchema.extend({
  params: z.object({ rollup: addressSchema, rollupOwner: addressSchema }),
  gasOverrides: gasLimitSchema.optional(),
  retryableGasOverrides: tokenBridgeRetryableGasOverridesSchema.optional(),
  tokenBridgeCreatorAddressOverride: addressSchema.optional(),
  privateKey: privateKeySchema,
  nativeToken: addressSchema.default(zeroAddress),
});

export const schema = inputSchema.strict().transform((input) => {
  const { privateKey, nativeToken, ...rest } = input;
  const signer = toAccount(privateKey);
  const [createTokenBridgeParams] = withParentChainPublicClient({
    ...rest,
    account: signer.address,
  });
  return { createTokenBridgeParams, signer, nativeToken };
});

export const execute = async (input: z.output<typeof schema>) => {
  const deployer = input.signer;
  const nativeToken = input.nativeToken;
  const createTokenBridgeParams = input.createTokenBridgeParams;
  const parentChainPublicClient = createTokenBridgeParams.parentChainPublicClient;

  if (nativeToken !== zeroAddress) {
    const allowanceParams = {
      nativeToken: nativeToken,
      owner: deployer.address,
      publicClient: parentChainPublicClient,
      tokenBridgeCreatorAddressOverride: createTokenBridgeParams.tokenBridgeCreatorAddressOverride,
    };
    if (!(await createTokenBridgeEnoughCustomFeeTokenAllowance(allowanceParams))) {
      const approvalTxRequest =
        await createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequest(allowanceParams);

      const approvalTxHash = await parentChainPublicClient.sendRawTransaction({
        serializedTransaction: await deployer.signTransaction(approvalTxRequest),
      });

      await parentChainPublicClient.waitForTransactionReceipt({
        hash: approvalTxHash,
      });
    }
  }

  const transactionRequest = await createTokenBridgePrepareTransactionRequest(
    createTokenBridgeParams,
  );

  const txHash = await parentChainPublicClient.sendRawTransaction({
    serializedTransaction: await deployer.signTransaction(transactionRequest),
  });

  const txReceipt = createTokenBridgePrepareTransactionReceipt(
    await parentChainPublicClient.waitForTransactionReceipt({ hash: txHash }),
  );

  const tokenBridgeContracts = await txReceipt.getTokenBridgeContracts({
    parentChainPublicClient,
  });

  // If the nativeToken is the zero address, we also set the WETH gateway
  if (nativeToken === zeroAddress) {
    const setWethGatewayTransactionRequest =
      await createTokenBridgePrepareSetWethGatewayTransactionRequest({
        rollup: createTokenBridgeParams.params.rollup,
        account: deployer.address,
        parentChainPublicClient,
        rollupDeploymentBlockNumber: txReceipt.blockNumber,
      });

    const setWethGatewayTxHash = await parentChainPublicClient.sendRawTransaction({
      serializedTransaction: await deployer.signTransaction(setWethGatewayTransactionRequest),
    });

    createTokenBridgePrepareSetWethGatewayTransactionReceipt(
      await parentChainPublicClient.waitForTransactionReceipt({ hash: setWethGatewayTxHash }),
    );
  }

  return tokenBridgeContracts;
};
