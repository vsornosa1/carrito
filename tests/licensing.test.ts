import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { relative, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const projectRoot = resolve(import.meta.dirname, '..');
const inventoryPath = resolve(projectRoot, 'data', 'licensing', 'inventory.json');

// The envelope exists because a paywall is being considered and nobody knows yet
// which layers may legally be charged for. The whole value of the answer rests on
// one property: a verdict is never asserted without a citation. Free-text verdicts
// cannot be checked, so the vocabulary is fixed and this test is what keeps it fixed.
//
// This file is also the only place the inventory is read. Nothing under src/ imports
// it, so the audit cannot leak into the shipped bundle.

const EXPECTED_ROW_IDS = [
  'code',
  'app-shell',
  'mirror',
  'underlying-catalog-data',
  'catalog-bundle',
  'photos',
  'trademark',
  'enriched-db',
  'off-derived-nutrition',
  'off-api-terms',
] as const;

const VERDICTS = ['safe', 'safe-if', 'not-safe', 'unknown'] as const;
const KINDS = ['artifact', 'source', 'right'] as const;

interface LicenceRow {
  id: string;
  kind: string;
  licence: string | null;
  verdict: string;
  requires: readonly string[];
  covers: readonly string[];
  fields: readonly string[];
  basis: string;
  note?: string;
}

const inventory: LicenceRow[] = existsSync(inventoryPath)
  ? (JSON.parse(readFileSync(inventoryPath, 'utf8')) as LicenceRow[])
  : [];

// The two directories whose contents are redistributed, and therefore the only
// files each verdict has to account for one by one. data/raw and data/cache are
// gitignored, and the test below asserts that precisely so the exclusion cannot
// quietly become an oversight. The source tree is deliberately not enumerated:
// hundreds of paths no licence question turns on, and a guard that noisy stops
// being read.
const DISTRIBUTED_DIRS = ['public/catalog', 'data/enriched'] as const;

/** Every file under `dir`, relative to the repo root, with forward slashes. */
function filesUnder(dir: string): string[] {
  const absolute = resolve(projectRoot, dir);
  if (!existsSync(absolute)) return [];

  const found: string[] = [];
  const walk = (current: string): void => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const child = resolve(current, entry.name);
      if (entry.isDirectory()) walk(child);
      else found.push(relative(projectRoot, child).split(/[\\/]/).join('/'));
    }
  };
  walk(absolute);
  return found.sort();
}

/** Every path any row claims to account for. */
function declaredCovers(): string[] {
  return inventory.flatMap((row) => (Array.isArray(row.covers) ? row.covers : []));
}

/** Every field path any row claims to account for. */
function declaredFields(): string[] {
  return inventory.flatMap((row) => (Array.isArray(row.fields) ? row.fields : []));
}

const bundlePath = resolve(projectRoot, 'public', 'catalog', 'products.json');

// The blocks of the shipped bundle whose fields carry provenance. `nutrition` is
// the Open Food Facts join; `processing` is our own signal derived from Mercadona's
// ingredient text. Both ship inside products.json, so both need accounting for.
const PROVENANCE_BLOCKS = ['nutrition', 'processing'] as const;

interface BundleProduct {
  nutrition?: unknown;
  processing?: unknown;
}

/**
 * Records every leaf path under `prefix`. A `null` means "absent" everywhere in
 * this bundle — missing data is null, never zero — so it is skipped rather than
 * recorded as a field. Arrays are leaves: their elements are the data, not fields.
 */
function collectLeafPaths(prefix: string, value: unknown, into: Set<string>): void {
  if (value === null || value === undefined) return;
  if (typeof value !== 'object' || Array.isArray(value)) {
    into.add(prefix);
    return;
  }
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    collectLeafPaths(`${prefix}.${key}`, child, into);
  }
}

// The bundle is 5.5 MB; parsed once rather than once per test.
let shippedFields: string[] | null = null;

function shippedFieldPaths(): string[] {
  if (shippedFields === null) {
    const products = existsSync(bundlePath)
      ? (JSON.parse(readFileSync(bundlePath, 'utf8')) as BundleProduct[])
      : [];
    const paths = new Set<string>();
    for (const block of PROVENANCE_BLOCKS) {
      for (const product of products) {
        const value = product[block];
        if (value === undefined) continue;
        collectLeafPaths(block, value, paths);
      }
    }
    shippedFields = [...paths].sort();
  }
  return shippedFields;
}

