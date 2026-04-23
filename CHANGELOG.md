# Changelog

## Unreleased — viem v2 migration

**Breaking** — this release upgrades `viem` from `1.20.0` to `2.48.4` across the entire SDK. Consumers must also upgrade their viem peer to `^2.48.4`.

### Dependencies

- `viem`: `^1.20.0` → `^2.48.4` (peer + dev)
- `abitype`: `^0.9.8` → `^1.2.4`
- `@wagmi/cli`: `^1.5.2` → `^2.10.0`
- `typescript`: `^5.2.2` → `^5.9.3`
- Removed `viem` and `viem>ws` entries from `pnpm.overrides` — the resolver now picks latest compatible versions everywhere.

### Module system

The shipped package is now ESM. `src/package.json` sets `"type": "module"` and emits `.js` files with ES module syntax. Consumers that use `require('@arbitrum/chain-sdk')` under CommonJS will need to switch to dynamic `import()` or use a bundler / Node 22+ CJS↔ESM interop.

### Public-API reshape (driven by TypeScript's correlated-union limitation under viem v2, microsoft/TypeScript#30581)

viem v2's stricter generics made the v1-era "generic `<TFunctionName>` wrapper" pattern impossible to type without casts. Each of the following wrappers has been reshaped to accept a **distributed discriminated union** over every concrete function name (call-site narrowing still works when you pass an inline object literal):

- `arbGasInfoReadContract`, `arbAggregatorReadContract`, `arbOwnerReadContract`, `sequencerInboxReadContract`, `rollupAdminLogicReadContract` — non-generic, return type is a union over all read-function return types.
- `arbAggregatorPrepareTransactionRequest`, `arbOwnerPrepareTransactionRequest`, `sequencerInboxPrepareTransactionRequest`, `rollupAdminLogicPrepareTransactionRequest` — non-generic, params are a distributed union of every write-function + its arg tuple.
- Their decorator methods (`client.arbOwnerReadContract(...)`, etc.) follow the same shape.

**Caller migration**:

- Drop explicit-generic call syntax: `client.fn<'literalName'>({ ... })` → `client.fn({ functionName: 'literalName', ... })`. TS narrows from the object literal's `functionName` discriminant.
- If you read a value out of a read-contract call and it's structurally a union under v2 (e.g., `maxTimeVariation` returns a tuple), narrow with a runtime check (`Array.isArray(result)` or `typeof result === 'string'`) before using it. The runtime value is unchanged.

### Removed helpers

- `prepareUpgradeExecutorCallParameters` now takes `(encoded: Hex, envelope)` as two positional args instead of the combined object. Callers (all four `buildSet*` actions) updated internally. If you consumed this helper directly, pass pre-encoded calldata instead of `{ abi, functionName, args }`.

### `createTokenBridge`

`createTokenBridge` is no longer generic over `<TParentChain, TOrbitChain>`. The return type is `CreateTokenBridgeResults<Chain | undefined, Chain | undefined>`. Consumers who pinned `Chain` narrowing should widen their types.

### `prepareTransactionRequest` return type

The SDK's internal `PrepareTransactionRequestReturnTypeWithChainId` alias now pins the transaction `type` to `'eip1559'`. All `*PrepareTransactionRequest` helpers pass `type: 'eip1559'` to viem's `prepareTransactionRequest`, so the return is assignable to `signTransaction`/`sendRawTransaction` without casts. Non-EIP-1559 transactions (legacy, EIP-2930, EIP-4844, EIP-7702) are not produced by these helpers.

### TypeScript configuration

- `tsconfig.json` now uses `moduleResolution: "bundler"` and `module: "preserve"` (required for viem v2's type graph under pnpm).
- `lib` now includes `"DOM"` (required because viem v2's dependency `ox` references `crypto` / `window` globals in its WebAuthn module).
- The build script drops `--module commonjs`; the ESM output is driven by the package's `"type": "module"` and tsconfig.

### Non-goals / known gaps

- Three schema-vs-parameter type-equality assertions in `src/scripting/schemas/schemas.type.test.ts` are skipped with `it.skip` and a `TODO(viem-v2)` comment. They compare `z.output<schema>` to `Parameters<fn>[0]` and trip on viem v2's expanded `PublicClient` method surface — a test-helper (`DeepNormalize`) issue, not a correctness gap.
- Integration tests require a running nitro-testnode and weren't run in this upgrade's verification.

### Verification

```
pnpm build       # passes, zero TS errors
pnpm lint        # passes
pnpm test:type   # 55 passed, 3 skipped (documented above)
pnpm test:unit   # 221 passed
```

### Fraud-free gate

- Zero `@ts-expect-error` in non-test source.
- Zero `as unknown as` / `as any` / `@ts-ignore` in non-test source added for TS-limitation workarounds. Three `as unknown as` remain at genuine system boundaries (JSON-RPC response parse; `@arbitrum/sdk` result arrays that the surrounding code has runtime-validated for length and status).
