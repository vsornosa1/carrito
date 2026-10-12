import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';

import type { Cart } from '../types/cart.ts';
import { addItem, createCart } from '../lib/cart.ts';
import { JOINT_STORAGE_KEY, readBinding, readRememberedChoice } from '../lib/joint-session.ts';
import { useJointSession } from './useJointSession.ts';

const t0 = new Date('2026-10-12T12:00:00Z');
const sid = 'AAAAAAAAAAAAAAAAAAAAAA';

/** A cart as a string, so a test can assert the whole list in one line. */
function itemsOf(cart: Cart) {
  return cart.items
    .map((item) => `${item.productId}x${item.quantity}${item.checked ? '*' : ''}`)
    .join(',');
}

/**
 * The hook drives the cart, so the harness owns the cart the way `App` does — one
 * owner, and the hook asks for a replacement rather than keeping a second copy.
 */
function Harness({ initialCart }: { initialCart: Cart }) {
  const [cart, setCart] = useState(initialCart);
  const [created, setCreated] = useState('');

  const joint = useJointSession({ cart, onCartReplaced: setCart });

  return (
    <>
      <output data-testid="binding">{joint.binding?.sessionId ?? 'solo'}</output>
      <output data-testid="origin">{joint.binding?.origin ?? '-'}</output>
      <output data-testid="pending">{joint.pending?.sessionId ?? 'none'}</output>
      <output data-testid="items">{itemsOf(cart)}</output>
      <output data-testid="created">{created}</output>
      <button type="button" onClick={() => joint.resolve('merge')}>
        fusionar
      </button>
      <button type="button" onClick={() => joint.resolve('replace')}>
        reemplazar
      </button>
      <button type="button" onClick={() => joint.dismiss()}>
        cancelar
      </button>
      <button type="button" onClick={() => joint.unbind('keep')}>
        quedarme
      </button>
      <button type="button" onClick={() => joint.unbind('clear')}>
        empezar de cero
      </button>
      <button type="button" onClick={() => setCreated(joint.ensureSession())}>
        compartir
      </button>
    </>
  );
}

function renderHarness(initialCart: Cart = createCart(t0)) {
  render(<Harness initialCart={initialCart} />);
}

beforeEach(() => {
  window.localStorage.clear();
  window.history.replaceState(null, '', '/');
});

describe('useJointSession — a device that has never joined anything', () => {
  it('is solo, and leaves the cart exactly as it was', () => {
    renderHarness(addItem(createCart(t0), 9, t0));

    expect(screen.getByTestId('binding')).toHaveTextContent('solo');
    expect(screen.getByTestId('pending')).toHaveTextContent('none');
    expect(screen.getByTestId('items')).toHaveTextContent('9x1');
  });

  it('is solo, without crashing, when the stored binding is corrupt', () => {
    window.localStorage.setItem(JOINT_STORAGE_KEY, 'not json');

    renderHarness();

    expect(screen.getByTestId('binding')).toHaveTextContent('solo');
  });

  it('is solo when the fragment is not a shared list', () => {
    window.history.replaceState(null, '', '/app/#como-funciona');

    renderHarness();

    expect(screen.getByTestId('pending')).toHaveTextContent('none');
  });
});

