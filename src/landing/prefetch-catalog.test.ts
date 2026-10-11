import { describe, expect, it } from 'vitest';

import { CATALOG_URL, prefetchCatalog, shouldPrefetch } from './prefetch-catalog.ts';

/** A `document` that records what was appended, without a DOM. */
function fakeDocument() {
  const appended: { rel: string; as: string; href: string }[] = [];
  const doc = {
    createElement: () => ({ rel: '', as: '', href: '' }),
    head: {
      append: (element: { rel: string; as: string; href: string }) => void appended.push(element),
    },
  } as unknown as Document;
  return { doc, appended };
}

describe('prefetching the catalogue from the landing page', () => {
  it('spends the bandwidth when nothing objects', () => {
    expect(shouldPrefetch(undefined)).toBe(true);
    expect(shouldPrefetch({})).toBe(true);
    expect(shouldPrefetch({ effectiveType: '4g' })).toBe(true);
  });

  it('honours a reader who asked to save data', () => {
    expect(shouldPrefetch({ saveData: true, effectiveType: '4g' })).toBe(false);
  });

  it('skips the narrow pipes, where 0.73 MB is not a nicety', () => {
    expect(shouldPrefetch({ effectiveType: 'slow-2g' })).toBe(false);
    expect(shouldPrefetch({ effectiveType: '2g' })).toBe(false);
  });

  it('asks the browser for the same URL the app fetches, so the cache is shared', () => {
    const { doc, appended } = fakeDocument();

    expect(prefetchCatalog(doc, { effectiveType: '4g' })).toBe(true);

    expect(appended).toHaveLength(1);
    expect(appended[0]).toMatchObject({ rel: 'prefetch', as: 'fetch', href: CATALOG_URL });
  });

  it('adds nothing at all on a connection it decided against', () => {
    const { doc, appended } = fakeDocument();

    expect(prefetchCatalog(doc, { saveData: true })).toBe(false);
    expect(appended).toHaveLength(0);
  });
});
