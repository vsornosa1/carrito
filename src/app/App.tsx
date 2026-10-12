import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { AppHeader } from '../components/AppHeader.tsx';
import { BottomNav } from '../components/BottomNav.tsx';
import { ConfirmDialog } from '../components/ConfirmDialog.tsx';
import type { TabId } from '../components/nav-tabs.tsx';
import { cartTotal, isInCart } from '../lib/cart.ts';
import { encodeSharePayload, shareUrl } from '../lib/joint-session.ts';
import { shareLink } from '../lib/share.ts';
import { buildSwapSignals } from '../lib/swaps.ts';
import type { BindChoice, UnbindChoice } from '../types/joint-session.ts';
import type { Swap } from '../types/swaps.ts';
import { BrowseScreen } from './BrowseScreen.tsx';
import { CartScreen } from './CartScreen.tsx';
import { ProductScreen, type RecommendationContext } from './ProductScreen.tsx';
import { SearchResults } from './SearchResults.tsx';
import { useCart } from './useCart.ts';
import { useCatalog } from './useCatalog.ts';
import { useJointSession } from './useJointSession.ts';
import { useIsDesktop } from './useMediaQuery.ts';
import { useOrder } from './useOrder.ts';

interface OpenProduct {
  id: number;
  recommendation?: RecommendationContext;
}

const BIND_LABELS: Record<BindChoice, string> = { merge: 'Fusionar', replace: 'Reemplazar' };

/**
 * Both consequences, before the tap.
 *
 * A merge cannot uncheck — that is a property of the rule, not a bug to discover — and a
 * replace throws away the list that is on screen. Naming both is the difference between
 * a question and a guess.
 */
const BIND_MESSAGE =
  'Fusionar une las dos listas, y no puede destachar lo que ya esté tachado. ' +
  'Reemplazar deja la lista del enlace y descarta la tuya.';

