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
 * explicit nonces, so a failed send leaves no nonce gap.
 *
 * Throws, naming each transaction, if any reverted or a deployment landed somewhere other than the
 * address predicted from its nonce.
 */
/**
 * EIP-1559 fee caps for a whole wave. viem caps each transaction at 1.2x the current base fee, but a
 * wave can fill several blocks, and each full block raises the base fee by 12.5%, so the last
 * transactions would sit unmined below the base fee. The cap is 2x the base fee, raised 12.5% for
 * every block the wave can fill. Transactions pay the actual base fee, not the cap.
 */
async function waveFees(
  ctx: DeployContext,
  totalGas: bigint,
): Promise<{ maxFeePerGas?: bigint; maxPriorityFeePerGas?: bigint }> {
  const block = await ctx.client.getBlock();
  if (block.baseFeePerGas === null) {
    return {};
  }
  const maxPriorityFeePerGas = await ctx.client.estimateMaxPriorityFeePerGas({
    chain: ctx.client.chain,
  });
  const fullBlocks = (totalGas + block.gasLimit - 1n) / block.gasLimit;
  let maxBaseFee = block.baseFeePerGas * 2n;
  for (let i = 0n; i < fullBlocks; i++) {
    maxBaseFee = (maxBaseFee * 9n) / 8n + 1n;
  }
  return { maxFeePerGas: maxBaseFee + maxPriorityFeePerGas, maxPriorityFeePerGas };
}

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

  const fees = await waveFees(
    ctx,
    gasLimits.reduce((total, gas) => total + gas, 0n),
  );

  let nonce = await ctx.client.getTransactionCount({
    address: account.address,
    blockTag: 'pending',
  });
  const sent: (WaveResult & { name: string; isDeployment: boolean })[] = [];
  for (const [i, key] of keys.entries()) {
    const { name, to, data } = transactions[key];
    const transactionHash = await ctx.client.sendTransaction({
      account,
      chain: ctx.client.chain,
      to,
      data,
      gas: gasLimits[i],
      nonce,
      ...fees,
    });
    const address = to ?? getContractAddress({ from: account.address, nonce: BigInt(nonce) });
    sent.push({ name, transactionHash, address, isDeployment: !to });
    nonce += 1;
  }

  const settled = await Promise.allSettled(
    sent.map((tx) =>
      ctx.client.waitForTransactionReceipt({
        hash: tx.transactionHash,
        timeout: waveReceiptTimeoutMs,
      }),
    ),
  );
  const missing = sent.filter((_, i) => settled[i].status === 'rejected');
  if (missing.length > 0) {
    const minedNonce = await ctx.client.getTransactionCount({ address: account.address });
    // TEMP diagnostics for the litro v0.6.0 stuck-transaction investigation
    const describe = (value: unknown) =>
      JSON.stringify(value, (_, v) => (typeof v === 'bigint' ? v.toString() : v));
    const probe = async (label: string, fn: () => Promise<unknown>) => {
      try {
        console.error(`[sendWave] ${label}: ${describe(await fn())}`);
      } catch (error) {
        console.error(`[sendWave] ${label} failed: ${(error as Error).message.split('\n')[0]}`);
      }
    };
    for (const [i, tx] of sent.entries()) {
      if (settled[i].status === 'rejected') {
        console.error(
          `[sendWave] wait for ${tx.name} rejected: ${
            String((settled[i] as PromiseRejectedResult).reason).split('\n')[0]
          }`,
        );
        await probe(`getTransaction ${tx.name}`, () =>
          ctx.client.getTransaction({ hash: tx.transactionHash }),
        );
      }
    }
    await probe('balance', () => ctx.client.getBalance({ address: account.address }));
    await probe('latest block', async () => {
      const { number, gasUsed, gasLimit, baseFeePerGas, transactions } =
        await ctx.client.getBlock();
      return { number, gasUsed, gasLimit, baseFeePerGas, transactions: transactions.length };
    });
    await probe('txpool_inspect', () => ctx.client.request({ method: 'txpool_inspect' } as never));
    throw new Error(
      `${ctx.label}: no receipt after ${waveReceiptTimeoutMs}ms for ${missing
        .map((tx) => `${tx.name} (${tx.transactionHash})`)
        .join(', ')}; ${account.address} mined nonce ${minedNonce}, wave nonces ${
        nonce - sent.length
      }-${nonce - 1}`,
    );
  }
  const receipts = settled.map(
    (result) => (result as PromiseFulfilledResult<TransactionReceipt>).value,
  );
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
