import { describe, it, expect } from 'vitest';
import { Abi, decodeFunctionData } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

import expressLaneAuction from '@arbitrum/nitro-contracts/build/contracts/src/express-lane-auction/ExpressLaneAuction.sol/ExpressLaneAuction.json';
import { encodeExpressLaneAuctionInitData } from './deployExpressLaneAuction';

// encodeExpressLaneAuctionInitData is the single source of truth for the InitArgs tuple keys that
// deployExpressLaneAuction sends on-chain. Because the JSON-imported ABI is cast to Abi, a renamed or
// dropped key in that encoder is invisible to the compiler; round-tripping the *production* encoder
// through the real ABI makes such a typo fail here in CI rather than at live deploy time with viem's
// opaque "Address undefined is invalid" error.
describe('deployExpressLaneAuction initialize encoding', () => {
  it('encodes the production InitArgs and decodes back to the same values', () => {
    const randomAddress = () => privateKeyToAccount(generatePrivateKey()).address;
    const initArgs = {
      auctioneer: randomAddress(),
      biddingToken: randomAddress(),
      beneficiary: randomAddress(),
      roundTimingInfo: {
        offsetTimestamp: 123n,
        roundDurationSeconds: 60n,
        auctionClosingSeconds: 15n,
        reserveSubmissionSeconds: 15n,
      },
      minReservePrice: 1n,
      auctioneerAdmin: randomAddress(),
      minReservePriceSetter: randomAddress(),
      reservePriceSetter: randomAddress(),
      reservePriceSetterAdmin: randomAddress(),
      beneficiarySetter: randomAddress(),
      roundTimingSetter: randomAddress(),
      masterAdmin: randomAddress(),
    };

    const data = encodeExpressLaneAuctionInitData(initArgs);
    const decoded = decodeFunctionData({ abi: expressLaneAuction.abi as Abi, data });

    expect(decoded.functionName).toEqual('initialize');
    expect(decoded.args).toEqual([
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
    ]);
  });
});
