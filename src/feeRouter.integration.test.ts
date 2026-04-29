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
import { getNitroTestnodePrivateKeyAccounts } from './testHelpers';
import { feeRouterDeployChildToParentRewardRouter } from './feeRouterDeployChildToParentRewardRouter';
import { feeRouterDeployRewardDistributor } from './feeRouterDeployRewardDistributor';

const testnodeAccounts = getNitroTestnodePrivateKeyAccounts();
const deployer = testnodeAccounts.deployer;
const randomAccount = privateKeyToAccount(generatePrivateKey());
const randomAccount2 = privateKeyToAccount(generatePrivateKey());

const nitroTestnodeL1Client = createPublicClient({
  chain: nitroTestnodeL1,
  transport: http(nitroTestnodeL1.rpcUrls.default.http[0]),
});

const nitroTestnodeL2Client = createPublicClient({
  chain: nitroTestnodeL2,
  transport: http(nitroTestnodeL2.rpcUrls.default.http[0]),
});
const nitroTestnodeL2WalletClient = createWalletClient({
  chain: nitroTestnodeL2,
  transport: http(nitroTestnodeL2.rpcUrls.default.http[0]),
  account: deployer,
});

describe('Fee routing tests', () => {
  it(`successfully deploys and configures an ArbChildToParentRewardRouter`, async () => {
    const childToParentRewardRouterDeploymentTransactionHash =
      await feeRouterDeployChildToParentRewardRouter({
        parentChainPublicClient: nitroTestnodeL1Client,
        orbitChainWalletClient: nitroTestnodeL2WalletClient,
        parentChainTargetAddress: randomAccount.address,
      });

    const childToParentRewardRouterDeploymentTransactionReceipt =
      await nitroTestnodeL2Client.waitForTransactionReceipt({
        hash: childToParentRewardRouterDeploymentTransactionHash,
      });

    expect(childToParentRewardRouterDeploymentTransactionReceipt).to.have.property(
      'contractAddress',
    );

    const childToParentRewardRouterAddress = getAddress(
      childToParentRewardRouterDeploymentTransactionReceipt.contractAddress as `0x${string}`,
    );

    // reading the parentChainTarget
    const parentChainTarget = await nitroTestnodeL2Client.readContract({
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
      orbitChainWalletClient: nitroTestnodeL2WalletClient,
      recipients,
    });

    const rewardDistributorDeploymentTransactionReceipt =
      await nitroTestnodeL2Client.waitForTransactionReceipt({
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
    const currentRecipientGroup = await nitroTestnodeL2Client.readContract({
      address: rewardDistributorAddress,
      abi: parseAbi(['function currentRecipientGroup() view returns (bytes32)']),
      functionName: 'currentRecipientGroup',
    });

    const currentRecipientWeights = await nitroTestnodeL2Client.readContract({
      address: rewardDistributorAddress,
      abi: parseAbi(['function currentRecipientWeights() view returns (bytes32)']),
      functionName: 'currentRecipientWeights',
    });

    expect(currentRecipientGroup).toEqual(recipientGroup);
    expect(currentRecipientWeights).toEqual(recipientWeights);
  });
});
