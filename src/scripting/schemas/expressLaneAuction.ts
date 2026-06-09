import { z } from 'zod';
import { withChildChainSign } from '../viemTransforms';
import { addressSchema, bigintSchema, privateKeySchema } from './common';

export const deployExpressLaneAuctionSchema = z
  .strictObject({
    orbitChainRpcUrl: z.url(),
    orbitChainId: z.number(),
    privateKey: privateKeySchema,
    proxyAdmin: addressSchema,
    auctioneer: addressSchema,
    biddingToken: addressSchema,
    beneficiary: addressSchema,
    roundTimingInfo: z.strictObject({
      offsetTimestamp: bigintSchema,
      roundDurationSeconds: bigintSchema,
      auctionClosingSeconds: bigintSchema,
      reserveSubmissionSeconds: bigintSchema,
    }),
    minReservePrice: bigintSchema,
    auctioneerAdmin: addressSchema,
    minReservePriceSetter: addressSchema,
    reservePriceSetter: addressSchema,
    reservePriceSetterAdmin: addressSchema,
    beneficiarySetter: addressSchema,
    roundTimingSetter: addressSchema,
    masterAdmin: addressSchema,
  })
  .transform(withChildChainSign);
