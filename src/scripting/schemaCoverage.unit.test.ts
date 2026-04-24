import { describe, it } from 'vitest';
import { type ZodType } from 'zod';
import {
  mocks,
  assertSchemaCoverage,
  getSchemaVariants,
  getVariantLabel,
  type CoverageOverride,
} from './schemaCoverage';
import { commands } from './commands';

/** consensus-v10 wasm module root -- a real value from the known list. */
const CONSENSUS_V10_WASM_MODULE_ROOT =
  '0x6b94a7fc388fd8ef3def759297828dc311761e88d8179c7ee8d3887dc554f3c3';

/** Per-command coverage configuration. Keyed by command name. */
type CoverageConfig = {
  /**
   * Realistic values keyed by dotted leaf path. Applied to `valuesA` (the
   * `base` side of each check) when a pure function's synthetic inputs
   * would collapse to the same output (typical for lookups against a small
   * fixed table). `valuesB` stays synthetic so base and mutated land in
   * different code-path buckets.
   */
  samples?: Readonly<Record<string, unknown>>;
  /**
   * Predicate-based fixture augmentations applied on top of the generated
   * inputs -- typically to satisfy refines or supply sibling context that
   * the leaf under test depends on.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  overrides?: readonly CoverageOverride<ZodType<any>>[];
};

const coverageConfig: Record<string, CoverageConfig> = {
  getConsensusReleaseByVersion: {
    samples: { consensusVersion: 10 },
  },
  getConsensusReleaseByWasmModuleRoot: {
    samples: { wasmModuleRoot: CONSENSUS_V10_WASM_MODULE_ROOT },
  },
  isKnownWasmModuleRoot: {
    samples: { wasmModuleRoot: CONSENSUS_V10_WASM_MODULE_ROOT },
  },
  deployNewChain: {
    // `execute` only consults `keyset` when `chainConfig.arbitrum.DataAvailabilityCommittee`
    // is true; the schema enforces that via a superRefine. Supply both so
    // toggling `params.keyset` actually exercises the function's keyset path.
    overrides: [
      {
        matches: (k) => k === 'params.keyset',
        apply: (base) => {
          const b = base as { params: { config: Record<string, unknown> } };
          return {
            ...b,
            params: {
              ...b.params,
              config: {
                ...b.params.config,
                chainConfig: {
                  chainId: 99999,
                  arbitrum: {
                    InitialChainOwner: '0x' + '1'.repeat(40),
                    DataAvailabilityCommittee: true,
                  },
                },
              },
            },
          };
        },
      },
    ],
  },
  transferOwnership: {
    // `nativeToken` has a `default(zeroAddress)`; execute only threads the
    // value through when the caller explicitly hands in zeroAddress. Force it.
    overrides: [
      {
        matches: (k) => k === 'nativeToken',
        apply: (base) => ({
          ...(base as object),
          nativeToken: '0x0000000000000000000000000000000000000000',
        }),
      },
    ],
  },
  createTokenBridgeExample: {
    overrides: [
      {
        matches: (k) => k === 'nativeToken',
        apply: (base) => ({
          ...(base as object),
          nativeToken: '0x0000000000000000000000000000000000000000',
        }),
      },
    ],
  },
  deployFullChain: {
    // `execute` only exercises keyset when DAC=true; schema enforces via
    // superRefine. Supply both so toggling keyset hits the branch.
    overrides: [
      {
        matches: (k) => k === 'createRollupParams.keyset',
        apply: (base) => {
          const b = base as { createRollupParams: { config: Record<string, unknown> } };
          return {
            ...b,
            createRollupParams: {
              ...b.createRollupParams,
              config: {
                ...b.createRollupParams.config,
                chainConfig: {
                  chainId: 99999,
                  arbitrum: {
                    InitialChainOwner: '0x' + '1'.repeat(40),
                    DataAvailabilityCommittee: true,
                  },
                },
              },
            },
          };
        },
      },
    ],
  },
};

describe('schema coverage', () => {
  for (const { name, schema, func } of commands) {
    const variants = getSchemaVariants(schema);
    variants.forEach((variant, i) => {
      const label =
        variants.length > 1 ? `${name} (${getVariantLabel(variant) ?? `variant ${i}`})` : name;
      const config = coverageConfig[name];
      it(label, async () => {
        await assertSchemaCoverage(variant, func, mocks, config?.overrides, config?.samples);
      });
    });
  }
});
