import { describe, expect, it } from 'vitest';

import type { Cart } from '../types/cart.ts';
import { addItem, createCart } from './cart.ts';
import {
  clearBinding,
  createSessionId,
  decodeSharePayload,
  encodeSharePayload,
  JOINT_REMEMBER_KEY,
  JOINT_STORAGE_KEY,
  MAX_SHARE_URL_LENGTH,
  mergeCarts,
  readBinding,
  readRememberedChoice,
  readSharePayload,
  shareUrl,
  writeBinding,
  writeRememberedChoice,
  type JointStorage,
} from './joint-session.ts';

const t0 = new Date('2026-10-12T12:00:00Z');

/** A `JointStorage` backed by a Map, so a test never needs a real `localStorage`. */
function memoryStorage(seed: Record<string, string> = {}) {
  const map = new Map(Object.entries(seed));
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, value),
    removeItem: (key: string) => void map.delete(key),
    has: (key: string) => map.has(key),
  };
}

const bound = '{"sessionId":"AbC-123","joinedAt":"2026-10-12T10:00:00.000Z","origin":"created"}';

describe('the binding store', () => {
  it('reads back a binding that was written', () => {
    const storage = memoryStorage();

    writeBinding(storage, {
      sessionId: 'AbC-123',
      joinedAt: t0.toISOString(),
      origin: 'joined',
    });

    expect(readBinding(storage, t0)).toEqual({
      sessionId: 'AbC-123',
      joinedAt: t0.toISOString(),
      origin: 'joined',
    });
  });

  it('writes the binding under its own key, leaving the cart key alone', () => {
    const storage = memoryStorage();

    writeBinding(storage, { sessionId: 'AbC-123', joinedAt: t0.toISOString(), origin: 'created' });

    expect(storage.has(JOINT_STORAGE_KEY)).toBe(true);
    expect(storage.has('carrito.cart.v1')).toBe(false);
  });

  it('reports solo when nothing has ever been stored', () => {
    expect(readBinding(memoryStorage(), t0)).toBeNull();
  });

  it('reports solo, without throwing, when the stored value is not JSON', () => {
    const storage = memoryStorage({ [JOINT_STORAGE_KEY]: 'not json at all' });

    expect(readBinding(storage, t0)).toBeNull();
  });

  it('reports solo when the stored value carries no session id', () => {
    const storage = memoryStorage({ [JOINT_STORAGE_KEY]: '{"joinedAt":"2026-10-12T10:00:00.000Z"}' });

    expect(readBinding(storage, t0)).toBeNull();
  });

  it('reports solo when the session id is empty', () => {
    const storage = memoryStorage({
      [JOINT_STORAGE_KEY]: '{"sessionId":"","joinedAt":"2026-10-12T10:00:00.000Z"}',
    });

    expect(readBinding(storage, t0)).toBeNull();
  });

  it('reports solo, without throwing, when storage itself throws on read', () => {
    const hostile: JointStorage = {
      getItem: () => {
        throw new Error('cookies are disabled');
      },
      setItem: () => undefined,
      removeItem: () => undefined,
    };

    expect(readBinding(hostile, t0)).toBeNull();
  });

  it('repairs an unparseable joinedAt rather than discarding the binding', () => {
    const storage = memoryStorage({
      [JOINT_STORAGE_KEY]: '{"sessionId":"AbC-123","joinedAt":"whenever","origin":"joined"}',
    });

    expect(readBinding(storage, t0)).toEqual({
      sessionId: 'AbC-123',
      joinedAt: t0.toISOString(),
      origin: 'joined',
    });
  });

  it('repairs an unknown origin to joined rather than claiming the user created it', () => {
    const storage = memoryStorage({
      [JOINT_STORAGE_KEY]: '{"sessionId":"AbC-123","joinedAt":"2026-10-12T10:00:00.000Z","origin":"cloned"}',
    });

    expect(readBinding(storage, t0)).toEqual({
      sessionId: 'AbC-123',
      joinedAt: '2026-10-12T10:00:00.000Z',
      origin: 'joined',
    });
  });

  it('clearing removes the binding', () => {
    const storage = memoryStorage({ [JOINT_STORAGE_KEY]: bound });

    clearBinding(storage);

    expect(readBinding(storage, t0)).toBeNull();
    expect(storage.has(JOINT_STORAGE_KEY)).toBe(false);
  });
});

