import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { makeProduct } from '../test-fixtures.ts';
import { stubViewport } from '../test-media.ts';
import { CART_STORAGE_KEY } from '../lib/cart.ts';
import { App } from './App.tsx';

const catalog = [
  makeProduct({
    id: 1,
    name: 'Plátano de Canarias IGP',
    unitPrice: 1.19,
    categoryPath: [
      { id: 3, name: 'Fruta y verdura' },
      { id: 27, name: 'Fruta' },
      { id: 853, name: 'Plátano y uva' },
    ],
    leafCategoryId: 853,
  }),
  makeProduct({ id: 2, name: 'Leche entera', brand: 'Hacendado', unitPrice: 0.96 }),
];

function renderApp(composition: 'phone' | 'desktop' = 'phone') {
  stubViewport(composition);
  render(<App />);
  return userEvent.setup();
}

const searchField = () => screen.getByRole('searchbox', { name: 'Buscar producto' });

beforeEach(() => {
  window.localStorage.clear();
  // History is shared by every test in this file, and the app now pushes an entry per
  // open product. Without this reset, a leftover entry makes the next test start
  // mid-navigation and its push get skipped as a duplicate.
  window.history.replaceState(null, '');
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: true, json: async () => catalog })),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('App — where it starts', () => {
  it('opens on the sections, because search is not somewhere you navigate to', async () => {
    renderApp();
    expect(await screen.findByRole('button', { name: /Fruta y verdura/ })).toBeInTheDocument();
  });

  it('has no tab that leads to a second copy of the search field', async () => {
    renderApp();
    await screen.findByRole('button', { name: /Fruta y verdura/ });
    expect(screen.queryByRole('button', { name: 'Buscar' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Categorías' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Carrito' })).toBeInTheDocument();
  });
});

/*
  The bug these defend against: navigation is React state, so the browser's history knew
  nothing about it. Opening a product and pressing back took you out of the app instead of
  out of the product — the browser's back button and the app's "Volver" meant two
  different things.

  jsdom does not perform real navigations, so `history.back()` is not usable here. The
  contract is asserted at the seam the browser actually uses: the entry the app pushes,
  and how it reacts to `popstate`.
*/
describe('App — the browser back button', () => {
  async function openFromSearch(user: ReturnType<typeof userEvent.setup>) {
    await screen.findByRole('button', { name: /Fruta y verdura/ });
    await user.type(searchField(), 'platano');
    const row = (await screen.findAllByRole('button', { name: /Plátano de Canarias/ }))[0]!;
    await user.click(row);
    await screen.findByRole('button', { name: /Volver/ });
  }

  it('opens a product as one history entry, so one press of back leaves the product', async () => {
    const user = renderApp();
    const urlBefore = window.location.href;

    await openFromSearch(user);

    expect(window.history.state).toEqual({ product: 1 });
    // The URL is left alone on purpose: this is a static host with no server to resolve
    // /app/producto/1, so a deep link would 404 on refresh.
    expect(window.location.href).toBe(urlBefore);
  });

  it('closes the product when the browser goes back, exactly as the app button does', async () => {
    const user = renderApp();
    await openFromSearch(user);

    // Wrapped in act: popstate arrives outside React's event system, so without it the
    // state update is only *scheduled* when the assertion runs.
    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate', { state: null }));
    });

    expect(screen.queryByRole('button', { name: /Volver/ })).toBeNull();
    expect(searchField()).toHaveValue('platano');
  });

  it('reopens the right product when the browser goes forward onto it', async () => {
    const user = renderApp();
    await openFromSearch(user);

    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate', { state: null }));
    });
    expect(screen.queryByRole('button', { name: /Volver/ })).toBeNull();

    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate', { state: { product: 1 } }));
    });

    expect(await screen.findByRole('button', { name: /Volver/ })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: /Plátano de Canarias/ }),
    ).toBeInTheDocument();
  });
});

