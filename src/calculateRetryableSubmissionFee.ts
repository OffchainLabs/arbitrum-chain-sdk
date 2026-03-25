import { Address, PublicClient, Transport, Chain, parseAbi } from 'viem';

// Matches DEFAULT_SUBMISSION_FEE_PERCENT_INCREASE in @arbitrum/sdk's ParentToChildMessageGasEstimator
const SUBMISSION_FEE_PERCENT_INCREASE = 300n;

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

  const submissionFee = await parentChainPublicClient.readContract({
    address: inbox,
    abi: inboxABI,
    functionName: 'calculateRetryableSubmissionFee',
    args: [dataLength, block.baseFeePerGas],
  });

  return submissionFee + (submissionFee * SUBMISSION_FEE_PERCENT_INCREASE) / 100n;
}
