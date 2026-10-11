import { tierLabel } from '../lib/tier-labels.ts';
import { ZONES, type ZoneId } from '../lib/zones.ts';

/**
 * The hero's demo list.
 *
 * A handful of stand-ins, not the catalogue. The hero needs the *shape* of a
 * shopping list; importing `public/catalog/products.json` here would put 5.8 MB in
 * front of someone who has not decided to use the app yet, which is the one thing
 * this page must never do. A guard in `tests/landing-isolation.test.ts` enforces it.
 *
 * The zones are the app's own `ZONES`, so the order the hero shows is the order
 * the app actually proposes. A hand-copied list would drift within a release, and
 * the drift would be invisible — the hero would simply start lying.
 */
export interface HeroItem {
  name: string;
  zone: ZoneId;
  /** Present on the one item the demo points at. See `HeroFlag`. */
  flag?: HeroFlag;
}

/**
 * What the app says about one item, shown on that item.
 *
 * The demo used to cycle three captions over the same card while the list stood
 * still, so working out what had changed meant holding a state machine in your head
 * — and the card named a product the list also named, which read as a contradiction
 * rather than an explanation. A mark on one row is read once, in a glance, and stays
 * read. Nothing here may carry a figure: the app refuses to invent numbers for a real
 * product, and a marketing page would be a worse place to start.
 */
export interface HeroFlag {
  /** The app's own badge, from `tier-labels.ts` rather than a copy of its wording. */
  badge: string;
  /** What the app offers instead, in one line. */
  better: string;
}

export const HERO_ITEMS: readonly HeroItem[] = [
  {
    name: 'Pizza 4 quesos',
    zone: 'congelados',
    flag: {
      badge: tierLabel('ultra-processed', 'off-nova'),
      better: 'Mejor opción del pasillo: menos procesado',
    },
  },
  { name: 'Tomate rama', zone: 'frescos' },
  { name: 'Leche entera', zone: 'refrigerados' },
  { name: 'Detergente', zone: 'no-alimentacion' },
  { name: 'Garbanzos cocidos', zone: 'despensa' },
];

export interface HeroGroup {
  /** The zone's own label, so the heading and the app's chip say the same word. */
  label: string;
  items: HeroItem[];
}

/**
 * The list as a walk: one group per zone, zones in trip order, and inside a zone the
 * order the items were given.
 *
 * Zones with nothing in them are left out — a heading with nothing under it would be
 * a step the shopper cannot take. That, and iterating `ZONES` rather than the items,
 * is what keeps the demo from having its own opinion about the sequence.
 */
export function heroGroups(items: readonly HeroItem[] = HERO_ITEMS): HeroGroup[] {
  return ZONES.flatMap((zone) => {
    const inZone = items.filter((item) => item.zone === zone.id);
    return inZone.length === 0 ? [] : [{ label: zone.label, items: inZone }];
  });
}
