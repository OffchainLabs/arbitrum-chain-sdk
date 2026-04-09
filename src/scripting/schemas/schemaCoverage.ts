import { type ZodType } from 'zod';

type SchemaLeaf = { path: string[]; schema: ZodType };

// Counter for generating unique values across calls
let counter = 0;

export function resetCounter(): void {
  counter = 0;
}

function getDefType(schema: ZodType): string {
  return (schema as any)._zod?.def?.type ?? 'unknown';
}

function getDef(schema: ZodType): any {
  return (schema as any)._zod?.def;
}

function getBag(schema: ZodType): any {
  return (schema as any)._zod?.bag;
}

export function getSchemaLeaves(schema: ZodType, path: string[] = []): SchemaLeaf[] {
  const def = getDef(schema);
  if (!def) return [{ path, schema }];

  switch (def.type) {
    case 'object': {
      const shape = def.shape as Record<string, ZodType>;
      return Object.entries(shape).flatMap(([key, child]) =>
        getSchemaLeaves(child, [...path, key]),
      );
    }
    case 'never':
      // Can't generate values for never -- skip entirely
      return [];
    case 'optional':
    case 'nullable':
    case 'default':
    case 'prefault':
    case 'nonoptional':
    case 'readonly':
    case 'catch':
      return getSchemaLeaves(def.innerType, path);
    case 'pipe':
      // For pipes (string -> transform), walk the input side
      return getSchemaLeaves(def.in, path);
    default:
      return [{ path, schema }];
  }
}

export function generateValue(schema: ZodType): unknown {
  const n = counter++;
  return generateForType(schema, n);
}

function generateForType(schema: ZodType, n: number): unknown {
  const def = getDef(schema);
  if (!def) return `value_${n}`;

  switch (def.type) {
    case 'string':
      return generateString(schema, n);
    case 'number':
      return n + 1;
    case 'int':
      return n + 1;
    case 'boolean':
      return n % 2 === 0;
    case 'bigint':
      return BigInt(n + 1);
    case 'literal':
      return def.values[0];
    case 'enum':
      return Object.values(def.entries)[n % Object.values(def.entries).length];
    case 'object':
      return generateObject(schema, n);
    case 'array':
      return [generateForType(def.element, n)];
    case 'tuple':
      return (def.items as ZodType[]).map((item: ZodType, i: number) =>
        generateForType(item, n + i),
      );
    case 'optional':
    case 'nullable':
    case 'default':
    case 'prefault':
    case 'nonoptional':
    case 'readonly':
    case 'catch':
      return generateForType(def.innerType, n);
    case 'pipe':
      return generateForType(def.in, n);
    default:
      return `value_${n}`;
  }
}

function generateString(schema: ZodType, n: number): string {
  const bag = getBag(schema);

  if (bag?.format === 'url') {
    return `http://host-${n}.test`;
  }

  const patterns = bag?.patterns as Set<RegExp> | undefined;
  if (patterns) {
    for (const pattern of patterns) {
      const src = pattern.source;
      // Ethereum address: 40 hex chars
      if (src.includes('[0-9a-fA-F]{40}')) {
        const hex = (n + 1).toString(16).padStart(40, '0');
        return `0x${hex}`;
      }
      // Private key: 64 hex chars
      if (src.includes('[0-9a-fA-F]{64}')) {
        const hex = (n + 1).toString(16).padStart(64, '0');
        return `0x${hex}`;
      }
      // General hex string
      if (src.includes('[0-9a-fA-F]')) {
        const hex = (n + 1).toString(16);
        return `0x${hex}`;
      }
      // Numeric string (bigintSchema input)
      if (src.includes('-?\\d+')) {
        return String(n + 100);
      }
    }
  }

  return `string_${n}`;
}

function generateObject(schema: ZodType, baseN: number): Record<string, unknown> {
  const def = getDef(schema);
  const shape = def.shape as Record<string, ZodType>;
  const result: Record<string, unknown> = {};
  let i = baseN;
  for (const [key, child] of Object.entries(shape)) {
    result[key] = generateForType(child, i++);
  }
  return result;
}

function setNestedField(obj: Record<string, unknown>, path: string[], value: unknown): Record<string, unknown> {
  if (path.length === 0) return obj;
  if (path.length === 1) {
    return { ...obj, [path[0]]: value };
  }
  const [head, ...rest] = path;
  return {
    ...obj,
    [head]: setNestedField((obj[head] as Record<string, unknown>) ?? {}, rest, value),
  };
}

function buildFixture(leaves: SchemaLeaf[], values: Map<string, unknown>): Record<string, unknown> {
  let fixture: Record<string, unknown> = {};
  for (const leaf of leaves) {
    const key = leaf.path.join('.');
    fixture = setNestedField(fixture, leaf.path, values.get(key));
  }
  return fixture;
}

/**
 * Verifies that every field in a schema affects observable side effects.
 * For each leaf field, generates two inputs that differ only in that field,
 * runs both through execute, and asserts the recorded side effects differ.
 */
interface SideEffectTracker {
  clear(): void;
  snapshot(): string;
}

export async function assertSchemaCoverage(
  schema: ZodType,
  execute: (input: Record<string, unknown>) => unknown,
  mocks: SideEffectTracker,
  overrides?: Record<string, (base: Record<string, unknown>) => Record<string, unknown>>,
): Promise<void> {
  const leaves = getSchemaLeaves(schema);

  resetCounter();
  const valuesA = new Map<string, unknown>();
  const valuesB = new Map<string, unknown>();
  for (const leaf of leaves) {
    const key = leaf.path.join('.');
    valuesA.set(key, generateValue(leaf.schema));
    valuesB.set(key, generateValue(leaf.schema));
  }

  const deadFields: string[] = [];

  for (const leaf of leaves) {
    const key = leaf.path.join('.');
    if (getDefType(leaf.schema) === 'literal') continue;

    let baseFixture = buildFixture(leaves, valuesA);
    if (overrides?.[key]) {
      baseFixture = overrides[key](baseFixture);
    }

    let mutatedFixture = buildFixture(leaves, valuesA);
    if (overrides?.[key]) {
      mutatedFixture = overrides[key](mutatedFixture);
    }
    mutatedFixture = setNestedField(mutatedFixture, leaf.path, valuesB.get(key));

    mocks.clear();
    await execute(baseFixture);
    const snapshotBase = mocks.snapshot();

    mocks.clear();
    await execute(mutatedFixture);
    const snapshotMutated = mocks.snapshot();

    if (snapshotBase === snapshotMutated) {
      deadFields.push(key);
    }
  }

  if (deadFields.length > 0) {
    throw new Error(
      `Dead schema fields detected (no effect on transform output):\n  ${deadFields.join('\n  ')}`,
    );
  }
}
