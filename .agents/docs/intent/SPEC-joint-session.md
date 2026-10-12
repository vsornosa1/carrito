# Spec: `joint-session`

Module id: `joint-session` · Depends on: `cart` · Build order: after `cart` (and after `ordering`, which owns the row order the joint list is drawn with)

Status: **approved 2026-10-12.** Nothing in this spec is built yet; the plan and task list live in `tasks/`.

## Objective

Let me and my family shop off *one* list. I build the carrito, I send it, whoever is in the shop adds to it and ticks things off, and we see the same list. When I want out — the trip is over, or it was never mine to share — I detach and the list becomes mine again, or goes away.

**Confirmation, 2026-10-12: no backend.** The shared list travels *inside the link*. There is no server, no account, and no cart content is ever transmitted anywhere. That is a deliberate rejection of the alternative (a Cloudflare Worker + Durable Object relaying live edits) and it is the decision this whole spec is shaped by — the price is that devices converge only when a link is exchanged, and that price is paid in the open, below.

**User:** the author, and the two or three people who shop for the same house. Not accounts: a *device* is bound or not bound to a list, and that is the entire notion of membership.

## Platform constraints this builds on

- No backend. The deploy is `dist/` as static assets ([wrangler.jsonc](../../../wrangler.jsonc)); adding a server is a different decision, not an implementation detail.
- `public/_headers` pins `connect-src 'self'`, `script-src 'self'`, `frame-ancestors 'none'`. This spec adds **no new origin and no new request**, so `_headers` does not change. A shared list that needed `connect-src` widened would be the wrong design.
- `tests/network-hygiene.test.ts` asserts the absence of runtime network access at the source level. It stays true.
- Spanish UI strings, product names exactly as Mercadona publishes them.

## Commands

```
npm run dev                  # Vite dev server
npm test                     # vitest run
npm run test:coverage        # vitest run --coverage  (≥ 90% lines/functions/branches/statements on src/lib/**)
npm run typecheck            # tsc --noEmit
npm run lint                 # eslint . --max-warnings 0
npm run build                # tsc --noEmit && vite build
```

## Project structure

```
src/lib/joint-session.ts         → pure logic: id generation, link codec, merge, binding read/write (NEW)
src/lib/joint-session.test.ts    → exhaustive unit tests, colocated like every other src/lib module (NEW)
src/types/joint-session.ts       → the binding contract (NEW)
src/app/useJointSession.ts       → the React seam: bind, unbind, share, hash handling (NEW)
src/app/CartScreen.tsx           → the two entry points and the two dialogs (MODIFIED)
src/components/JointSessionBar.tsx / .test.tsx → the bound-state indicator and actions (NEW)
.agents/docs/intent/CAPABILITY-MAP.md → initiative registration (MODIFIED)
.agents/docs/intent/SPEC-joint-session.md → this file (NEW)
```

No `scripts/` change: this module touches no build-time data and no network.

## Code style

Pure logic in `src/lib`, data in and data out; no React, no storage globals, no fetch. Same idiom as `cart.ts`:

```ts
/** Highest quantity, checked wins, nothing lost. Commutative in contents; row order is presentation. */
export function mergeCarts(mine: Cart, theirs: Cart, now: Date = new Date()): Cart {
  const byId = new Map(mine.items.map((item) => [item.productId, item]));
  for (const item of theirs.items) {
    const existing = byId.get(item.productId);
    byId.set(
      item.productId,
      existing === undefined
        ? item
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
```

Conventions: TypeScript `strict`; no `any`; named exports; storage access through a `StorageLike` parameter so `localStorage` never appears in a test.

## Testing strategy

| Concern | Level |
|---|---|
| Link codec — round-trip, every malformed shape, the length cap | unit, exhaustive (`src/lib/joint-session.test.ts`) |
| Merge rule — commutativity, quantity max, checked OR, addedAt | unit, exhaustive |
| Binding store — read-back, unknown session, corrupt value | unit, with an in-memory `StorageLike` |
| Bind / unbind dialogs, fragment handling, shared-list rendering | component (Testing Library) |
| Two real phones, one real link | manual, in the shop |

Coverage: the existing **≥ 90% lines/functions/branches/statements on `src/lib/**`** floor applies unchanged and is not lowered for this module.

## Contract

```ts
// src/types/joint-session.ts

/** This device's membership in a shared list. Its absence means the device is solo. */
export interface JointBinding {
  sessionId: string;             // opaque; 16 random bytes, base64url
  joinedAt: string;              // ISO timestamp — from the device's own clock
  origin: 'created' | 'joined';  // who opened the session; the bar's copy uses it, nothing else does
}

export type BindChoice = 'merge' | 'replace';
export type UnbindChoice = 'keep' | 'clear';
```

The remembered `BindChoice` is **not** a field of the binding. It has its own key,
because it has to outlive the binding: the whole point of remembering it is that the
next handshake — which happens after this device has been unbound — is pre-answered.
Putting it in both places would be two sources of truth for one fact, and the first
disagreement between them would be a silent one.

