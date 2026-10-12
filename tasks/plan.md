# Implementation Plan: joint lists

## Overview

Let two or three phones shop off one carrito without a server. A device is either
*solo* or *bound* to a session; the list travels inside a URL fragment
(`/app/#j=1.<sessionId>.<items>`), so nothing leaves the device until the user
sends the link themselves. Binding asks merge-or-replace, unbinding asks
keep-or-clear, and both answers are the user's.

Intent: [CAPABILITY-MAP.md § Initiative: Joint lists](../.agents/docs/intent/CAPABILITY-MAP.md) ·
Spec: [SPEC-joint-session.md](../.agents/docs/intent/SPEC-joint-session.md)

## Working agreement

**Every task is built test-first (confirmed 2026-10-12).** The test is written and
*seen to fail* before the implementation exists, per
[test-driven-development](../.agents/skills/test-driven-development/SKILL.md). No task
is complete on "seems right": the red run is the evidence the test can fail, and the
green run is the evidence it now covers something real. A test that passes on its first
run is treated as a broken test, not a finished task.

## Architecture Decisions

- **A shared list is a `Cart`.** One schema, one storage key (`carrito.cart.v1`),
  and a small sibling record (`carrito.joint.v1`) saying whether this device is
  bound. Nothing in `cart.ts` changes. A second cart shape would have meant a
  second `cartTotal`, a second set of row components and a migration — for a
  feature whose whole point is that the list is the list.
- **The session id lives in the fragment, never the query or the path.** A
  fragment is not sent in a request line, not in `Referer`, and not in the
  origin's logs. That single fact is why the link is shaped the way it is, and
  why `public/_headers` does not move.
- **The codec is canonical, so payloads are comparable.** Items are emitted sorted
  by `productId`, quantity 1 is omitted, checked is one character. The same cart
  always produces the same string, which makes the round-trip test an equality
  test rather than a set comparison, and makes two people comparing links compare
  the same bytes.
- **Malformed means rejected whole.** `decodeSharePayload` returns `null` and never
  throws, and the caller changes nothing. Same posture as `loadCart` degrading a
  corrupt cart to an empty one: a bad input is not a crash, and it is not a
  half-applied edit either.
- **Merge is commutative in contents and lossy in one direction, and that is
  said out loud.** `quantity` takes the higher of the two, `checked` is
  checked-by-either. So merge can resurrect a line the user had unchecked — the
  dialog's message names that before the tap, and *Reemplazar* is the escape.
  Hiding it would make the app's list disagree with what the user thought they
  did.
- **`ConfirmDialog` gains a third action rather than a second dialog component.**
  Both questions here have two real answers and one safe exit (Fusionar /
  Reemplazar / Cancelar; Quedarme / Empezar de cero / Cancelar). The native
  `<dialog>` already brings the focus trap, Esc and the top layer, and its comment
  explains at length why that is not worth re-implementing. The new action is
  optional, so every existing `ConfirmDialog` call site is untouched — and the
  safe choice still takes focus.
- **The remembered choice pre-answers, it does not auto-apply.** Both options are
  always on screen with the remembered one as the primary button, so a handshake
  is one tap when the answer is still the same and never a surprise. The app never
  performs a destructive merge because of a default the user set last month.
- **The share action is an injected seam.** `navigator.share` and
  `navigator.clipboard` are absent in tests and in some browsers, so the call goes
  through a small wrapper that takes the navigator as a parameter. That keeps the
  fallback path testable without a browser stub library, and keeps `src/lib` free
  of globals.
- **No new request, so no header and no guard changes.** The link is built and
  parsed locally. `tests/network-hygiene.test.ts` is not weakened; a new assertion
  is added that the sharing code contains no `fetch`.

## Task List

**Re-sliced during implementation, 2026-10-12.** The plan below is the sequence that was
actually built. The original split — bar-plus-bind-question as one task, the share action
as the next — did not survive contact: a bar whose *Compartir* button does nothing is not
a working slice, and the share mechanism is self-contained enough to be its own. So the
mechanism came first, then the bar, then one wiring task that lands the whole feature
working (including unbind, which was Task 8 and is now folded into the wiring). The
numbers below are the ones in `todo.md`.

### Phase 1: The pure core

- [x] Task 1: The binding contract and its store. Files: `src/types/joint-session.ts`,
  `src/lib/joint-session.ts`, `src/lib/joint-session.test.ts`. **Done** — 14 tests.
- [x] Task 2: The link codec. Same files. **Done** — 70 tests in the file by the end,
  including 20 malformed payloads in one table.
- [x] Task 3: The merge rule. Same files. **Done** — 11 red first.

### Checkpoint: Pure core — **passed**
- [x] `npx vitest run src/lib/joint-session.test.ts` green
- [x] `npm run test:coverage` holds the ≥ 90% floor
- [x] No React import, no `window`, no `fetch` in `src/lib/joint-session.ts`
- [x] Round-trip is an equality on the canonical string, not a set comparison

### Phase 2: The seam and the pieces

