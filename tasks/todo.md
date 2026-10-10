# Task list: licensing envelope

Plan: [plan.md](./plan.md) · Intent: [INTENT-monetization.md](../.agents/docs/intent/INTENT-monetization.md) · Spec: [SPEC-licensing.md](../.agents/docs/intent/SPEC-licensing.md)

Boundary: this work draws the envelope. It does not build a paywall, set a
price, or state whether any licence term is enforceable. Nothing here changes
what the app does.

## Task 1: The row contract and the ten rows

**Description:** `data/licensing/inventory.json` — the ten rows the envelope
rests on, in the shape the guard reads. Types and vocabulary are enforced by
test, not by convention.

**Acceptance criteria:**
- [x] The file holds one row per id in the spec's table: `code`, `app-shell`,
      `mirror`, `underlying-catalog-data`, `catalog-bundle`, `photos`,
      `trademark`, `enriched-db`, `off-derived-nutrition`, `off-api-terms`
- [x] Each row has `id`, `kind`, `licence`, `verdict`, `requires`, `basis`
- [x] Every `verdict` is one of exactly `safe`, `safe-if`, `not-safe`, `unknown`
- [x] Every `basis` is non-empty, and every `unknown` names what would resolve it
- [x] Until Tasks 4-6 land, every verdict is `unknown` — seeded rows assert nothing
      and carry what would resolve them, so no verdict ever precedes its evidence
- [x] Ids are unique, kebab-case, and stable

**Verification:**
- [x] `npx vitest run tests/licensing.test.ts` — 9 passed

**Dependencies:** None

**Files likely touched:** `data/licensing/inventory.json`, `tests/licensing.test.ts`

**Estimated scope:** Small

## Task 2: The completeness guard

**Description:** Every artifact the repo commits and therefore distributes maps
to exactly one row, so a new committed artifact cannot enter the envelope
silently.

**Acceptance criteria:**
- [x] Every committed file under `public/catalog/` maps to exactly one row
- [x] Every committed file under `data/enriched/` maps to exactly one row
- [x] `data/raw/` and `data/cache/` are **not** required to map — they are
      gitignored, and the test says so rather than leaving it implicit
- [x] Adding a committed file under either directory without a row fails the test

**Verification:**
- [x] `npx vitest run tests/licensing.test.ts` — 14 passed
- [x] Probe: `public/catalog/__drift-probe.json` added, guard failed naming that
      exact file, probe removed

**Note:** the row contract gained `covers` for this, which is a data-model change,
so [SPEC-licensing.md](../.agents/docs/intent/SPEC-licensing.md) was updated first.

**Dependencies:** Task 1

**Files likely touched:** `tests/licensing.test.ts`

**Estimated scope:** Small

## Task 3: The OFF-fields guard

**Description:** The nutrition fields the bundle actually ships are accounted
for individually, so a new Open Food Facts-sourced field cannot be added to the
bundle without the envelope noticing.

**Acceptance criteria:**
- [ ] The test reads `public/catalog/products.json` and enumerates the
      nutrition and processing fields actually present
- [ ] Every such field is covered by the `off-derived-nutrition` row
- [ ] A fabricated new OFF-sourced field makes the test fail
- [ ] The attribution obligation is asserted to be satisfiable in fact: the app
      renders `Fuente: Open Food Facts`, so a redesign cannot drop it while the
      envelope still claims it

**Verification:**
- [ ] `npx vitest run tests/licensing.test.ts`

**Dependencies:** Task 1

**Files likely touched:** `tests/licensing.test.ts`

**Estimated scope:** Small

## Checkpoint: After Tasks 1-3

- [ ] `npx vitest run tests/licensing.test.ts` green
- [ ] The guard has been seen to fail on a deliberate drift, not merely to pass
- [ ] No `src/` file imports the inventory

## Task 4: The ODbL layer

**Description:** The layer most likely to change the answer, so it goes first.
`enriched-db`, `off-derived-nutrition` and `off-api-terms`, each with the clause
that decides it.

**Acceptance criteria:**
- [ ] The ODbL obligations that matter are named: attribution, share-alike on a
      Derivative Database, no additional restrictions on redistribution, and the
      source-offer requirement
- [ ] The distinction between *using* the database and *distributing* a
      Derivative Database is drawn explicitly, and mapped onto what this repo
      commits
- [ ] Both branches of the gate-the-database / gate-the-app question are recorded
      with their differing verdicts
- [ ] Every claim cites the licence text and clause, fetched rather than recalled

**Verification:**
- [ ] `npx vitest run tests/licensing.test.ts`
- [ ] `docs/licensing/ENVELOPE.md` section reads as citations, not paraphrase