describe('the remembered choice', () => {
  it('is not remembered before any handshake has happened', () => {
    expect(readRememberedChoice(memoryStorage())).toBeNull();
  });

  it('reads back the choice that was written', () => {
    const storage = memoryStorage();

    writeRememberedChoice(storage, 'replace');

    expect(readRememberedChoice(storage)).toBe('replace');
  });

  it('survives the binding being cleared, which is the whole reason it is a separate key', () => {
    const storage = memoryStorage({ [JOINT_STORAGE_KEY]: bound });
    writeRememberedChoice(storage, 'replace');

    clearBinding(storage);

    expect(readBinding(storage, t0)).toBeNull();
    expect(readRememberedChoice(storage)).toBe('replace');
  });

  it('is not remembered when the stored value is neither merge nor replace', () => {
    const storage = memoryStorage({ [JOINT_REMEMBER_KEY]: 'maybe' });

    expect(readRememberedChoice(storage)).toBeNull();
  });
});

describe('createSessionId', () => {
  it('is 22 base64url characters', () => {
    const id = createSessionId(new Uint8Array(16));

    expect(id).toHaveLength(22);
    expect(id).toMatch(/^[A-Za-z0-9_-]{22}$/);
  });

  it('uses the bytes it is given, so the shape can be pinned exactly', () => {
    expect(createSessionId(new Uint8Array(16))).toBe('AAAAAAAAAAAAAAAAAAAAAA');
  });

  it('encodes url-unsafely, so a fragment never needs escaping', () => {
    const id = createSessionId(
      Uint8Array.from([0xfb, 0xff, 0xff, 0xfb, 0xff, 0xff, 0xfb, 0xff, 0xff, 0xfb, 0xff, 0xff, 0xfb, 0xff, 0xff, 0xfb]),
    );

    expect(id).not.toContain('+');
    expect(id).not.toContain('/');
    expect(id).toMatch(/^[A-Za-z0-9_-]{22}$/);
  });

  it('gives different ids for different bytes', () => {
    const zeros = createSessionId(new Uint8Array(16));
    const ones = createSessionId(new Uint8Array(16).fill(1));

    expect(zeros).not.toBe(ones);
  });

  // The two tests above all inject bytes. These exercise the default path — the one
  // production takes — which the coverage report named as unexercised (lines 135-137).
  // Characterisation tests, not red-first: the behaviour already existed, and what
  // failed was the report.
  it('makes a real id when it is not handed bytes, which is the path production takes', () => {
    expect(createSessionId()).toMatch(/^[A-Za-z0-9_-]{22}$/);
  });

  it('makes a different id every time, so a constant could never be shipped by mistake', () => {
    expect(createSessionId()).not.toBe(createSessionId());
  });
});

const sid = 'AAAAAAAAAAAAAAAAAAAAAA';

/** A cart built directly, so a size test does not pay for a thousand mutations. */
function cartOf(
  items: { id: number; quantity?: number; checked?: boolean; addedAt?: string }[],
): Cart {
  return {
    items: items.map(({ id, quantity = 1, checked = false, addedAt = '2026-10-12T10:00:00.000Z' }) => ({
      productId: id,
      addedAt,
      checked,
      quantity,
    })),
    updatedAt: '2026-10-12T10:00:00.000Z',
  };
}

