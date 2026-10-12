import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { ConfirmDialog } from './ConfirmDialog.tsx';

function renderDialog(overrides: Partial<Parameters<typeof ConfirmDialog>[0]> = {}) {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  render(
    <ConfirmDialog
      open
      title="¿Vaciar el carrito?"
      message="Se quitarán 7 productos."
      confirmLabel="Vaciar"
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...overrides}
    />,
  );
  return { onConfirm, onCancel };
}

describe('ConfirmDialog', () => {
  it('is a modal dialog that names itself, not an alert box', () => {
    renderDialog();
    const dialog = screen.getByRole('dialog', { name: '¿Vaciar el carrito?' });
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('open');
  });

  it('describes the consequence, so the choice is not made blind', () => {
    renderDialog();
    expect(screen.getByText('Se quitarán 7 productos.')).toBeInTheDocument();
  });

  it('starts on the safe choice, so a stray Enter does not destroy anything', () => {
    renderDialog();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveFocus();
  });

  it('reports the confirmation', async () => {
    const user = userEvent.setup();
    const { onConfirm, onCancel } = renderDialog();

    await user.click(screen.getByRole('button', { name: 'Vaciar' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('reports the cancellation, and does nothing else', async () => {
    const user = userEvent.setup();
    const { onConfirm, onCancel } = renderDialog();

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('stays shut when it is not open, rather than lurking in the page', () => {
    renderDialog({ open: false });
    const dialog = screen.getByRole('dialog', { hidden: true });
    expect(dialog).not.toHaveAttribute('open');
  });

  it('names itself uniquely when two of them are mounted at once', () => {
    // The cart has two destructive actions, so both dialogs exist together. Duplicate
    // ids would make a screen reader announce the wrong title.
    render(
      <>
        <ConfirmDialog
          open
          title="¿Vaciar el carrito?"
          message="A"
          confirmLabel="Vaciar"
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
        <ConfirmDialog
          open={false}
          title="¿Restablecer el orden?"
          message="B"
          confirmLabel="Restablecer"
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      </>,
    );

    const ids = [...document.querySelectorAll('dialog h2')].map((h) => h.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(screen.getByRole('dialog', { name: '¿Vaciar el carrito?' })).toBeInTheDocument();
  });
});

describe('ConfirmDialog — a question with two real answers', () => {
  function renderThreeWay() {
    const onConfirm = vi.fn();
    const onAlternate = vi.fn();
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        open
        title="¿Unir esta lista con la tuya?"
        message="Fusionar no puede destachar: lo que ya esté tachado seguirá tachado."
        confirmLabel="Fusionar"
        alternateLabel="Reemplazar"
        onConfirm={onConfirm}
        onAlternate={onAlternate}
        onCancel={onCancel}
      />,
    );
    return { onConfirm, onAlternate, onCancel };
  }

  it('offers both answers, in the order safe, alternate, primary', () => {
    renderThreeWay();

    expect(screen.getAllByRole('button').map((button) => button.textContent)).toEqual([
      'Cancelar',
      'Reemplazar',
      'Fusionar',
    ]);
  });

  it('still starts on the safe choice, so a stray Enter destroys nothing', () => {
    renderThreeWay();

    expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveFocus();
  });

  it('reports the alternate answer, and nothing else', async () => {
    const user = userEvent.setup();
    const { onConfirm, onAlternate, onCancel } = renderThreeWay();

    await user.click(screen.getByRole('button', { name: 'Reemplazar' }));

    expect(onAlternate).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('reports the primary answer, and nothing else', async () => {
    const user = userEvent.setup();
    const { onConfirm, onAlternate, onCancel } = renderThreeWay();

    await user.click(screen.getByRole('button', { name: 'Fusionar' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onAlternate).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('cancels when the dialog reports a cancel request, which is how Esc arrives', () => {
    const { onConfirm, onAlternate, onCancel } = renderThreeWay();

    // jsdom does not turn Escape into a `cancel` event, which is why the existing suite
    // has no Esc test. Dispatching the request directly tests *this* component's handler
    // — the browser's key handling is the native `<dialog>`'s job, and is the reason the
    // element is used at all.
    fireEvent(
      screen.getByRole('dialog', { name: '¿Unir esta lista con la tuya?' }),
      new Event('cancel', { cancelable: true }),
    );

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onAlternate).not.toHaveBeenCalled();
  });

  it('renders only two actions when there is no alternate, so existing call sites are untouched', () => {
    renderDialog();

    expect(screen.getAllByRole('button').map((button) => button.textContent)).toEqual([
      'Cancelar',
      'Vaciar',
    ]);
  });
});

describe('ConfirmDialog — opening and closing as the app drives it', () => {
  function Harness() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <button type="button" onClick={() => setOpen(true)}>
          Vaciar carrito
        </button>
        <ConfirmDialog
          open={open}
          title="¿Vaciar el carrito?"
          message="Se quitarán 7 productos."
          confirmLabel="Vaciar"
          onConfirm={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      </>
    );
  }

  it('opens on demand and closes when answered', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    expect(screen.getByRole('dialog', { hidden: true })).not.toHaveAttribute('open');

    await user.click(screen.getByRole('button', { name: 'Vaciar carrito' }));
    expect(screen.getByRole('dialog', { name: '¿Vaciar el carrito?' })).toHaveAttribute('open');

    await user.click(screen.getByRole('button', { name: 'Vaciar' }));
    expect(screen.getByRole('dialog', { hidden: true })).not.toHaveAttribute('open');
  });
});
