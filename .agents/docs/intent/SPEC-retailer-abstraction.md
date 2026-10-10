# Spec: `retailer-abstraction`

Module id: `retailer-abstraction` · Depends on: `licensing` · Third in the monetization build order

Map: [CAPABILITY-MAP.md](./CAPABILITY-MAP.md) ·
Envelope: [ENVELOPE.md](../../docs/licensing/ENVELOPE.md)

## Objective

Decide whether "the same app, for another retailer" is a **second repository** or
**data added to this one**, and implement only the part of that answer that is
justified by evidence. The user's ask was concrete: *"I would like to create a repo
that is the same as this one but for Aldi products, lots of people can also be
interested here."*

## The finding that decides the shape, established 2026-10-11

**There is no Aldi catalogue to port.** The Mercadona design rests entirely on one
artefact — `datania/mercadona-catalog`, a weekly export published on Hugging Face —
and nothing equivalent exists for Aldi:

- A Hugging Face dataset search for `aldi` returns only unrelated work: a speech
  dataset that happens to be abbreviated ALDi, plus uploaders with "aldi" in their
  usernames. No grocery catalogue.
- The publisher of the Mercadona mirror (`datania`) publishes Spanish open data —
  IPC, INE tables, hipotecas, embalses — and the Mercadona catalogue. No second
  retailer.
- The Mercadona mirror has already been forked (`manurruis/mercadona-catalog`,
  identical description), which is useful evidence in passing: the provenance
  question this repo inherited is one that propagates, and any second copy of this
  app inherits it too.

So `aldi-data` is **blocked on a data source, not on code**. That single fact makes
most of the interesting design work here premature, and the spec says so rather
than producing a plan for a pipeline with nothing to ingest.

Two consequences follow immediately:

1. **The Mercadona app's founding constraint cannot be ported.** *"No scraping,
   ever — not at runtime, not in CI"* is satisfiable only because a mirror exists.
   For a retailer with no mirror, the design has to answer a different question
   first: is there a permitted source at all? That is a `licensing` question before
   it is an engineering one.
2. **A fork made today would fork the *unknown*, not the solution.** The envelope
   records `underlying-catalog-data` as `unknown` — five other rows inherit from
   it. A second repo would carry its own copy of that, with its own retailer, and
   would need its own envelope. Duplicating it does not resolve anything; it
   doubles it.

## Options

| Option | What it means | Cost now | Cost later |
|---|---|---|---|
| **A. Fork the repo** | Copy it, swap the data pipeline for Aldi's | Low | Two copies of everything, including two envelopes and two unknown-provenance rows; every fix lands twice. The zones vocabulary, the 26 sections and the `SECTION_TO_ZONE` table are retailer-specific and would be rewritten, not reused |
| **B. Abstract the seam now** | Extract a retailer-agnostic core plus a data-package contract, before any second retailer exists | High | Invents an interface against one implementation — the interface any second source needs is not knowable from one source |
| **C. Defer both, and pin the contract** | Write down what a retailer data package must provide and where the retailer-specific surface is; build neither | Very low | Bounded: the writing is cheap, and it is what makes the Aldi decision answerable the moment a source appears |

**Recommendation: C.** The repo is currently *not* retailer-agnostic, and the useful
output is knowing exactly where, rather than an abstraction built on one example.
Option B is speculative generality with a concrete price; Option A spends real
effort to duplicate an unresolved legal position.

## Where the retailer-specific surface actually is

Recorded because it is the thing a second retailer would have to replace, and it is
larger than it looks:

| Surface | Where | Notes |
|---|---|---|
| The source and its snapshot shape | `scripts/fetch-catalog.ts` | Hard-coded to the Hugging Face mirror's layout; the Mercadona domain is forbidden by a test |
| The section→zone vocabulary | `src/lib/zones.ts` | **26 Mercadona sections.** A different retailer's sections would need a different table, not a reorder |
| The catalogue domain type | `src/types/catalog.ts`, `scripts/build-bundle.ts` | Assumes the Mercadona product shape: `slug`, `unitSize`, `bulkPrice`, imgix `thumbnail`/`photo` |
| The nutrition join | `scripts/enrich.ts` | Barcode-keyed, so genuinely portable — Open Food Facts does not care which shop sold the product |
| The retailer's mark | name, icon, copy | Treated by `branding`; a second retailer means a second name decision, and the envelope's `trademark` row changes owner |

Worth noting for the morning: the nutrition enrichment is the one part that ports
cleanly, because it keys on the barcode rather than the retailer. That is a real
asset — it is also the part carrying the ODbL obligations.

## Acceptance criteria

1. A written **retailer data-package contract**: the inputs a second retailer must
   supply, in the repo, so the Aldi question is answerable from a document rather
   than from memory.
2. The retailer-specific surface is enumerated with file paths, as above, and each
   entry says whether it is *replaceable as data* or *requires code*.
3. **No fork and no abstraction layer is built.** The deliverable is the contract
   and the inventory of coupling.
4. The spec records that a second retailer needs its own envelope with its own row
   set, per the scope boundary already added to
   [SPEC-licensing.md](./SPEC-licensing.md).
5. The decision between A, B and C is recorded with the evidence that produced it,
   so a future session does not re-derive it.

## Boundaries

**Always** — state the data source before designing its pipeline; keep the
"Mercadona is never contacted" property intact for this repo.

**Ask first** — actually creating a second repository; adding a scraping path for
any retailer; extracting shared code.

**Never** — copy this repo for a retailer whose data source is unresolved and call
the copy finished; treat a permissive licence on a republisher as a grant over the
republished data (the envelope's central finding).

## Open questions

1. **Is there a permitted Aldi source at all?** Everything else waits on this. Not
   answerable from a dataset search — it is a question about Aldi's terms, and it
   belongs to `licensing`, not here.
2. **Does "another retailer" mean another Spanish supermarket with a mirror, or
   specifically Aldi?** The answer changes the effort entirely; a retailer with a
   published catalogue is a data-package job, and one without is a research job.
3. **Does the second retailer share this repo's `offer`?** A second catalogue does
   not imply a second product, and the build order puts `offer` before this module
   for a reason: the commercial decision is upstream of the technical one.
4. **Is the interest real?** The user's judgement that *"lots of people can also be
   interested"* is the premise for spending anything here, and it is not something
   this spec can verify. Worth testing the claim before the code — the Mercadona
   app's own distribution question (`launch-comms`) is unanswered, and a second
   retailer multiplies an unanswered question rather than solving it.
