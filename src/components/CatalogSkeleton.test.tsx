import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CatalogSkeleton } from './CatalogSkeleton.tsx';

describe('the catalogue skeleton', () => {
  it('says it is loading, because a grey rectangle is not an announcement', () => {
    render(<CatalogSkeleton />);

    expect(screen.getByRole('status')).toHaveTextContent(/cargando el catálogo/i);
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
  });

  it('draws the rows it was asked for, shaped like the real ones', () => {
    const { container } = render(<CatalogSkeleton rows={4} />);

    const rows = container.querySelectorAll('.section-row--skeleton');
    expect(rows).toHaveLength(4);
    // Reusing the real row class is what keeps the two from drifting apart.
    for (const row of rows) {
      expect(row.classList.contains('section-row')).toBe(true);
      expect(row.querySelectorAll('.skeleton')).toHaveLength(3);
    }
  });

  it('hides the decoration from assistive tech', () => {
    const { container } = render(<CatalogSkeleton />);

    expect(container.querySelector('.section-list')).toHaveAttribute('aria-hidden', 'true');
  });
});
