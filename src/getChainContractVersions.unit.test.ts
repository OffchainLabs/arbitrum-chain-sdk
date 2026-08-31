import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getChainContractVersions } from './getChainContractVersions';
import { runChainVersioner } from '@arbitrum/chain-actions';

vi.mock('@arbitrum/chain-actions', () => ({
  runChainVersioner: vi.fn(),
}));

describe('getChainContractVersions', () => {
  beforeEach(() => {
    vi.mocked(runChainVersioner).mockReset();
  });

  it('uses the native chain-actions versioner', async () => {
    vi.mocked(runChainVersioner).mockResolvedValueOnce({
      versions: {
        Inbox: 'v1.1.1',
        RollupProxy: 'v1.1.1',
      },
      upgradeRecommendation: {
        message: 'No upgrade path found',
      },
    });

    await expect(
      getChainContractVersions('0xaE21fDA3de92dE2FDAF606233b2863782Ba046F9', 'https://rpc.example'),
    ).resolves.toEqual({
      versions: {
        Inbox: 'v1.1.1',
        RollupProxy: 'v1.1.1',
      },
      upgradeRecommendation: {
        message: 'No upgrade path found',
      },
    });

    expect(runChainVersioner).toHaveBeenCalledWith(
      '0xaE21fDA3de92dE2FDAF606233b2863782Ba046F9',
      'https://rpc.example',
      true,
    );
  });

  it('throws when the JSON payload is missing top level fields', async () => {
    vi.mocked(runChainVersioner).mockResolvedValueOnce({
      versions: { Inbox: 'v1.1.1' },
    } as never);

    await expect(
      getChainContractVersions('0xaE21fDA3de92dE2FDAF606233b2863782Ba046F9', 'https://rpc.example'),
    ).rejects.toThrow('Failed to parse Orbit chain contract versions');
  });

  it('accepts any JSON payload that includes versions and upgradeRecommendation', async () => {
    vi.mocked(runChainVersioner).mockResolvedValueOnce({
      versions: 'not-validated',
      upgradeRecommendation: null,
    } as never);

    await expect(
      getChainContractVersions('0xaE21fDA3de92dE2FDAF606233b2863782Ba046F9', 'https://rpc.example'),
    ).resolves.toEqual({
      versions: 'not-validated',
      upgradeRecommendation: null,
    });
  });
});
