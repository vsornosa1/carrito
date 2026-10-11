import { ZONES } from '../lib/zones.ts';

/**
 * The hero's demo list.
 *
 * A handful of stand-ins, not the catalogue. The hero needs the *shape* of a
 * shopping list; importing `public/catalog/products.json` here would put 5.8 MB in
 * front of someone who has not decided to use the app yet, which is the one thing
 * this page must never do. A guard in `tests/landing-isolation.test.ts` enforces it.
 *
 * The zones are the app's own `ZONES`, so the order the hero acts out is the order
 * the app actually proposes. A hand-copied list would drift within a release, and
 * the drift would be invisible — the hero would simply start lying.
 */
export interface HeroItem {
  name: string;
  zone: (typeof ZONES)[number]['id'];
}

export const HERO_ITEMS: readonly HeroItem[] = [
  { name: 'Pizza 4 quesos', zone: 'congelados' },
  { name: 'Tomate rama', zone: 'frescos' },
  { name: 'Leche entera', zone: 'refrigerados' },
  { name: 'Detergente', zone: 'no-alimentacion' },
  { name: 'Garbanzos cocidos', zone: 'despensa' },
];

/**
 * The hero's beats, in order.
 *
 * Each caption is a claim the app can actually keep — and deliberately not a *number*.
 * The first draft read "4 aditivos" and "12 g menos de azúcar", which is exactly the
 * kind of figure this app refuses to invent for a real product; on a marketing page it
 * would be worse, not better. The demo is labelled an example for the same reason.
 */
export interface HeroBeat {
  id: 'see' | 'swap' | 'order';
  /** Short status, shown on the card. */
  badge: string;
  /** The sentence under the demo. */
  caption: string;
}

export const HERO_BEATS: readonly HeroBeat[] = [
  {
    id: 'see',
    badge: 'Ultraprocesado',
    caption: 'Muchos aditivos, y los puedes ver uno a uno',
  },
  {
    id: 'swap',
    badge: 'Mejor opción del pasillo',
    caption: 'Te dice por qué es mejor, con los números delante',
  },
  {
    id: 'order',
    badge: 'En orden de recorrido',
    caption: 'Congelados al final, para que no se derritan',
  },
];

export const HERO_BEAT_MS = 2800;

export function nextBeat(current: number): number {
  return (current + 1) % HERO_BEATS.length;
}

/**
 * The items in the order the app would propose: zones in trip order, and inside each
 * zone the items keep the order they were given.
 */
export function orderedItems(items: readonly HeroItem[] = HERO_ITEMS): HeroItem[] {
  return ZONES.flatMap((zone) => items.filter((item) => item.zone === zone.id));
}

export function zoneLabel(id: HeroItem['zone']): string {
  return ZONES.find((zone) => zone.id === id)?.label ?? '';
}
