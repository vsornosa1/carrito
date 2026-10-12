# Task list: licensing envelope

Archived 2026-10-12, when the joint-session plan took over `tasks/plan.md`. The
implementation is complete; the three open checkboxes are **human reviews only**
(deferred, not abandoned). Not superseded, just no longer the active plan.

Plan: [licensing-plan.md](./licensing-plan.md) · Intent: [INTENT-monetization.md](../../.agents/docs/intent/INTENT-monetization.md) · Spec: [SPEC-licensing.md](../../.agents/docs/intent/SPEC-licensing.md)

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
- [x] The test reads `public/catalog/products.json` and enumerates the
      nutrition and processing fields actually present — 15 leaf paths
- [x] Every such field is claimed by at least one inventory row
      (**corrected**: the criterion originally said all of them were covered by
      `off-derived-nutrition`, which is not true of the block as built — see the
      note below)
- [x] A fabricated new OFF-sourced field makes the test fail
- [x] The attribution obligation is asserted to be satisfiable in fact: the app
      renders `Fuente: Open Food Facts`, so a redesign cannot drop it while the
      envelope still claims it

**Verification:**
- [x] `npx vitest run tests/licensing.test.ts` — 17 passed
- [x] Probe: `nutrition.per100.omega3` injected into a real product, guard failed
      naming that exact path, bundle restored byte-exact from git

**Note:** the original criterion — every field covered by `off-derived-nutrition` —
turned out to be false and was corrected in the spec before implementing.
`processing.basis`, `processing.tier` and `processing.additiveMarkers` are **ours**,
derived from Mercadona's ingredient text, and `nutrition.additives` is fed by Open
Food Facts' `additives_tags` *and* by our parse of Mercadona's ingredients. So that
one field is claimed by two rows, which is why the `fields` rule is at-least-one
while the `covers` rule stays exactly-one.

**Dependencies:** Task 1

**Files likely touched:** `tests/licensing.test.ts`

**Estimated scope:** Small

## Checkpoint: After Tasks 1-3

- [x] `npx vitest run tests/licensing.test.ts` green — 17 tests
- [x] The guard has been seen to fail on a deliberate drift, not merely to pass —
      probed twice: a file added under `public/catalog/`, and a field injected
      into the bundle. Both reverted; the bundle restored byte-exact.
- [x] No `src/` file imports the inventory — verified, zero matches

## Task 4: The ODbL layer

**Description:** The layer most likely to change the answer, so it goes first.
`enriched-db`, `off-derived-nutrition` and `off-api-terms`, each with the clause
that decides it.

**Acceptance criteria:**
- [x] The ODbL obligations that matter are named: attribution, share-alike on a
      Derivative Database, no additional restrictions on redistribution, and the
      source-offer requirement
- [x] The distinction between *using* the database and *distributing* a
      Derivative Database is drawn explicitly, and mapped onto what this repo
      commits
- [x] Both branches of the gate-the-database / gate-the-app question are recorded
      with their differing verdicts
- [x] Every claim cites the licence text and clause, fetched rather than recalled

**Verification:**
- [x] `npx vitest run tests/licensing.test.ts` — 17 passed
- [x] `docs/licensing/ENVELOPE.md` section 2 reads as quotations with clause
      numbers, not paraphrase

**Note:** the finding that changed the shape of this module — **ODbL 4.7(b)** and
**4.7(c)**. 4.7(c) permits a paywall by name ("behind a password"), and 4.7(b)
makes it conditional on also offering a copy "without additional fee". So
share-alike does not forbid charging; it requires the data to stay free.

**Dependencies:** Tasks 1, 2, 3

**Files likely touched:** `data/licensing/inventory.json`, `docs/licensing/ENVELOPE.md`

**Estimated scope:** Medium

## Task 5: The Mercadona layer

**Description:** `mirror`, `underlying-catalog-data`, `catalog-bundle`, `photos`
and `trademark` — the rows where the provenance is genuinely unsettled, and the
one row that is a right rather than a licence.

**Acceptance criteria:**
- [x] The mirror's MIT is stated for exactly what it covers; whether it reaches
      the underlying data is `unknown` and the row names what would settle it
- [x] Hotlinking is separated from redistribution, and whether gating changes the
      analysis is stated rather than guessed
- [x] The trademark row states the exposure and where the name and imagery are
      used, without asserting an outcome
- [x] No row takes the convenient reading of an ambiguous licence

**Verification:**
- [x] `npx vitest run tests/licensing.test.ts` — 17 passed
- [ ] Human review of the two `unknown` rows — **deferred to the morning**;
      the author said to finish unattended, so this is the one criterion in this
      task left open on purpose

**Note:** the mirror's `LICENSE` text was read, not assumed. It is standard MIT
over *"this software and associated documentation files (the 'Software')"*,
copyright 2025 David Gasquez — and the repo ships a scraper. That is what turns
the dataset card's bare `license: mit` into an `unknown` rather than a `safe`.

**Dependencies:** Tasks 1, 2, 3

**Files likely touched:** `data/licensing/inventory.json`, `docs/licensing/ENVELOPE.md`

**Estimated scope:** Medium

## Task 6: The authored layer

**Description:** `code` and `app-shell` — the part that is mine, including the
finding that there is no `LICENSE` file and `package.json` is `"private": true`.

