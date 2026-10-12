import type { Cart, CartItem } from '../types/cart.ts';
import type { BindChoice, JointBinding } from '../types/joint-session.ts';
import type { StorageLike } from './cart.ts';

/**
 * Storage that can also forget a key.
 *
 * A binding is *cleared*, not overwritten with a sentinel: a leftover value would be
 * a second thing every reader has to know to special-case, and the point of reading a
 * binding is that absence is a normal answer.
 */
export interface JointStorage extends StorageLike {
  removeItem(key: string): void;
}

/** Where this device's membership in a shared list lives. */
export const JOINT_STORAGE_KEY = 'carrito.joint.v1';

/**
 * Where the last handshake's answer lives.
 *
 * Its own key, because it has to outlive the binding. The handshake it pre-answers
 * happens *after* this device has been unbound, so a field on the binding would be
 * gone exactly when it is needed. Keeping it in both places would be two sources of
 * truth for one fact, and the first disagreement between them would be silent.
 */
export const JOINT_REMEMBER_KEY = 'carrito.joint.remember.v1';

/** Reads a key, treating storage that throws as storage that is empty. */
function readRaw(storage: JointStorage, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

/** A `joinedAt` is usable only if it is a string that parses as a date. */
function readJoinedAt(value: unknown, now: Date): string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value))
    ? value
    : now.toISOString();
}

/**
 * Reads the binding, repairing what it can and giving up only on the identity.
 *
 * A missing or unusable `sessionId` means there is nothing to bind to, so the device
 * is solo — the same posture as `loadCart` degrading a corrupt cart to an empty one.
 * Everything else is repaired instead of discarded, because discarding it would
 * silently turn a shared list into a personal one: an unparseable `joinedAt` becomes
 * now, and an unknown `origin` becomes `'joined'` — the conservative reading, since if
 * the app cannot tell, it must not claim the user created the session.
 */
export function readBinding(storage: JointStorage, now: Date = new Date()): JointBinding | null {
  const raw = readRaw(storage, JOINT_STORAGE_KEY);
  if (raw === null) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<JointBinding> | null;
    if (typeof parsed?.sessionId !== 'string' || parsed.sessionId === '') return null;

    return {
      sessionId: parsed.sessionId,
      joinedAt: readJoinedAt(parsed.joinedAt, now),
      origin: parsed.origin === 'created' ? 'created' : 'joined',
    };
  } catch {
    return null;
  }
}

export function writeBinding(storage: JointStorage, binding: JointBinding): void {
  storage.setItem(JOINT_STORAGE_KEY, JSON.stringify(binding));
}

/** Leaves the remembered choice alone: it exists to survive this. */
export function clearBinding(storage: JointStorage): void {
  storage.removeItem(JOINT_STORAGE_KEY);
}

/** The last handshake's answer, or `null` if there has not been one this device trusts. */
export function readRememberedChoice(storage: JointStorage): BindChoice | null {
  const raw = readRaw(storage, JOINT_REMEMBER_KEY);
  return raw === 'merge' || raw === 'replace' ? raw : null;
}

export function writeRememberedChoice(storage: JointStorage, choice: BindChoice): void {
  storage.setItem(JOINT_REMEMBER_KEY, choice);
}

/**
 * The cap on the payload — the fragment after `#j=`, which is the part the app
 * controls. The `/app/#j=` prefix and the origin are not counted, so the same list is
 * shareable or not regardless of which host built the link.
 */
export const MAX_SHARE_URL_LENGTH = 8000;

/** The fragment key. One character, because the whole point is a short link. */
export const SHARE_FRAGMENT_KEY = 'j';

const PAYLOAD_VERSION = '1';
const SESSION_ID_PATTERN = /^[A-Za-z0-9_-]{22}$/;
const ITEM_PATTERN = /^(\d+)(?:x(\d+))?(\*)?$/;
const BASE64URL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

/**
 * base64url, written out rather than borrowed.
 *
 * The standard alphabet contains `+` and `/`, and both would need escaping inside a
 * fragment. Encoding for the URL alphabet directly means the link is exactly the
 * payload — no percent-encoding, and therefore no length that depends on the data.
 */
function toBase64Url(bytes: Uint8Array): string {
  let out = '';
  for (let index = 0; index < bytes.length; index += 3) {
    // `?? 0` never fires: the loop guarantees `a` exists. It is here because indexing
    // a typed array is `number | undefined` under `noUncheckedIndexedAccess`, and a
    // non-null assertion would be the other way to say the same thing less safely.
    const a = bytes[index] ?? 0;
    const b = bytes[index + 1];
    const c = bytes[index + 2];

    out += BASE64URL[a >> 2];
    out += BASE64URL[((a & 0b11) << 4) | ((b ?? 0) >> 4)];
    if (b === undefined) break;
    out += BASE64URL[((b & 0b1111) << 2) | ((c ?? 0) >> 6)];
    if (c === undefined) break;
    out += BASE64URL[c & 0b111111];
  }
  return out;
}

function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  globalThis.crypto.getRandomValues(bytes);
  return bytes;
}

