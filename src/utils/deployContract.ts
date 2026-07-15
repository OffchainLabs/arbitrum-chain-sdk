import {
  Abi,
  Account,
  Address,
  Chain,
  Hex,
  WalletClient,
  encodeFunctionData,
  getAddress,
  publicActions,
} from 'viem';

export type DeployArtifact = { abi: unknown; bytecode: string };

function extendWithPublicActions(walletClient: WalletClient) {
  return walletClient.extend(publicActions);
}

export type DeployClient = ReturnType<typeof extendWithPublicActions>;

export type DeployContext = {
  client: DeployClient;
  account: Account;
  chain: Chain | undefined;
  label: string;
};

export function toDeployContext(walletClient: WalletClient, label: string): DeployContext {
  return {
    client: extendWithPublicActions(walletClient),
    account: walletClient.account!,
    chain: walletClient.chain,
    label,
  };
}

export async function deployContractChecked(
  ctx: DeployContext,
  name: string,
  artifact: DeployArtifact,
  args?: readonly unknown[],
): Promise<{ address: Address; transactionHash: Hex }> {
  const transactionHash = await ctx.client.deployContract({
    abi: artifact.abi as Abi,
    account: ctx.account,
    chain: ctx.chain,
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
    account: ctx.account,
    chain: ctx.chain,
    to: call.address,
    data,
  });
  const receipt = await ctx.client.waitForTransactionReceipt({ hash: transactionHash });
  if (receipt.status === 'reverted') {
    throw new Error(`${ctx.label}: ${name} transaction ${transactionHash} reverted`);
  }
}
