import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { JointSessionBar } from './JointSessionBar.tsx';

const sid = 'A7fK2qAAAAAAAAAAAAAAAA';

function renderBar(overrides: Partial<Parameters<typeof JointSessionBar>[0]> = {}) {
  const onShare = vi.fn();
  const onUnbind = vi.fn();
  render(
    <JointSessionBar sessionId={sid} onShare={onShare} onUnbind={onUnbind} {...overrides} />,
  );
  return { onShare, onUnbind };
}

describe('JointSessionBar', () => {
  it('says the list is shared, and never claims it is synchronised', () => {
    renderBar();

    const bar = screen.getByRole('region', { name: 'Lista compartida' });
    expect(bar.textContent).toMatch(/compartida/i);
    // The one thing the bar must not do: imply that two phones are in step.
    expect(bar.textContent).not.toMatch(/sincroniz/i);
  });

  it('never reports how many people are in the list, because it cannot know', () => {
    renderBar();

    const bar = screen.getByRole('region', { name: 'Lista compartida' });
    expect(bar.textContent).not.toMatch(/\d+\s*(miembros|personas)/i);
  });

  it('explains that a change only reaches the others when the link is sent again', () => {
    renderBar();

    expect(screen.getByText(/solo llega a los demás cuando vuelvas a enviar el enlace/i)).toBeInTheDocument();
  });

  it('shows the session in short form, so two people can confirm they are on one list', () => {
    renderBar();

    expect(screen.getByText('A7fK2q')).toBeInTheDocument();
  });

  it('offers sharing, and reports it', async () => {
    const user = userEvent.setup();
    const { onShare, onUnbind } = renderBar();

    await user.click(screen.getByRole('button', { name: 'Compartir' }));

    expect(onShare).toHaveBeenCalledTimes(1);
    expect(onUnbind).not.toHaveBeenCalled();
  });

  it('offers leaving, and reports it', async () => {
    const user = userEvent.setup();
    const { onShare, onUnbind } = renderBar();

    await user.click(screen.getByRole('button', { name: 'Desvincularme' }));

    expect(onUnbind).toHaveBeenCalledTimes(1);
    expect(onShare).not.toHaveBeenCalled();
  });

  it('shows the link in a selectable field when it had to be shown rather than sent', () => {
    renderBar({ manualLink: 'https://carrito.dev/app/#j=1.abc.42' });

    const field = screen.getByRole('textbox', { name: 'Enlace para compartir' });
    expect(field).toHaveValue('https://carrito.dev/app/#j=1.abc.42');
    expect(field).toHaveAttribute('readonly');
  });

  it('announces what happened, as visible text rather than a tooltip', () => {
    renderBar({ notice: 'Enlace copiado' });

    expect(screen.getByRole('status')).toHaveTextContent('Enlace copiado');
  });

  it('shows no field and no notice when there is nothing to report', () => {
    renderBar();

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
