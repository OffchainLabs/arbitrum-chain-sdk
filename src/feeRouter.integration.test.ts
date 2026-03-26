import { describe, it, expect } from 'vitest';
import {
  createPublicClient,
  http,
  createWalletClient,
  getAddress,
  parseAbi,
  encodePacked,
  keccak256,
  pad,
} from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

import { nitroTestnodeL1, nitroTestnodeL2 } from './chains';
import { getNitroTestnodePrivateKeyAccounts, PrivateKeyAccountWithPrivateKey } from './testHelpers';
import { feeRouterDeployChildToParentRewardRouter } from './feeRouterDeployChildToParentRewardRouter';
import { feeRouterDeployRewardDistributor } from './feeRouterDeployRewardDistributor';
import { getAnvilTestStack, isAnvilTestMode } from './integrationTestHelpers/injectedMode';

const env = isAnvilTestMode() ? getAnvilTestStack() : undefined;
const randomAccount = privateKeyToAccount(generatePrivateKey());
const randomAccount2 = privateKeyToAccount(generatePrivateKey());

let deployer: PrivateKeyAccountWithPrivateKey;
if (env) {
  deployer = env.l2.accounts.deployer;
} else {
  deployer = getNitroTestnodePrivateKeyAccounts().deployer;
}

const l1Client = createPublicClient({
  chain: env ? env.l1.chain : nitroTestnodeL1,
  transport: http(),
});

const l2Client = createPublicClient({
  chain: env ? env.l2.chain : nitroTestnodeL2,
  transport: http(),
});

const l2WalletClient = createWalletClient({
  chain: env ? env.l2.chain : nitroTestnodeL2,
  transport: http(),
  account: deployer,
});

describe('Fee routing tests', () => {
  it(`successfully deploys and configures an ArbChildToParentRewardRouter`, async () => {
    const childToParentRewardRouterDeploymentTransactionHash =
      await feeRouterDeployChildToParentRewardRouter({
        parentChainPublicClient: l1Client,
        orbitChainWalletClient: l2WalletClient,
        parentChainTargetAddress: randomAccount.address,
      });

    const childToParentRewardRouterDeploymentTransactionReceipt =
      await l2Client.waitForTransactionReceipt({
        hash: childToParentRewardRouterDeploymentTransactionHash,
      });

    expect(childToParentRewardRouterDeploymentTransactionReceipt).to.have.property(
      'contractAddress',
    );

    const childToParentRewardRouterAddress = getAddress(
      childToParentRewardRouterDeploymentTransactionReceipt.contractAddress as `0x${string}`,
    );

    // reading the parentChainTarget
    const parentChainTarget = await l2Client.readContract({
      address: childToParentRewardRouterAddress,
      abi: parseAbi(['function parentChainTarget() view returns (address)']),
      functionName: 'parentChainTarget',
    });

    expect(parentChainTarget).toEqual(randomAccount.address);
  });

  it(`successfully deploys and configures the RewardDistributor`, async () => {
    const recipients = [
      {
        account: randomAccount.address,
        weight: 9000n,
      },
      {
        account: randomAccount2.address,
        weight: 1000n,
      },
    ];
    const rewardDistributorDeploymentTransactionHash = await feeRouterDeployRewardDistributor({
      orbitChainWalletClient: l2WalletClient,
      recipients,
    });

    const rewardDistributorDeploymentTransactionReceipt = await l2Client.waitForTransactionReceipt({
      hash: rewardDistributorDeploymentTransactionHash,
    });

    expect(rewardDistributorDeploymentTransactionReceipt).to.have.property('contractAddress');

    const rewardDistributorAddress = getAddress(
      rewardDistributorDeploymentTransactionReceipt.contractAddress as `0x${string}`,
    );

    // hashing the recipient addresses
    // keccak256(abi.encodePacked(addresses))
    // Note: we need to pad the addresses to 32-bytes, since the packing in Solidity is done that way
    const recipientGroup = keccak256(
      encodePacked(
        ['bytes32', 'bytes32'],
        [
          pad(randomAccount.address, {
            size: 32,
          }),
          pad(randomAccount2.address, {
            size: 32,
          }),
        ],
      ),
    );

    // hashing the weights
    // keccak256(abi.encodePacked(addresses))
    const recipientWeights = keccak256(encodePacked(['uint256', 'uint256'], [9000n, 1000n]));

    // reading the currentRecipientGroup and currentRecipientWeights
    const currentRecipientGroup = await l2Client.readContract({
      address: rewardDistributorAddress,
      abi: parseAbi(['function currentRecipientGroup() view returns (bytes32)']),
      functionName: 'currentRecipientGroup',
    });

    const currentRecipientWeights = await l2Client.readContract({
      address: rewardDistributorAddress,
      abi: parseAbi(['function currentRecipientWeights() view returns (bytes32)']),
      functionName: 'currentRecipientWeights',
    });

    expect(currentRecipientGroup).toEqual(recipientGroup);
    expect(currentRecipientWeights).toEqual(recipientWeights);
  });
});
