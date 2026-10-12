# Task list: joint lists

Plan: [plan.md](./plan.md) · Intent: [CAPABILITY-MAP.md § Initiative: Joint lists](../.agents/docs/intent/CAPABILITY-MAP.md) · Spec: [SPEC-joint-session.md](../.agents/docs/intent/SPEC-joint-session.md)

Boundary: the list travels **inside the link**. No server, no account, no request,
and no header changes. A device is *bound* or it is not; that is the whole notion of
membership. Nothing in this work sends the cart anywhere.

**Method:** every task is test-first. The test is written and seen to fail before the
implementation exists, and a test that passes on its first run is treated as broken
rather than done.

**Re-sliced during implementation.** The original Task 6/7 split (bar-and-bind-question,
then the share action) did not survive contact: a bar whose *Compartir* button does nothing
is not a working slice, and the share mechanism is self-contained enough to stand alone.
The numbering below is what was built, and `plan.md` was updated to match.

---

## Task 1: The binding contract and its store — **done 2026-10-12**

**Description:** `src/types/joint-session.ts` — `JointBinding`, `BindChoice`,
`UnbindChoice`. `src/lib/joint-session.ts` — `readBinding`/`writeBinding`/
`clearBinding` over a `JointStorage`, the remembered choice under its own key so it
survives unbinding, and degradation to *solo* on any malformed stored value.

**Acceptance criteria:**
- [x] The binding is `{sessionId, joinedAt, origin}`, and the cart's own key and shape
      are untouched by this module. `remember` was **removed from the binding at spec
      time** — it lives in its own key, because the handshake it pre-answers happens
      after the binding is gone
- [x] A device with no binding reads as solo; a corrupt, non-JSON, or unreadable
      `carrito.joint.v1` also reads as solo, and never throws
- [x] The remembered choice is read back after the binding is cleared
- [x] Storage access goes through a `JointStorage` parameter — no `window` in the module
- [x] The binding is written through on every change, with no unload hook
- [x] Reading **repairs** rather than discards: an unusable `joinedAt` becomes now, an
      unknown `origin` becomes `joined`, and only an unusable `sessionId` means solo

**Verification:**
- [x] `npx vitest run src/lib/joint-session.test.ts` — **14 passed**
- [x] `npm run typecheck` and `npm run lint` clean

**Note:** the first green attempt was not green — 13 passed, 1 failed. The implementation
kept *any* string `joinedAt` while the requirement is that an unparseable one is repaired,
so `"whenever"` survived as a timestamp. The test caught the hole before the code was
accepted, which is the whole reason for the red run.

**Files touched:** `src/types/joint-session.ts`, `src/lib/joint-session.ts`, `src/lib/joint-session.test.ts`

---

## Task 2: The link codec — **done 2026-10-12**

**Description:** `createSessionId` (16 random bytes, base64url), `encodeSharePayload`,
`decodeSharePayload`, `shareUrl`, `readSharePayload`. Canonical form: sorted by
`productId`, quantity 1 omitted, `*` for checked, `x` for count.
`MAX_SHARE_URL_LENGTH = 8000` checked before a link is offered.

**Acceptance criteria:**
- [x] `decodeSharePayload(encodeSharePayload(sid, cart))` re-encodes to **byte-identical**
      output for any cart within the cap — an equality, not a set comparison
- [x] Every malformed payload returns `null` and never throws — **20 cases** in one
      `it.each`: unknown version, wrong-length id, url-unsafe id, `x0`, `x-1`, `x1.5`, `x`,
      an empty entry, a trailing comma, a product named twice, stray text
- [x] The same cart always produces byte-identical output, so two links are comparable
- [x] A 100-line cart's payload is pinned twice: under the cap, and under 2500 characters
- [x] `readSharePayload('#j=…')` returns the payload, tolerates a missing `#`, and
      returns `null` for an unrelated anchor, another key, and an empty hash
- [x] The session id appears only in the fragment — `shareUrl` is asserted to contain no `?`
- [x] The production default path (`createSessionId()` with no injected bytes) is covered

**Verification:**
- [x] `npx vitest run src/lib/joint-session.test.ts` — 70 passed by the end of Task 3
- [x] `npm run test:coverage` — floor holds
- [x] `npm run typecheck` and `npm run lint` clean

**Note:** two follow-ups came from tooling rather than a red run, and are recorded as such:
`noUncheckedIndexedAccess` rejected the typed-array and destructuring code, and the coverage
report named `randomBytes` as the only unexercised path — which was the path production
takes, so it got two characterisation tests rather than a shrug.

**Files touched:** `src/lib/joint-session.ts`, `src/lib/joint-session.test.ts`

---

## Task 3: The merge rule — **done 2026-10-12**