export function App() {
  const { products, status } = useCatalog();
  const { cart, add, remove, toggle, clear, quantity, replace } = useCart();
  const { order, change: changeOrder } = useOrder();
  const isDesktop = useIsDesktop();

  const joint = useJointSession({ cart, onCartReplaced: replace });

  // What the bar has to say, and the link itself when the app had to show it rather than
  // send it. Both live here because both are consequences of an action taken here.
  const [notice, setNotice] = useState<string | null>(null);
  const [manualLink, setManualLink] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);

  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<TabId>('browse');
  const [openProduct, setOpenProduct] = useState<OpenProduct | null>(null);

  const signals = useMemo(() => buildSwapSignals(products), [products]);
  const selected =
    openProduct === null ? null : (products.find((p) => p.id === openProduct.id) ?? null);
  const totals = useMemo(() => cartTotal(cart, products), [cart, products]);
  const term = query.trim();

  // A link for a list this device is not in. Refused rather than switched to: joining it
  // would silently abandon the list this device is already part of, and losing a list
  // without being asked is the one thing the cart has never done.
  const foreignOffer =
    joint.pending !== null &&
    joint.binding !== null &&
    joint.pending.sessionId !== joint.binding.sessionId;

  // The remembered answer becomes the primary button; both answers are always on screen.
  // Pre-answering is not the same as auto-applying, and a question the user set a default
  // for last month must still be a question.
  const preferred: BindChoice = joint.remembered ?? 'merge';
  const other: BindChoice = preferred === 'merge' ? 'replace' : 'merge';

  const share = () => {
    const sessionId = joint.ensureSession();
    const payload = encodeSharePayload(sessionId, cart);

    // Refused rather than truncated: a link that only sometimes opens is worse than being
    // told the list is too long to send.
    if (payload === null) {
      setManualLink(null);
      setNotice(
        'Esta lista es demasiado larga para compartirse por enlace. Quita algún producto y vuelve a intentarlo.',
      );
      return;
    }

    const link = shareUrl(payload, window.location.origin);
    void shareLink(link, window.navigator).then((outcome) => {
      setManualLink(outcome === 'manual' ? link : null);
      setNotice(
        outcome === 'shared'
          ? 'Enlace enviado.'
          : outcome === 'copied'
            ? 'Enlace copiado.'
            : outcome === 'manual'
              ? 'Copia el enlace y envíalo.'
              : null,
      );
    });
  };

  const leave = (choice: UnbindChoice) => {
    joint.unbind(choice);
    setLeaving(false);
    setNotice(null);
    setManualLink(null);
  };

  // On every *place* change, start at the top and move focus into the content so
  // assistive tech announces it instead of the DOM swapping silently. A search
  // deliberately does not count: the caret is in the field, and moving focus
  // would interrupt the typing that caused it.
  //
  // `preventScroll` on the focus is load-bearing, not tidiness. Focusing a large
  // element scrolls it into view, so the two calls were fighting: the focus put
  // `<main>`'s top at the viewport top, and the *sticky* app bar then sat over it —
  // hiding the first ~110px of every product view, which is exactly where "← Volver"
  // is. The page looked scrolled with no way back unless you scrolled up first.
  const mainRef = useRef<HTMLElement>(null);
  const firstRender = useRef(true);
  const viewKey = selected !== null ? `product:${selected.id}` : tab;

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    window.scrollTo({ top: 0 });

    // Never take the caret off someone who is typing. Opening a product and then typing
    // a second character is one keystroke that changes `viewKey`, and this effect used to
    // move focus into `<main>` on the way past — so the search box lost focus after the
    // first letter and "search" meant one character at a time, filtering on that.
    const active = document.activeElement;
    const typing =
      active instanceof HTMLInputElement ||
      active instanceof HTMLTextAreaElement ||
      (active instanceof HTMLElement && active.isContentEditable);
    if (typing) return;

    mainRef.current?.focus({ preventScroll: true });
  }, [viewKey]);

  /*
    The browser's back button has to mean what the app's back button means, or someone
    who opens a product and swipes back lands somewhere they never were — the landing
    page, or out of the app entirely.

    One history entry per open product, and the URL is left alone on purpose: this is a
    static host with no server to resolve `/app/producto/123`, so a deep link would 404
    on refresh. The entry carries the product id in its state instead, which is enough
    to make back and forward land on the right view.
  */
  const historyProduct = (): number | undefined =>
    (window.history.state as { product?: number } | null)?.product;

  useEffect(() => {
    if (openProduct === null) return;
    // Guarded because React runs effects twice in development: without this, one
    // product would leave two entries behind and back would need pressing twice.
    if (historyProduct() === openProduct.id) return;
    window.history.pushState({ product: openProduct.id }, '');
  }, [openProduct]);

  useEffect(() => {
    const onPop = (event: PopStateEvent) => {
      const id = (event.state as { product?: number } | null)?.product;
      setOpenProduct(id === undefined ? null : { id });
    };

    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Going through history when there is an entry to consume keeps the two in step:
  // closing the view any other way would leave an entry behind that reopens nothing.
  const closeProduct = () => {
    if (historyProduct() === undefined) setOpenProduct(null);
    else window.history.back();
  };

  const openSwap = (swap: Swap, from: { id: number; name: string }) => {
    setOpenProduct({
      id: swap.product.id,
      recommendation: {
        fromName: from.name,
        reasons: swap.reasons,
        onBackToOrigin: () => setOpenProduct({ id: from.id }),
      },
    });
  };

  // Typing while a product is open used to change the query and nothing else, because
  // the open product wins the render — so the search only appeared after you closed it,
  // which reads as "search does not work from inside a product". Searching is a change of
  // place, so it is treated as one.
  const search = (value: string) => {
    setQuery(value);
    if (value.trim() !== '') setOpenProduct(null);
  };

  // Choosing a section is also how you leave a search, so the field is cleared:
  // a query that outlived the click would keep overriding the tab.
  const selectTab = (next: TabId) => {
    setTab(next);
    setOpenProduct(null);
    setQuery('');
  };

  // One ordered decision rather than several independent conditions: an open
  // product wins, then a search in progress, then the chosen section.
  let content: ReactNode;
  if (selected !== null) {
    content = (
      <ProductScreen
        product={selected}
        catalog={products}
        signals={signals}
        recommendation={openProduct?.recommendation}
        onBack={closeProduct}
        onAdd={() => add(selected.id)}
        added={isInCart(cart, selected.id)}
        onSelectSwap={(swap) => openSwap(swap, { id: selected.id, name: selected.name })}
        onSelectSimilar={(id) => setOpenProduct({ id })}
      />
    );
  } else if (term !== '') {
    content = (
      <SearchResults
        query={query}
        products={products}
        status={status}
        onSelectProduct={(id) => setOpenProduct({ id })}
      />
    );
  } else if (tab === 'cart') {
    content = (
      <CartScreen
        cart={cart}
        products={products}
        total={totals}
        order={order}
        onOrderChange={changeOrder}
        onToggle={toggle}
        onRemove={remove}
        onClear={clear}
        onSetQuantity={quantity}
        joint={
          joint.binding === null
            ? null
            : {
                sessionId: joint.binding.sessionId,
                notice,
                manualLink,
                onShare: share,
                onUnbind: () => setLeaving(true),
              }
        }
      />
    );
  } else {
    content = (
      <BrowseScreen
        products={products}
        status={status}
        onSelectProduct={(id) => setOpenProduct({ id })}
      />
    );
  }

  return (
    <>
      <AppHeader
        query={query}
        onQueryChange={search}
        activeTab={tab}
        onSelectTab={selectTab}
        cartCount={totals.units}
        cartTotal={totals.total}
      />

      <main className="app-main" ref={mainRef} tabIndex={-1}>
        {content}
      </main>

      {foreignOffer ? (
        <div className="joint-notice" role="status">
          <p>Ya estás en otra lista compartida. Desvincúlate de ella para unirte a esta.</p>
          <button type="button" className="joint-notice__dismiss" onClick={() => joint.dismiss()}>
            Descartar
          </button>
        </div>
      ) : null}

      <ConfirmDialog
        open={joint.pending !== null && !foreignOffer}
        title="¿Unir esta lista con la tuya?"
        message={BIND_MESSAGE}
        confirmLabel={BIND_LABELS[preferred]}
        alternateLabel={BIND_LABELS[other]}
        onConfirm={() => joint.resolve(preferred)}
        onAlternate={() => joint.resolve(other)}
        onCancel={() => joint.dismiss()}
      />

      <ConfirmDialog
        open={leaving}
        title="¿Desvincular de la lista compartida?"
        message="Esta lista dejará de ser compartida. Puedes quedarte con lo que hay en ella o empezar de cero."
        confirmLabel="Quedarme con la lista"
        alternateLabel="Empezar de cero"
        onConfirm={() => leave('keep')}
        onAlternate={() => leave('clear')}
        onCancel={() => setLeaving(false)}
      />

      {/* The tabs stay put, product open or not. They used to be hidden for a pushed
          view and replaced by a button in the app bar; the bar now carries nothing but
          search, and a nav that comes and goes is one you have to go looking for. */}
      {!isDesktop ? (
        <BottomNav
          active={tab}
          cartCount={totals.units}
          cartTotal={totals.total}
          onSelect={selectTab}
        />
      ) : null}
    </>
  );
}
