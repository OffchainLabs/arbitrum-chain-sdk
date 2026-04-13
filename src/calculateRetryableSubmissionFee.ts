import { Address, PublicClient, Transport, Chain, parseAbi } from 'viem';

const inboxABI = parseAbi([
  'function calculateRetryableSubmissionFee(uint256 dataLength, uint256 baseFee) view returns (uint256)',
]);

export async function calculateRetryableSubmissionFee<TChain extends Chain | undefined>(
  parentChainPublicClient: PublicClient<Transport, TChain>,
  inbox: Address,
  dataLength: bigint,
): Promise<bigint> {
  const block = await parentChainPublicClient.getBlock();
  if (!block.baseFeePerGas) {
    throw new Error('Latest block did not contain base fee');
  }

  return parentChainPublicClient.readContract({
    address: inbox,
    abi: inboxABI,
    functionName: 'calculateRetryableSubmissionFee',
    args: [dataLength, block.baseFeePerGas],
  });
}
