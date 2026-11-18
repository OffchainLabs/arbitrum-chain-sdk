import { describe, it, expect } from 'vitest';
import {
  Abi,
  Address,
  Hex,
  createPublicClient,
  createWalletClient,
  getAddress,
  http,
  parseAbi,
  parseEther,
} from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

import testToken from '@arbitrum/nitro-contracts/build/contracts/src/test-helpers/TestToken.sol/TestToken.json';

import { nitroTestnodeL2 } from './chains';
import { getNitroTestnodePrivateKeyAccounts } from './testHelpers';
import { deployProxyAdmin } from './deployProxyAdmin';
import { deployExpressLaneAuction } from './deployExpressLaneAuction';

const deployer = getNitroTestnodePrivateKeyAccounts().deployer;

const nitroTestnodeL2Client = createPublicClient({
  chain: nitroTestnodeL2,
  transport: http(nitroTestnodeL2.rpcUrls.default.http[0]),
});
const nitroTestnodeL2WalletClient = createWalletClient({
  chain: nitroTestnodeL2,
  transport: http(nitroTestnodeL2.rpcUrls.default.http[0]),
  account: deployer,
});

// Distinct random role addresses so the assertions can't accidentally pass by
// every field collapsing to the deployer.
const auctioneer = privateKeyToAccount(generatePrivateKey()).address;
const beneficiary = privateKeyToAccount(generatePrivateKey()).address;
const auctioneerAdmin = privateKeyToAccount(generatePrivateKey()).address;
const minReservePriceSetter = privateKeyToAccount(generatePrivateKey()).address;
const reservePriceSetter = privateKeyToAccount(generatePrivateKey()).address;
const reservePriceSetterAdmin = privateKeyToAccount(generatePrivateKey()).address;
const beneficiarySetter = privateKeyToAccount(generatePrivateKey()).address;
const roundTimingSetter = privateKeyToAccount(generatePrivateKey()).address;
const masterAdmin = privateKeyToAccount(generatePrivateKey()).address;