describe('encoding a list into a payload', () => {
  it('round-trips: re-encoding what was decoded gives the same bytes back', () => {
    const cart = addItem(addItem(createCart(t0), 7, t0), 1120, t0);
    const payload = encodeSharePayload(sid, cart);

    expect(payload).not.toBeNull();
    const decoded = decodeSharePayload(payload as string, t0);

    expect(decoded?.sessionId).toBe(sid);
    expect(encodeSharePayload(sid, decoded!.cart)).toBe(payload);
  });

  it('is canonical: sorted by product id, one omitted, checked as an asterisk', () => {
    const cart = cartOf([
      { id: 1120 },
      { id: 7, quantity: 2, checked: true },
      { id: 304, checked: true },
    ]);

    expect(encodeSharePayload(sid, cart)).toBe(`1.${sid}.7x2*,304*,1120`);
  });

  it('writes a quantity only when there is more than one', () => {
    expect(encodeSharePayload(sid, cartOf([{ id: 42, quantity: 1 }]))).toBe(`1.${sid}.42`);
    expect(encodeSharePayload(sid, cartOf([{ id: 42, quantity: 3 }]))).toBe(`1.${sid}.42x3`);
  });

  it('is stable: the same list encodes to the same string every time', () => {
    const cart = cartOf([
      { id: 5, quantity: 2 },
      { id: 9, checked: true },
    ]);

    expect(encodeSharePayload(sid, cart)).toBe(encodeSharePayload(sid, cart));
  });

  it('encodes an empty list, so an empty joint list is still a session', () => {
    expect(encodeSharePayload(sid, cartOf([]))).toBe(`1.${sid}.`);
  });

  it('refuses a session id it could not read back, rather than emitting a dead link', () => {
    expect(encodeSharePayload('', cartOf([{ id: 42 }]))).toBeNull();
    expect(encodeSharePayload('too-short', cartOf([{ id: 42 }]))).toBeNull();
  });

  it('fits a hundred-line list far inside the cap', () => {
    const cart = cartOf(Array.from({ length: 100 }, (_, index) => ({ id: 100000 + index })));
    const payload = encodeSharePayload(sid, cart) as string;

    expect(payload.length).toBeLessThan(MAX_SHARE_URL_LENGTH);
    // Pinned so a format change that doubles the size cannot pass unnoticed.
    expect(payload.length).toBeLessThan(2500);
  });

  it('returns null when the list is too long to share at all', () => {
    const cart = cartOf(
      Array.from({ length: 900 }, (_, index) => ({ id: 1000000 + index, quantity: 99 })),
    );

    expect(encodeSharePayload(sid, cart)).toBeNull();
  });
});