Two storage keys, and **the cart's key does not move**:

| Key | Holds |
|---|---|
| `carrito.cart.v1` | The active cart — solo *or* shared. Unchanged, and still the only cart key |
| `carrito.joint.v1` | A `JointBinding`, or absent. Added |
| `carrito.joint.remember.v1` | The remembered `BindChoice`. Added, and survives unbinding |

A shared list is a `Cart` — the same shape, the same `cartTotal`, the same rows. There is no second cart schema, which is why nothing in `cart.ts` has to change and why an unbind is a one-line state transition rather than a migration.

**Reading a binding repairs what it can and only gives up on the identity.** A missing
or non-string `sessionId` means there is nothing to bind to, so the device is solo — the
same posture as `loadCart` degrading a corrupt cart to an empty one. Everything else is
repaired rather than discarded, because discarding it would silently turn a shared list
into a personal one: an unparseable `joinedAt` becomes now, and an unknown `origin`
becomes `'joined'` (the conservative reading — if the app cannot tell, it does not claim
the user created it). The remembered choice is validated the same way: anything that is
not exactly `'merge'` or `'replace'` reads as *not remembered*.

### The link

```
/app/#j=<version>.<sessionId>.<items>

version     = "1"
sessionId   = 22 chars of base64url over 16 random bytes
items       = "" | item ("," item)*
item        = <productId> [ "x" <quantity> ] [ "*" ]
```

- `productId` — decimal, positive.
- `quantity` — decimal, ≥ 2. Omitted means 1: one of something is the common case, so it costs nothing to say.
- `*` — checked.
- Items are emitted sorted ascending by `productId`, so the same cart always yields byte-identical payloads and two people comparing links are comparing the same string. The decoder accepts any order.
- A malformed payload is rejected **whole** — never partially applied. Unknown version, wrong-length id, non-numeric or non-positive id, `x0`, `x-1`, `x1.5`, a payload over `MAX_SHARE_URL_LENGTH` — each returns `null`.

`MAX_SHARE_URL_LENGTH = 8000` characters of **payload** — the fragment after `#j=`,
which is the part the app controls. The fixed `/app/#j=` prefix and the origin are not
counted, so the cap does not shift between localhost and production. It is checked
*before* a link is offered: a list too long to share says so and produces no link,
because a link that only sometimes opens is worse than a refusal. No timestamps travel:
nothing about when a line was added changes what it means, and leaving them out keeps the
payload small enough to survive a chat client. On decode, `addedAt` is the moment of decode.

**Two different postures, deliberately.** A binding is read from this app's own storage, so
it is repaired — the session id is the only thing worth giving up on. A payload arrives
from *outside* the app, so it is rejected whole: an unknown version, a session id that is
not 22 base64url characters, a non-numeric or zero `productId`, `x0`, `x-1`, `x1.5`, a
product named twice, or a payload over the cap each mean `null`, and the caller changes
nothing. The one exception is `x1`, which is read as one of something: the encoder never
writes it, but it is unambiguous, and refusing a link the app fully understands would be
strictness for its own sake. Duplicates are *not* treated that way — a payload that names
a product twice does not say which line is meant, and picking one silently would make the
list disagree with the link it came from.

**The session id lives in the fragment, never the query or the path.** A fragment is not sent in a request line, not sent in `Referer`, and not in the origin's logs. That is the whole reason the format is a fragment.

## Behaviour

| Action | Result |
|---|---|
| Compartir (solo) | Creates a session, writes the binding, builds the link, and opens the platform share sheet with a copied fallback |
| Compartir (bound) | Emits the current list under the same `sessionId` — this is how a device re-syncs: check things off, share again |
| Open a link, never bound | Asks: **Fusionar** / **Reemplazar** / **Cancelar**. The choice is remembered as the default for the next handshake |
| Open a link, bound to the same session | Asks with the remembered choice pre-answered, and a way to pick the other |
| Open a link, bound to a *different* session | Refuses, and says plainly that this device is already in another shared list and must leave it first. It never switches sessions on its own |
| Fusionar | Union of lines; `quantity` = the higher of the two; `checked` = checked by either. The list on screen becomes the shared one |
| Reemplazar | The link's list becomes this device's list, and the previous one is discarded — which the dialog says in the same breath, before the tap |
| Desvincularse (bound, not empty) | Asks: **Quedarme con la lista** / **Empezar de cero** / **Cancelar** |
| Quedarme con la lista | The binding is removed; the shared list stays as this device's own cart |
| Empezar de cero | The binding is removed and the cart is emptied |
| Desvincularse (bound, empty) | Same question; "Quedarme con la lista" is the no-op and the cart stays empty |
| After a handshake | The fragment is removed with `history.replaceState`, so a reload does not re-ask |
| Reload, bound | Cart, checked flags, quantities and the binding all survive |
| Empty shared list | The same empty state as today; no separate joint empty state |

