// Replaces contract/ with a clean backend export: `pnpm sync-contract <backend>/dist/contract`.
import { cpSync, existsSync, renameSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { contractDir, verifyBundle } from './contract.mjs';

const from = process.argv[2];
if (!from) throw new Error('usage: pnpm sync-contract <backend>/dist/contract');
const source = verifyBundle(resolve(from));
const staging = `${contractDir}.next`;
rmSync(staging, { recursive: true, force: true });
cpSync(resolve(from), staging, { recursive: true });
verifyBundle(staging);
if (existsSync(contractDir)) rmSync(contractDir, { recursive: true });
renameSync(staging, contractDir);
console.log(`contract ${source.contractHash} from backend ${source.backendCommit}`);
