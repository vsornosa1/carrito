# Intent: Carrito

Status: **confirmed** · 2026-10-11 · supersedes [INTENT-monetization.md](./INTENT-monetization.md)

This is the intent behind the rename, the Ko-fi pivot and the landing page. It is
the authoritative statement; where it disagrees with INTENT-monetization.md, this
wins, because the monetization question was retired rather than answered.

## Statement of intent

- **Outcome:** This project becomes **Carrito** — renamed, re-homed at
  `carrito.dev`, and free. A marketing landing page takes `/` and the app moves to
  `/app`, keeping its present appearance deliberately unchanged. Support is a link
  to Ko-fi, not a gate.
- **User:** Two of them. The person in the shop with one hand on the trolley —
  unchanged, and still the only user the app itself is designed for. And the
  stranger arriving from a shared link who has never heard of it, who has to
  understand what it is in one screenful before deciding to tap through.
- **Why now:** The paywall question is retired by not asking it. Ko-fi removes the
  gate, and with it the `offer` and `entitlement` modules and the entire
  CSP-versus-payment problem that made a paywall expensive. `carrito.dev` is brand
  new, so moving the app breaks nothing anyone has bookmarked.
- **Success:** A stranger understands it and leaves for the app in one screenful.
  The landing page never downloads the 5.8 MB catalogue. The app can still honestly
  claim that no user data leaves the device. And every existing cart and saved order
  survives the rename.
- **Constraint:** The landing page gets its **own** visual identity and the app is
  **not** restyled. Both are in Spanish. Animation sits at the calibration of the
  reference the author chose: one hero animation plus scroll reveals, with
  `prefers-reduced-motion` respected. **No third-party script anywhere**, so Ko-fi
  is a link in both places, and `public/_headers` is not touched.
  *Later exception, recorded here rather than rewriting the decision: Vercel Web
  Analytics. It is same-origin on Vercel, compiled out of every other build, and
  therefore still loads no third-party origin — but it is measurement, and the landing
  page's `0 rastreo` claim had to change with it. See the CHANGELOG.*
- **Out of scope:** Restyling the app. Embedding any part of Ko-fi's widget.
  Loosening the CSP. Rewriting `tasks/archive/**`. The `offer` and `entitlement`
  modules. Anything about a second retailer.

## What the interview settled

| Question | Answer | Consequence |
|---|---|---|
| Does the landing page get its own identity, or inherit the app's? | **Its own** | The app is not touched. The landing page is a marketing page, free to look like one, and its palette must not leak into the app |
| What does the hero animate? | **The list reordering into trip order** | The hero shows the app's actual differentiator — seven zones, non-food separated, freezer last — and the animation is honest because that behaviour already ships and is tested |
| How is Ko-fi embedded in the app? | **A link out** | No CSP change, no third-party script, no request to Ko-fi on load. The app keeps its "no user data leaves the device" property |

The third answer is the load-bearing one. Ko-fi's overlay widget loads a script
from `storage.ko-fi.com`, which `script-src 'self'` blocks; its button image is
blocked by `img-src`; an iframe is blocked by `frame-src` falling back to
`default-src 'self'`. A plain link is the *only* option that works under the current
headers — and it is also the only one that preserves the privacy claim in
`docs/LAUNCH.md`. Convenient, but worth recording that it was chosen for the
privacy property, not merely because it was cheapest.

## Decisions taken while writing this down

Small forks not worth a question, recorded so they are reviewable rather than
silent:

- **The rename is a product-name rename, not a retailer excise.** `Mercadona` stays
  everywhere it means the shop: the catalogue is still Mercadona's, the images are
  still theirs, and the app still says which shop it is for. Only the *product* name
  changes. Renaming the retailer out of the app would make it less understandable,
  not less risky.
- **`tasks/archive/**` is not rewritten.** Those documents record what was planned
  and done at the time; editing them would falsify the record. They will still
  contain the old name, on purpose, and a future reader should find that unremarkable
  rather than confusing.
- **The storage keys are renamed with a migration, not merely renamed.** Renaming
  them alone would silently orphan every existing cart and saved order.
- **The trademark row in the envelope is materially changed by this rename**, and is
  updated rather than left stale: the retailer's mark leaves the product name, the
  package name and the page title. It stays in the app's copy and imagery, so the
  verdict does not flip — but the basis does, and an envelope that quietly kept the
  old basis would be lying about what is left.

## Still open

Deliberately not decided here:

- Whether the landing page's identity should eventually be back-ported to the app.
  Explicitly not now; the app stays as it is.
- Whether `carrito.dev` also becomes the deployment name in `netlify.toml` and the
  GitHub repository name. The rename here is in-product; the repository and hosting
  names are separate decisions with their own churn.
- Whether the landing page needs a dark theme. The reference has a toggle; this is
  a design-time call, not an intent-level one.