**Description:** `mergeCarts(mine, theirs)` — union of lines, `quantity` = the higher
of the two, `checked` = checked by either, `addedAt` = the earlier of the two, row
order from `mine` first. Pure; the `ordering` module owns the sequence.

**Acceptance criteria:**
- [x] The set of `(productId, quantity, checked)` is identical for `merge(a, b)` and
      `merge(b, a)` — commutativity in contents, asserted directly
- [x] The higher quantity wins — asserted **both ways round**, because taking the max from
      only one direction is the bug this rule invites
- [x] Checked-by-either wins, in both directions
- [x] A cart merged with an empty cart is unchanged in contents, both ways
- [x] The documented consequence is pinned: merge re-checks a line the user had unchecked
      when the other side has it checked
- [x] The earlier `addedAt` survives, and an unusable one loses to a usable one
- [x] Neither input is mutated, asserted on the serialised values

**Verification:**
- [x] `npx vitest run src/lib/joint-session.test.ts` — **70 passed**
- [x] `npm run typecheck` and `npm run lint` clean

**Note:** 11 red first, then green. The unusable-`addedAt` case was added to the test file
*before* the implementation existed, so it was part of the same red run rather than a test
written to fit code that was already there.

**Files touched:** `src/lib/joint-session.ts`, `src/lib/joint-session.test.ts`

---

## Checkpoint: After Tasks 1-3 — **passed 2026-10-12**

- [x] `npx vitest run src/lib/joint-session.test.ts` green — 70 passed
- [x] `npm run test:coverage` holds the ≥ 90% floor — 97.2% statements, 94.14% branches
- [x] No React import, no `window`, no `fetch`, no `document.` in `src/lib/joint-session.ts`
- [x] `npm run typecheck` and `npm run lint` clean

---

## Task 4: A second action for `ConfirmDialog` — **done 2026-10-12**

**Description:** An optional `alternateLabel` / `onAlternate` rendered between
Cancelar and the primary action. Optional, so every existing call site is unchanged.
Focus still starts on Cancelar.

**Acceptance criteria:**
- [x] With no `alternateLabel`, the dialog renders exactly as it does today and
      `ConfirmDialog.test.tsx` passes with its original cases unmodified
- [x] With an `alternateLabel`, three actions render in the order Cancelar, alternate,
      primary — asserted on the rendered labels, not on props
- [x] Focus starts on Cancelar in both shapes, so a stray Return cannot pick an answer
- [x] The alternate reports only itself: neither of the other two handlers fires
- [x] A `cancel` request still means cancel with three actions on screen

**Verification:**
- [x] `npx vitest run src/components/ConfirmDialog.test.tsx src/app/CartScreen.test.tsx`
      — **55 passed**, the existing call sites untouched
- [x] `npm run typecheck` and `npm run lint` clean

**Notes, both worth keeping:**
- **No CSS was needed.** The plan guessed `styles.css` would be touched; it is not. The
  `confirm__*` classes appear in exactly one file — the component — and are styled by the
  global `button` rule, so a third button inherits the same treatment as the other two.
- **The Esc test was wrong, and the failure said so.** jsdom does not turn Escape into a
  `cancel` event, which is why the existing suite has no Esc test. The rewritten test
  dispatches the `cancel` request directly, so it tests this component's handler rather than
  the browser's key handling — which is the native `<dialog>`'s job.

**Files touched:** `src/components/ConfirmDialog.tsx`, `src/components/ConfirmDialog.test.tsx`

---

## Task 5: `useJointSession` — **done 2026-10-12**

**Description:** The seam. Binding state read from storage, the `#j=` intake at mount,
stripping the fragment so a reload does not re-ask, and the actions over the pure core.

**Acceptance criteria:**
- [x] A device with no binding is solo, and nothing about the cart changes
- [x] Opening `/app/#j=…` produces an *offer*, not a mutation: the test asserts the cart,
      the binding and the pending state separately, so "nothing changed" is asserted
      rather than assumed
- [x] The fragment is gone after mount, so a reload cannot re-offer
- [x] A corrupt binding degrades to solo rather than a crash
- [x] Cancelling changes nothing and remembers nothing — an unanswered question is not an
      answer
- [x] `ensureSession` reuses the session when already bound instead of starting a second
- [x] The hook holds no network call

**Verification:**
- [x] `npx vitest run src/app/useJointSession.test.tsx` — **15 passed**
- [x] `npx vitest run src/app/App.test.tsx src/app/CartScreen.test.tsx src/lib/cart.test.ts`
      — 84 passed, so the `useCart` change broke nothing
- [x] `npm run typecheck` and `npm run lint` clean