describe('decoding a payload', () => {
  it('reads a plain list', () => {
    const decoded = decodeSharePayload(`1.${sid}.7x2*,304*,1120`, t0);

    expect(decoded?.cart.items).toEqual([
      { productId: 7, addedAt: t0.toISOString(), checked: true, quantity: 2 },
      { productId: 304, addedAt: t0.toISOString(), checked: true, quantity: 1 },
      { productId: 1120, addedAt: t0.toISOString(), checked: false, quantity: 1 },
    ]);
  });

  it('stamps addedAt at decode time, because the link carries no clock', () => {
    const later = new Date('2026-10-13T09:30:00Z');

    expect(decodeSharePayload(`1.${sid}.42`, later)?.cart.items[0]?.addedAt).toBe(
      later.toISOString(),
    );
  });

  it('accepts items in any order, since the encoder sorts and a reader need not', () => {
    const decoded = decodeSharePayload(`1.${sid}.1120,7`, t0);

    expect(decoded?.cart.items.map((item) => item.productId)).toEqual([1120, 7]);
  });

  it('reads an explicit quantity of one as one, rather than refusing what it understands', () => {
    expect(decodeSharePayload(`1.${sid}.42x1`, t0)?.cart.items[0]?.quantity).toBe(1);
  });

  it.each([
    ['an unknown version', `2.${sid}.42`],
    ['no version at all', `${sid}.42`],
    ['too few parts', `1.${sid}`],
    ['too many parts', `1.${sid}.42.7`],
    ['a session id that is too short', '1.AAAA.42'],
    ['a session id with a url-unsafe character', `1.${'A'.repeat(21)}+.42`],
    ['a non-numeric product id', `1.${sid}.abc`],
    ['a zero product id', `1.${sid}.0`],
    ['a negative product id', `1.${sid}.-7`],
    ['a quantity of zero', `1.${sid}.7x0`],
    ['a negative quantity', `1.${sid}.7x-1`],
    ['a fractional quantity', `1.${sid}.7x1.5`],
    ['a bare x', `1.${sid}.7x`],
    ['an empty entry between commas', `1.${sid}.7,,9`],
    ['a trailing comma', `1.${sid}.7,`],
    ['a product named twice', `1.${sid}.7,7`],
    ['a duplicated product with different counts', `1.${sid}.7x2,7x3`],
    ['stray text', `1.${sid}.7 and more`],
    ['nothing at all', ''],
    ['only a dot', '.'],
  ])('returns null for %s, and never throws', (_name, payload) => {
    expect(decodeSharePayload(payload, t0)).toBeNull();
  });

  it('returns null for a payload over the cap, rather than reading a truncated list', () => {
    const huge = `1.${sid}.${Array.from({ length: 1100 }, (_, i) => 1000000 + i).join(',')}`;

    expect(huge.length).toBeGreaterThan(MAX_SHARE_URL_LENGTH);
    expect(decodeSharePayload(huge, t0)).toBeNull();
  });
});

describe('reading a payload out of a fragment', () => {
  it('reads the payload after #j=', () => {
    expect(readSharePayload(`#j=1.${sid}.42`)).toBe(`1.${sid}.42`);
  });

  it('tolerates a hash that arrives without its leading #', () => {
    expect(readSharePayload(`j=1.${sid}.42`)).toBe(`1.${sid}.42`);
  });

  it('ignores an unrelated anchor, which the landing page already uses', () => {
    expect(readSharePayload('#como-funciona')).toBeNull();
  });

  it('ignores a fragment that uses another key', () => {
    expect(readSharePayload(`#s=1.${sid}.42`)).toBeNull();
  });

  it('ignores an empty hash', () => {
    expect(readSharePayload('')).toBeNull();
    expect(readSharePayload('#')).toBeNull();
  });
});

describe('shareUrl', () => {
  it('puts the payload in the fragment, never the query or the path', () => {
    const url = shareUrl(`1.${sid}.42`, 'https://carrito.dev');

    expect(url).toBe(`https://carrito.dev/app/#j=1.${sid}.42`);
    expect(url).not.toContain('?');
  });
});

/** What a merge is judged on: the lines, not the order they are drawn in. */
function contents(cart: Cart) {
  return [...cart.items]
    .sort((a, b) => a.productId - b.productId)
    .map(({ productId, quantity, checked }) => ({ productId, quantity, checked }));
}