The bound state is visible, not implied: the cart screen carries a **joint-list bar** naming the session (short form of the id), with *Compartir* and *Desvincularme*. On a phone it sits above the total bar and above the tabs, in the same reach as the existing actions.

## What a link cannot do — stated, not buried

These are the consequences of the confirmed decision, and the UI repeats the first two where they matter:

1. **No live sync.** Two phones converge only when a link is exchanged. Adding milk on one phone does not appear on the other until a link goes across. The bar says the list is *shared*, never *synced*.
2. **No roll call.** There is no server, so the app cannot know who else is in the session, how many devices joined, or whether anyone changed anything. No member count, no "last updated by". The only fact the app has is the session id it holds.
3. **No revocation.** Anyone who ever had the link has the list. Unbinding detaches *this device* and cannot reach the copy in someone else's phone, chat log or screenshot. To stop a link working, start a new session and share a new link — which is what "Empezar de cero" plus a fresh *Compartir* does.
4. **Not a secret store.** The payload is base64url in a URL. Whoever sees the URL sees the list. Nothing else about the device travels, and no product, price or nutrition data is in the link — only product ids and counts.

## Acceptance criteria

1. `decodeSharePayload(encodeSharePayload(sid, cart))` returns a cart with the same lines, quantities and checked flags, for any cart within the cap.
2. Every malformed payload returns `null` and never throws, and leaves both the cart and the binding untouched.
3. A cart that would exceed `MAX_SHARE_URL_LENGTH` produces no link, and the UI says why.
4. `mergeCarts` is commutative in contents: the set of `(productId, quantity, checked)` is identical for `merge(a, b)` and `merge(b, a)`.
5. Merge takes the higher quantity and treats checked-by-either as checked; the dialog's help text says that a merge cannot uncheck, before it is applied.
6. Opening a link while bound to a different session changes nothing and explains why.
7. The fragment is cleared after a handshake, so a reload does not re-open the question.
8. A corrupt or unreadable `carrito.joint.v1` degrades to a solo cart rather than a crash, exactly as `loadCart` does for a corrupt cart.
9. Unbind with "Quedarme con la lista" leaves the shared contents as the personal cart; with "Empezar de cero" leaves an empty cart; and a reload after either does not re-bind.
10. No action in this module makes a network request, and no cart content appears in a request line — `tests/network-hygiene.test.ts` passes unchanged.
11. Unit tests cover the codec round-trip, every malformed case, merge, and the binding read/write; `npm run test:coverage` stays above the existing floor.
12. Exactly one session at a time: a second link to a different session is refused, not merged.

## Boundaries

**Always** — keep `carrito.cart.v1` and the `Cart` shape exactly as they are, so a shared list is a cart and not a second schema; put the session id in the fragment and never in the query or path; write the binding through to storage on every change; ask before anything destructive and say what will be lost in the question itself.

**Ask first** — any server-side or relay component (that reverses the decision recorded at the top, and needs its own privacy and CSP review); any change to the merge rule; adding member names, a roll call, or any per-line attribution; changing the link format in a way that breaks links already sent.

**Never** — transmit the cart, or any part of it, to any origin; let a malformed link throw or apply partially; silently switch sessions or join a second one; unbind, replace or empty without asking; describe the list as synchronised, live, or up to date; report a member count the app cannot know.

## Success criteria

1. Two phones, one link: both show the same list; ticking items off on one and sharing again reflects on the other.
2. A device with an existing cart that opens a link is offered merge or replace, and the choice is remembered the next time.
3. Unbinding offers keep-or-clear, and either outcome leaves no binding behind.
4. `npm test`, `npm run test:coverage`, `npm run typecheck` and `npm run lint` are all clean.
5. Zero new runtime network requests (DevTools, plus `tests/network-hygiene.test.ts`).
6. `public/_headers` is unchanged.

## Open questions

1. **The cap.** 8000 characters is assumed — roughly 600–700 lines. Do we want a QR code as well? A scannable QR tops out near 2,900 characters, so offering it would either lower the practical cap or make the two paths disagree. Assumed: no QR in this version.
2. **Replace discards.** The cart spec's own principle is that a list the user built is never quietly thrown away (that is why the storage key was never bumped). This spec discards on *Reemplazar*, and makes it loud instead of quiet. Is loud enough, or should the replaced list go to a recovery slot offered at unbind?
3. **One session at a time.** Assumed. Should a device be able to hold several shared lists and switch between them?
4. **Wording.** "Lista compartida" / "sesión conjunta" / "lista familiar" — the module id is `joint-session`, but the UI is Spanish and none of those is obviously right. Needs one decision before the strings are written.
5. **Order.** Assumed: only *items* travel. The `ordering` preference (clusters, within-cluster order) stays per device, because it describes how *this* person walks *this* store.