/** 16 random bytes as base64url — unguessable enough that a stranger cannot enumerate. */
export function createSessionId(bytes: Uint8Array = randomBytes(16)): string {
  return toBase64Url(bytes);
}

/**
 * The list as a payload, or `null` when it cannot be shared.
 *
 * Canonical: sorted by product id, a quantity of one left out, checked as one
 * character. The same list therefore always produces the same bytes, which makes two
 * links comparable and the round trip an equality rather than a set comparison.
 */
export function encodeSharePayload(sessionId: string, cart: Cart): string | null {
  if (!SESSION_ID_PATTERN.test(sessionId)) return null;

  const items = [...cart.items]
    .sort((a, b) => a.productId - b.productId)
    .map((item) => {
      const quantity = item.quantity > 1 ? `x${item.quantity}` : '';
      return `${item.productId}${quantity}${item.checked ? '*' : ''}`;
    })
    .join(',');

  const payload = `${PAYLOAD_VERSION}.${sessionId}.${items}`;
  return payload.length > MAX_SHARE_URL_LENGTH ? null : payload;
}

export interface DecodedShare {
  sessionId: string;
  cart: Cart;
}

/**
 * Reads a payload, or returns `null`.
 *
 * Rejected whole, never partially applied: a payload arrives from outside the app, so
 * a half-understood list would be a list that disagrees with the link it came from.
 * The two deliberate tolerances are an explicit `x1` (unambiguous, so read as one) and
 * items in any order. A product named twice is *not* tolerated — the payload does not
 * say which line is meant, and choosing one silently would invent an answer.
 */
export function decodeSharePayload(payload: string, now: Date = new Date()): DecodedShare | null {
  if (payload.length > MAX_SHARE_URL_LENGTH) return null;

  const parts = payload.split('.');
  if (parts.length !== 3) return null;

  // Three parts is asserted above, so these are all present; the fallbacks exist so the
  // types say so without an assertion, and a missing part still fails the checks below.
  const version = parts[0] ?? '';
  const sessionId = parts[1] ?? '';
  const items = parts[2] ?? '';
  if (version !== PAYLOAD_VERSION) return null;
  if (!SESSION_ID_PATTERN.test(sessionId)) return null;

  const addedAt = now.toISOString();
  const decoded: CartItem[] = [];
  const seen = new Set<number>();

  if (items !== '') {
    for (const entry of items.split(',')) {
      const match = ITEM_PATTERN.exec(entry);
      if (match === null) return null;

      const productId = Number(match[1]);
      if (productId < 1) return null;
      if (seen.has(productId)) return null;

      const quantity = match[2] === undefined ? 1 : Number(match[2]);
      if (quantity < 1) return null;

      seen.add(productId);
      decoded.push({ productId, addedAt, checked: match[3] === '*', quantity });
    }
  }

  return { sessionId, cart: { items: decoded, updatedAt: addedAt } };
}

/** The payload out of a fragment, or `null` when this fragment is not a shared list. */
export function readSharePayload(hash: string): string | null {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  const prefix = `${SHARE_FRAGMENT_KEY}=`;
  return raw.startsWith(prefix) ? raw.slice(prefix.length) : null;
}

/**
 * The link to send.
 *
 * The payload is the fragment, so no part of the list is ever in a request line, a
 * `Referer`, or an origin's logs — which is the entire reason this is a fragment and
 * not a query string.
 */
export function shareUrl(payload: string, origin: string): string {
  return `${origin}/app/#${SHARE_FRAGMENT_KEY}=${payload}`;
}

/** Whichever of two `addedAt` values is older, treating an unusable one as absent. */
function earlier(left: string, right: string): string {
  const leftAt = Date.parse(left);
  const rightAt = Date.parse(right);
  if (Number.isNaN(leftAt)) return right;
  if (Number.isNaN(rightAt)) return left;
  return leftAt <= rightAt ? left : right;
}

/**
 * Two lists into one.
 *
 * Union of lines; the higher quantity; checked by either side. Adding quantities would
 * be wrong — two people who each want a few of something do not collectively want seven
 * — and the rule is commutative in contents, so neither device's list is privileged.
 *
 * It cannot *un*check, and that is a consequence rather than a detail: a line you ticked
 * off and then unticked comes back if the other side still has it ticked. The dialog
 * says so before the tap, and *Replace* is how one side's version wins outright.
 *
 * Row order is presentation — `ordering` owns the sequence — so this keeps the receiving
 * list's order and appends what it did not have. That makes the result deterministic
 * without pretending the order means anything.
 */
export function mergeCarts(mine: Cart, theirs: Cart, now: Date = new Date()): Cart {
  const byId = new Map<number, CartItem>(
    mine.items.map((item) => [item.productId, { ...item }]),
  );

  for (const item of theirs.items) {
    const existing = byId.get(item.productId);
    byId.set(
      item.productId,
      existing === undefined
        ? { ...item }
        : {
            ...existing,
            quantity: Math.max(existing.quantity, item.quantity),
            checked: existing.checked || item.checked,
            addedAt: earlier(existing.addedAt, item.addedAt),
          },
    );
  }

  return { items: [...byId.values()], updatedAt: now.toISOString() };
}
