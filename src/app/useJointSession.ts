import { useCallback, useEffect, useState } from 'react';

import { clearCart } from '../lib/cart.ts';
import {
  clearBinding,
  createSessionId,
  decodeSharePayload,
  mergeCarts,
  readBinding,
  readRememberedChoice,
  readSharePayload,
  writeBinding,
  writeRememberedChoice,
  type DecodedShare,
  type JointStorage,
} from '../lib/joint-session.ts';
import type { Cart } from '../types/cart.ts';
import type { BindChoice, JointBinding, UnbindChoice } from '../types/joint-session.ts';

const storage: JointStorage = {
  getItem: (key) => window.localStorage.getItem(key),
  setItem: (key, value) => window.localStorage.setItem(key, value),
  removeItem: (key) => window.localStorage.removeItem(key),
};

/**
 * The offer sitting in the URL, read without touching it.
 *
 * Deliberately pure: React invokes a `useState` initializer twice under `StrictMode`,
 * so an initializer that also cleared the fragment would strip it on the first call and
 * find nothing on the second — the offer would vanish in development and nowhere else.
 */
function readArrivingOffer(): DecodedShare | null {
  const payload = readSharePayload(window.location.hash);
  return payload === null ? null : decodeSharePayload(payload);
}

/** Takes the fragment out of the URL, so a reload never re-asks. */
function consumeFragment(): void {
  if (readSharePayload(window.location.hash) === null) return;
  window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
}

interface UseJointSessionOptions {
  /** The current list. The hook never keeps a second copy of it. */
  cart: Cart;
  /** How the list is replaced — `useCart`'s `replace`, so there is one owner. */
  onCartReplaced: (cart: Cart) => void;
}

export interface JointSession {
  /** This device's membership, or `null` while it is solo. */
  binding: JointBinding | null;
  /** A link that arrived and is waiting for an answer. */
  pending: DecodedShare | null;
  /** The answer applied last time, so the next question can be pre-answered. */
  remembered: BindChoice | null;
  resolve: (choice: BindChoice) => void;
  dismiss: () => void;
  unbind: (choice: UnbindChoice) => void;
  ensureSession: () => string;
}

/**
 * The seam between the shared-list logic and React.
 *
 * Everything that decides anything lives in `src/lib/joint-session.ts`; this holds the
 * state, reads the URL once, and asks the cart's owner to replace the list. It never
 * applies an arriving link on its own — an offer is offered, and nothing about the cart
 * changes until the user answers.
 */
export function useJointSession({ cart, onCartReplaced }: UseJointSessionOptions): JointSession {
  const [binding, setBinding] = useState<JointBinding | null>(() => readBinding(storage));
  const [pending, setPending] = useState<DecodedShare | null>(readArrivingOffer);
  const [remembered, setRemembered] = useState<BindChoice | null>(() =>
    readRememberedChoice(storage),
  );

  useEffect(consumeFragment, []);

  const resolve = useCallback(
    (choice: BindChoice) => {
      if (pending === null) return;

      onCartReplaced(choice === 'merge' ? mergeCarts(cart, pending.cart) : pending.cart);

      const next: JointBinding = {
        sessionId: pending.sessionId,
        joinedAt: new Date().toISOString(),
        origin: 'joined',
      };
      writeBinding(storage, next);
      writeRememberedChoice(storage, choice);
      setBinding(next);
      setRemembered(choice);
      setPending(null);
    },
    [cart, onCartReplaced, pending],
  );

  const dismiss = useCallback(() => setPending(null), []);

  const unbind = useCallback(
    (choice: UnbindChoice) => {
      if (choice === 'clear') onCartReplaced(clearCart());
      clearBinding(storage);
      setBinding(null);
    },
    [onCartReplaced],
  );

  const ensureSession = useCallback(() => {
    if (binding !== null) return binding.sessionId;

    const next: JointBinding = {
      sessionId: createSessionId(),
      joinedAt: new Date().toISOString(),
      origin: 'created',
    };
    writeBinding(storage, next);
    setBinding(next);
    return next.sessionId;
  }, [binding]);

  return { binding, pending, remembered, resolve, dismiss, unbind, ensureSession };
}
