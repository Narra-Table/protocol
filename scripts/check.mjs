// Fails when contract/ is not a clean, unmodified export or generated/ is stale.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { contractDir, root, verifyBundle } from './contract.mjs';
import { generate } from './generate.mjs';

const source = verifyBundle(contractDir);
const stale = [];
for (const [name, content] of Object.entries(await generate())) {
  let current = '';
  try {
    current = readFileSync(join(root, name), 'utf8');
  } catch {}
  if (current !== content) stale.push(name);
}
if (stale.length) throw new Error(`stale generated files (run pnpm generate): ${stale.join(', ')}`);
console.log(`contract ${source.contractHash} (backend ${source.backendCommit}) verified; generated files current`);
