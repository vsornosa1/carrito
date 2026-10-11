import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Landing } from './Landing.tsx';

describe('the landing page', () => {
  it('has exactly one h1, and it makes the claim the page exists for', () => {
    render(<Landing />);

    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent(/qué hay dentro/i);
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