describe('licence inventory', () => {
  it('exists — the envelope has somewhere to live', () => {
    expect(existsSync(inventoryPath), 'data/licensing/inventory.json must exist').toBe(true);
  });

  it('covers exactly the rows the spec names, with no extras', () => {
    expect(
      inventory.map((row) => row.id).sort(),
      'the inventory must cover the spec\'s rows and nothing else',
    ).toEqual([...EXPECTED_ROW_IDS].sort());
  });

  it('gives every row the full contract', () => {
    for (const row of inventory) {
      expect(typeof row.id, `${row.id} must have a string id`).toBe('string');
      expect(typeof row.kind, `${row.id} must have a kind`).toBe('string');
      expect(typeof row.verdict, `${row.id} must have a verdict`).toBe('string');
      expect(Array.isArray(row.requires), `${row.id} must have a requires array`).toBe(true);
      expect(
        Array.isArray(row.covers),
        `${row.id} must declare which committed paths it accounts for`,
      ).toBe(true);
      expect(
        Array.isArray(row.fields),
        `${row.id} must declare which bundle fields it accounts for`,
      ).toBe(true);
      expect(typeof row.basis, `${row.id} must have a basis`).toBe('string');
      expect(row.licence === null || typeof row.licence === 'string', `${row.id} licence must be a string or null`).toBe(true);
    }
  });

  it('uses only the fixed verdict vocabulary', () => {
    for (const row of inventory) {
      expect(
        VERDICTS,
        `${row.id} has verdict "${row.verdict}", which is not one of: ${VERDICTS.join(', ')}`,
      ).toContain(row.verdict);
    }
  });

  it('uses only the fixed kind vocabulary', () => {
    for (const row of inventory) {
      expect(KINDS, `${row.id} has kind "${row.kind}", which is not one of: ${KINDS.join(', ')}`).toContain(
        row.kind,
      );
    }
  });

  it('cites a basis for every row — no verdict without a citation', () => {
    for (const row of inventory) {
      expect(row.basis.trim().length, `${row.id} must cite a basis`).toBeGreaterThan(0);
    }
  });

  it('makes every unknown row say what would resolve it', () => {
    for (const row of inventory.filter((candidate) => candidate.verdict === 'unknown')) {
      expect(
        row.note?.trim().length ?? 0,
        `${row.id} is unknown, so its note must name what would resolve it`,
      ).toBeGreaterThan(0);
    }
  });

  it('keeps ids unique', () => {
    const ids = inventory.map((row) => row.id);
    expect(new Set(ids).size, 'ids must be unique').toBe(ids.length);
  });

  it('keeps ids stable kebab-case, so they can be referenced without renaming', () => {
    for (const row of inventory) {
      expect(row.id, `${row.id} must be kebab-case`).toMatch(/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/);
    }
  });
});

describe('distributed artifact coverage', () => {
  it('skips data/raw and data/cache because they are gitignored, not by oversight', () => {
    const gitignore = readFileSync(resolve(projectRoot, '.gitignore'), 'utf8');
    expect(
      gitignore,
      'data/raw must stay gitignored for its exclusion from the guard to be principled',
    ).toContain('data/raw/');
    expect(
      gitignore,
      'data/cache must stay gitignored for its exclusion from the guard to be principled',
    ).toContain('data/cache/');
  });

  it('finds the distributed files it exists to guard', () => {
    // Without this, a wrong path would make every assertion below pass over an
    // empty list: a guard that reads green while guarding nothing.
    for (const dir of DISTRIBUTED_DIRS) {
      expect(filesUnder(dir).length, `${dir} must contain committed files`).toBeGreaterThan(0);
    }
  });

  it('leaves no committed file outside the envelope', () => {
    const declared = new Set(declaredCovers());
    for (const dir of DISTRIBUTED_DIRS) {
      for (const file of filesUnder(dir)) {
        expect(
          declared.has(file),
          `${file} is committed, so an inventory row must account for it`,
        ).toBe(true);
      }
    }
  });

  it('claims no file that is not actually there', () => {
    const present = new Set(DISTRIBUTED_DIRS.flatMap((dir) => filesUnder(dir)));
    for (const row of inventory) {
      for (const path of Array.isArray(row.covers) ? row.covers : []) {
        expect(present.has(path), `${row.id} claims ${path}, which is not a committed file`).toBe(
          true,
        );
      }
    }
  });

  it('maps each committed file to exactly one row', () => {
    const claimed = declaredCovers();
    expect(
      new Set(claimed).size,
      'a committed file must be claimed by exactly one row, not several',
    ).toBe(claimed.length);
  });
});

describe('bundle field coverage', () => {
  it('accounts for every nutrition and processing field the bundle ships', () => {
    const declared = new Set(declaredFields());
    const present = shippedFieldPaths();

    // Without this, a renamed block or a wrong path would make every assertion
    // below pass over an empty list.
    expect(present.length, 'the bundle must ship nutrition fields').toBeGreaterThan(0);

    for (const path of present) {
      expect(
        declared.has(path),
        `${path} ships in the bundle but no inventory row accounts for it`,
      ).toBe(true);
    }
  });

  it('still finds the fields this guard exists to watch', () => {
    for (const path of ['nutrition.per100.kcal', 'nutrition.novaGroup', 'processing.tier']) {
      expect(shippedFieldPaths(), `${path} should ship in the bundle`).toContain(path);
    }
  });

  it('keeps the Open Food Facts credit the envelope claims is satisfied', () => {
    // The envelope records attribution as an obligation, and as satisfied in fact.
    // If a redesign drops the credit, that claim becomes false — so the credit is
    // asserted here, in the same spirit as the network-hygiene guard.
    const panel = readFileSync(
      resolve(projectRoot, 'src', 'components', 'NutritionPanel.tsx'),
      'utf8',
    );
    expect(panel, 'the Open Food Facts credit is what satisfies attribution').toContain(
      'Fuente: Open Food Facts',
    );
  });
});
