// Shared helpers for reading and verifying the pinned backend contract bundle.
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

export const root = new URL('..', import.meta.url).pathname;
export const contractDir = join(root, 'contract');

export function listFiles(dir) {
  const out = [];
  const walk = (d) => {
    for (const name of readdirSync(d).sort()) {
      const path = join(d, name);
      if (statSync(path).isDirectory()) walk(path);
      else out.push(relative(dir, path).split(sep).join('/'));
    }
  };
  walk(dir);
  return out;
}

const sha256 = (b) => createHash('sha256').update(b).digest('hex');

// Mirrors the backend: Digest(map[file]sha256(file)) over every file except source.json.
export function contractHash(dir) {
  const digest = {};
  for (const name of listFiles(dir)) {
    if (name !== 'source.json') digest[name] = sha256(readFileSync(join(dir, name)));
  }
  const sorted = Object.fromEntries(Object.keys(digest).sort().map((k) => [k, digest[k]]));
  return sha256(JSON.stringify(sorted));
}

export function readJSON(dir, name) {
  return JSON.parse(readFileSync(join(dir, name), 'utf8'));
}

// A bundle is only usable when it was exported from a clean commit and is unmodified.
export function verifyBundle(dir) {
  const source = readJSON(dir, 'source.json');
  if (source.dirty) throw new Error(`${dir}: bundle was exported from a dirty worktree`);
  const actual = contractHash(dir);
  if (actual !== source.contractHash) {
    throw new Error(`${dir}: contractHash mismatch (source ${source.contractHash}, files ${actual})`);
  }
  return source;
}
