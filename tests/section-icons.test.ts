import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { createElement } from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Icon } from '../src/components/icons.tsx';
import { FALLBACK_SECTION_ICON, SECTION_ICON, sectionIcon } from '../src/lib/section-icons.ts';

const bundlePath = resolve(import.meta.dirname, '..', 'public', 'catalog', 'products.json');

interface CatalogProduct {
  categoryPath: { name: string }[];
}

// Checked against the real catalogue rather than fixtures, for the same reason the
// zone table is: a mapping that holds for three invented sections is an anecdote.
// Mercadona adds sections without telling anyone, and the day it does, this is
// where it shows up rather than as a silently borrowed pictogram.
const sections = [
  ...new Set(
    (JSON.parse(readFileSync(bundlePath, 'utf8')) as CatalogProduct[])
      .map((product) => product.categoryPath[0]?.name)
      .filter((name): name is string => typeof name === 'string'),
  ),
].sort();

describe('section icons', () => {
  it('found the catalogue to check against', () => {
    expect(sections.length, 'the committed bundle must be readable').toBeGreaterThan(0);
  });

  it('gives every section in the real catalogue a pictogram of its own', () => {
    for (const section of sections) {
      expect(SECTION_ICON[section], `${section} has no icon mapped`).toBeDefined();
      expect(sectionIcon(section), `${section} fell through to the fallback`).not.toBe(
        FALLBACK_SECTION_ICON,
      );
    }
  });

  it('maps nothing the catalogue does not have', () => {
    for (const name of Object.keys(SECTION_ICON)) {
      expect(sections, `${name} is mapped but is not a catalogue section`).toContain(name);
    }
  });

  it('keeps the fallback observable rather than silent', () => {
    expect(sectionIcon('Una sección que no existe')).toBe(FALLBACK_SECTION_ICON);
  });

  // The mapping is keyed by name, so a renamed pictogram would still map to a
  // string and still pass every assertion above while drawing absolutely nothing.
  // This is the assertion that actually looks at the drawing.
  it('draws every mapped pictogram, so a renamed icon cannot hide behind the table', () => {
    for (const name of new Set(Object.values(SECTION_ICON))) {
      const { container, unmount } = render(createElement(Icon, { name }));
      expect(
        container.querySelector('svg')?.childElementCount ?? 0,
        `${name} is mapped but draws nothing`,
      ).toBeGreaterThan(0);
      unmount();
    }
  });
});
