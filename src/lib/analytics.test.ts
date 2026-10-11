import { describe, expect, it } from 'vitest';

import { shouldInstrument, startAnalytics } from './analytics.ts';

// The two conditions are separate promises, so they get separate tests. `vercel` protects
// the Cloudflare deployment from a 404 on every page load; `production` protects the
// "contacts nobody but its own origin" promise, because the package's development build
// fetches its debug script from va.vercel-scripts.com.
describe('shouldInstrument', () => {
  it('records a production build deployed on Vercel', () => {
    expect(shouldInstrument({ production: true, vercel: true })).toBe(true);
  });

  it('stays silent in development, where the debug script comes from a third-party origin', () => {
    expect(shouldInstrument({ production: false, vercel: true })).toBe(false);
  });

  it('stays silent off Vercel, where /_vercel/insights/script.js does not exist', () => {
    expect(shouldInstrument({ production: true, vercel: false })).toBe(false);
  });
});

describe('startAnalytics', () => {
  it('adds no script when the Vercel flag is absent from the build', () => {
    // The decisive case: a bundler that never ran the `define` must fail closed rather
    // than throw. This is also what vitest itself looks like.
    startAnalytics();
    expect(document.head.querySelector('script[src*="insights"]')).toBeNull();
  });
});