describe('ExpressLaneAuction deployment tests', () => {
  it('successfully deploys a ProxyAdmin and an initialized ExpressLaneAuction', async () => {
    const { proxyAdmin } = await deployProxyAdmin({
      orbitChainWalletClient: nitroTestnodeL2WalletClient,
    });

    // A real ERC20 stands in as the bidding token; initialize only stores it (no
    // method is called on it at init), but a concrete token keeps the test honest.
    const biddingTokenTransactionHash = await nitroTestnodeL2WalletClient.deployContract({
      abi: testToken.abi as Abi,
      account: deployer,
      chain: nitroTestnodeL2,
      args: [parseEther('1000000')],
      bytecode: testToken.bytecode as Hex,
    });
    const biddingTokenReceipt = await nitroTestnodeL2Client.waitForTransactionReceipt({
      hash: biddingTokenTransactionHash,
    });
    const biddingToken = getAddress(biddingTokenReceipt.contractAddress as Address);

    const latestBlock = await nitroTestnodeL2Client.getBlock();
    const roundTimingInfo = {
      offsetTimestamp: latestBlock.timestamp,
      roundDurationSeconds: 60n,
      auctionClosingSeconds: 15n,
      reserveSubmissionSeconds: 15n,
    };

    const { expressLaneAuction, implementation } = await deployExpressLaneAuction({
      orbitChainWalletClient: nitroTestnodeL2WalletClient,
      proxyAdmin,
      auctioneer,
      biddingToken,
      beneficiary,
      roundTimingInfo,
      minReservePrice: 1n,
      auctioneerAdmin,
      minReservePriceSetter,
      reservePriceSetter,
      reservePriceSetterAdmin,
      beneficiarySetter,
      roundTimingSetter,
      masterAdmin,
    });

    expect(expressLaneAuction).not.toEqual('0x0000000000000000000000000000000000000000');
    expect(implementation).not.toEqual('0x0000000000000000000000000000000000000000');
    expect(expressLaneAuction).not.toEqual(implementation);

    // Query wiring through the ProxyAdmin: a TransparentProxy routes admin/implementation reads away
    // from the proxy itself, so these getters are the authoritative source.
    const proxyAdminAbi = parseAbi([
      'function getProxyAdmin(address) view returns (address)',
      'function getProxyImplementation(address) view returns (address)',
      'function owner() view returns (address)',
    ]);
    const onChainProxyAdmin = await nitroTestnodeL2Client.readContract({
      address: proxyAdmin,
      abi: proxyAdminAbi,
      functionName: 'getProxyAdmin',
      args: [expressLaneAuction],
    });
    expect(onChainProxyAdmin).toEqual(proxyAdmin);
    const onChainImplementation = await nitroTestnodeL2Client.readContract({
      address: proxyAdmin,
      abi: proxyAdminAbi,
      functionName: 'getProxyImplementation',
      args: [expressLaneAuction],
    });
    expect(onChainImplementation).toEqual(implementation);
    const proxyAdminOwner = await nitroTestnodeL2Client.readContract({
      address: proxyAdmin,
      abi: proxyAdminAbi,
      functionName: 'owner',
    });
    expect(proxyAdminOwner).toEqual(getAddress(deployer.address));

    // Reads go through the proxy, proving initialize ran via delegatecall.
    const onChainBiddingToken = await nitroTestnodeL2Client.readContract({
      address: expressLaneAuction,
      abi: parseAbi(['function biddingToken() view returns (address)']),
      functionName: 'biddingToken',
    });
    expect(onChainBiddingToken).toEqual(biddingToken);

    const reservePrice = await nitroTestnodeL2Client.readContract({
      address: expressLaneAuction,
      abi: parseAbi(['function reservePrice() view returns (uint256)']),
      functionName: 'reservePrice',
    });
    expect(reservePrice).toEqual(1n);

    const onChainBeneficiary = await nitroTestnodeL2Client.readContract({
      address: expressLaneAuction,
      abi: parseAbi(['function beneficiary() view returns (address)']),
      functionName: 'beneficiary',
    });
    expect(onChainBeneficiary).toEqual(beneficiary);

    const onChainRoundTimingInfo = await nitroTestnodeL2Client.readContract({
      address: expressLaneAuction,
      abi: parseAbi([
        'function roundTimingInfo() view returns (int64 offsetTimestamp, uint64 roundDurationSeconds, uint64 auctionClosingSeconds, uint64 reserveSubmissionSeconds)',
      ]),
      functionName: 'roundTimingInfo',
    });
    // offsetTimestamp is the signed int64 field, the riskiest to encode; assert it round-trips.
    expect(onChainRoundTimingInfo[0]).toEqual(roundTimingInfo.offsetTimestamp);
    expect(onChainRoundTimingInfo[1]).toEqual(roundTimingInfo.roundDurationSeconds);
    expect(onChainRoundTimingInfo[2]).toEqual(roundTimingInfo.auctionClosingSeconds);
    expect(onChainRoundTimingInfo[3]).toEqual(roundTimingInfo.reserveSubmissionSeconds);

    const onChainMinReservePrice = await nitroTestnodeL2Client.readContract({
      address: expressLaneAuction,
      abi: parseAbi(['function minReservePrice() view returns (uint256)']),
      functionName: 'minReservePrice',
    });
    expect(onChainMinReservePrice).toEqual(1n);

    // The role addresses are otherwise unobservable; reading them back catches a misordered
    // InitArgs tuple that distinct-but-valid addresses would otherwise hide.
    const accessControlAbi = parseAbi([
      'function hasRole(bytes32, address) view returns (bool)',
      'function AUCTIONEER_ROLE() view returns (bytes32)',
      'function AUCTIONEER_ADMIN_ROLE() view returns (bytes32)',
      'function MIN_RESERVE_SETTER_ROLE() view returns (bytes32)',
      'function RESERVE_SETTER_ROLE() view returns (bytes32)',
      'function RESERVE_SETTER_ADMIN_ROLE() view returns (bytes32)',
      'function BENEFICIARY_SETTER_ROLE() view returns (bytes32)',
      'function ROUND_TIMING_SETTER_ROLE() view returns (bytes32)',
      'function DEFAULT_ADMIN_ROLE() view returns (bytes32)',
    ]);
    const roleHolders: [string, Address][] = [
      ['AUCTIONEER_ROLE', auctioneer],
      ['AUCTIONEER_ADMIN_ROLE', auctioneerAdmin],
      ['MIN_RESERVE_SETTER_ROLE', minReservePriceSetter],
      ['RESERVE_SETTER_ROLE', reservePriceSetter],
      ['RESERVE_SETTER_ADMIN_ROLE', reservePriceSetterAdmin],
      ['BENEFICIARY_SETTER_ROLE', beneficiarySetter],
      ['ROUND_TIMING_SETTER_ROLE', roundTimingSetter],
      ['DEFAULT_ADMIN_ROLE', masterAdmin],
    ];
    for (const [roleName, holder] of roleHolders) {
      const roleId = await nitroTestnodeL2Client.readContract({
        address: expressLaneAuction,
        abi: accessControlAbi,
        functionName: roleName as 'AUCTIONEER_ROLE',
      });
      const holdsRole = await nitroTestnodeL2Client.readContract({
        address: expressLaneAuction,
        abi: accessControlAbi,
        functionName: 'hasRole',
        args: [roleId, holder],
      });
      expect(holdsRole, `expected ${holder} to hold ${roleName}`).toEqual(true);
    }
  });

  it('rejects with a revert error when roundTimingInfo is invalid', async () => {
    const { proxyAdmin } = await deployProxyAdmin({
      orbitChainWalletClient: nitroTestnodeL2WalletClient,
    });

    // closing + reserve > duration reverts initialize inside the proxy constructor; the deploy
    // must surface that as a revert error, not an opaque null-address parse failure.
    await expect(
      deployExpressLaneAuction({
        orbitChainWalletClient: nitroTestnodeL2WalletClient,
        proxyAdmin,
        auctioneer,
        biddingToken: auctioneer,
        beneficiary,
        roundTimingInfo: {
          offsetTimestamp: 0n,
          roundDurationSeconds: 60n,
          auctionClosingSeconds: 50n,
          reserveSubmissionSeconds: 50n,
        },
        minReservePrice: 1n,
        auctioneerAdmin,
        minReservePriceSetter,
        reservePriceSetter,
        reservePriceSetterAdmin,
        beneficiarySetter,
        roundTimingSetter,
        masterAdmin,
      }),
    ).rejects.toThrow(/reverted/);
  });
});