/*
  The symptom reported: search "does not work from inside a product; it only retrieves
  when you go back to the list". The cause was render precedence — an open product beat
  the query — so typing changed the field and nothing else.
*/
describe('App — searching from inside a product', () => {
  it('shows the results as soon as you type, instead of waiting for you to close it', async () => {
    const user = renderApp();
    await screen.findByRole('button', { name: /Fruta y verdura/ });

    await user.type(searchField(), 'platano');
    await user.click((await screen.findAllByRole('button', { name: /Plátano de Canarias/ }))[0]!);
    await screen.findByRole('button', { name: /Volver/ });

    await user.clear(searchField());
    await user.type(searchField(), 'leche');

    expect(await screen.findByRole('button', { name: /Leche entera/ })).toBeInTheDocument();
    // Typing moved us out of the product, which is what makes the results visible.
    expect(screen.queryByRole('button', { name: /Volver/ })).toBeNull();
  });

  it('leaves the product alone when the field is merely cleared', async () => {
    const user = renderApp();
    await screen.findByRole('button', { name: /Fruta y verdura/ });

    await user.type(searchField(), 'platano');
    await user.click((await screen.findAllByRole('button', { name: /Plátano de Canarias/ }))[0]!);
    await screen.findByRole('button', { name: /Volver/ });

    await user.clear(searchField());

    expect(screen.getByRole('button', { name: /Volver/ })).toBeInTheDocument();
  });

  /*
    The bug that made search "one character at a time". Closing the product changes
    `viewKey`, and the view-change effect moved focus into `<main>` on the way past — so
    the caret left the field after the first letter and the second one went nowhere.
    Asserting the value, not just the focus: with the bug the value only ever grew by one
    character.
  */
  it('keeps the caret in the field while you type a second character', async () => {
    const user = renderApp();
    await screen.findByRole('button', { name: /Fruta y verdura/ });

    await user.type(searchField(), 'platano');
    await user.click((await screen.findAllByRole('button', { name: /Plátano de Canarias/ }))[0]!);
    await screen.findByRole('button', { name: /Volver/ });

    await user.type(searchField(), ' le');

    expect(searchField()).toHaveFocus();
    expect(searchField()).toHaveValue('platano le');
  });
});

describe('App — searching from anywhere', () => {
  it('replaces the section with results as soon as something is typed', async () => {
    const user = renderApp();
    await screen.findByRole('button', { name: /Fruta y verdura/ });

    await user.type(searchField(), 'platano');

    expect(await screen.findByText(/1 resultado para «platano»/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Fruta y verdura/ })).toBeNull();
  });

  it('puts the section back when the field is cleared', async () => {
    const user = renderApp();
    await screen.findByRole('button', { name: /Fruta y verdura/ });
    await user.type(searchField(), 'platano');
    await screen.findByText(/1 resultado para «platano»/);

    await user.clear(searchField());

    expect(await screen.findByRole('button', { name: /Fruta y verdura/ })).toBeInTheDocument();
  });

  it('leaves the search behind when a section is chosen, rather than letting it win', async () => {
    const user = renderApp();
    await screen.findByRole('button', { name: /Fruta y verdura/ });
    await user.type(searchField(), 'platano');
    await screen.findByText(/1 resultado para «platano»/);

    await user.click(screen.getByRole('button', { name: 'Carrito' }));

    expect(screen.getByRole('heading', { level: 1, name: 'Carrito' })).toBeInTheDocument();
    expect(searchField()).toHaveValue('');
  });
});

