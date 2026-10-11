import type { AlternativesResult, NoneBetterBecause } from '../lib/alternatives.ts';
import { toBenefit, toCost } from '../lib/benefits.ts';
import { formatPrice } from '../lib/format.ts';
import { pluralise } from '../lib/plural.ts';
import type { Swap } from '../types/swaps.ts';
import { BenefitChips } from './BenefitChips.tsx';
import { ProductThumb } from './ProductThumb.tsx';

interface SwapListProps {
  result: AlternativesResult;
  onSelect: (swap: Swap) => void;
}

/** What a recommendation gives up, if anything. Never smaller than the benefit. */
function CostNote({ swap }: { swap: Swap }) {
  if (!swap.cost) return null;
  const cost = toCost(swap.cost);
  return (
    <ul className="costs" role="list">
      <li className="cost">
        <span className="cost__prefix">A cambio:</span>
        <span className="cost__label">{cost.label}</span>
        <span className="cost__delta">{cost.delta}</span>
      </li>
    </ul>
  );
}

function accessibleName(swap: Swap): string {
  const benefits = swap.reasons
    .map((reason) => {
      const benefit = toBenefit(reason);
      return `${benefit.label}, ${benefit.delta}`;
    })
    .join('; ');
  const cost = swap.cost ? `. A cambio: ${toCost(swap.cost).label}, ${toCost(swap.cost).delta}` : '';
  return `Ver ${swap.product.name}. Mejor: ${benefits}${cost}`;
}

/**
 * "Ninguno es mejor" means two different things, and which one it is matters far more
 * than the count.
 *
 * The panel used to say it in both cases, which meant congratulating someone for buying
 * the least-bad thing on a shelf where nothing is good. The ranking knows the difference
 * — it is the product's own tier — and the person reading has to decide what to do about
 * it, so the copy has to say which one this is.
 */
function noneBetterMessage(because: NoneBetterBecause, comparedCount: number): string {
  const compared = pluralise(comparedCount, 'producto', 'productos');

  if (because === 'already-good') {
    return `Lo hemos comparado con ${compared} de su categoría y ninguno mejora: ya está entre los mejores.`;
  }

  if (because === 'all-alike') {
    return `Lo hemos comparado con ${compared} de su categoría y tampoco hay uno mejor: en esta categoría son todos igual de procesados.`;
  }

  // A third of the catalogue lands here: no ingredient list, so no processing signal, so
  // no claim about the product or about its shelf. Saying "ninguno es mejor" told the
  // reader nothing at all, and "unknown" is only honest if it says *what* is unknown.
  return `Lo hemos comparado con ${compared} de su categoría y ninguno mejora sus cifras. De este no tenemos la lista de ingredientes, así que no podemos decirte si es porque está bien o porque en esta categoría no hay nada mejor.`;
}

export function SwapList({ result, onSelect }: SwapListProps) {
  // Non-food gets no panel at all: "healthier alternatives" for shampoo is noise.
  if (result.kind === 'non-food') return null;

  if (result.kind === 'no-data') {
    return (
      <section className="panel" aria-labelledby="alternativas-title">
        <h2 id="alternativas-title" className="panel__title">
          Alternativas
        </h2>
        <p className="muted" role="status">
          No hay datos suficientes para compararlo con otros productos de su categoría.
        </p>
      </section>
    );
  }

  if (result.kind === 'none-better') {
    return (
      <section className="panel" aria-labelledby="alternativas-title">
        <h2 id="alternativas-title" className="panel__title">
          Alternativas
        </h2>
        <p className="muted" role="status">
          {noneBetterMessage(result.because, result.comparedCount)}
        </p>
      </section>
    );
  }

  return (
    <section className="panel" aria-labelledby="alternativas-title">
      <h2 id="alternativas-title" className="panel__title">
        Alternativas mejores
      </h2>
      <ul className="suggestion-list" role="list">
        {result.swaps.map((swap) => (
          <li key={swap.product.id}>
            <button
              type="button"
              className="suggestion-item"
              onClick={() => onSelect(swap)}
              aria-label={accessibleName(swap)}
            >
              <ProductThumb className="suggestion-item__thumb" src={swap.product.thumbnail} size={56} />
              <span className="suggestion-item__body">
                <span className="suggestion-item__name">{swap.product.name}</span>
                <BenefitChips reasons={swap.reasons} />
                <CostNote swap={swap} />
              </span>
              <span className="suggestion-item__aside">
                <span className="suggestion-item__price">{formatPrice(swap.product.unitPrice)}</span>
                <span className="suggestion-item__chevron" aria-hidden="true">
                  ›
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
