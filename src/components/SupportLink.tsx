import { Icon } from './icons.tsx';

/**
 * The one place the app asks for anything.
 *
 * A link and nothing else — no script, no image, no frame — so opening the app
 * still contacts nobody. That is the property `docs/LAUNCH.md` claims and the CSP
 * in `public/_headers` enforces, and Ko-fi's own widget would end both: it loads a
 * script from `storage.ko-fi.com`, which `script-src 'self'` blocks. Linking out is
 * therefore not the cheap option, it is the only one that keeps the promise.
 *
 * It sits at the end of the catalogue rather than in the app bar: a request for
 * money does not belong in the space a thumb reaches for the search field.
 */
export function SupportLink() {
  return (
    <div className="support">
      <p className="support__note">
        Carrito es gratis, sin anuncios y sin cuentas. Si te ahorra tiempo en la compra,
        puedes invitarme a un café.
      </p>
      <a
        className="support__action"
        href="https://ko-fi.com/sornosa"
        target="_blank"
        rel="noopener noreferrer"
        // The visible text and the accessible name agree, and the name also says
        // what the target _blank does not announce on its own.
        aria-label="Invítame a un café (se abre en una pestaña nueva)"
      >
        <Icon name="heart" size={18} />
        <span>Invítame a un café</span>
      </a>
    </div>
  );
}