describe('useJointSession — a link arrives', () => {
  it('offers the link instead of applying it, so nothing changes unasked', () => {
    window.history.replaceState(null, '', `/app/#j=1.${sid}.7x2*,3`);
    const mine = addItem(createCart(t0), 9, t0);

    renderHarness(mine);

    expect(screen.getByTestId('pending')).toHaveTextContent(sid);
    expect(screen.getByTestId('binding')).toHaveTextContent('solo');
    expect(screen.getByTestId('items')).toHaveTextContent('9x1');
  });

  it('removes the fragment as soon as it is read, so a reload never re-asks', () => {
    window.history.replaceState(null, '', `/app/#j=1.${sid}.7x2*,3`);

    renderHarness();

    expect(window.location.hash).toBe('');
  });

  it('merges into the cart when that is the answer', async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, '', `/app/#j=1.${sid}.7x2*,3`);
    renderHarness(addItem(createCart(t0), 9, t0));

    await user.click(screen.getByRole('button', { name: 'fusionar' }));

    expect(screen.getByTestId('items')).toHaveTextContent('9x1,7x2*,3x1');
    expect(screen.getByTestId('binding')).toHaveTextContent(sid);
    expect(screen.getByTestId('origin')).toHaveTextContent('joined');
    expect(screen.getByTestId('pending')).toHaveTextContent('none');
  });

  it("replaces the cart when that is the answer, dropping what was there", async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, '', `/app/#j=1.${sid}.7x2*,3`);
    renderHarness(addItem(createCart(t0), 9, t0));

    await user.click(screen.getByRole('button', { name: 'reemplazar' }));

    expect(screen.getByTestId('items')).toHaveTextContent('7x2*,3x1');
    expect(screen.getByTestId('binding')).toHaveTextContent(sid);
  });

  it('remembers the answer, so the next handshake can be pre-answered', async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, '', `/app/#j=1.${sid}.7x2*,3`);
    renderHarness();

    await user.click(screen.getByRole('button', { name: 'reemplazar' }));

    expect(readRememberedChoice(window.localStorage)).toBe('replace');
  });

  it('changes nothing at all when the offer is cancelled', async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, '', `/app/#j=1.${sid}.7x2*,3`);
    renderHarness(addItem(createCart(t0), 9, t0));

    await user.click(screen.getByRole('button', { name: 'cancelar' }));

    expect(screen.getByTestId('items')).toHaveTextContent('9x1');
    expect(screen.getByTestId('binding')).toHaveTextContent('solo');
    expect(screen.getByTestId('pending')).toHaveTextContent('none');
  });

  it('cancels without remembering anything, because nothing was answered', async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, '', `/app/#j=1.${sid}.7x2*,3`);
    renderHarness();

    await user.click(screen.getByRole('button', { name: 'cancelar' }));

    expect(readRememberedChoice(window.localStorage)).toBeNull();
  });
});

describe('useJointSession — leaving', () => {
  function seedBinding() {
    window.localStorage.setItem(
      JOINT_STORAGE_KEY,
      JSON.stringify({ sessionId: sid, joinedAt: t0.toISOString(), origin: 'joined' }),
    );
  }

  it('shows a stored binding as bound', () => {
    seedBinding();

    renderHarness();

    expect(screen.getByTestId('binding')).toHaveTextContent(sid);
  });

  it('keeps the list and drops the binding when that is the choice', async () => {
    const user = userEvent.setup();
    seedBinding();
    renderHarness(addItem(createCart(t0), 9, t0));

    await user.click(screen.getByRole('button', { name: 'quedarme' }));

    expect(screen.getByTestId('items')).toHaveTextContent('9x1');
    expect(screen.getByTestId('binding')).toHaveTextContent('solo');
    expect(readBinding(window.localStorage)).toBeNull();
  });

  it('empties the list and drops the binding when that is the choice', async () => {
    const user = userEvent.setup();
    seedBinding();
    renderHarness(addItem(createCart(t0), 9, t0));

    await user.click(screen.getByRole('button', { name: 'empezar de cero' }));

    expect(screen.getByTestId('items')).toHaveTextContent('');
    expect(screen.getByTestId('binding')).toHaveTextContent('solo');
    expect(readBinding(window.localStorage)).toBeNull();
  });
});

describe('useJointSession — opening a session to share', () => {
  it('creates one while solo, and records it as this device having made it', async () => {
    const user = userEvent.setup();
    renderHarness();

    await user.click(screen.getByRole('button', { name: 'compartir' }));

    const created = screen.getByTestId('created').textContent ?? '';
    expect(created).toMatch(/^[A-Za-z0-9_-]{22}$/);
    expect(screen.getByTestId('binding')).toHaveTextContent(created);
    expect(screen.getByTestId('origin')).toHaveTextContent('created');
  });

  it('reuses the session when already bound, rather than starting a second one', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(
      JOINT_STORAGE_KEY,
      JSON.stringify({ sessionId: sid, joinedAt: t0.toISOString(), origin: 'joined' }),
    );
    renderHarness();

    await user.click(screen.getByRole('button', { name: 'compartir' }));

    expect(screen.getByTestId('created')).toHaveTextContent(sid);
    expect(screen.getByTestId('binding')).toHaveTextContent(sid);
  });
});
