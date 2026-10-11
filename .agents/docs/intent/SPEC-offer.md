# Spec: `offer`

> **Superseded 2026-10-11.** Carrito went free with a Ko-fi link, so there is no
> offer to price and no gate to build: this spec and `SPEC-entitlement.md` were both
> dropped. Kept rather than deleted because the *reasoning* still holds — the
> envelope finding that a paywall belongs on authored computation rather than on
> withheld data remains true, and would be the starting point if a gate ever comes
> back. The decision that retired it is in
> [INTENT-carrito.md](./INTENT-carrito.md).

Module id: `offer` · Depends on: `licensing` · Second in the monetization build order

Envelope: [ENVELOPE.md](../../docs/licensing/ENVELOPE.md) ·
Inventory: [inventory.json](../../data/licensing/inventory.json) ·
Map: [CAPABILITY-MAP.md](./CAPABILITY-MAP.md)

## Objective

Decide **what is sold, for how much, and what the promise is** — one payment, never
a subscription — so that the premium thing is an obvious yes rather than a
negotiation. This spec decides the offer. It does not build the gate; that is
`entitlement`.

The user is the author, deciding what to sell. Success is a single sentence that
names what a person gets for their money, and a price, and neither needs a
paragraph to defend.

## The constraint the envelope imposes, which comes first

The envelope answered its own question and the answer changes the order of work:

> **The premium feature is not the blocker. The catalogue's chain of title is.**
> Six of the ten rows are `unknown`, and five of them inherit from
> `underlying-catalog-data`.

So this spec **designs** the offer and cannot **ship** it. Nothing here permits
selling the app yet — that requires the Mercadona question to move, and it will
not move by choosing a different feature. The litmus demonstrated why: all three
candidate features land on the same row, because gating the cart rather than the
nutrition panel changes who receives the catalogue, not whether it may be
redistributed.

What this spec *can* do is avoid adding risk. The envelope shows the route:

| If the offer gates… | The rows it engages |
|---|---|
| the catalogue | `underlying-catalog-data`, `catalog-bundle` — `unknown` |
| Open Food Facts-derived fields | `off-derived-nutrition`, `enriched-db` — `safe-if`, and ODbL 4.7(b) attaches if the *data* is gated rather than the app |
| **authored computation over data that stays free** | `code`, `app-shell` — **`safe`** |

**Recommendation that follows from this: sell authored value, not withheld data.**
An offer built on computation the app performs — a report, a plan, an analysis —
engages only the `safe` rows and leaves the ODbL conditions untouched, because the
catalogue and the nutrition data stay publicly available exactly as they are today.

## Assumptions I am making

1. **One payment, no subscription.** Stated by the author: *"I really like 1
   payment only instead of SaaS monthly."* This is the hardest constraint here and
   it rules out anything with a marginal cost to serve: sync, accounts, cloud
   backup, server-side computation.
2. **No accounts.** The app has no auth, no backend and no user data leaving the
   device, and `docs/LAUNCH.md` records that as a deliberate verified property. A
   one-time purchase fits a licence key far better than it fits accounts, so
   `entitlement` should not need to introduce accounts at all.
3. **The free experience must stay genuinely useful.** The app's growth comes from
   people showing it to people. A free tier that is a hollow shell kills that, and
   a one-time price already caps revenue, so word of mouth is the only thing
   buying distribution.
4. **Price is not decided here.** The spec fixes what is sold and the shape of the
   price (one-off); the number is an open question below.

## Selection criteria for "an absolute yes"

A feature earns a one-time payment without hesitation when it is:

1. **Obvious before purchase.** The value is legible in one sentence, ideally in
   the app's own UI, without a demo or a trial.
2. **Additive, not subtracted.** Something gained, rather than something the app
   conspicuously withholds. Withholding reads as a hostage situation and the
   author pays for it in word of mouth.
3. **A one-off by nature.** Its value does not depend on ongoing service, which is
   what makes a single payment honest rather than a trick.
4. **Deliverable with no backend.** Anything else contradicts assumption 2 and
   costs money per user, which a one-time price cannot fund.
5. **Legally cheap.** It should not engage the `unknown` rows beyond what shipping
   the app already engages, and should not gate the data.

## Candidates

