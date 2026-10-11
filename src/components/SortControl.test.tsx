import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SortControl } from './SortControl.tsx';

const control = () => screen.getByRole('group', { name: 'Ordenar productos' });

describe('SortControl', () => {
  it('offers the three ways to look at one shelf', () => {
    render(<SortControl sort="shop" onChange={vi.fn()} />);

    expect(screen.getAllByRole('button', { name: /Como en la tienda|A–Z|Precio/ })).toHaveLength(3);
  });

  it('says which one is in effect, not only by colour', () => {
    render(<SortControl sort="price" onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Precio' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'A–Z' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('reports the choice rather than keeping it', () => {
    const onChange = vi.fn();
    render(<SortControl sort="shop" onChange={onChange} />);
    expect(control()).toBeInTheDocument();

    return userEvent.setup().click(screen.getByRole('button', { name: 'A–Z' })).then(() => {
      expect(onChange).toHaveBeenCalledWith('az');
    });
  });
});
