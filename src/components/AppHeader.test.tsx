import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { stubViewport } from '../test-media.ts';
import { AppHeader } from './AppHeader.tsx';

afterEach(() => {
  vi.unstubAllGlobals();
});

function renderHeader(overrides: Partial<Parameters<typeof AppHeader>[0]> = {}) {
  const onQueryChange = vi.fn();
  const onSelectTab = vi.fn();
  render(
    <AppHeader
      query=""
      onQueryChange={onQueryChange}
      activeTab="browse"
      onSelectTab={onSelectTab}
      cartCount={0}
      cartTotal={0}
      {...overrides}
    />,
  );
  return { onQueryChange, onSelectTab };
}

/** The real thing is a controlled field driven by the app, so the test drives it too. */
function ControlledHeader() {
  const [query, setQuery] = useState('');
  return (
    <AppHeader
      query={query}
      onQueryChange={setQuery}
      activeTab="browse"
      onSelectTab={vi.fn()}
      cartCount={0}
      cartTotal={0}
    />
  );
}

describe('AppHeader', () => {
  /*
    The header used to carry the wordmark. It does not any more, and this pins why: the
    cart tab is called Carrito, so a brand saying Carrito beside it put the same word
    twice in the first 60 pixels of a phone. The landing page carries the mark, and so
    does the installed icon.
  */
  it('leaves the wordmark out, and still takes no page heading', () => {
    stubViewport('phone');
    renderHeader();
    expect(document.querySelector('.app-header__brand')).toBeNull();
    expect(screen.queryByRole('heading')).toBeNull();
  });

  it('offers the search field on a phone', () => {
    stubViewport('phone');
    renderHeader();
    expect(screen.getByRole('searchbox', { name: 'Buscar producto' })).toBeInTheDocument();
  });

  it('offers the same search field on desktop', () => {
    stubViewport('desktop');
    renderHeader();
    expect(screen.getByRole('searchbox', { name: 'Buscar producto' })).toBeInTheDocument();
  });

  it('reports every keystroke to the app', async () => {
    stubViewport('phone');
    const user = userEvent.setup();
    render(<ControlledHeader />);
    const field = screen.getByRole('searchbox', { name: 'Buscar producto' });
    await user.type(field, 'leche');
    expect(field).toHaveValue('leche');
  });

  it('leaves the tabs to the bottom navigation on a phone', () => {
    stubViewport('phone');
    renderHeader();
    expect(screen.queryByRole('navigation', { name: 'Secciones' })).toBeNull();
  });

  it('puts the sections in the bar on desktop, where there is no bottom navigation', async () => {
    stubViewport('desktop');
    const user = userEvent.setup();
    const { onSelectTab } = renderHeader();
    const nav = screen.getByRole('navigation', { name: 'Secciones' });
    expect(nav).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Categorías' }));
    expect(onSelectTab).toHaveBeenCalledWith('browse');
  });

  it('marks the section you are on', () => {
    stubViewport('desktop');
    renderHeader({ activeTab: 'cart' });
    expect(screen.getByRole('button', { name: /Carrito/ })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Categorías' })).not.toHaveAttribute('aria-current');
  });

  it('says what the list costs, so the total is not only inside the list screen', () => {
    stubViewport('desktop');
    renderHeader({ cartCount: 3, cartTotal: 12.4 });
    expect(screen.getByRole('button', { name: /Carrito/ }).getAttribute('aria-label')).toContain(
      '12,40',
    );
  });

  it('says nothing about a total when the list is empty', () => {
    stubViewport('desktop');
    renderHeader({ cartCount: 0, cartTotal: 0 });
    expect(screen.getByRole('button', { name: 'Carrito' })).toBeInTheDocument();
  });
});

describe('AppHeader — reaching the list', () => {
  it('carries the list when the tabs are not there to do it', async () => {
    stubViewport('phone');
    const user = userEvent.setup();
    const { onSelectTab } = renderHeader({ listButton: true, cartCount: 2, cartTotal: 4.3 });

    const button = screen.getByRole('button', { name: /Carrito/ });
    expect(button.getAttribute('aria-label')).toContain('2 productos');
    expect(button.getAttribute('aria-label')).toContain('4,30');

    await user.click(button);
    expect(onSelectTab).toHaveBeenCalledWith('cart');
  });

  it('offers the list even when it is empty, so it is not a control that comes and goes', () => {
    stubViewport('phone');
    renderHeader({ listButton: true, cartCount: 0, cartTotal: 0 });
    expect(screen.getByRole('button', { name: 'Carrito' })).toBeInTheDocument();
  });

  it('does not offer a second way to the list where the tabs already are', () => {
    stubViewport('phone');
    renderHeader({ listButton: false, cartCount: 2, cartTotal: 4.3 });
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });
});