**Acceptance criteria:**
- [x] The row records that the repo is currently unlicensed and that this is a
      deliberate state to confirm, not an oversight to fix silently
- [x] Third-party dependencies are accounted for as a class, with the licence
      surface stated and the tool that reports it named — react and react-dom,
      both MIT, read from their own manifests; the 20 devDependencies are
      build-only and not redistributed; `npx license-checker` named as what would
      enumerate every transitive licence, and explicitly not run
- [x] The verdict reflects that authored code is the author's to license

**Verification:**
- [x] `npx vitest run tests/licensing.test.ts` — 17 passed

**Dependencies:** Tasks 1, 2, 3

**Files likely touched:** `data/licensing/inventory.json`, `docs/licensing/ENVELOPE.md`

**Estimated scope:** Small

## Checkpoint: After Tasks 4-6

- [x] Every row has a verdict and a non-empty `basis`
- [x] Every `unknown` names what would resolve it
- [ ] Review with the human before the document is written — **overridden by
      explicit instruction**: the author said to finish the rest unattended, so
      the document was written and the review moves to the morning

## Task 7: The envelope document

**Description:** `docs/licensing/ENVELOPE.md` — the map a person reads: one
section per layer, each ending in a verdict and the clause that decides it.

**Acceptance criteria:**
- [x] One section per layer, in risk order, each ending in a verdict plus its
      clause
- [x] The document states plainly that it is not legal advice
- [x] It lists what a lawyer would need to see to answer properly
- [x] There is a summary table of every row, so the whole envelope is visible
      without reading the sections
- [x] No sentence asserts enforceability or predicts a dispute's outcome

**Verification:**
- [ ] Human review of the document — **deferred to the morning** (`docs/licensing/ENVELOPE.md`)
- [x] `npx vitest run tests/licensing.test.ts` — 17 passed

**Dependencies:** Tasks 4, 5, 6

**Files likely touched:** `docs/licensing/ENVELOPE.md`

**Estimated scope:** Medium

## Task 8: The litmus

**Description:** The real acceptance test of the deliverable: take three
plausible premium features and place each against the envelope without
re-opening the research.

**Acceptance criteria:**
- [x] Three features are run through: the nutrition/swaps insight layer, the
      cart and trip-order layer, and whole-app access
- [x] Each gets `safe` / `safe-if-X` / `not-safe` with the clause that decides it
- [x] A feature that lands on `unknown` says so, and says what would move it
- [x] Running the litmus requires no new research — if it does, the envelope is
      incomplete and the task says which row is missing

**Verification:**
- [x] `npx vitest run tests/licensing.test.ts` — 17 passed
- [ ] Human review: can a feature be placed without asking a follow-up question? —
      **deferred to the morning**

**Note:** the litmus produced a result worth more than three verdicts. All three
features land on the *same* row — `underlying-catalog-data` — because gating the
cart rather than the nutrition panel changes who receives the catalogue, not
whether it may be redistributed. So **the feature choice does not move the
answer.** Only one thing distinguishes the features: whether the gate sits on the
app or on the data, which decides whether ODbL 4.7(b) attaches.

**Dependencies:** Task 7

**Files likely touched:** `docs/licensing/ENVELOPE.md`

**Estimated scope:** Small

## Checkpoint: After Task 8

- [x] A proposed feature can be given a verdict without re-opening the research

## Task 9: Verification

**Description:** Prove the guard is a guard — that it fails — and take the repo
to green.

**Acceptance criteria:**
- [x] A deliberately removed row fails the test, observed and then reverted —
      `photos` removed, guard reported the missing id, restored to 10 rows from a
      local backup (**not** `git checkout`, which would have reverted the
      researched rows)
- [x] A deliberately added OFF-sourced field fails the test, observed and then
      reverted — `nutrition.per100.omega3` injected, caught by exact path,
      bundle restored byte-exact
- [x] `npm test`, `npm run typecheck`, `npm run lint`, `npm run build` all green —
      548 tests
- [x] `git status` shows no stray artifact left by the deliberate-drift checks —
      no probe files, no backups

**Verification:**
- [x] `npm test` — 548 passed; `npm run typecheck`, `npm run lint`,
      `npm run build` all clean

**Dependencies:** Tasks 1-8

**Files likely touched:** `tests/licensing.test.ts`

**Estimated scope:** Small

## Checkpoint: Complete

- [x] Every acceptance criterion met
- [x] The envelope names the question it could not settle, and what would settle it
- [ ] Reviewed by the human, merged — **open**: three reviews are deferred to the
      morning by explicit instruction, and nothing is merged

## Where this stopped

Tasks 1-9 are implemented and committed. What remains is not implementation:

1. **Three human reviews**, deliberately deferred: the two `unknown` Mercadona
   rows, the document, and the litmus.
2. **The `[Sin publicar]` changelog entry** for the ConfirmDialog feature —
   still unwritten, because describing the author's own feature is the author's
   call.
3. **None of it is merged**, and no branch was cut; the work sits on `main` in
   four commits.

The envelope's own answer, recorded so the morning does not have to re-derive it:
**the premium feature is not the blocker — the catalogue's chain of title is.**
Six of ten rows are `unknown` and five of them inherit from
`underlying-catalog-data`.