**Notes:**
- **A real trap avoided.** The fragment is read by a *pure* initializer and stripped in an
  effect. Clearing it inside the `useState` initializer would have worked in production and
  failed under `StrictMode`, where React invokes the initializer twice: the first call would
  strip the fragment and the second would find nothing, so the offer would disappear in
  development and nowhere else.
- **Deviation from the plan, recorded rather than glossed.** The plan listed `App.tsx` under
  this task. Wiring the hook into `App` before anything renders it would be dead code that
  lint rejects, so the wiring moved to Task 8. The hook is real and tested; it simply had no
  consumer yet.
- `useCart` gained `replace` — one caller needs to hand over a whole list rather than an
  edit. Every other mutation stays a small function, so the cart keeps one owner.

**Files touched:** `src/app/useJointSession.ts`, `src/app/useJointSession.test.tsx`, `src/app/useCart.ts`

---

## Task 6: The share mechanism — **done 2026-10-12**

**Description:** `shareLink(link, navigator)` — platform share sheet, then clipboard, then
`manual`, with `cancelled` as a real outcome. The navigator is a parameter, so `src/lib`
still touches no globals and the fallbacks are testable without a browser stub library.

**Acceptance criteria:**
- [x] Uses the share sheet when there is one, and hands over the link and nothing else
- [x] Falls back to the clipboard when there is no share sheet
- [x] Falls back to the clipboard when sharing throws for a reason that is not the user
- [x] Does **not** copy when the user closed the sheet themselves — copying after a cancel
      puts the link on the clipboard without being asked
- [x] Reports `manual` when there is neither, and when the clipboard is blocked
- [x] No `fetch`, `XMLHttpRequest`, or `sendBeacon` anywhere on this path

**Verification:**
- [x] `npx vitest run src/lib/share.test.ts` — **6 passed**
- [x] `npm run typecheck` and `npm run lint` clean

**Files touched:** `src/lib/share.ts`, `src/lib/share.test.ts`

---

## Task 7: `JointSessionBar` — **done 2026-10-12**

**Description:** The bar: the session in short form, *Compartir*, *Desvincularme*, the
notice area, and the selectable link field for the `manual` fallback.

**Acceptance criteria:**
- [x] Says the list is shared, and **never** claims it is synchronised — asserted by test
- [x] Never reports a member count, because the app cannot know one — asserted by test
- [x] Explains that a change only reaches the others when the link is sent again
- [x] Shows the session in short form, so two people can confirm they are on one list
- [x] Offers both actions, and each reports only itself
- [x] Shows the link in a read-only, selectable field when it had to be shown by hand
- [x] Announces what happened as visible text (`role="status"`), never as a tooltip
- [x] Shows no field and no notice when there is nothing to report

**Verification:**
- [x] `npx vitest run src/components/JointSessionBar.test.tsx` — **9 passed**
- [x] `npm run lint` clean

**Files touched:** `src/components/JointSessionBar.tsx`, `src/components/JointSessionBar.test.tsx`

---

## Task 8: The wiring — **done 2026-10-12**

**Description:** Everything joined up: the bar on the list, the bind question when a link
arrives, the share action, the refusal of a foreign session, and unbind. The bar renders in
*both* branches of `CartScreen`, so an empty shared list is still shareable and leavable.

**Acceptance criteria:**
- [x] A bound device shows the bar; a solo device does not
- [x] The bar appears even with an empty list, so being bound with nothing in the cart is
      not a state with no way out
- [x] An arriving link asks, and names **both** consequences before the tap: merging cannot
      uncheck, and replacing discards the list on screen
- [x] The remembered choice is the primary button, and both answers are always visible
- [x] Fusionar applies the union rule; Reemplazar replaces; Cancelar changes nothing
- [x] A link for a different session is refused with a reason, and the cart is untouched —
      a banner, not a dialog, so it can be read from whatever tab is open
- [x] Sharing sends a real link built from the list on screen
- [x] A list over the cap produces no link and says why, rather than a link that may not open
- [x] Unbinding offers Quedarme con la lista / Empezar de cero / Cancelar, and either
      outcome removes the binding

**Verification:**
- [x] `npx vitest run src/app/App.test.tsx` — **29 passed** (11 of them new)
- [x] `npm run typecheck` and `npm run lint` clean

**Notes, both found by a failing test:**
- **`userEvent.setup()` installs a clipboard of its own.** A `navigator` stub applied before
  the harness is silently overwritten, so the "neither share nor copy" test was getting a
  working clipboard and reporting `Enlace copiado`. The stub now goes *after* the harness,
  which is correct because the app reads `navigator` at the moment of the tap. A temporary
  probe test established this, and was deleted.
