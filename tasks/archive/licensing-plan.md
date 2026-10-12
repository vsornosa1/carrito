# Implementation Plan: licensing envelope

Archived 2026-10-12, when the joint-session plan took over `tasks/plan.md`. Built
and verified; the three unchecked items are human reviews deferred, not work left
undone.

Task list: [licensing-todo.md](./licensing-todo.md)

## Overview

Draw the boundary the premium feature has to live inside. Before anything is
charged for, establish — per layer of the app — whether that layer *may* be
charged for, what obligation follows if it may, and the clause that decides it.
The output is a map with citations, made durable by a guard test that fails when
it drifts from what the repo actually distributes.

Intent: [INTENT-monetization.md](../../.agents/docs/intent/INTENT-monetization.md) ·
Spec: [SPEC-licensing.md](../../.agents/docs/intent/SPEC-licensing.md)

## Architecture Decisions

- **The envelope is data, not prose.** `data/licensing/inventory.json` holds the
  rows; `tests/licensing.test.ts` is the guard. A prose answer rots silently; a
  table with a guard fails when a new distributed artifact appears without a
  verdict. Same shape as the section→zone table proved against all 4,330
  products.
- **The audit does not ship.** Nothing under `src/` imports the inventory, and no
  app behaviour changes. The envelope is build- and test-time only, so it adds
  nothing to the bundle and cannot accidentally become a runtime dependency.
- **Verdicts are a fixed vocabulary, and each carries a `basis`.** `safe` /
  `safe-if-X` / `not-safe` / `unknown`, with `X` named. No verdict without a
  citation, enforced by the test rather than by discipline.
- **`unknown` is first-class and is not softened.** The mirror's MIT question is
  the load-bearing one, and the honest answer may well be `unknown` plus what
  would resolve it. The app already works this way — a confident guess is never
  preferred to a stated gap.
- **Research order follows risk, not document order.** ODbL is the layer most
  likely to change the answer, so it is researched first. If it turns out to
  forbid charging behind the nutrition layer, that is cheaper to learn now than
  after a feature exists.
- **The unresolved branch is recorded, not guessed.** Whether the paywall gates
  the *database* or the *app* decides `safe` versus `safe-if` for the
  OFF-derived fields, and that question cannot be answered until a feature is
  chosen — so both branches are written down.
- **No enforceability opinion, ever.** The map states what the licences say and
  what a qualified reader should be shown. It never states whether a term would
  hold up.

## Task List

### Phase 1: The inventory and its guard

- [x] Task 1: The row contract and the ten rows — `data/licensing/inventory.json`,
      vocabulary and basis enforced by test. Done 2026-10-11: ten rows seeded
      `unknown` with what would resolve each; contract green (9 tests).
- [x] Task 2: The completeness guard — every committed artifact under
      `public/catalog/` and `data/enriched/` maps to exactly one row. Done
      2026-10-11: rows gained a `covers` list; proved to fail by adding a file
      under `public/catalog/` and removing it again.
- [x] Task 3: The OFF-fields guard — the nutrition fields actually present in the
      shipped bundle are accounted for by a row. Done 2026-10-11: 15 leaf paths
      enumerated; the spec's claim that all of them are OFF-derived was **wrong**
      and corrected first.

### Checkpoint: Inventory
- [x] `npx vitest run tests/licensing.test.ts` green — 17 tests
- [x] The guard has been seen to *fail* on a deliberate drift, not just pass —
      probed with a new file and with a new field, both reverted
- [x] No `src/` file imports the inventory

### Phase 2: The layers, researched in risk order

- [x] Task 4: The ODbL layer — `enriched-db`, `off-derived-nutrition`,
      `off-api-terms`, with clause citations. Done 2026-10-11: the ODbL text and
      Open Food Facts' terms were fetched and quoted, not recalled. The decisive
      clauses are 4.7(b) and 4.7(c): a paywall is contemplated, and conditional
      on the data staying free.
- [x] Task 5: The Mercadona layer — `mirror`, `underlying-catalog-data`,
      `catalog-bundle`, `photos`, `trademark`. Done 2026-10-11: the mirror's
      `LICENSE` was read and is software-scoped MIT, which is what makes the
      dataset's `license: mit` tag an `unknown` rather than a `safe`.
- [x] Task 6: The authored layer — `code`, `app-shell`, and the missing `LICENSE`.
      Done 2026-10-11: runtime dependencies read from their own manifests, both
      MIT; the tool that would enumerate every transitive licence named rather
      than claimed.

### Checkpoint: Verdicts
- [x] Every row has a verdict and a non-empty `basis`
- [x] Every `unknown` names what would resolve it
- [ ] Review with the human before writing the document — **overridden**: explicit
      instruction to finish unattended, so the review moves to the morning

### Phase 3: The map

- [x] Task 7: `docs/licensing/ENVELOPE.md` — one section per layer, ending in a
      verdict and its clause, with the not-legal-advice framing and the list of
      what a lawyer would need to see. Written; human review deferred.
- [x] Task 8: The litmus — three plausible premium features run through the
      envelope end to end. Done: all three land on the same row, which is the
      finding — the feature is not what decides it.

### Checkpoint: Map
- [x] A feature can be given a verdict without re-opening the research

### Phase 4: Verification

- [x] Task 9: Prove the guard fails when it should; full suite, typecheck, lint
      and build green. Probed three ways: a new file, a new field, a removed row.

### Checkpoint: Complete
- [x] Every acceptance criterion met
- [x] The envelope names the question it could not settle, and what would settle it
- [ ] Reviewed by the human, merged — **open**: reviews deferred to the morning,
      nothing merged

> **Answer, for the morning:** the premium feature is not the blocker. The
> catalogue's chain of title is. Six of ten rows are `unknown` and five of them
> inherit from `underlying-catalog-data`.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| ODbL forbids gating the nutrition layer | High | Researched first (Task 4), before any feature or paywall exists; the branch where the paywall gates the *app* rather than the *database* is recorded separately |
| The mirror's MIT is read as covering the data when it may only cover the mirror | High | The row is `unknown` unless a source settles it, and the row must name what would settle it; the convenient reading is explicitly not taken |
| A research claim is paraphrased from memory and is wrong | High | Every `basis` cites a document and clause; the primary texts are fetched and cited, not recalled |
| A verdict is mistaken for legal advice | High | Fixed framing on the document, and an explicit "what a lawyer needs" list; no enforceability statements anywhere |
| The inventory drifts as the pipeline changes | Medium | The guard reads the real repo and the real bundle; a new committed artifact or a new OFF-sourced field without a row fails the test |
| Scope creep into paywall implementation | Medium | Out of scope in the intent; boundaries forbid shipping a paywall in the same change |
| Audit code leaking into the app bundle | Low | No `src/` import, asserted at the checkpoint |

## Open Questions

- **Does the mirror's MIT extend to Mercadona's data, or only to the mirror's
  packaging?** Load-bearing. Answered as `unknown` plus what resolves it, unless
  Task 5 finds a source that settles it.
- **Does the paywall gate the database or the app?** Decides `safe` vs `safe-if`
  for the OFF-derived fields. Both branches recorded; unresolvable until a
  feature is chosen.
- **Hotlinking versus redistribution for the photos**, and whether gating changes
  the analysis. Stated, not guessed.
- **Is jurisdiction really Spain/EU, and does the app ship outside it?** Changes
  the sui generis database-rights reading.
- **Does `CAPABILITY-MAP.md` gain a third initiative entry?** Its map is approved
  and gated, so this is a human decision — the plan does not assume an answer.
