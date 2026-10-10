# The monetization envelope

**What may be charged for, per layer, with the clause that decides it.**

Machine-checkable source: [`data/licensing/inventory.json`](../../data/licensing/inventory.json) ·
Guard: [`tests/licensing.test.ts`](../../tests/licensing.test.ts) ·
Intent: [INTENT-monetization.md](../../.agents/docs/intent/INTENT-monetization.md) ·
Spec: [SPEC-licensing.md](../../.agents/docs/intent/SPEC-licensing.md)

> **This is not legal advice.** It is a map of what the licences say, with citations,
> and it records where the answer is genuinely unresolved. Nothing here states
> whether a term would hold up, or predicts how a dispute would end. The last
> section lists what a qualified reader would need in order to answer properly.

## The bottom line

**You cannot currently say that you may sell this app, and the reason has nothing to
do with which feature you put behind the paywall.**

Two layers behave completely differently:

- **The Open Food Facts layer is answerable, and the answer is yes-with-conditions.**
  Commercial use is authorised explicitly. Share-alike does *not* forbid a paywall —
  ODbL 4.7(c) names access control as permitted. What it requires is that the data
  itself stays available.
- **The catalogue's chain of title is unverified.** Every product name, price,
  category, ingredient list and photo in the app came from Mercadona, and nothing in
  the chain is a grant from Mercadona. That is what stops the envelope short, and it
  is the one thing worth resolving before building anything paid.

The consequence is counter-intuitive enough to state plainly: **choosing the right
premium feature does not move this.** Gating the cart instead of the nutrition panel
changes who receives the catalogue, not whether the catalogue may be redistributed.

## Summary

| Row | Kind | Licence | Verdict | Requires |
|---|---|---|---|---|
| `code` | artifact | — (authored) | ✅ safe | — |
| `app-shell` | artifact | — (authored) | ✅ safe | the OFF credit stays in the UI |
| `enriched-db` | artifact | ODbL 1.0 | 🟡 safe-if | attribution, share-alike, source-offer |
| `off-derived-nutrition` | artifact | ODbL 1.0 / DbCL 1.0 | 🟡 safe-if | the above, plus no-additional-restrictions |
| `off-api-terms` | source | ODbL 1.0 / DbCL 1.0 | ⚪ unknown | — |
| `mirror` | source | MIT (software only) | ⚪ unknown | — |
| `underlying-catalog-data` | source | — | ⚪ unknown | — |
| `catalog-bundle` | artifact | — | ⚪ unknown | — |
| `photos` | source | — | ⚪ unknown | — |
| `trademark` | right | — | ⚪ unknown | — |

Six rows are `unknown`, and they are not equally weighted: `underlying-catalog-data`
is the one holding the others up.

## 1. The catalogue's chain of title

**Rows:** `underlying-catalog-data`, `mirror`, `catalog-bundle` — all `unknown`.

The catalogue is Mercadona's: names, prices, category tree, ingredient and allergen
HTML, photos. This project never contacted Mercadona — a deliberate, documented design
— which also means it never obtained anything from them. The data arrives as a weekly
export published by a third party.

Two facts from that third party's own repository decide how much its MIT tag is worth:

1. **The licence text in the mirror is software-scoped.** The `LICENSE` file at
   `github.com/datania/mercadona-catalog` is standard MIT over *"this software and
   associated documentation files (the 'Software')"*, copyright 2025 David Gasquez.
   The repository ships a scraper (`mercadona.py`). The dataset card separately
   asserts `license: mit` for the dataset, but no data-licence text sits behind that
   assertion.
2. **The mirror's own documentation describes how the data was obtained.** Its README
   says the catalogue is exported from *"su API pública (no oficial)"*, and its
   `api.md` records: *"robots.txt bloquea `/api` para crawlers. Respeta ToS."*

So the MIT tag is a republisher's assertion about data the republisher did not create
and, on its own documentation, obtained from an endpoint the operator disallows to
crawlers. **A permissive licence on a republisher grants nothing in the republished
data.** That is the finding, and it is why these rows are `unknown` rather than
`safe`.