**Dependencies:** Tasks 1, 2, 3

**Files likely touched:** `data/licensing/inventory.json`, `docs/licensing/ENVELOPE.md`

**Estimated scope:** Medium

## Task 5: The Mercadona layer

**Description:** `mirror`, `underlying-catalog-data`, `catalog-bundle`, `photos`
and `trademark` — the rows where the provenance is genuinely unsettled, and the
one row that is a right rather than a licence.

**Acceptance criteria:**
- [ ] The mirror's MIT is stated for exactly what it covers; whether it reaches
      the underlying data is `unknown` and the row names what would settle it
- [ ] Hotlinking is separated from redistribution, and whether gating changes the
      analysis is stated rather than guessed
- [ ] The trademark row states the exposure and where the name and imagery are
      used, without asserting an outcome
- [ ] No row takes the convenient reading of an ambiguous licence

**Verification:**
- [ ] `npx vitest run tests/licensing.test.ts`
- [ ] Human review of the two `unknown` rows

**Dependencies:** Tasks 1, 2, 3

**Files likely touched:** `data/licensing/inventory.json`, `docs/licensing/ENVELOPE.md`

**Estimated scope:** Medium

## Task 6: The authored layer

**Description:** `code` and `app-shell` — the part that is mine, including the
finding that there is no `LICENSE` file and `package.json` is `"private": true`.

**Acceptance criteria:**
- [ ] The row records that the repo is currently unlicensed and that this is a
      deliberate state to confirm, not an oversight to fix silently
- [ ] Third-party dependencies are accounted for as a class, with the licence
      surface stated and the tool that reports it named
- [ ] The verdict reflects that authored code is the author's to license

**Verification:**
- [ ] `npx vitest run tests/licensing.test.ts`

**Dependencies:** Tasks 1, 2, 3

**Files likely touched:** `data/licensing/inventory.json`, `docs/licensing/ENVELOPE.md`

**Estimated scope:** Small

## Checkpoint: After Tasks 4-6

- [ ] Every row has a verdict and a non-empty `basis`
- [ ] Every `unknown` names what would resolve it
- [ ] Review with the human before the document is written

## Task 7: The envelope document

**Description:** `docs/licensing/ENVELOPE.md` — the map a person reads: one
section per layer, each ending in a verdict and the clause that decides it.

**Acceptance criteria:**
- [ ] One section per layer, in risk order, each ending in a verdict plus its
      clause
- [ ] The document states plainly that it is not legal advice
- [ ] It lists what a lawyer would need to see to answer properly
- [ ] There is a summary table of every row, so the whole envelope is visible
      without reading the sections
- [ ] No sentence asserts enforceability or predicts a dispute's outcome

**Verification:**
- [ ] Human review of the document
- [ ] `npx vitest run tests/licensing.test.ts`

**Dependencies:** Tasks 4, 5, 6

**Files likely touched:** `docs/licensing/ENVELOPE.md`

**Estimated scope:** Medium

## Task 8: The litmus

**Description:** The real acceptance test of the deliverable: take three
plausible premium features and place each against the envelope without
re-opening the research.

**Acceptance criteria:**
- [ ] Three features are run through: the nutrition/swaps insight layer, the
      cart and trip-order layer, and whole-app access
- [ ] Each gets `safe` / `safe-if-X` / `not-safe` with the clause that decides it
- [ ] A feature that lands on `unknown` says so, and says what would move it
- [ ] Running the litmus requires no new research — if it does, the envelope is
      incomplete and the task says which row is missing

**Verification:**
- [ ] `npx vitest run tests/licensing.test.ts`
- [ ] Human review: can a feature be placed without asking a follow-up question?

**Dependencies:** Task 7

**Files likely touched:** `docs/licensing/ENVELOPE.md`

**Estimated scope:** Small

## Checkpoint: After Task 8

- [ ] A proposed feature can be given a verdict without re-opening the research

## Task 9: Verification

**Description:** Prove the guard is a guard — that it fails — and take the repo
to green.

**Acceptance criteria:**
- [ ] A deliberately removed row fails the test, observed and then reverted
- [ ] A deliberately added OFF-sourced field fails the test, observed and then
      reverted
- [ ] `npm test`, `npm run typecheck`, `npm run lint`, `npm run build` all green
- [ ] `git status` shows no stray artifact left by the deliberate-drift checks

**Verification:**
- [ ] `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`

**Dependencies:** Tasks 1-8

**Files likely touched:** `tests/licensing.test.ts`

**Estimated scope:** Small

## Checkpoint: Complete

- [ ] Every acceptance criterion met
- [ ] The envelope names the question it could not settle, and what would settle it
- [ ] Reviewed by the human, merged
