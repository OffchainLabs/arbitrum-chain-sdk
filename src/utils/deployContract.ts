import {
  Abi,
  Address,
  Hex,
  PublicActions,
  TransactionReceipt,
  WalletClient,
  encodeDeployData,
  encodeFunctionData,
  getAddress,
  getContractAddress,
} from 'viem';

export type DeployArtifact = { abi: unknown; bytecode: string };

export type DeployClient = WalletClient & PublicActions;

export type DeployContext = { client: DeployClient; label: string };

// A wave's transactions all reach the mempool before the first is mined, so each receipt should
// arrive within a few blocks. Without a timeout a dropped transaction hangs the deploy forever.
const waveReceiptTimeoutMs = 300_000;

export async function deployContractChecked(
  ctx: DeployContext,
  name: string,
  artifact: DeployArtifact,
  args?: readonly unknown[],
): Promise<{ address: Address; transactionHash: Hex }> {
  const transactionHash = await ctx.client.deployContract({
    abi: artifact.abi as Abi,
    account: ctx.client.account!,
    chain: ctx.client.chain,
    bytecode: artifact.bytecode as Hex,
    ...(args ? { args } : {}),
  });
  const receipt = await ctx.client.waitForTransactionReceipt({ hash: transactionHash });
  if (receipt.status === 'reverted' || !receipt.contractAddress) {
    throw new Error(
      `${ctx.label}: ${name} deployment ${transactionHash} reverted (status=${receipt.status})`,
    );
  }
  return { address: getAddress(receipt.contractAddress), transactionHash };
}

/** One transaction of a wave: a deployment (no `to`) or a call. */
export type WaveTransaction = { name: string; to?: Address; data: Hex };

/** A mined wave transaction. `address` is the created contract, or the call target. */
export type WaveResult = { transactionHash: Hex; address: Address };

export function deployTransaction(
  name: string,
  artifact: DeployArtifact,
  args?: readonly unknown[],
): WaveTransaction {
  return {
    name,
    data: encodeDeployData({
      abi: artifact.abi as Abi,
      bytecode: artifact.bytecode as Hex,
      ...(args ? { args } : {}),
    }),
  };
}

export function callTransaction(
  name: string,
  call: { address: Address; abi: Abi; functionName: string; args: readonly unknown[] },
): WaveTransaction {
  return {
    name,
    to: call.address,
    data: encodeFunctionData({ abi: call.abi, functionName: call.functionName, args: call.args }),
  };
}

/**
 * Sends independent transactions back to back and waits for all of them once, instead of waiting
 * a block per transaction. The transactions must not depend on each other: every gas estimate runs
 * before the first send, against the state the previous wave left. (Estimating after earlier sends
 * is also unreliable: anvil fails such estimates with "nonce too high".) Sends are sequential with
 * explicit nonces, so a failed send leaves no nonce gap. A wave is sent in chunks of at most half a
 * block's gas, each mined before the next is sent (see `chunkByGas`).
 *
 * Throws, naming each transaction, if any reverted or a deployment landed somewhere other than the
 * address predicted from its nonce.
 */
