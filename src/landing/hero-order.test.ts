import { describe, expect, it } from 'vitest';

import { ZONES } from '../lib/zones.ts';
import { HERO_ITEMS, heroGroups } from './hero-order.ts';

describe('the hero demo', () => {
  it('keeps every item, so the demo never quietly drops one', () => {
    expect(heroGroups().flatMap((group) => group.items)).toHaveLength(HERO_ITEMS.length);
  });

  it('ends at the freezer, like the app does', () => {
    expect(heroGroups().at(-1)?.items.at(-1)?.zone).toBe('congelados');
  });

  // The hero is not allowed to have its own opinion about the walk: it must follow the
  // app's zone sequence, so the two cannot drift apart in a release.
  it('follows the app zone order rather than a copy of it', () => {
    const used = new Set(HERO_ITEMS.map((item) => item.zone));
    const expected = ZONES.filter((zone) => used.has(zone.id)).map((zone) => zone.label);
    expect(heroGroups().map((group) => group.label)).toEqual(expected);
  });

  it('files every item under the heading of its own zone', () => {
    const zoneOfLabel = new Map(ZONES.map((zone) => [zone.label, zone.id]));

    for (const group of heroGroups()) {
      const zone = zoneOfLabel.get(group.label);
      expect(zone, `${group.label} must be one of the app's zones`).toBeDefined();
      for (const item of group.items) {
        expect(item.zone).toBe(zone);
      }
    }
  });

  // A group with no rows in it would be a step the shopper cannot take.
  it('leaves no empty group for a zone nothing lands in', () => {
    for (const group of heroGroups()) {
      expect(group.items.length, `${group.label} must have something in it`).toBeGreaterThan(0);
    }
  });

  /*
    One mark, in words. The demo used to carry three captions over the same card, which
    was the part nobody could follow; and the mark it carries now must not contain a
    figure, because the app refuses to invent one for a real product and a poster is a
    worse place to start than the app.
  */
  it('marks exactly one item, in words rather than numbers', () => {
    const flagged = HERO_ITEMS.filter((item) => item.flag !== undefined);

    expect(flagged).toHaveLength(1);
    const flag = flagged[0]!.flag!;
    expect(flag.badge.length).toBeGreaterThan(0);
    expect(flag.better).not.toMatch(/\d/);
    expect(flag.badge).not.toMatch(/\d/);
  });
});
