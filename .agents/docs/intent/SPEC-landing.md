# Spec: `landing`

Module id: `landing` · Depends on: `branding` (the name) · New module, not yet in the map

Intent: [INTENT-carrito.md](./INTENT-carrito.md) ·
Supersedes nothing · Reference studied: `corrillo.dev` (2026-10-11)

## Scope check (Phase 0)

**Skipped.** One capability: a marketing page that gets a stranger into the app.
Its three parts — the shell, the hero, the "how it works" demos — are sections of
one document that ship together, not independently testable modules. The one thing
that comes close to separable is the service-worker change, and that is a
*consequence* of this page existing, not a capability of its own.

## Objective

Put a front door on `carrito.dev`. The app moves to `/app`; `/` becomes a page whose
only job is to make someone understand what Carrito is in one screenful and leave for
the app — or, if they already value it, to Ko-fi.

Two users, and the page has to serve both without choosing:

- **The stranger**, arriving from a link someone shared. They have never heard of
  it, they are probably on a phone, and they will give it about five seconds.
- **The user**, who already knows the app and wants a way to say thanks.

Success is that the stranger taps through, and that the page itself costs almost
nothing to read.

## The architectural decision, which is the whole risk

**The landing page must never download the catalogue.** Today the service worker
precaches **5,856 KiB**, and every visitor would pay that before reading a sentence.

The fix needs no new infrastructure and, importantly, **no change to
`public/_headers`** — which the intent put out of scope, and this design respects
that:

| Change | Why it works without a header |
|---|---|
| The app moves to `app/index.html` | A service worker's *default* scope is its own directory, so registering from `/app/` yields scope `/app/` |
| The registration passes `scope: '/app/'` explicitly | Narrowing a scope is always permitted; only *widening* needs `Service-Worker-Allowed`, and widening is exactly what we are avoiding |
| The landing page registers **no** service worker | No registration, no precache, no 5.8 MB. The landing page is also outside `/app/`, so it is never controlled even if a worker exists |
| The manifest gets `start_url: '/app'` and `scope: '/app/'` | Installing from the landing page installs the app, and opening the installed icon skips the landing page — which is what someone who installed it wants |

Everything else stays where it is: `base` remains `/`, assets stay under `/assets/`,
and `public/_headers` is untouched. The catalogue keeps being precached — for the
people using the app, which is precisely who should pay for it.

## Assumptions I am making

1. **Both entries are one Vite build** with two HTML inputs, not two projects. One
   toolchain, one deploy, one set of tests; two projects would double the CI surface
   to avoid a config block.
2. **The landing page is React**, like the app. It costs ~45 kB gzip and reuses the
   toolchain, the test setup and the lint rules. Hand-rolled DOM would save that and
   cost a second way of building UI in one repository.
3. **No webfonts.** The reference preloads two, and they are a large part of why it
   looks the way it does — but a self-hosted display face is 100–200 kB and drags a
   font licence into the envelope, which is a question nobody wants to open for a
   landing page. The page gets its identity from scale, weight, tracking and motion
   on the system stack instead.
4. **Spanish, like the app.** The app is `lang="es"` and its users are shopping in
   Spain. The reference explains a Spanish word to an English-speaking audience; this
   one does not have to, because its audience already speaks it.
5. **The product's green stays the accent.** "Its own identity" means its own
   typographic scale, spacing rhythm and surface treatment — not a different company.
   A landing page in a colour the app does not use would read as a different product.
   Worth correcting now if that is not what was meant, because it is cheap now and
   expensive after the page exists.
6. **The Ko-fi link is a link.** Same as in the app: no script, no image, no iframe.

## Deliverable

| Artifact | What it is |
|---|---|
| `index.html` | The landing entry, at the root |
| `app/index.html` | The app entry, moved from the root |
| `src/landing/main.tsx` | The landing's mount point — no worker, no catalogue |
| `src/landing/Landing.tsx` | The page: hero, steps, ordering, support, footer. One file rather than `screens/*`, as built: the sections share the reveal wrapper and the copy, and splitting five small components would have cost more than it explained |
| `src/landing/hero-order.ts` | The hero's list and beats, built on the app's own `ZONES` so the two cannot drift |
| `src/landing/use-reveal.ts` | Scroll reveal, and the reduced-motion preference read via `useSyncExternalStore` |
| `src/landing/landing.css` | The landing's own tokens; it must not import `src/styles.css` |
| `vite.config.ts` | Two inputs, `appType: 'mpa'`, `injectRegister: null`. **`appType: 'mpa'` was added during the build**, after `vite preview` handed `/app` to the root document: without it the multi-page project still behaves like a single-page one and the visitor gets the landing page twice |
| `public/manifest.webmanifest` | `start_url` and `scope` move to `/app/` — trailing slash included, since `/app` is a real document and the slash is what makes a static host resolve the directory index |

