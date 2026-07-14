import {
  Abi,
  Address,
  Hex,
  WalletClient,
  encodeFunctionData,
  getAddress,
  publicActions,
} from 'viem';

import expressLaneAuction from '@arbitrum/nitro-contracts/build/contracts/src/express-lane-auction/ExpressLaneAuction.sol/ExpressLaneAuction.json';
import transparentUpgradeableProxy from '@arbitrum/nitro-contracts/build/contracts/@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol/TransparentUpgradeableProxy.json';

export type ExpressLaneAuctionRoundTimingInfo = {
  offsetTimestamp: bigint;
  roundDurationSeconds: bigint;
  auctionClosingSeconds: bigint;
  reserveSubmissionSeconds: bigint;
};

export type DeployExpressLaneAuctionParams = {
  orbitChainWalletClient: WalletClient;
  proxyAdmin: Address;
  auctioneer: Address;
  biddingToken: Address;
  beneficiary: Address;
  roundTimingInfo: ExpressLaneAuctionRoundTimingInfo;
  minReservePrice: bigint;
  auctioneerAdmin: Address;
  minReservePriceSetter: Address;
  reservePriceSetter: Address;
  reservePriceSetterAdmin: Address;
  beneficiarySetter: Address;
  roundTimingSetter: Address;
  masterAdmin: Address;
};

export type DeployExpressLaneAuctionResult = {
  expressLaneAuction: Address;
  implementation: Address;
  transactionHash: Hex;
};

/**
 * The ExpressLaneAuction initialize arguments: everything in DeployExpressLaneAuctionParams
 * except the deploy machinery (the wallet client and the proxy admin).
 */
export type ExpressLaneAuctionInitArgs = Omit<
  DeployExpressLaneAuctionParams,
  'orbitChainWalletClient' | 'proxyAdmin'
>;

/**
 * Encodes the ExpressLaneAuction `initialize(InitArgs)` calldata.
 */
export function encodeExpressLaneAuctionInitData(initArgs: ExpressLaneAuctionInitArgs): Hex {
  return encodeFunctionData({
    abi: expressLaneAuction.abi as Abi,
    functionName: 'initialize',
    args: [
      {
        _auctioneer: initArgs.auctioneer,
        _biddingToken: initArgs.biddingToken,
        _beneficiary: initArgs.beneficiary,
        _roundTimingInfo: initArgs.roundTimingInfo,
        _minReservePrice: initArgs.minReservePrice,
        _auctioneerAdmin: initArgs.auctioneerAdmin,
        _minReservePriceSetter: initArgs.minReservePriceSetter,
        _reservePriceSetter: initArgs.reservePriceSetter,
        _reservePriceSetterAdmin: initArgs.reservePriceSetterAdmin,
        _beneficiarySetter: initArgs.beneficiarySetter,
        _roundTimingSetter: initArgs.roundTimingSetter,
        _masterAdmin: initArgs.masterAdmin,
      },
    ],
  });
}

