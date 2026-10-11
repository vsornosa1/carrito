# Spec: `licensing`

Module id: `licensing` · Depends on: nothing · Third initiative (after Trip order)

Intent: [INTENT-monetization.md](./INTENT-monetization.md)

## Scope check (Phase 0)

**Skipped, deliberately.** This is one capability — produce the envelope — not
several independently shippable ones. The inventory, the obligations and the
per-layer verdicts are three *sections of one document*, not three modules: none
can ship without the others, none has its own consumer, and cutting one would
require rewriting the rest. If the verdicts turn out to split cleanly while
writing the map (e.g. "code" and "data" share no obligation at all), *that* is
the moment to come back and propose a capability map — not before.

## Objective

Answer, per layer of the app, whether it may be charged for and what obligation
follows — with the clause that decides — so a premium feature can be chosen
inside the lines rather than discovered against a wall after it is built.

The user is me, before any paid feature exists. Success is that for any proposed
premium feature I can say *safe / not safe / safe-if-X* and point at the clause.

**Not legal advice.** The deliverable is a map with citations, explicitly framed
as something to take to someone qualified. No section may read as an opinion on
enforceability.

**Scope boundary — carrito only.** Added 2026-10-11 when the monetization
capability map was approved ([CAPABILITY-MAP.md](./CAPABILITY-MAP.md)). A second
retailer (`aldi-data`) needs its **own** row set: the source, its licence and the
trademark all change, and a verdict borrowed from this envelope would be wrong.
This envelope's rows are not reusable across retailers, and the guard test is
scoped accordingly.

## Assumptions this rests on

1. **Jurisdiction is Spain/EU.** Sui generis database rights exist in the EU and
   they matter here; a US-only reading of ODbL gives a different answer. If the
   app will be offered outside the EU, say so — it changes the obligations, not
   just the wording.
2. **"Distributed" means committed and shipped.** `public/catalog/products.json`
   and `data/enriched/enriched.json` are committed on purpose (`.gitignore` says
   so); `data/raw/` and `data/cache/` are not; `dist/` is not committed.
3. **Photos are hotlinked, not redistributed.** The app serves Mercadona imgix
   URLs and the image bytes never enter the repo. That is a different question
   from the catalogue data, so it gets its own row.
4. **The repo has no `LICENSE` file**, and `package.json` is `"private": true`.
   The code is mine to license; the map records this rather than treating it as
   a gap to fill.
5. **The commercial model is unknown** ("a premium feature not yet discovered"),
   so the map is model-agnostic: it says what a layer *permits*, not what a
   price should be.
6. **In scope: data licences and trademark.** Out: patents, competition law,
   consumer law, tax, and the enforceability of any of it.

## Deliverable

Three artifacts, all versioned:

| Artifact | What it is |
|---|---|
| `docs/licensing/ENVELOPE.md` | The human-readable map: one section per layer, each ending in a verdict and the clause that decides it. |
| `data/licensing/inventory.json` | The machine-checkable inventory: every distributed artifact and every upstream source, with its licence, its obligations, and where it lands in the app. |
| `tests/licensing.test.ts` | The guard: fails if the inventory drifts from what the repo actually contains. |

## Verdict vocabulary

Fixed, because a verdict in free text cannot be checked or compared:

```
safe       — charging for this layer is compatible with the licences as written
safe-if-X  — compatible once obligation X is met (X is named, never implied)
not-safe   — a licence term or a trademark right is incompatible with charging
unknown    — provenance genuinely unresolved; the row must say what resolves it
```

`unknown` is a valid and expected answer, and must not be softened — the app
already works this way (`unknown` beats a confident guess; see
[INTENT-trip-order.md](./INTENT-trip-order.md)). Every verdict carries a `basis`
citing a document plus clause. **No verdict without a basis.**

## Rows the inventory must cover

One row per thing that is distributed or relied upon:

| Row id | Why it is here |
|---|---|
| `code` | The TypeScript/React source and its dependencies |
| `app-shell` | Authored copy, icons, PWA manifest |
| `mirror` | `datania/mercadona-catalog` — what its MIT actually covers |
| `underlying-catalog-data` | Names, prices, categories, ingredients — Mercadona's |
| `catalog-bundle` | `public/catalog/products.json` — the mirror's data, shipped |
| `photos` | imgix URLs hotlinked at runtime, bytes never redistributed |
| `trademark` | "Mercadona" in the app name, icon and copy |
| `enriched-db` | `data/enriched/enriched.json` — the commit-time OFF join |
| `off-derived-nutrition` | The numeric fields and `nova_group`/`additives_tags` inside the shipped bundle |
| `off-api-terms` | The terms the build-time API calls were made under |

## Commands

```
Build:      npm run build
Audit test: npx vitest run tests/licensing.test.ts
Full suite: npm test
Typecheck:  npm run typecheck
Lint:       npm run lint
```

## Project structure

```
docs/licensing/ENVELOPE.md      → the map (new)
data/licensing/inventory.json   → the table the guard reads (new)
tests/licensing.test.ts         → the guard (new; beside tests/network-hygiene.test.ts,
                                   which is where a repo-wide audit assertion already lives)
```

## Code style

The inventory is **data, not prose**, and it follows the repo's existing
precedent: a table in code that a test reads, and that fails when it drifts from
reality — the same shape as the section→zone table verified against all 4,330
products.

