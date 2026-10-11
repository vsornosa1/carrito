import { inject } from '@vercel/analytics';

/**
 * Replaced by `define` in vite.config.ts. Vercel's build environment sets `VERCEL=1`;
 * a build anywhere else leaves it `false`.
 *
 * `typeof` rather than a direct read, because a bundler that does not run the `define`
 * above (vitest is one) would otherwise throw a ReferenceError instead of deciding not to
 * count. Absent is not the same as false, and it has to fail closed.
 */
declare const __VERCEL__: boolean | undefined;

function isVercelBuild(): boolean {
  return typeof __VERCEL__ !== 'undefined' && __VERCEL__;
}

/**
 * Whether this build may load Vercel Web Analytics. Both conditions are load-bearing:
 *
 * - `production` — in development the package fetches its debug script from
 *   `va.vercel-scripts.com`. That is a third-party origin, and this project's promise,
 *   enforced by the CSP in `public/_headers` and asserted by tests/network-hygiene.test.ts,
 *   is that opening it contacts nobody but its own origin.
 * - `vercel` — the tracking script is served from `/_vercel/insights/script.js`, a route
 *   that exists only on Vercel. Anywhere else it 404s, and the package's own `onerror`
 *   then writes a failure message into the console on every page load. The same build
 *   deployed to Cloudflare Pages (wrangler.jsonc) has to stay silent.
 */
export function shouldInstrument(flags: { production: boolean; vercel: boolean }): boolean {
  return flags.production && flags.vercel;
}

/**
 * Counting visits, and nothing else. Called from both entries, because both are real
 * documents: the landing page a stranger lands on, and the app.
 *
 * `mode: 'production'` rather than the default `auto`, so the decision above is the only
 * thing that decides whether the script loads.
 */
export function startAnalytics(): void {
  if (!shouldInstrument({ production: import.meta.env.PROD, vercel: isVercelBuild() })) return;
  inject({ mode: 'production' });
}
