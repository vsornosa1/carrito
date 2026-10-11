import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Landing } from './Landing.tsx';
import { HERO_ITEMS } from './hero-order.ts';

describe('the landing page', () => {
  /*
    Deliberately does not pin the sentence. The headline is the owner's copy and gets
    rewritten — a test that goes red on a copy edit teaches everyone to ignore red. It
    asserts the *structure* the page needs: one h1, and one that says something.
  */
  it('has exactly one h1, and it says something', () => {
    render(<Landing />);

    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
    expect((headings[0]!.textContent ?? '').trim().length).toBeGreaterThan(10);
  });

  it('offers the two exits, and the Ko-fi one leaves the tab', () => {
    render(<Landing />);

    expect(screen.getAllByRole('link', { name: 'Abrir la app' })[0]).toHaveAttribute(
      'href',
      '/app/',
    );

    const kofi = screen.getAllByRole('link', { name: /invítame a un café/i })[0]!;
    expect(kofi).toHaveAttribute('href', 'https://ko-fi.com/sornosa');
    expect(kofi).toHaveAttribute('target', '_blank');
    expect(kofi).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  /*
    Scoped to the hero on purpose. The first version of this test asked the whole page
    for a Ko-fi link and took the first match — which was the support section's, so the
    suite stayed green when the hero's own button went missing during a rewrite. A test
    that passes while a call to action disappears is worse than no test.
  */
  it('puts one exit in the hero, and keeps the ask to a single place on the page', () => {
    render(<Landing />);

    const actions = document.querySelector('.hero__actions');
    expect(actions, 'the hero must have an actions row').not.toBeNull();
    expect(within(actions as HTMLElement).getAllByRole('link')).toHaveLength(1);
    expect(within(actions as HTMLElement).getAllByRole('link')[0]).toHaveAttribute(
      'href',
      '/app/',
    );

    // Once. Asking for money twice on one page reads as a toll booth, and the person
    // reading the hero has not been given anything yet.
    expect(screen.getAllByRole('link', { name: /invítame a un café/i })).toHaveLength(1);
  });

  /*
    The demo is `aria-hidden`, so no role-based query can see it — and the thing that must
    not come back is exactly what it looked like: the same product named twice, once on a
    card and once in the list, with a badge that contradicted itself from beat to beat.
    Read on the DOM, once per product.
  */
  it('names each product in the demo exactly once', () => {
    render(<Landing />);

    const demo = document.querySelector('.hero__demo');
    expect(demo, 'the hero must have its demo panel').not.toBeNull();

    for (const item of HERO_ITEMS) {
      const mentions = (demo!.textContent ?? '').split(item.name).length - 1;
      expect(mentions, `${item.name} must be named once in the demo`).toBe(1);
    }
  });

  it('says which catalogue it actually has, since there is only one', () => {
    render(<Landing />);

    expect(screen.getByText(/el único catálogo disponible es el de Mercadona/i)).toBeInTheDocument();
  });

  /*
    Encodes a decision, not a style preference. The catalogue's chain of title is
    recorded as unresolved in docs/licensing/ENVELOPE.md, and the mirror's own api.md
    notes that robots.txt disallows /api — so a page asserting the data was obtained
    "legally" would be the confident-sounding claim this project's own documentation
    exists to prevent. Saying "not affiliated, sourced from public sources" is true and
    is worth saying; claiming a legal position we do not have is not.
  */
  it('disclaims affiliation without claiming a legal position we have not verified', () => {
    const { container } = render(<Landing />);

    expect(container.textContent).toMatch(/no está afiliado a Mercadona/i);
    expect(container.textContent).not.toMatch(/legalmente/i);
  });

  it('is reachable by keyboard and embeds nothing', () => {
    const { container } = render(<Landing />);

    expect(screen.getByRole('link', { name: /saltar al contenido/i })).toHaveAttribute(
      'href',
      '#contenido',
    );
    expect(container.querySelectorAll('iframe, img, script')).toHaveLength(0);
  });
});
