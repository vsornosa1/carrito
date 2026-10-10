# Implementation Plan: licensing envelope

## Overview

Draw the boundary the premium feature has to live inside. Before anything is
charged for, establish — per layer of the app — whether that layer *may* be
charged for, what obligation follows if it may, and the clause that decides it.
The output is a map with citations, made durable by a guard test that fails when
it drifts from what the repo actually distributes.

Intent: [INTENT-monetization.md](../.agents/docs/intent/INTENT-monetization.md) ·
Spec: [SPEC-licensing.md](../.agents/docs/intent/SPEC-licensing.md)

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
- [ ] Task 3: The OFF-fields guard — the nutrition fields actually present in the
      shipped bundle are accounted for by a row.

### Checkpoint: Inventory
- [ ] `npx vitest run tests/licensing.test.ts` green
- [ ] The guard has been seen to *fail* on a deliberate drift, not just pass
- [ ] No `src/` file imports the inventory

### Phase 2: The layers, researched in risk order

- [ ] Task 4: The ODbL layer — `enriched-db`, `off-derived-nutrition`,
      `off-api-terms`, with clause citations.
- [ ] Task 5: The Mercadona layer — `mirror`, `underlying-catalog-data`,
      `catalog-bundle`, `photos`, `trademark`.
- [ ] Task 6: The authored layer — `code`, `app-shell`, and the missing `LICENSE`.

### Checkpoint: Verdicts
- [ ] Every row has a verdict and a non-empty `basis`
- [ ] Every `unknown` names what would resolve it
- [ ] Review with the human before writing the document

### Phase 3: The map

- [ ] Task 7: `docs/licensing/ENVELOPE.md` — one section per layer, ending in a
      verdict and its clause, with the not-legal-advice framing and the list of
      what a lawyer would need to see.
- [ ] Task 8: The litmus — three plausible premium features run through the
      envelope end to end.

### Checkpoint: Map
- [ ] A feature can be given a verdict without re-opening the research

### Phase 4: Verification

- [ ] Task 9: Prove the guard fails when it should; full suite, typecheck, lint
      and build green.

### Checkpoint: Complete
- [ ] Every acceptance criterion met
- [ ] Reviewed by the human, merged

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
