import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const projectRoot = resolve(import.meta.dirname, '..');
const css = readFileSync(resolve(projectRoot, 'src/styles.css'), 'utf8').replace(
  /\/\*[\s\S]*?\*\//g,
  '',
);

interface Rule {
  selector: string;
  body: string;
}

/**
 * Every `selector { … }` pair in the stylesheet, nested rules included.
 *
 * Comments are stripped first, so `selector` is the selector alone: a comment
 * sitting above a rule would otherwise be read as part of it.
 */
function rules(source: string): Rule[] {
  const found: Rule[] = [];
  for (const match of source.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    found.push({
      selector: match[1]!.trim(),
      body: match[2]!.replace(/\s+/g, ' '),
    });
  }
  return found;
}

const all = rules(css);

/** A bar taken out of the flow and pinned to the phone's foot. */
const fixed = all.filter((rule) => /position: fixed/.test(rule.body));

/*
  Two bars can share the foot of a phone, and only one can be nearest the edge. The
  navigation is that one — it is the layer everything else has to stay clear of — so a
  second bar pinned to `bottom: 0` is *behind* it, not above it, and reads as a button
  that has gone missing. That is exactly what happened to "Añadir al carrito": the tabs
  were made permanent on a product screen, and the action bar stayed at the bottom edge
  underneath them. jsdom computes no layout, so the geometry cannot be asserted there;
  what can be asserted is the offset that keeps the two from colliding.
*/
describe('the fixed bars at the foot of a phone', () => {
  it('keeps the navigation itself on the screen edge', () => {
    const nav = fixed.find((rule) => rule.selector === '.bottom-nav');
    expect(nav, '.bottom-nav must still be pinned to the bottom edge').toBeTruthy();
    expect(nav!.body).toMatch(/inset: auto 0 0 0/);
  });

  it('lifts every other one of them clear of the navigation', () => {
    const bars = fixed.filter((rule) => rule.selector !== '.bottom-nav');
    expect(bars.length, 'expected the cart summary and the product action bar').toBeGreaterThan(0);

    for (const bar of bars) {
      expect(
        bar.body,
        `${bar.selector} is pinned to the foot of the phone and must clear the navigation, ` +
          'the way the cart summary does, or the navigation covers it',
      ).toContain('var(--nav-height)');
    }
  });
});
