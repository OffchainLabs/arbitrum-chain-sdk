import {
  Abi,
  Address,
  Hex,
  PublicActions,
  WalletClient,
  encodeFunctionData,
  getAddress,
} from 'viem';

export type DeployArtifact = { abi: unknown; bytecode: string };

export type DeployClient = WalletClient & PublicActions;

export type DeployContext = { client: DeployClient; label: string };

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
