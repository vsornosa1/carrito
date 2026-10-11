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
  it('opens from the results and steps the phone navigation aside', async () => {
    const user = renderApp();
    await screen.findByRole('button', { name: /Fruta y verdura/ });
    await user.type(searchField(), 'platano');
    await user.click(await screen.findByRole('button', { name: /Plátano de Canarias IGP/ }));

    expect(
      screen.getByRole('heading', { level: 1, name: 'Plátano de Canarias IGP' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Secciones' })).toBeNull();
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
