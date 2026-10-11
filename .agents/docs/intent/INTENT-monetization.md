# Intent: monetization envelope

Status: **superseded** · 2026-10-11 — see [INTENT-carrito.md](./INTENT-carrito.md).
The monetization question was retired rather than answered: Ko-fi replaced the
paywall, so `offer` and `entitlement` were dropped and the licence findings that
this intent produced now live on in [ENVELOPE.md](../../../docs/licensing/ENVELOPE.md).

This is the intent behind `SPEC-monetization.md`. It records *why* the question
was asked, not the legal answer — the answer is the spec's job. Nothing here is
legal advice; it is a statement of what I want to find out and why.

## Statement of intent

- **Outcome:** A map of the legal envelope for monetizing carrito — which
  layers are chargeable, which are not, and what obligations follow the
  chargeable ones — so a premium feature can be chosen to sit *inside* the
  lines rather than discovered against a wall after it is built.
- **User:** Me, deciding whether and how to monetize, *before* any paid feature
  exists.
- **Why now:** The app is at 1.2.2 with trip order merged, and the catalogue and
  nutrition bundles are already versioned, distributed artifacts — the licences are already in play,
  they simply have not been exercised commercially yet. The cost of finding the
  wall late is a feature I have to unwind.
- **Success:** For any proposed premium feature I can say *safe / not safe /
  safe-if-X*, and point at the clause that makes it so.
- **Constraint:** The nutrition bundle is a **distributed** derivative database
  of Open Food Facts under **ODbL** (share-alike, and it forbids imposing
  additional restrictions on redistribution of the database). The Mercadona
  catalogue is underlying data of uncertain provenance sitting behind an
  **MIT**-licensed mirror — the mirror's licence covers the mirror's packaging,
  which is not the same thing as the data inside it. The "Mercadona" name and
  imagery are a **trademark** exposure that grows the moment the use is
  commercial. **I am not a lawyer**; this is a constraints map, not advice.
- **Out of scope:** Designing the paywall itself (payment provider, feature
  flags, gating logic), pricing, and any actual legal opinion. Also out of
  scope: changing what the app currently ships. This work decides what *may*
  be charged for; it does not yet charge for anything.

## What the interview settled

Two questions, both of which changed the shape of the work:

| Question | Answer | Consequence |
|---|---|---|
| Which "allowed" — legal, ethical, technical, or commercial? | **Legal / licensing** | The answer lives in what the licences permit, not in the code. The ethics question would have been one line; the technical question would have been a different piece of work entirely. |
| What does the paywall sit behind — the whole app, or a named feature? | **Not decided — a premium feature not yet discovered** | This is the important one. The question stops being "may I charge for X?" and becomes "what is the envelope I must design X inside?" The second is answerable *now*, while the first cannot be answered until X exists. |

The second answer reframed the deliverable. A yes/no on an unnamed feature is not
answerable; a per-layer envelope is.

## Decisions taken while writing this down

Small forks not worth a question, recorded so they are reviewable rather than
silent:

- **The envelope is per-layer, not per-app.** A single verdict for "the app"
  would hide the thing that matters: the layers are under different licences,
  so they have different verdicts.
- **Provenance of the catalogue is treated as unsettled.** The mirror says MIT;
  the data inside it is Mercadona's. The spec records both claims rather than
  picking the convenient one.
- **The trademark is in scope.** It is not a data licence, but it is the risk
  most likely to grow on commercial use and it is cheap to state alongside the
  rest.
- **No legal opinion is produced.** The deliverable is a map with clause
  citations, explicitly framed as something to take to someone qualified.

## Still open

Deliberately not decided here; they are cheap to change and better answered
once the envelope is drawn:

- Which premium feature is actually built. The envelope constrains the choice;
  it does not make it.
- Whether the app is charged for at all, versus funded another way. A paywall is
  one route to sustainability and there is no revenue requirement yet.
- Whether the nutrition layer could be re-sourced to something permissive enough
  to remove the ODbL constraint entirely — that is a data-pipeline question, not
  a licensing one, and it would move the envelope rather than work around it.