| Candidate | What it is | Obvious | Additive | One-off | No backend | Legally cheap |
|---|---|---|---|---|---|---|
| **A. Whole-app access** | One payment, everything unlocked | ✅ | ❌ free tier becomes nothing | ✅ | ✅ | ❌ gates the data |
| **B. The insight layer** | Nutrition panels and ranked swaps behind the gate; browse, search and cart free | ✅ | ❌ | ✅ | ✅ | ⚠️ gates `safe-if` rows |
| **C. The basket report** | One payment unlocks a computed, authored analysis of the current list — what it costs you nutritionally, where the ultra-processed weight sits, what to swap — as something you can keep or share | ✅ | ✅ | ✅ | ✅ | ✅ `safe` rows only |
| **D. Saved lists / trip presets** | More than one list | ✅ | ✅ | ✅ | ✅ | ⚠️ weak value, and bags a feature people expect free |

Candidate **C** is the recommendation, and it is the one the envelope points at: it
is a computed artifact rather than withheld data, it needs no server, it is
naturally one-off — a report is a thing you have, not a subscription — and it
showcases the app's actual differentiator (the nutrition and processing work)
without hiding the searchable catalogue that makes the app usable.

Candidate **A** is the tempting one and the worst one: it is the clearest possible
tax on the people most likely to recommend the app, it makes the free tier
incoherent, and it is the only candidate that gates the *data*, which is precisely
what ODbL 4.7(b) makes conditional.

## Acceptance criteria

1. The offer is expressible as one sentence naming what the buyer gets, with no
   reference to what non-buyers lose.
2. Whatever is sold is computed or authored in the app: no request leaves the
   device to deliver it, and no account is created.
3. The free experience remains complete for the app's stated purpose — searching
   the catalogue, knowing what is in a product, and building a list for the trip.
4. The catalogue and the Open Food Facts-derived data remain publicly available
   exactly as they are today, so gating the offer never gates the data and ODbL
   4.7(b) is not engaged.
5. The price, whatever it is, is framed once and never as recurring.
6. The offer survives the friend test: it can be explained in a corridor without
   describing a pricing model.

## Commands

```
Tests:      npm test
Focused:    npx vitest run src/app/CartScreen.test.tsx   # the screen the report would extend
Typecheck:  npm run typecheck
Lint:       npm run lint
Build:      npm run build
```

## Project structure

```
src/lib/        → the computation (pure, testable, no React, no network)
src/app/        → the screen that presents it
docs/licensing/ → the envelope this offer must stay inside
```

## Code style

The computation is a pure function in `src/lib`, in the shape the repo already
uses — data in, data out, no fetching, no React:

```ts
export function basketReport(
  items: readonly CartItem[],
  catalog: readonly EnrichedCatalogProduct[],
  nutrition: NutritionIndex,
): BasketReport {
  // ...
}
```

Every figure it renders carries its unit and its source, as everywhere else in
this app. Where a value is unknown it says so — a report that invents a number to
look complete would contradict the app's founding rule.

## Testing strategy

Vitest. The computation is exhaustive unit tests in `src/lib` (it is pure, so every
edge case is cheap to pin, and `src/lib` carries the 90 % coverage floor). The
presentation is a component test. Nothing here needs a network or a browser pass
beyond the existing ones.

## Boundaries

**Always** — keep the catalogue and the nutrition data free and public; keep every
figure labelled with its unit and its source; keep `unknown` honest in the report
as everywhere else.

**Ask first** — the price; changing what the free tier includes; anything that
would introduce a runtime network request.

**Never** — introduce accounts or a server to deliver the offer; gate the data
itself; describe the price as recurring; degrade the free experience to make the
paid one look better.

## Open questions

1. **The decision itself: C, or something else?** This spec recommends the basket
   report and does not decide it. Everything downstream is cheap to redo if the
   recommendation is wrong, which is exactly why it is written down rather than
   assumed.
2. **The price.** A number, chosen by the author, not derived here.
3. **What the report contains.** It should say something the app can actually
   support — the app's own measurement is that kcal is available for ~46 % of the
   catalogue and NOVA for ~36 %, so the report must be honest about its own gaps
   rather than implying completeness.
4. **Whether the offer can ship at all** is not this module's question, but it
   gates the whole module: it is answered by the Mercadona rows in the envelope.
