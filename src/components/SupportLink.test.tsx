import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SupportLink } from './SupportLink.tsx';

describe('SupportLink', () => {
  it('points at the Ko-fi page and opens it in a new tab', () => {
    render(<SupportLink />);

    const link = screen.getByRole('link', { name: /invítame a un café/i });
    expect(link).toHaveAttribute('href', 'https://ko-fi.com/sornosa');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('keeps the name readable by someone who cannot see it opens a tab', () => {
    render(<SupportLink />);

    const link = screen.getByRole('link', { name: /invítame a un café/i });
    expect(link).toHaveAccessibleName(/pestaña nueva/i);
  });

  // The load-bearing test. The app's whole privacy claim is that opening it
  // contacts nobody, and the CSP enforces it; Ko-fi's own widget needs a
  // third-party script and would end both. So this asserts absence, not intent.
  it('loads nothing from Ko-fi — no script, no image, no iframe', () => {
    const { container } = render(<SupportLink />);

    expect(container.querySelectorAll('script, iframe, img')).toHaveLength(0);
  });

  it('says what the app is before asking for anything', () => {
    const { container } = render(<SupportLink />);

    expect(container.textContent).toMatch(/gratis/i);
  });
});
