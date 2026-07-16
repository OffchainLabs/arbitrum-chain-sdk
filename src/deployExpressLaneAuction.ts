import { Abi, Address, Hex, WalletClient, encodeFunctionData } from 'viem';

import { deployContractChecked, toDeployContext } from './utils/deployContract';

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
 * Encodes the ExpressLaneAuction `initialize(InitArgs)` calldata. The JSON ABI is cast to `Abi`, so a
 * renamed or dropped InitArgs key escapes the compiler; the unit test round-trips this encoder so such
 * a typo fails in CI rather than at deploy time.
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
 * The proxy is what callers interact with; the logic contract holds no state. ExpressLaneAuction's
 * initialize is guarded by onlyDelegated, so it reverts if called on the implementation directly.
 * We therefore encode initialize into the proxy constructor's data argument: it runs via delegatecall
 * atomically with deployment, exactly like the orbit-actions Foundry deployment script.
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
 *
 * @returns Promise<DeployExpressLaneAuctionResult> {@link DeployExpressLaneAuctionResult} - The proxy address (expressLaneAuction), the implementation address, and the proxy deployment transaction hash
 *
 * @example
 * const { proxyAdmin } = await deployProxyAdmin({ orbitChainWalletClient });
 * const { expressLaneAuction } = await deployExpressLaneAuction({
 *   orbitChainWalletClient,
 *   proxyAdmin,
 *   auctioneer,
 *   biddingToken,
 *   beneficiary,
 *   roundTimingInfo: {
 *     offsetTimestamp: 0n,
 *     roundDurationSeconds: 60n,
 *     auctionClosingSeconds: 15n,
 *     reserveSubmissionSeconds: 15n,
 *   },
 *   minReservePrice: 1n,
 *   auctioneerAdmin,
 *   minReservePriceSetter,
 *   reservePriceSetter,
 *   reservePriceSetterAdmin,
 *   beneficiarySetter,
 *   roundTimingSetter,
 *   masterAdmin,
 * });
 */
export async function deployExpressLaneAuction(
  deployExpressLaneAuctionParams: DeployExpressLaneAuctionParams,
): Promise<DeployExpressLaneAuctionResult> {
  const { orbitChainWalletClient, proxyAdmin, ...initArgs } = deployExpressLaneAuctionParams;
  const ctx = toDeployContext(orbitChainWalletClient, 'deployExpressLaneAuction');

  const { address: implementation } = await deployContractChecked(
    ctx,
    'ExpressLaneAuction implementation',
    expressLaneAuction,
  );

  const initData = encodeExpressLaneAuctionInitData(initArgs);

  // initialize runs via delegatecall inside the proxy constructor, so an invalid config reverts
  // the proxy deployment; deployContractChecked surfaces that as a revert error.
  const proxy = await deployContractChecked(
    ctx,
    'ExpressLaneAuction proxy',
    transparentUpgradeableProxy,
    [implementation, proxyAdmin, initData],
  );

  return {
    expressLaneAuction: proxy.address,
    implementation,
    transactionHash: proxy.transactionHash,
  };
}
