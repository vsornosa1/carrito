/**
 * What the section list looks like before there is one.
 *
 * It reuses `.section-row`, the class the real rows use, on purpose. A skeleton whose
 * geometry is written out twice drifts the moment the row changes, and when it drifts
 * the page jumps as the catalogue lands — which is the one thing a skeleton exists to
 * prevent.
 *
 * The bars are `aria-hidden` and the loading message is real text: "loading" is
 * information, and a grey rectangle is not.
 */
export function CatalogSkeleton({ rows = 7 }: { rows?: number }) {
  return (
    <div className="section-skeleton" role="status" aria-busy="true">
      <p className="visually-hidden">Cargando el catálogo</p>
      <ul className="section-list" aria-hidden="true">
        {Array.from({ length: rows }, (_, index) => (
          <li key={index}>
            <div className="section-row section-row--skeleton">
              <span className="skeleton skeleton__icon" />
              <span className="skeleton skeleton__line" />
              <span className="skeleton skeleton__count" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