- **The first version of the too-long test timed out** (5s) because it rendered 1,100 cart
  rows under coverage instrumentation. A slow test, not a slow app: it now uses long ids and
  a quantity so 400 lines exceed the cap, with an explicit timeout as headroom.
- `src/styles.css` gained the `.joint-bar` and `.joint-notice` rules, in the existing token
  idiom, because the bar is cart UI and the cart UI is styled.

**Files touched:** `src/app/App.tsx`, `src/app/App.test.tsx`, `src/app/CartScreen.tsx`, `src/components/JointSessionBar.tsx`, `src/styles.css`

---

## Checkpoint: The feature works — **passed 2026-10-12**

- [x] An arriving link asks, and applies only what was chosen
- [x] Sharing builds a real link from the list on screen, and refuses when too long
- [x] Unbinding offers keep-or-clear, and either leaves nothing behind
- [x] The bar says *compartida*, never *sincronizada*
- [x] Two devices converge once the link has gone both ways (integration test)

---

## Task 9: The guard, the integration test, and the record — **done 2026-10-12**

**Description:** A test spanning the module; a network-hygiene assertion that the sharing
path cannot transmit; and the documentation the spec amends.

**Acceptance criteria:**
- [x] `tests/joint-session.test.ts` walks the errand across two devices and asserts they
      converge on one list
- [x] The link survives URL parsing — the test opens it through `new URL(link).hash`, as a
      chat client would
- [x] The payload carries no timestamps, asserted directly on the string
- [x] `tests/network-hygiene.test.ts` fails if the sharing path gains `fetch`,
      `XMLHttpRequest`, `sendBeacon` or a socket — **proved by adding a `fetch` to
      `share.ts`, watching the guard name the file, and reverting it**
- [x] The guard strips comments first, so it cannot cry wolf on a sentence about a call —
      the principle the file's own third-party guard already states
- [x] `shareUrl` is asserted to build a fragment and never a query string
- [x] `SPEC-cart.md`'s "no sync, nothing is transmitted anywhere" gains a pointer to
      `SPEC-joint-session.md` and says what a shared list actually is
- [x] `README.md` and `docs/LAUNCH.md` say what sharing is and what it is not
- [x] `public/_headers` is byte-identical — asserted with an empty `git diff --stat`

**Verification:**
- [x] `npm test` — **738 passed** (63 files)
- [x] `npm run test:coverage` — 97.63% statements, 94.37% branches, 98.81% functions,
      99.19% lines against the 90% floor
- [x] `npm run typecheck`, `npm run lint`, `npm run build` all green
- [x] `git status` shows no probe artifact left behind

**Note:** the first version of the convergence test asserted the wrong thing — merging the
same link into a device that had an extra item cannot match. Rewritten as the property that
actually matters: after the link goes both ways, both devices hold the same list.

**Files touched:** `tests/joint-session.test.ts`, `tests/network-hygiene.test.ts`, `.agents/docs/intent/SPEC-cart.md`, `README.md`, `docs/LAUNCH.md`

---

## Checkpoint: Complete

- [x] Every acceptance criterion in [SPEC-joint-session.md](../.agents/docs/intent/SPEC-joint-session.md) is met
- [x] Full suite, coverage floor, typecheck, lint and build green
- [x] `public/_headers` byte-identical
- [ ] **The five spec open questions** — answered or still open, below
- [ ] **Reviewed by the human, merged** — open: nothing is committed
- [ ] **The plan's own open question about pasting a link** — decided, not silently dropped

## Where this stopped

Built and verified; **nothing is committed**. The working tree holds the new module
(`src/lib/joint-session.ts`, `src/lib/share.ts`, `src/types/joint-session.ts`), the seam
(`src/app/useJointSession.ts`), the bar, the wiring in `App`/`CartScreen`, the styles, the
tests, and the documentation amendments.

Still open, and none of them is a defect:

1. **The cap** — 8000 characters of payload, no QR. Pinned by test; a scannable QR would
   lower the practical limit to about 2,900 and make the two paths disagree.
2. **Replace discards** — loudly, in the dialog, with no recovery slot. The cart spec's own
   principle is that a built list is never *quietly* thrown away; this is loud. If it ever
   loses a real list, the recovery slot is the fix, and it is deliberately not built
   speculatively.
3. **One session at a time** — a second link is refused, not merged.
4. **Wording** — "Lista compartida" was chosen and is now in the component, the tests and
   the README.
5. **Order** — only items travel; the `ordering` preference stays per device.
6. **Pasting a link** — not built. Some chat clients do not make a `#fragment` link
   tappable, and a "pegar enlace" field would cover that. It is not in the spec, so it was
   raised rather than smuggled into a task.

Not verified, and worth naming: **two real phones in a shop**. Every check above is a test
or a build; the manual round trip is the one thing a test cannot stand in for.
