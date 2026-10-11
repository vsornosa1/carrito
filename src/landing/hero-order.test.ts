import { describe, expect, it } from 'vitest';

import { ZONES } from '../lib/zones.ts';
import { HERO_BEATS, HERO_ITEMS, nextBeat, orderedItems, zoneLabel } from './hero-order.ts';

describe('the hero demo', () => {
  it('keeps every item, so the animation never quietly drops one', () => {
    expect(orderedItems()).toHaveLength(HERO_ITEMS.length);
  });

  it('ends at the freezer, like the app does', () => {
    expect(orderedItems().at(-1)?.zone).toBe('congelados');
  });

  // The hero is not allowed to have its own opinion about the walk: it must follow the
  // app's zone sequence, so the two cannot drift apart in a release.
  it('follows the app zone order rather than a copy of it', () => {
    const seen = orderedItems().map((item) => item.zone);
    const expected = ZONES.filter((zone) => seen.includes(zone.id)).map((zone) => zone.id);
    expect([...new Set(seen)]).toEqual(expected);
  });

  it('labels every zone it uses', () => {
    for (const item of HERO_ITEMS) {
      expect(zoneLabel(item.zone)).not.toBe('');
    }
  });

  it('starts on the problem and ends on the order', () => {
    expect(HERO_BEATS.map((beat) => beat.id)).toEqual(['see', 'swap', 'order']);
  });

  it('cycles the beats and wraps around', () => {
    expect(nextBeat(0)).toBe(1);
    expect(nextBeat(HERO_BEATS.length - 1)).toBe(0);
  });
});