## The hero, concretely

The app's differentiator is that **the list reads as a walk**: seven zones in trip
order, non-food its own block, the freezer last. The hero animates exactly that — a
short list of product chips reordering itself into the trip order, zone headings
arriving as their items land, `Congelados` last.

It is honest content rather than aspirational: that behaviour already ships and is
covered by the app's own tests. The animation is a **timed state machine over a
small list**, stepped by the same ordering functions the app uses where practical, so
the hero cannot drift from the thing it advertises.

Under `prefers-reduced-motion: reduce` the animation does not run: the final order is
rendered immediately, static. Not a slower animation — no animation.

## Commands

```
Dev:        npm run dev
Tests:      npm test
Focused:    npx vitest run src/landing
Typecheck:  npm run typecheck
Lint:       npm run lint
Build:      npm run build
Preview:    npm run preview
```

## Project structure

```
index.html                 → the landing page (new at the root)
app/index.html             → the app (moved from the root)
src/app/                   → the app's screens — unchanged by this work
src/landing/               → the landing page's own components, styles and tests
public/manifest.webmanifest→ start_url and scope → /app/
src/styles.css             → the app's tokens; the landing must not import them
```

## Code style

The landing page keeps its own design tokens rather than borrowing the app's, which
is what "its own identity" has to mean in practice:

```css
/* src/landing/landing.css */
.landing {
  --landing-ink: #101312;
  --landing-paper: #f6f7f4;
  --landing-accent: var(--color-primary-strong, #007a3a); /* the one shared value */
  --landing-display: clamp(2.5rem, 9vw, 5rem);            /* the hero's scale */
}
```

Conventions, inherited from the app: TypeScript `strict`, no `any`, named exports,
all user-facing strings in Spanish, and every claimed number carrying its source.

## Testing strategy

Vitest, plus a browser pass, because this is a page and pages are looked at.

| Concern | Level |
|---|---|
| The reorder state machine (order over time, reduced-motion branch) | unit — pure, exhaustive, colocated |
| Section rendering: one `h1`, the two exits, the Ko-fi link's `href`/`target`/`rel` | component |
| **The landing page never imports the catalogue** | source guard, in `tests/` |
| **The landing page registers no service worker** | source guard, in `tests/` |
| Third-party isolation | the existing `tests/network-hygiene.test.ts` guard, extended to `src/landing` |
| Contrast, focus order, no overflow at 320/375/768/1024/1440 | browser pass, screenshots, and a reduced-motion run |

The two guards in bold are the load-bearing ones. They encode the architectural
decision above, so that a later session cannot reconnect the landing page to the
catalogue or to the service worker without a test going red and explaining why.

## Boundaries

**Always** — keep the landing page free of the catalogue and the service worker; keep
it inside the current CSP; respect `prefers-reduced-motion`; keep the Ko-fi link a
link; keep its strings Spanish.

**Ask first** — changing `public/_headers`; adding a webfont or any runtime
dependency; changing the app's appearance; moving the app anywhere other than `/app`.

**Never** — let the landing page load the catalogue; register a service worker from
it; loosen the CSP; import `src/styles.css` into the landing page; embed any part of
Ko-fi.

## Success criteria

1. `curl -s https://carrito.dev/ | wc -c` is a marketing page, and **an uncached visit
   to `/` transfers no `catalog/*` request** — verified in the browser's network
   panel, not inferred.
2. `/app` is the app, installable, and its installed icon opens the app rather than
   the landing page.
3. The hero shows the list reordering into trip order, and renders the final order
   statically under reduced motion.
4. Contrast passes AA on the landing page, one `h1`, skip link present, keyboard
   order sensible, no horizontal overflow at 320 px.
5. `public/_headers` is byte-identical to what it is today.
6. The full suite, typecheck, lint and build are green, with the two guards in place.

## Open questions

1. **Does the app move to `/app`, or to a subdomain?** `/app` is assumed throughout:
   one deploy, one certificate, one set of headers. A subdomain would be a second
   deployment and would split the `carrito.dev` the envelope is scoped to.
2. **How much motion is "fully animated"?** This spec reads it as the reference does:
   one hero animation, scroll reveals, and hover/focus transitions — not parallax,
   scroll-jacking or WebGL. That is the single biggest cost lever in this work.
3. **What is the headline?** The spec's draft is *"La lista de la compra, en el orden
   en que andas el supermercado."* It is the author's voice, not mine, and it is a
   one-line change later.
4. **Does `landing` need an entry in `CAPABILITY-MAP.md`?** The map is an approved,
   gated artifact and this module is new scope, so the spec proposes `landing` (and a
   `branding` dependency for the name) rather than adding itself.
5. **Does the rename extend to the repository and the hosting config?** `netlify.toml`
   and the GitHub repository name are still `mercadonapp`, and the intent left both
   open. Nothing here depends on it.
