import type { ProductSort } from '../lib/ordering.ts';

const LABELS: Record<ProductSort, string> = {
  shop: 'Como en la tienda',
  az: 'A–Z',
  price: 'Precio',
};

const ORDER: readonly ProductSort[] = ['shop', 'az', 'price'];

interface SortControlProps {
  sort: ProductSort;
  onChange: (next: ProductSort) => void;
}

/**
 * How to list a shelf.
 *
 * "Como en la tienda" is the default and is not a joke: the shop's own order within a
 * shelf already groups what you would compare, which is why it stays first. The other two
 * answer the two questions people actually arrive with — what is this called, and what is
 * the cheapest.
 *
 * `aria-pressed` rather than a radio group: these are three ways of looking at one list,
 * not three answers to a question, and a pressed button says "this is what you are
 * looking at" without dragging a whole widget's worth of keyboard behaviour along.
 */
export function SortControl({ sort, onChange }: SortControlProps) {
  return (
    <div className="sort" role="group" aria-label="Ordenar productos">
      {ORDER.map((id) => (
        <button
          key={id}
          type="button"
          className="sort__option"
          aria-pressed={id === sort}
          onClick={() => onChange(id)}
        >
          {LABELS[id]}
        </button>
      ))}
    </div>
  );
}