describe('App — the list', () => {
  it('shows the list when its section is chosen', async () => {
    const user = renderApp();
    await screen.findByRole('button', { name: /Fruta y verdura/ });
    await user.click(screen.getByRole('button', { name: 'Carrito' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Carrito' })).toBeInTheDocument();
  });

  it('says what the list costs in the navigation, without opening it', async () => {
    window.localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify({
        items: [{ productId: 2, addedAt: '2026-10-06T12:00:00Z', checked: false }],
        updatedAt: '2026-10-06T12:00:00Z',
      }),
    );
    renderApp();

    const listTab = await screen.findByRole('button', { name: /Carrito/ });
    expect(listTab.getAttribute('aria-label')).toContain('0,96');
  });
});

describe('App — a product', () => {
  /*
    Reversed on purpose, and this pins the reversal. The tabs used to be hidden for a
    product — "a pushed view with its own way back" — with a list button in the app bar
    standing in for them. The bar now carries nothing but search, and the nav stays:
    a nav that comes and goes is one you have to go looking for, and the way back is
    the one thing you always want.
  */
  it('keeps the phone navigation in place while a product is open', async () => {
    const user = renderApp();
    await screen.findByRole('button', { name: /Fruta y verdura/ });
    await user.type(searchField(), 'platano');
    await user.click(await screen.findByRole('button', { name: /Plátano de Canarias IGP/ }));

    expect(
      screen.getByRole('heading', { level: 1, name: 'Plátano de Canarias IGP' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Secciones' })).toBeInTheDocument();
    // And the bar is not carrying a second way to the cart. Scoped to the header by
    // class: matching on the name alone finds the bottom nav's own Carrito tab, which is
    // the thing this change put back.
    expect(document.querySelector('.app-header__list')).toBeNull();
  });

  it('goes back to the results you came from', async () => {
    const user = renderApp();
    await screen.findByRole('button', { name: /Fruta y verdura/ });
    await user.type(searchField(), 'platano');
    await user.click(await screen.findByRole('button', { name: /Plátano de Canarias IGP/ }));
    await user.click(screen.getByRole('button', { name: /Volver/ }));

    expect(await screen.findByText(/1 resultado para «platano»/)).toBeInTheDocument();
  });

  it('keeps the sections in the bar on desktop, so the app is never a dead end', async () => {
    const user = renderApp('desktop');
    await screen.findByRole('button', { name: /Fruta y verdura/ });
    await user.type(searchField(), 'platano');
    await user.click(await screen.findByRole('button', { name: /Plátano de Canarias IGP/ }));

    expect(screen.getByRole('navigation', { name: 'Secciones' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Categorías' }));
    expect(screen.queryByRole('heading', { level: 1, name: 'Plátano de Canarias IGP' })).toBeNull();
    expect(screen.getByRole('navigation', { name: 'Secciones del supermercado' })).toBeInTheDocument();
  });

  it('keeps the list one tap away on a phone, even with a product open', async () => {
    const user = renderApp('phone');
    await screen.findByRole('button', { name: /Fruta y verdura/ });
    await user.type(searchField(), 'platano');
    await user.click(await screen.findByRole('button', { name: /Plátano de Canarias IGP/ }));

    // The tabs step aside for the product, so the bar has to carry the list.
    await user.click(screen.getByRole('button', { name: /Carrito/ }));
    expect(screen.getByRole('heading', { level: 1, name: 'Carrito' })).toBeInTheDocument();
  });

  it('offers exactly one way to the list, never two', async () => {
    renderApp('phone');
    await screen.findByRole('button', { name: /Fruta y verdura/ });
    expect(screen.getAllByRole('button', { name: /Carrito/ })).toHaveLength(1);
  });
});

/*
  Joint lists, at the level where they are wired together.

  The pure rules and the bar have their own tests; what is exercised here is the seam —
  that an arriving link asks before it changes anything, that sharing builds a real link
  from the list on screen, and that leaving leaves nothing behind.

  Everything is seeded *before* the render, because the cart and the binding are read
  once at mount; seeding afterwards would test a state the app never has.
*/
describe('App — a shared list', () => {
  const sid = 'A7fK2qAAAAAAAAAAAAAAAA';
  const otherSid = 'BBBBBBBBBBBBBBBBBBBBBB';

  function bindTo(sessionId: string) {
    window.localStorage.setItem(
      'carrito.joint.v1',
      JSON.stringify({ sessionId, joinedAt: '2026-10-12T10:00:00.000Z', origin: 'joined' }),
    );
  }

  function seedCart(ids: number[], quantity = 1) {
    window.localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify({
        items: ids.map((id) => ({
          productId: id,
          addedAt: '2026-10-12T10:00:00.000Z',
          checked: false,
          quantity,
        })),
        updatedAt: '2026-10-12T10:00:00.000Z',
      }),
    );
  }

  /** A link that has arrived, as the browser would present it. */
  function arriveWith(sessionId: string, items: string) {
    window.history.replaceState(null, '', `/app/#j=1.${sessionId}.${items}`);
  }

  /**
   * jsdom's `navigator` carries its members on the prototype, so spreading it yields
   * nothing. Defining the property directly is the only way to give the app an API the
   * browser would normally provide.
   */
  function stubPlatform(platform: { share?: unknown; clipboard?: unknown }) {
    Object.defineProperty(window.navigator, 'share', {
      value: platform.share,
      configurable: true,
    });
    Object.defineProperty(window.navigator, 'clipboard', {
      value: platform.clipboard,
      configurable: true,
    });
  }

  afterEach(() => {
    Reflect.deleteProperty(window.navigator, 'share');
    Reflect.deleteProperty(window.navigator, 'clipboard');
  });

  /**
   * Renders, then hands the app a platform.
   *
   * The order matters and is not obvious: `userEvent.setup()` installs a clipboard of
   * its own, so stubbing `navigator` before the harness would be overwritten and the app
   * would find a clipboard no test provided. The app reads `navigator` at the moment of
   * the tap, so stubbing after the render is what the test actually needs.
   */
  function renderAppWithPlatform(platform: { share?: unknown; clipboard?: unknown }) {
    const user = renderApp();
    stubPlatform(platform);
    return user;
  }

  async function openCart(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole('button', { name: /Carrito/ }));
  }

  it('shows no shared-list bar at all while this device is solo', async () => {
    const user = renderApp();
    await screen.findByRole('button', { name: /Fruta y verdura/ });
    await openCart(user);

    expect(screen.queryByRole('region', { name: 'Lista compartida' })).not.toBeInTheDocument();
  });

  it('shows the bar when bound, even with an empty list, so leaving stays reachable', async () => {
    bindTo(sid);
    const user = renderApp();
    await screen.findByRole('button', { name: /Fruta y verdura/ });
    await openCart(user);

    expect(screen.getByRole('region', { name: 'Lista compartida' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Desvincularme' })).toBeInTheDocument();
  });

  it('asks before applying a link, and names both consequences before the tap', async () => {
    arriveWith(sid, '2');
    renderApp();

    const dialog = await screen.findByRole('dialog', { name: '¿Unir esta lista con la tuya?' });
    expect(dialog).toHaveTextContent(/no puede destachar/i);
    expect(dialog).toHaveTextContent(/descarta la tuya/i);
    expect(screen.getByRole('button', { name: 'Fusionar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reemplazar' })).toBeInTheDocument();
  });

  it('adds the arriving list to the cart when the answer is to merge', async () => {
    seedCart([1]);
    arriveWith(sid, '2');
    const user = renderApp();
    await screen.findByRole('dialog', { name: '¿Unir esta lista con la tuya?' });

    await user.click(screen.getByRole('button', { name: 'Fusionar' }));
    await openCart(user);

    expect(screen.getByText('Plátano de Canarias IGP')).toBeInTheDocument();
    expect(screen.getByText('Leche entera')).toBeInTheDocument();
  });

  it('leaves the cart alone when the offer is cancelled', async () => {
    seedCart([1]);
    arriveWith(sid, '2');
    const user = renderApp();
    await screen.findByRole('dialog', { name: '¿Unir esta lista con la tuya?' });

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    await openCart(user);

    expect(screen.getByText('Plátano de Canarias IGP')).toBeInTheDocument();
    expect(screen.queryByText('Leche entera')).not.toBeInTheDocument();
  });

  it('refuses a link for a different list, and says why instead of switching', async () => {
    bindTo(otherSid);
    seedCart([1]);
    arriveWith(sid, '2');
    const user = renderApp();
    await screen.findByRole('button', { name: /Fruta y verdura/ });

    expect(screen.getByRole('status')).toHaveTextContent(/ya estás en otra lista compartida/i);
    expect(screen.queryByRole('dialog', { name: '¿Unir esta lista con la tuya?' })).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Descartar' }));
    await openCart(user);

    expect(screen.getByText('Plátano de Canarias IGP')).toBeInTheDocument();
    expect(screen.queryByText('Leche entera')).not.toBeInTheDocument();
  });

  it('sends a real link built from the list on screen when sharing', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    bindTo(sid);
    seedCart([1, 2]);
    const user = renderAppWithPlatform({ share });
    await screen.findByRole('button', { name: /Fruta y verdura/ });
    await openCart(user);

    await user.click(screen.getByRole('button', { name: 'Compartir' }));

    expect(share).toHaveBeenCalledTimes(1);
    expect(share.mock.calls[0]?.[0]).toMatchObject({
      url: expect.stringContaining(`/app/#j=1.${sid}.1,2`) as unknown as string,
    });
    expect(screen.getByRole('status')).toHaveTextContent(/enviado/i);
  });

  it('shows the link in a field when the platform can neither share nor copy', async () => {
    bindTo(sid);
    seedCart([1]);
    const user = renderAppWithPlatform({});
    await screen.findByRole('button', { name: /Fruta y verdura/ });
    await openCart(user);

    await user.click(screen.getByRole('button', { name: 'Compartir' }));

    // `findBy`, because handing the link over is asynchronous: the platform APIs are
    // promises, so the field appears a microtask after the tap.
    const field = await screen.findByRole('textbox', { name: 'Enlace para compartir' });
    expect((field as HTMLInputElement).value).toContain(`/app/#j=1.${sid}.1`);
    expect(screen.getByRole('status')).toHaveTextContent(/copia el enlace/i);
  });

  // 400 lines, not 1,100: long ids and a quantity make the payload exceed the cap with a
  // list small enough to render quickly. The first version of this test rendered 1,100
  // rows and timed out at 5s under coverage instrumentation — a slow test, not a slow app.
  it(
    'refuses to produce a link at all when the list is too long to share',
    async () => {
      const share = vi.fn().mockResolvedValue(undefined);
      bindTo(sid);
      seedCart(
        Array.from({ length: 400 }, (_, index) => 1000000000000000 + index),
        99,
      );
      const user = renderAppWithPlatform({ share });
      await screen.findByRole('button', { name: /Fruta y verdura/ });
      await openCart(user);

      await user.click(screen.getByRole('button', { name: 'Compartir' }));

      expect(share).not.toHaveBeenCalled();
      expect(screen.getByRole('status')).toHaveTextContent(/demasiado larga para compartirse/i);
    },
    30_000,
  );

  it('keeps the list and drops the binding when leaving that way', async () => {
    bindTo(sid);
    seedCart([1]);
    const user = renderApp();
    await screen.findByRole('button', { name: /Fruta y verdura/ });
    await openCart(user);

    await user.click(screen.getByRole('button', { name: 'Desvincularme' }));
    await user.click(screen.getByRole('button', { name: 'Quedarme con la lista' }));

    expect(screen.queryByRole('region', { name: 'Lista compartida' })).toBeNull();
    expect(screen.getByText('Plátano de Canarias IGP')).toBeInTheDocument();
  });

  it('empties the list and drops the binding when leaving that way', async () => {
    bindTo(sid);
    seedCart([1]);
    const user = renderApp();
    await screen.findByRole('button', { name: /Fruta y verdura/ });
    await openCart(user);

    await user.click(screen.getByRole('button', { name: 'Desvincularme' }));
    await user.click(screen.getByRole('button', { name: 'Empezar de cero' }));

    expect(screen.queryByRole('region', { name: 'Lista compartida' })).toBeNull();
    expect(screen.getByText('El carrito está vacío')).toBeInTheDocument();
  });
});
