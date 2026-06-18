import { it, expect } from 'vitest';
import { createPublicClient, http } from 'viem';

import { arbitrumSepolia } from '../chains';
import { buildScheduleArbOSUpgrade } from './buildScheduleArbOSUpgrade';

const publicClient = createPublicClient({
  chain: arbitrumSepolia,
  transport: http(),
});

// https://arbiscan.io/tx/0x60f8dab14414f5735880e607ca29c2f778d28b7e31bb62377345550397154aee
it('should prepare transaction request without upgrade executor (timestamp set)', async () => {
  const newVersion = 10n;
  const timestamp = 1671217200n;

  const result = await buildScheduleArbOSUpgrade(publicClient, {
    account: '0xD345e41aE2cb00311956aA7109fC801Ae8c81a52',
    upgradeExecutor: false,
    args: [newVersion, timestamp],
    gasOverrides: { gasLimit: { base: 0n } },
  });

  expect(result.to).toEqual('0x0000000000000000000000000000000000000070');
  expect(result.data).toEqual(
    '0xe388b381000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000639cc030',
  );
});

// https://muster-explorer.alt.technology/tx/0xec8acd5c3be6c7dfdbb95e64606b1a8b69c29728c727c1ef5e17c13b3e3eaa2c?tab=index
it('should prepare transaction request with upgrade executor (timestamp not set)', async () => {
  const newVersion = 40n;
  const timestamp = 0n;

  const result = await buildScheduleArbOSUpgrade(publicClient, {
    account: '0xCa9c24bf165D375A62E62b9fb8F138E19A957Aa9',
    upgradeExecutor: '0x302210D41e5AEf43DB392FAD8382440f33cA0440',
    args: [newVersion, timestamp],
    gasOverrides: { gasLimit: { base: 0n } },
  });

  expect(result.to).toEqual('0x302210D41e5AEf43DB392FAD8382440f33cA0440');
  expect(result.data).toEqual(
    '0xbca8c7b5000000000000000000000000000000000000000000000000000000000000007000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000044e388b3810000000000000000000000000000000000000000000000000000000000000028000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
  );
});

// https://mainnet.explorer.rarichain.org/tx/0xc3bb2429ea4d7dccd1a088ea724ee6d86d3e093dd62827332c97215ddbc9e16c
it('should prepare transaction request with upgrade executor (timestamp set)', async () => {
  const newVersion = 32n;
  const timestamp = 1730761240n;

  const result = await buildScheduleArbOSUpgrade(publicClient, {
    account: '0x24aD5A235632EDDad741fF380112b3161d31b32D',
    upgradeExecutor: '0x3e856A38782fde2430866a353B0c388C3aDD2E43',
    args: [newVersion, timestamp],
    gasOverrides: { gasLimit: { base: 0n } },
  });

  expect(result.to).toEqual('0x3e856A38782fde2430866a353B0c388C3aDD2E43');
  expect(result.data).toEqual(
    '0xbca8c7b5000000000000000000000000000000000000000000000000000000000000007000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000044e388b3810000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000006729521800000000000000000000000000000000000000000000000000000000',
  );
});