export async function sendWave<TKey extends string>(
  ctx: DeployContext,
  transactions: Record<TKey, WaveTransaction>,
): Promise<Record<TKey, WaveResult>> {
  const account = ctx.client.account!;
  const keys = Object.keys(transactions) as TKey[];

  const gasLimits = await Promise.all(
    keys.map((key) =>
      ctx.client.estimateGas({ account, to: transactions[key].to, data: transactions[key].data }),
    ),
  );

  const { gasLimit: blockGasLimit } = await ctx.client.getBlock();
  const chunks = chunkByGas(keys, gasLimits, blockGasLimit / 2n);

  let nonce = await ctx.client.getTransactionCount({
    address: account.address,
    blockTag: 'pending',
  });
  const sent: (WaveResult & { name: string; isDeployment: boolean })[] = [];
  const receipts: TransactionReceipt[] = [];
  for (const chunk of chunks) {
    const chunkSent: typeof sent = [];
    for (const i of chunk) {
      const { name, to, data } = transactions[keys[i]];
      const transactionHash = await ctx.client.sendTransaction({
        account,
        chain: ctx.client.chain,
        to,
        data,
        gas: gasLimits[i],
        nonce,
      });
      const address = to ?? getContractAddress({ from: account.address, nonce: BigInt(nonce) });
      chunkSent.push({ name, transactionHash, address, isDeployment: !to });
      nonce += 1;
    }

    const settled = await Promise.allSettled(
      chunkSent.map((tx) =>
        ctx.client.waitForTransactionReceipt({
          hash: tx.transactionHash,
          timeout: waveReceiptTimeoutMs,
        }),
      ),
    );
    const missing = chunkSent.filter((_, i) => settled[i].status === 'rejected');
    if (missing.length > 0) {
      const minedNonce = await ctx.client.getTransactionCount({ address: account.address });
      throw new Error(
        `${ctx.label}: no receipt after ${waveReceiptTimeoutMs}ms for ${missing
          .map((tx) => `${tx.name} (${tx.transactionHash})`)
          .join(', ')}; ${account.address} mined nonce ${minedNonce}, sent nonces ${
          nonce - chunkSent.length
        }-${nonce - 1}`,
      );
    }
    sent.push(...chunkSent);
    receipts.push(
      ...settled.map((result) => (result as PromiseFulfilledResult<TransactionReceipt>).value),
    );
  }

  const failures = sent.flatMap((tx, i) => {
    const receipt = receipts[i];
    if (receipt.status === 'reverted') {
      return [`${tx.name} transaction ${tx.transactionHash} reverted`];
    }
    if (
      tx.isDeployment &&
      (!receipt.contractAddress || getAddress(receipt.contractAddress) !== tx.address)
    ) {
      return [
        `${tx.name} deployment ${tx.transactionHash} created ${receipt.contractAddress}, expected ${tx.address}`,
      ];
    }
    return [];
  });
  if (failures.length > 0) {
    throw new Error(`${ctx.label}: ${failures.join('; ')}`);
  }

  return Object.fromEntries(
    keys.map((key, i) => [
      key,
      { transactionHash: sent[i].transactionHash, address: sent[i].address },
    ]),
  ) as Record<TKey, WaveResult>;
}

/**
 * Splits transaction indexes, in order, into runs whose gas limits add up to at most `budget`. A
 * transaction over the budget gets a run of its own.
 *
 * A wave must never queue more gas than one block holds. When anvil (checked on 1.3.5 and 1.7.1)
 * builds a block and a transaction's gas limit does not fit, it skips that transaction but still
 * tries the same sender's later ones; the first small enough to fit fails validation with a nonce
 * gap, and anvil deletes it from the pool for good, so its receipt never comes. The budget is half
 * the block gas limit to leave room for other senders' transactions in the same block.
 */
export function chunkByGas(
  keys: readonly unknown[],
  gasLimits: readonly bigint[],
  budget: bigint,
): number[][] {
  const chunks: number[][] = [];
  let current: number[] = [];
  let currentGas = 0n;
  for (const i of keys.keys()) {
    if (current.length > 0 && currentGas + gasLimits[i] > budget) {
      chunks.push(current);
      current = [];
      currentGas = 0n;
    }
    current.push(i);
    currentGas += gasLimits[i];
  }
  if (current.length > 0) {
    chunks.push(current);
  }
  return chunks;
}

export async function sendAndWait(
  ctx: DeployContext,
  name: string,
  call: { address: Address; abi: Abi; functionName: string; args: readonly unknown[] },
): Promise<void> {
  const data = encodeFunctionData({
    abi: call.abi,
    functionName: call.functionName,
    args: call.args,
  });
  const transactionHash = await ctx.client.sendTransaction({
    account: ctx.client.account!,
    chain: ctx.client.chain,
    to: call.address,
    data,
  });
  const receipt = await ctx.client.waitForTransactionReceipt({ hash: transactionHash });
  if (receipt.status === 'reverted') {
    throw new Error(`${ctx.label}: ${name} transaction ${transactionHash} reverted`);
  }
}
