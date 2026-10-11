import type { IconName } from '../components/icons.tsx';

/**
 * One pictogram per supermarket section.
 *
 * Data, not a branch, for the same reason `SECTION_TO_ZONE` is: adding a section
 * becomes a one-line diff in a single place, and the mapping can be checked against
 * the real catalogue rather than trusted.
 *
 * The icons are decorative — every row renders the section's name beside its
 * pictogram — so `Icon` is `aria-hidden` and this table never carries meaning on
 * its own. Losing the icons would cost nothing but looks; losing the names would
 * cost the app.
 */
export const SECTION_ICON: Record<string, IconName> = {
  'Fruta y verdura': 'apple',
  Carne: 'meat',
  'Marisco y pescado': 'fish',
  'Charcutería y quesos': 'cheese',
  'Panadería y pastelería': 'bread',
  'Aceite, especias y salsas': 'bottle',
  'Conservas, caldos y cremas': 'jar',
  'Arroz, legumbres y pasta': 'pasta',
  'Cacao, café e infusiones': 'coffee',
  'Cereales y galletas': 'cookie',
  'Azúcar, caramelos y chocolate': 'chocolate',
  Aperitivos: 'snack',
  'Agua y refrescos': 'water',
  Zumos: 'juice',
  Bodega: 'wine',
  'Limpieza y hogar': 'spray',
  'Cuidado facial y corporal': 'soap',
  'Cuidado del cabello': 'comb',
  Maquillaje: 'lipstick',
  Mascotas: 'paw',
  'Fitoterapia y parafarmacia': 'pharmacy',
  'Huevos, leche y mantequilla': 'egg',
  'Postres y yogures': 'yoghurt',
  'Pizzas y platos preparados': 'plate',
  Congelados: 'snowflake',
  Bebé: 'baby',
};

/**
 * Where a section the table has never seen lands.
 *
 * Exported so the fallback is visible in a test rather than silent — the same
 * contract `FALLBACK_ZONE` keeps. A new Mercadona section must show up as
 * "unmapped" in the suite, not quietly borrow a pictogram that means something else.
 */
export const FALLBACK_SECTION_ICON: IconName = 'browse';

export function sectionIcon(sectionName: string): IconName {
  return SECTION_ICON[sectionName] ?? FALLBACK_SECTION_ICON;
}