describe('merging two lists', () => {
  it('keeps every line from both sides', () => {
    const mine = cartOf([{ id: 9 }, { id: 5 }]);
    const theirs = cartOf([{ id: 3 }]);

    expect(contents(mergeCarts(mine, theirs, t0))).toEqual([
      { productId: 3, quantity: 1, checked: false },
      { productId: 5, quantity: 1, checked: false },
      { productId: 9, quantity: 1, checked: false },
    ]);
  });

  it('takes the higher quantity rather than adding them', () => {
    const mine = cartOf([{ id: 7, quantity: 2 }]);
    const theirs = cartOf([{ id: 7, quantity: 5 }]);

    // Adding would say "seven of them" for two people who each want a few, which is a
    // number nobody asked for.
    expect(contents(mergeCarts(mine, theirs, t0))).toEqual([
      { productId: 7, quantity: 5, checked: false },
    ]);
    expect(contents(mergeCarts(theirs, mine, t0))).toEqual([
      { productId: 7, quantity: 5, checked: false },
    ]);
  });

  it('treats a line checked by either side as checked', () => {
    const mine = cartOf([{ id: 7, checked: false }]);
    const theirs = cartOf([{ id: 7, checked: true }]);

    expect(contents(mergeCarts(mine, theirs, t0))[0]?.checked).toBe(true);
    expect(contents(mergeCarts(theirs, mine, t0))[0]?.checked).toBe(true);
  });

  it('keeps the earlier addedAt, so a line is as old as its oldest mention', () => {
    const mine = cartOf([{ id: 7, addedAt: '2026-10-12T10:00:00.000Z' }]);
    const theirs = cartOf([{ id: 7, addedAt: '2026-10-12T09:00:00.000Z' }]);

    expect(mergeCarts(mine, theirs, t0).items[0]?.addedAt).toBe('2026-10-12T09:00:00.000Z');
  });

  it('keeps the usable addedAt when one side has an unusable one', () => {
    const mine = cartOf([{ id: 7, addedAt: 'not a date' }]);
    const theirs = cartOf([{ id: 7, addedAt: '2026-10-12T09:00:00.000Z' }]);

    expect(mergeCarts(mine, theirs, t0).items[0]?.addedAt).toBe('2026-10-12T09:00:00.000Z');
  });

  it('is commutative in contents, so neither side is privileged', () => {
    const mine = cartOf([
      { id: 9, quantity: 3, checked: false },
      { id: 5, quantity: 1, checked: true },
    ]);
    const theirs = cartOf([
      { id: 9, quantity: 2, checked: true },
      { id: 3, quantity: 4 },
    ]);

    expect(contents(mergeCarts(mine, theirs, t0))).toEqual(contents(mergeCarts(theirs, mine, t0)));
  });

  it('leaves a list unchanged when merged with an empty one', () => {
    const mine = cartOf([
      { id: 9, quantity: 3, checked: true },
      { id: 5 },
    ]);

    expect(contents(mergeCarts(mine, cartOf([]), t0))).toEqual(contents(mine));
    expect(contents(mergeCarts(cartOf([]), mine, t0))).toEqual(contents(mine));
  });

  it('re-checks a line the user had unchecked, when the other side has it checked', () => {
    // The documented consequence, pinned so it cannot change quietly: a merge cannot
    // uncheck, and the dialog says so before the tap. Replace is the escape.
    const mine = cartOf([{ id: 7, checked: false }]);
    const theirs = cartOf([{ id: 7, checked: true }]);

    expect(mergeCarts(mine, theirs, t0).items[0]?.checked).toBe(true);
  });

  it('keeps the receiving list in its own order and appends what it did not have', () => {
    const mine = cartOf([{ id: 9 }, { id: 5 }]);
    const theirs = cartOf([{ id: 5 }, { id: 3 }]);

    expect(mergeCarts(mine, theirs, t0).items.map((item) => item.productId)).toEqual([9, 5, 3]);
  });

  it('stamps updatedAt at the merge, from the clock it is given', () => {
    expect(mergeCarts(cartOf([{ id: 7 }]), cartOf([]), t0).updatedAt).toBe(t0.toISOString());
  });

  it('does not mutate either list', () => {
    const mine = cartOf([{ id: 9, quantity: 3, checked: true }]);
    const theirs = cartOf([{ id: 9, quantity: 2 }, { id: 3 }]);
    const beforeMine = JSON.stringify(mine);
    const beforeTheirs = JSON.stringify(theirs);

    mergeCarts(mine, theirs, t0);

    expect(JSON.stringify(mine)).toBe(beforeMine);
    expect(JSON.stringify(theirs)).toBe(beforeTheirs);
  });
});
