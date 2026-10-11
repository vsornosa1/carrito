# Spec: `entitlement`

> **Superseded 2026-10-11.** There is nothing to unlock: Carrito is free and Ko-fi
> is a link. Dropped with [SPEC-offer.md](./SPEC-offer.md). The one durable finding
> is worth keeping, because it constrains anything future: the current CSP
> (`script-src 'self'`, `connect-src 'self'`, `form-action 'none'`, `payment=()`)
> blocks every *embedded* payment integration while leaving top-level navigation
> alone, so linking out is the only route that needs no CSP change.

Module id: `entitlement` · Depends on: `offer` · Fourth in the monetization build order

Map: [CAPABILITY-MAP.md](./CAPABILITY-MAP.md) ·
Spec: [SPEC-offer.md](./SPEC-offer.md)

## Objective

Decide and implement **who has paid, and what unlocks for them**: purchase,
verification, persistence, and what happens when the device is offline. This is the
module the author asked about directly — *"check if auth changes are necessary for
the paywall."*

**The short answer, with the evidence below: no accounts are needed, and no backend
is needed.** The app needs *proof of possession*, not *identity*. That is a much
smaller thing than authentication, and it can be built without adding a single
runtime network request.

## The facts that constrain this, all verified in the repo

| Fact | Where | What it forces |
|---|---|---|
| `script-src 'self'` | `public/_headers` | A payment SDK cannot be loaded. No Stripe.js, no embedded widget |
| `connect-src 'self'` | `public/_headers` | A runtime verification call to any provider is blocked outright |
| `form-action 'none'` | `public/_headers` | A payment form POST is blocked |
| `frame-ancestors 'none'`, no `frame-src` → `default-src 'self'` | `public/_headers` | A hosted-checkout iframe is blocked |
| `Permissions-Policy: payment=()` | `public/_headers` | The Payment Request API is explicitly disabled, so Apple Pay / Google Pay are off |
| *"Auth / authz / rate limiting — N/A — by design. No accounts, no login, no server, no user data leaves the device"* | `docs/LAUNCH.md` | A documented, verified property. Any entitlement design that adds accounts or a server makes that document false |
| *"Keep all network access inside `scripts/`"* | `CAPABILITY-MAP.md`, Boundaries | A runtime verification call puts network access in `src/`, so the boundary must be amended deliberately |
| *"No runtime network requests other than product images"* | `README.md` | The same fact at the product level |
| Service-worker precache; opens with the network off | `docs/LAUNCH.md` | **A gate that needs the network breaks the app's headline property.** Entitlement must work offline |
| `dependencies: react, react-dom` only | `package.json` | Anything heavier is a new dependency, which this repo gates behind "ask first" |

Read together: **the current CSP forbids every standard payment integration, and the
app's own promises forbid a server.** Those two constraints point at the same
design.

## The design that satisfies all of them

Three separate concerns, only one of which is architectural:

**1. Taking the money — no CSP change needed.**
A plain link to a hosted payment page is *not* blocked by this CSP. CSP restricts
`form-action` (forms) and resource loads (`script-src`, `connect-src`, `frame-src`);
it does not restrict top-level navigation. So `target="_blank"` to a provider's
hosted page works under the current headers, and the buyer pays there, on the
provider's domain, with the provider's own security.

That is the difference that matters: **link out, don't embed.** Everything the CSP
blocks — SDK, iframe, form POST, Payment Request — is the embedded route.

**2. Proving the purchase — offline, by signature.**
The provider issues a **licence key** at purchase and emails it. The key carries a
signature from a keypair the author holds; the app ships the public key and verifies
the signature locally with WebCrypto. No request, no server, no account.

The alternative — verifying the key against a provider API — is the one design this
app cannot adopt without breaking `connect-src 'self'`, the offline promise, and the
"no network access outside `scripts/`" boundary at the same time.

**3. Remembering it — the cart's contract, not a session.**
The key is stored like the cart: browser-local, written through on change, and
degrading to "not purchased" rather than throwing when the stored value is corrupt
or missing. That contract already exists and is already tested in this repo; the
entitlement should reuse its shape rather than invent a second one.

## The limitation this design has, stated plainly

**A purely client-side gate cannot be made tamper-proof.** The verification code and
the public key both run on the user's machine, so a determined person can bypass the
check in devtools. There is no way around this without a server, and a server is
ruled out.

That is an acceptable trade for a one-time, low-price purchase — but it is a real
property and should be written down rather than discovered later. It also has a
design consequence: because the gate is honour-based, **the free tier must stay
genuinely useful**, so that the honest path is also the easy one. Enforcing a
breakable gate harshly buys nothing and costs goodwill.

## Acceptance criteria

1. A purchase completes without the app loading any third-party script, iframe or
   form, and **without any change to `public/_headers`** — verified against the
   current CSP, not assumed.
2. Verification happens with no network request, and the unlocked state survives a
   reload and works with the network off.
3. A corrupt, truncated or absent stored key degrades to "not purchased" without
   throwing — the same contract `loadCart` already honours.
4. No account, no email in the app, no server, no new runtime dependency.
5. The locked state never withholds something the free tier is documented as
   including; the gate unlocks only what `offer` says it unlocks.
6. `docs/LAUNCH.md` is updated in the same change: "no user data leaves the device"
   and "anyone with the URL can use it" stop being unconditionally true, and that
   document is precisely where such a claim is recorded.

## Commands

```
Tests:      npm test
Coverage:   npm run test:coverage      # src/lib carries the 90% floor
Typecheck:  npm run typecheck
Lint:       npm run lint
Build:      npm run build
```

## Project structure

```
src/lib/        → key verification + persistence (pure, testable, no network)
src/components/ → the one place the purchase link and key entry live
public/_headers → expected to be UNCHANGED, and that is an acceptance criterion
tests/          → a guard asserting the CSP still blocks third-party payment code
```

## Testing strategy

The signature check is pure and belongs in `src/lib` with exhaustive tests: a valid
key, a tampered payload, a wrong key, a truncated key, an empty string, and a
correctly-signed key for a different product. Persistence gets the same round-trip
and degradation tests the cart already has. A source-level guard asserts the app
never gains a provider script tag, in the spirit of `tests/network-hygiene.test.ts`.

## Boundaries

**Always** — keep verification offline; keep the failure mode "not purchased" rather
than an error; keep the free tier complete.

**Ask first** — amending `public/_headers`; choosing a payment provider; adding any
runtime dependency.

**Never** — add accounts or a server; add a runtime network call; claim the gate is
tamper-proof; let the gate break the app when the network is off.

## Open questions

1. **Which provider?** It must support licence keys and hosted pages. Not decided
   here, and it is the one choice that touches money rather than architecture.
2. **Is a breakable client-side gate acceptable?** The alternative is a server, which
   this app has refused by design. This spec argues yes for a one-time purchase, and
   it is the author's call.
3. **What happens on refund or dispute?** With no server there is no revocation.
   Either accepted, or the provider's own process handles it and the key simply
   stays valid — which should be a decision, not an oversight.
4. **Does the CSP need to change at all?** On this design, no — and if a future
   decision to embed checkout forces it, that is a security-posture change that
   belongs in the map's "invariants under review" table, not in a quiet header edit.
