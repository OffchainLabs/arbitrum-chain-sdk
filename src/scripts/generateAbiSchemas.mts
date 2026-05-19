import { readdir, writeFile } from 'node:fs/promises';
import { join, dirname, basename, relative } from 'node:path';
import { pathToFileURL } from 'node:url';
import { renderSchemas } from 'abi-to-zod';
import type { Abi } from 'viem';

const CONTRACTS_DIR = join(process.cwd(), 'src/contracts');

async function findContractFiles(dir: string): Promise<string[]> {
  const out: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await findContractFiles(full)));
    } else if (
      entry.isFile() &&
      entry.name.endsWith('.ts') &&
      !entry.name.endsWith('.schemas.ts') &&
      entry.name !== 'index.ts'
    ) {
      out.push(full);
    }
  }
  return out;
}

async function main() {
  const files = await findContractFiles(CONTRACTS_DIR);
  let written = 0;

  for (const file of files) {
    // @ts-expect-error -- tsc flags dynamic import under the project's default module setting; tsx runs this fine.
    const mod: Record<string, unknown> = await import(pathToFileURL(file).href);
    const exportName = Object.keys(mod).find((k) => k.endsWith('ABI'));
    if (!exportName) {
      console.warn(`No *ABI export found in ${relative(process.cwd(), file)} — skipping`);
      continue;
    }

    const source = renderSchemas(mod[exportName] as Abi);
    const outFile = join(dirname(file), `${basename(file, '.ts')}.schemas.ts`);
    await writeFile(outFile, source);
    console.log(`Wrote ${relative(process.cwd(), outFile)}`);
    written++;
  }

  console.log(`\nGenerated ${written} schema file(s).`);
}

main();