/**
 * Deploys the Timeboost ExpressLaneAuction logic contract and an initialized
 * TransparentUpgradeableProxy in front of it on the orbit (child) chain.
 *
 * The proxy admin must already exist (deploy it first with deployProxyAdmin); it is the contract that
 * can later upgrade this proxy.
 *
 * References:
 * - ExpressLaneAuction contract: https://github.com/OffchainLabs/nitro-contracts/blob/v3.2.0/src/express-lane-auction/ExpressLaneAuction.sol
 * - TransparentUpgradeableProxy contract: https://github.com/OpenZeppelin/openzeppelin-contracts/blob/release-v4.7/contracts/proxy/transparent/TransparentUpgradeableProxy.sol
 *
 * @param {DeployExpressLaneAuctionParams} deployExpressLaneAuctionParams {@link DeployExpressLaneAuctionParams}
 * @param {WalletClient} deployExpressLaneAuctionParams.orbitChainWalletClient - The orbit chain Viem wallet client (this account deploys both contracts)
 * @param {Address} deployExpressLaneAuctionParams.proxyAdmin - The already-deployed ProxyAdmin that will own/upgrade the proxy
 * @param {Address} deployExpressLaneAuctionParams.auctioneer - The account that resolves auctions
 * @param {Address} deployExpressLaneAuctionParams.biddingToken - The ERC20 token used to place bids
 * @param {Address} deployExpressLaneAuctionParams.beneficiary - The account that receives auction proceeds
 * @param {ExpressLaneAuctionRoundTimingInfo} deployExpressLaneAuctionParams.roundTimingInfo - The auction round timing {@link ExpressLaneAuctionRoundTimingInfo}
 * @param {bigint} deployExpressLaneAuctionParams.roundTimingInfo.offsetTimestamp - The unix timestamp (seconds, signed int64) the first round is offset from; must be >= 0
 * @param {bigint} deployExpressLaneAuctionParams.roundTimingInfo.roundDurationSeconds - The duration of each round in seconds; must be in (0, 86400]
 * @param {bigint} deployExpressLaneAuctionParams.roundTimingInfo.auctionClosingSeconds - Seconds before a round during which bidding is closed; must be > 0
 * @param {bigint} deployExpressLaneAuctionParams.roundTimingInfo.reserveSubmissionSeconds - Seconds reserved for reserve-price submission; auctionClosingSeconds + reserveSubmissionSeconds must be <= roundDurationSeconds
 * @param {bigint} deployExpressLaneAuctionParams.minReservePrice - The minimum reserve price; reservePrice is initialized to this value
 * @param {Address} deployExpressLaneAuctionParams.auctioneerAdmin - Admin role for the auctioneer
 * @param {Address} deployExpressLaneAuctionParams.minReservePriceSetter - The account that can set the minimum reserve price
 * @param {Address} deployExpressLaneAuctionParams.reservePriceSetter - The account that can set the reserve price
 * @param {Address} deployExpressLaneAuctionParams.reservePriceSetterAdmin - Admin role for the reserve-price setter
 * @param {Address} deployExpressLaneAuctionParams.beneficiarySetter - The account that can change the beneficiary
 * @param {Address} deployExpressLaneAuctionParams.roundTimingSetter - The account that can change the round timing
 * @param {Address} deployExpressLaneAuctionParams.masterAdmin - Holds DEFAULT_ADMIN_ROLE; the admin for any role without a dedicated admin
 */
export async function deployExpressLaneAuction(
  deployExpressLaneAuctionParams: DeployExpressLaneAuctionParams,
): Promise<DeployExpressLaneAuctionResult> {
  const { orbitChainWalletClient, proxyAdmin, ...initArgs } = deployExpressLaneAuctionParams;
  const client = orbitChainWalletClient.extend(publicActions);

  const implementationTransactionHash = await client.deployContract({
    abi: expressLaneAuction.abi,
    account: orbitChainWalletClient.account!,
    chain: orbitChainWalletClient.chain,
    bytecode: expressLaneAuction.bytecode as Hex,
  });
  const implementationReceipt = await client.waitForTransactionReceipt({
    hash: implementationTransactionHash,
  });
  if (implementationReceipt.status === 'reverted' || !implementationReceipt.contractAddress) {
    throw new Error(
      `deployExpressLaneAuction: implementation deployment ${implementationTransactionHash} reverted (status=${implementationReceipt.status})`,
    );
  }
  const implementation = getAddress(implementationReceipt.contractAddress);

  const initData = encodeExpressLaneAuctionInitData(initArgs);

  const transactionHash = await client.deployContract({
    abi: transparentUpgradeableProxy.abi,
    account: orbitChainWalletClient.account!,
    chain: orbitChainWalletClient.chain,
    args: [implementation, proxyAdmin, initData],
    bytecode: transparentUpgradeableProxy.bytecode as Hex,
  });
  const receipt = await client.waitForTransactionReceipt({ hash: transactionHash });

  if (receipt.status === 'reverted' || !receipt.contractAddress) {
    throw new Error(
      `deployExpressLaneAuction: proxy deployment ${transactionHash} reverted (status=${receipt.status})`,
    );
  }

  return {
    expressLaneAuction: getAddress(receipt.contractAddress),
    implementation,
    transactionHash,
  };
}