```ts
// shape of data/licensing/inventory.json
interface LicenceRow {
  id: string;                                        // stable, kebab-case, never renamed
  kind: 'artifact' | 'source' | 'right';
  licence: string | null;                            // null only when genuinely unknown
  verdict: 'safe' | 'safe-if' | 'not-safe' | 'unknown';
  requires: readonly string[];                       // e.g. ['attribution', 'share-alike']
  covers: readonly string[];                         // committed paths this row accounts for
  fields: readonly string[];                         // leaf paths inside a covered file, e.g. 'nutrition.per100.kcal'
  basis: string;                                     // document + clause; never empty
  note?: string;                                     // only when the row needs a caveat
}
```

`covers` was added 2026-10-11, when Task 2 was implemented: "every committed file
maps to exactly one row" needs a mechanism, and the association belongs in the
inventory rather than in the test, so that reading the inventory tells you what a
row accounts for. A row that accounts for no committed file carries `[]` — which
is most of them, and is not a gap. Note the two different granularities:
`catalog-bundle` covers the **file** `public/catalog/products.json`, while
`off-derived-nutrition` covers **fields inside** that same file and therefore lists
no path at all. Two rows must never claim the same file.

`fields` was added the same day, for Task 3, and deliberately has a **looser** rule
than `covers`: a field may be claimed by **more than one** row. A file has one
identity, so exactly-one is right for it; a *value* can be derived from two sources
at once, and pretending otherwise would make the envelope lie. `nutrition.additives`
is the case in point — normalised E-numbers come from Open Food Facts'
`additives_tags` **and** from our parse of Mercadona's ingredient text, so both rows
claim it. Forcing a single claimant would have meant picking whichever source looked
tidy, which is exactly the kind of convenient reading this envelope exists to
refuse.

## Testing strategy

Vitest, in `tests/licensing.test.ts`, run against the real repo rather than
fixtures — the same reason `zones.test.ts` asserts against the whole catalogue:

1. Every committed file under `public/catalog/` and `data/enriched/` maps to
   exactly one inventory row — no artifact silently outside the envelope. The
   mapping is each row's `covers` list, and the guard asserts both directions: no
   committed file unclaimed, and no row claiming a file that is not there.
   Coverage is deliberately scoped to those two directories — the redistributed
   data. Enumerating the source tree would add hundreds of paths that no licence
   question turns on, and a guard that noisy stops being read. `data/raw/` and
   `data/cache/` are skipped because they are gitignored, and the guard asserts
   that ignores them so the exclusion cannot become accidental.
2. Every row has a non-empty `basis`, and every `verdict` is from the fixed
   vocabulary; an unknown verdict string fails.
3. Every field the bundle actually ships under `nutrition` and `processing` is
   claimed by at least one row, so a new field cannot be added to the bundle
   without the envelope noticing. This claim is **one-way on purpose**: a field
   may be absent from an entire bundle without anything being wrong (`offCode`
   exists only where Open Food Facts matched), so a declared-but-absent field is
   not a failure while a present-but-unclaimed one is.

   Corrected 2026-10-11 when Task 3 was implemented: the spec originally said
   every such field was covered by `off-derived-nutrition`, which is not true of
   the block as built. `processing.basis`, `processing.tier` and
   `processing.additiveMarkers` are **ours**, derived from Mercadona's ingredient
   text, and `nutrition.additives` is fed by both sources. Attributing all of it
   to Open Food Facts would have been the false-claim version of an envelope,
   which is the failure this whole module is meant to prevent.
4. The `attribution` obligation is satisfiable in fact: the app renders the
   credit (`Fuente: Open Food Facts` in `src/components/NutritionPanel.tsx`),
   asserted so a redesign cannot drop it while the envelope still claims it.
5. Fails if the inventory drifts from the repo.

## Boundaries

**Always** — cite a clause for every verdict; keep `unknown` honest; keep the
OFF attribution visible in the UI; keep the "not legal advice" framing on the
document.

**Ask first** — changing a recorded verdict; adding a second nutrition source;
changing what is committed and therefore distributed.

**Never** — state an opinion on enforceability or the outcome of a dispute;
present `unknown` as safe; remove the OFF attribution; let a paywall ship in the
same change as this spec (the intent puts paywall implementation out of scope).

## Success criteria

1. Any proposed premium feature can be placed against the envelope and given
   safe / safe-if / not-safe with a cited clause, without re-opening the
   research.
2. Every artifact the repo commits is covered by exactly one row, and the guard
   fails if one is added without a row.
3. The OFF-derived fields in `public/catalog/products.json` are individually
   accounted for, field by field.
4. The envelope names the one question it could not settle — the mirror's MIT
   versus the underlying data — and what would settle it.
5. The document states plainly that it is not legal advice, and lists what a
   lawyer would need to see to answer it properly.

## Open questions

1. **Does the mirror's MIT extend to the data (Mercadona's) or only to the
   mirror's packaging?** This is the load-bearing question. The envelope answers
   `unknown` plus what would resolve it unless a source settles it — it does not
   pick the convenient reading.
2. **Hotlinking versus redistribution for the photos.** Whether gating changes
   whether hotlinking counts as "use" is for the envelope to state, not to guess.
3. **Is jurisdiction really Spain/EU, and is the app offered outside it?**
   Changes the sui generis database-rights reading.
4. **Does the paywall gate access to the *database* or to the *app*?** ODbL's
   share-alike attaches to a distributed Derivative Database; this decides
   whether `off-derived-nutrition` is `safe` or `safe-if`. It cannot be resolved
   now — the feature is not chosen — so the envelope records both branches.
5. **Should `CAPABILITY-MAP.md` gain a third initiative entry for this?** The map
   is approved and gated; adding to it is a human decision, not an implementation
   detail, so this spec does not edit it.
