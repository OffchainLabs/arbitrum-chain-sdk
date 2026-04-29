import { PublicClient, Transport, Chain, TransactionReceipt } from 'viem';
import {
  ParentToChildMessageStatus,
  ParentToChildMessageWaitForStatusResult,
  ParentTransactionReceipt,
} from '@arbitrum/sdk';

import { publicClientToProvider } from './ethers-compat/publicClientToProvider';
import { viemTransactionReceiptToEthersTransactionReceipt } from './ethers-compat/viemTransactionReceiptToEthersTransactionReceipt';
import { ethersTransactionReceiptToViemTransactionReceipt } from './ethers-compat/ethersTransactionReceiptToViemTransactionReceipt';

type RedeemedRetryableTicket = Extract<
  ParentToChildMessageWaitForStatusResult,
  { status: ParentToChildMessageStatus.REDEEMED }
>;

export type WaitForRetryablesParameters<TChain extends Chain | undefined> = {
  orbitPublicClient: PublicClient<Transport, TChain>;
};

export type WaitForRetryablesResult = [TransactionReceipt];

export type CreateTokenBridgeSetWethGatewayTransactionReceipt<TChain extends Chain | undefined> =
  TransactionReceipt & {
    waitForRetryables(
      params: WaitForRetryablesParameters<TChain>,
    ): Promise<WaitForRetryablesResult>;
  };

export function createTokenBridgePrepareSetWethGatewayTransactionReceipt<
  TChain extends Chain | undefined,
>(txReceipt: TransactionReceipt): CreateTokenBridgeSetWethGatewayTransactionReceipt<TChain> {
  return {
    ...txReceipt,
    waitForRetryables: async function ({
      orbitPublicClient,
    }: WaitForRetryablesParameters<TChain>): Promise<WaitForRetryablesResult> {
      const ethersTxReceipt = viemTransactionReceiptToEthersTransactionReceipt(txReceipt);
      const parentChainTxReceipt = new ParentTransactionReceipt(ethersTxReceipt);
      const orbitProvider = publicClientToProvider(orbitPublicClient);
      const messages = await parentChainTxReceipt.getParentToChildMessages(orbitProvider);
      const messagesResults = await Promise.all(messages.map((message) => message.waitForStatus()));

      if (messagesResults.length !== 1) {
        throw Error(`Unexpected number of retryable tickets: ${messagesResults.length}`);
      }

      if (messagesResults[0].status !== ParentToChildMessageStatus.REDEEMED) {
        throw Error(`Unexpected status for retryable ticket: ${messages[0].retryableCreationId}`);
      }

      return (
        // these type casts are both fine as we already checked everything above
        (messagesResults as unknown as [RedeemedRetryableTicket])
          //
          .map((result) =>
            ethersTransactionReceiptToViemTransactionReceipt(result.childTxReceipt),
          ) as WaitForRetryablesResult
      );
    },
  };
}