`catalog-bundle` inherits the question rather than adding to it: it is committed to a
public repository and served to every visitor, so copies reach the public, and
`.gitignore` records the commit as deliberate. Whatever is true of the source is true
of the bundle, one derivative further along.

*Resolved by:* the mirror author stating the dataset's licence and their basis for
granting it, or by sourcing the catalogue from a party that holds rights in it.

## 2. The Open Food Facts layer

**Rows:** `off-derived-nutrition` 🟡, `enriched-db` 🟡, `off-api-terms` ⚪.

This is the only part of the envelope with a definite answer.

Three licences apply, per Open Food Facts' terms of use: the **database** is ODbL 1.0,
**individual contents** are DbCL 1.0, and **product images** are CC BY-SA 3.0. The
DbCL grant is broad — DbCL 2.1 grants rights that *"explicitly include commercial
use"* — but DbCL 2.3 is explicit that it *"does not cover any Database Rights,
Database copyright, or contract over the Contents as part of the Database"*. The
database layer stays governed by ODbL.

`data/enriched/enriched.json` is committed, and the OFF-derived fields ship inside
`public/catalog/products.json`. ODbL 4.4(b) makes the consequence direct: *"Extraction
or Re-utilisation of the whole or a Substantial part of the Contents into a new
database is a Derivative Database and must comply with Section 4.4"*, and 4.4(a)
requires a Publicly Used Derivative Database to be *"only under the terms of ... This
License"*.

### Why a paywall is not the problem people assume

Share-alike sounds like it forbids charging. It does not, and the licence says so in
two places:

- **ODbL 3.1** grants rights that *"explicitly include commercial use, and do not
  exclude any field of endeavour"*. Open Food Facts' terms repeat it: the licences
  *"authorize the use and reproduction of the content for all purposes, including
  commercial use"*.
- **ODbL 4.7(c)** contemplates gating the database by name: *"you may place this
  Database or a Derivative Database in an authenticated environment, behind a
  password, or within a similar access control scheme"*.

What ODbL does require is that the *data* stays available:

- **4.7(b)** makes a paywall conditional: terms or measures that restrict access are
  permitted only if you *also* make a copy available to the recipient that is
  *"available without additional fee"*.
- **4.6** independently requires recipients to be offered a machine-readable copy of
  *the entire Derivative Database*, *"free of charge if distributed over the
  internet"*.
- **4.2** and **4.3** set the notices: attribution to Open Food Facts with a link, and
  a statement that the content is available under this licence.

**Practical reading: charge for the app if you like; keep the data itself free.** The
current design already satisfies that — the bundle is committed publicly — so this is
the one part of the envelope where the existing architecture is already doing the
right thing.

Two questions stay open, and neither is guessable today:

1. **Does the gate sit on the app or on the data?** Both are `safe-if`, with different
   obligations. Gating the app while the bundle stays public engages none of the
   4.7(b) condition; gating the data engages it.
2. **Is this extraction a "Substantial" part of Open Food Facts' Contents?** If not,
   4.4 does not attach at all. The definition counts *"quantity or quality or a
   combination of both"*, and adds that *"repeated and systematic Extraction or
   Re-utilisation of insubstantial parts ... may amount to"* a Substantial one. A few
   fields for ~1,500 barcodes out of a database of millions reads as insubstantial in
   quantity; the enrichment is systematic. The envelope records the branch rather than
   picking the convenient one.

`off-api-terms` is `unknown` for a mundane, separate reason: the terms-of-use page says
nothing specific about programmatic access. No API usage policy and no request ceiling
were located, so the conditions the build-time calls were made under are not
established by the licence document.

## 3. The images and the name

**Rows:** `photos` ⚪, `trademark` ⚪.

**Photos.** The image bytes never enter the repository: the app serves
`prod-mercadona.imgix.net` URLs at runtime, which the CSP allows explicitly. Not
redistributing the bytes weakens the copyright question but does not answer it — the
app still loads Mercadona's imagery from Mercadona's CDN without a grant, and
hotlinking from a paid product is exactly the kind of use a retailer may object to.