- [x] Task 4: A second action for `ConfirmDialog`. Files:
  `src/components/ConfirmDialog.tsx`, `ConfirmDialog.test.tsx`. **Done** — no CSS needed
  (the plan guessed wrong; the classes are styled by the global `button` rule).
- [x] Task 5: `useJointSession`. Files: `src/app/useJointSession.ts`, its test, and
  `src/app/useCart.ts` (which gained `replace`). **Done** — 15 tests.
- [x] Task 6: The share mechanism, `src/lib/share.ts`. Files: `src/lib/share.ts`,
  `src/lib/share.test.ts`. **Done** — 6 tests, including the cancelled-sheet case.
- [x] Task 7: `JointSessionBar`. Files: `src/components/JointSessionBar.tsx`, its test.
  **Done** — 9 tests, two of which assert what the bar must *not* say.

### Checkpoint: The pieces — **passed**
- [x] Each piece tested on its own, with the platform injected rather than assumed

### Phase 3: The wiring

- [x] Task 8: Bar + bind question + share + refusal + unbind, wired. Files:
  `src/app/App.tsx`, `src/app/App.test.tsx`, `src/app/CartScreen.tsx`,
  `src/components/JointSessionBar.tsx` (rendered in both branches), `src/styles.css`.
  **Done** — 11 wiring tests in `App.test.tsx`, 29 in the file.

### Checkpoint: The feature works — **passed**
- [x] An arriving link asks, and applies only what was chosen
- [x] Sharing builds a real link from the list on screen, and refuses when too long
- [x] Unbinding offers keep-or-clear, and either leaves nothing behind
- [x] Two devices converge once the link has gone both ways

### Phase 4: The guard and the record

- [x] Task 9: The integration test, the network guard, and the docs the spec amends.
  Files: `tests/joint-session.test.ts`, `tests/network-hygiene.test.ts`,
  `.agents/docs/intent/SPEC-cart.md`, `README.md`, `docs/LAUNCH.md`. **Done** — the guard
  was proved to fail on deliberate drift, then the drift was reverted.

### Checkpoint: Complete
- [x] Every acceptance criterion in the spec is met
- [x] `npm test` — **738 passed**; `npm run test:coverage` — 97.63% statements, 94.37%
  branches, 98.81% functions, 99.19% lines against the 90% floor
- [x] `npm run typecheck`, `npm run lint`, `npm run build` all green
- [x] `public/_headers` is byte-identical — `git diff --stat -- public/_headers` empty
- [x] `git status` clean of probe artifacts
- [ ] **Reviewed by the human, merged** — open: nothing is committed

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| A real chat client truncates or breaks a long fragment | High | `MAX_SHARE_URL_LENGTH` is checked *before* the link is offered, so a list either shares or says it cannot; a test pins the length of a 100-line cart, and the share message is verified against the cap, not assumed |
| The user reads "compartida" as "synced" and trusts a stale phone | High | The bar says *compartida* and never *sincronizada*; the spec's "what a link cannot do" is echoed in the bar and the bind dialog, not only in the docs; verified in the component test by asserting the absence of the word |
| Merge quietly resurrects an unchecked line | Medium | The consequence is in the dialog's message before the tap; *Reemplazar* is the documented escape; a test asserts the message names it |
| `navigator.share`/`clipboard` unavailable or blocked | Medium | Two fallbacks behind one seam; the last is a selectable text field, which cannot be blocked |
| A remembered choice applies something the user no longer wants | Medium | The remembered choice only *pre-answers*; both buttons are always visible, focus stays on Cancelar, and nothing is applied without a tap |
| A future change reintroduces a request (a "sync" that is really an upload) | High | `tests/network-hygiene.test.ts` gains an assertion that the joint-session source contains no `fetch`/`XMLHttpRequest`; the spec's *Never* list names transmission as forbidden |
| Scope creep into the rejected backend | Medium | The decision is recorded at the head of the spec; a server component is *Ask first*, not an implementation detail |
| A stale service worker serves a build without fragment handling | Low | Both HTML documents are `no-cache` in `public/_headers`; the fragment is read at mount, before any async work |
| Losing a cart on *Reemplazar* | Medium | Already an open question in the spec: it discards loudly rather than adding a recovery slot. If it loses a real list, the recovery slot is the fix — deliberately not built speculatively |

## Open Questions

Carried from the spec, unresolved until the relevant task:

1. **The cap** — 8000 characters assumed, no QR (Task 2 pins it with a test).
2. **Replace discards** — loud, not recoverable (Task 6 wording; revisit if it loses a list).
3. **One session at a time** — a second session is refused (Task 6).
4. **Wording** — "lista compartida" / "sesión conjunta" / "lista familiar" is chosen before the
   strings are written, in Task 6. The plan uses "lista compartida".
5. **Order** — only items travel; the `ordering` preference stays per device (Task 2).

Raised by this plan, for the human:

6. **Pasting a link.** Some chat clients do not make a `#fragment` link tappable. A
   "pegar enlace" field would cover that, but it is not in the spec, so it is **not**
   built here — flagged as a possible spec amendment rather than smuggled into a task.
