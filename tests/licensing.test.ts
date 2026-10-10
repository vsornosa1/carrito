import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

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
  basis: string;
  note?: string;
}

const inventory: LicenceRow[] = existsSync(inventoryPath)
  ? (JSON.parse(readFileSync(inventoryPath, 'utf8')) as LicenceRow[])
  : [];

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