**Trademark.** "Mercadona" appears in the package name, the product name, the page
title, the icon and the in-app copy. No data licence addresses this, and Open Food
Facts' terms say so themselves: their licences cover *"only the rights that belong to
Open Food Facts and its contributors"*, and *"trademark rights"* are named among the
third-party rights that *"may apply"*, with the re-user responsible for checking.

Both are `unknown`. The name is the one that grows the moment the use becomes
commercial, which is why it is recorded here even though it is not a licence question
— and why it belongs to the `branding` module rather than this one.

## 4. The authored layer

**Rows:** `code` ✅, `app-shell` ✅.

The source, UI copy, icons and manifest are authored here, so there is no third-party
grant to inspect: charging for your own work is not a licensing question.
`package.json` declares `"private": true` and the repository has no `LICENSE` file.
That absence governs what *others* may do with the repository; it does not restrict
the author from monetizing, and it is recorded rather than silently treated as a gap
to fill.

One obligation does attach to the shell, from a different row: it has to keep
rendering the Open Food Facts credit, because that credit is what satisfies the
attribution condition above. The guard asserts it, precisely so a redesign cannot drop
it while this envelope still claims it is there.

## The litmus: three plausible premium features

The test of this document is whether a feature can be placed against it without
re-opening the research. Three candidates, chosen to be different in kind:

| Feature behind the gate | Verdict | The row that decides it |
|---|---|---|
| Whole-app access | ⚪ unknown | `underlying-catalog-data`, via `catalog-bundle` |
| The insight layer — nutrition panels and ranked swaps | ⚪ unknown | `underlying-catalog-data`; plus a 🟡 condition from `off-derived-nutrition` |
| The cart and trip order | ⚪ unknown | `underlying-catalog-data` |

**All three land on the same row.** That is the finding, and it is the reason this
document leads with the catalogue rather than with the feature. The cart gates only
authored logic, but the app still ships the catalogue to whoever passes the gate, so
the redistribution question is identical in all three cases. The feature choice
decides *what people pay for*; it does not decide *whether the data may be shipped at
all*.

The one place the feature choice does matter is on the Open Food Facts side:

- Gate **the app**, and the bundle stays public → no 4.7(b) condition is engaged, and
  the OFF rows stay `safe-if` on attribution, share-alike and the source offer alone.
- Gate **the data** — serve the bundle only to payers — and 4.7(b) attaches, so a copy
  must also be offered to each recipient *"without additional fee"*.

So a feature can be placed, but every placement currently inherits the same
`unknown`. **The envelope does not currently permit any of these three**, not because
of what they gate, but because of what they all ship.

*Placing a fourth feature required no new research, which is the property this litmus
exists to demonstrate. It did, however, surface the answer above — that the constraint
is orthogonal to the feature — which is worth more than a per-feature verdict would
have been.*

## What a qualified reader would need

Ordered by how much it would move the answer:

1. **Mercadona's position** on redistribution of catalogue data, on hotlinking their
   CDN imagery from a paid product, and on the use of the name. This decides six of the
   ten rows.
2. **The mirror's dataset licence, stated by the mirror's author**, including the basis
   on which they grant it — as distinct from the MIT text that covers their software.
3. **ES/EU sui generis database-right advice** on the catalogue: the ODbL definitions
   import the Database Directive's Chapter III rights, and equivalent rights exist over
   a retailer's catalogue independently of ODbL.
4. **A characterisation of our OFF extraction** as Substantial or not, under ODbL's
   definition.
5. **Open Food Facts' API usage terms or published rate limits**, as distinct from the
   licence of the data.
6. **The intended territory.** This envelope assumes Spain/EU; shipping outside the EU
   changes the database-right reading rather than merely the wording.

## What this document does not do

- It does not decide `offer` — what to sell, or at what price. That is the next module.
- It does not implement a paywall. The current CSP blocks every standard payment
  integration, which is a separate decision recorded in
  [CAPABILITY-MAP.md](../../.agents/docs/intent/CAPABILITY-MAP.md).
- It does not state whether any term is enforceable, and no section should be read as
  doing so.
- It does not cover a second retailer: the envelope is mercadonapp-only, and
  `aldi-data` needs its own row set, because the source, its licence and the trademark
  all change.
