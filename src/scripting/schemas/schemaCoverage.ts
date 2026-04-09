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

export function assertSchemaCoverage(
  schema: ZodType,
  transform: (input: any) => unknown,
  _sdkFunction?: unknown,
  overrides?: Record<string, (base: Record<string, unknown>) => Record<string, unknown>>,
): void {
  const leaves = getSchemaLeaves(schema);

  // Generate two values for each leaf
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

    // Skip literals -- they can't be mutated
    if (getDefType(leaf.schema) === 'literal') continue;

    // Build base fixture (all fields use value A)
    let baseFixture = buildFixture(leaves, valuesA);

    // Apply override if one exists
    if (overrides?.[key]) {
      baseFixture = overrides[key](baseFixture);
    }

    // Build mutated fixture (field under test uses value B, everything else value A)
    const mutatedValues = new Map(valuesA);
    mutatedValues.set(key, valuesB.get(key));
    let mutatedFixture = buildFixture(leaves, mutatedValues);

    if (overrides?.[key]) {
      mutatedFixture = overrides[key](mutatedFixture);
    }

    // Parse both through the schema
    const parsedBase = schema.parse(baseFixture);
    const parsedMutated = schema.parse(mutatedFixture);

    // Run through the transform
    const outputBase = transform(parsedBase);
    const outputMutated = transform(parsedMutated);

    // Compare -- if identical, the field is dead
    if (JSON.stringify(outputBase, replacer) === JSON.stringify(outputMutated, replacer)) {
      deadFields.push(key);
    }
  }

  if (deadFields.length > 0) {
    throw new Error(
      `Dead schema fields detected (no effect on transform output):\n  ${deadFields.join('\n  ')}`,
    );
  }
}

const replacer = (_k: string, v: unknown) => (typeof v === 'bigint' ? `__bigint__${v}` : v);
