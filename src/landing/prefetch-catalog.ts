export const CATALOG_URL = '/catalog/products.json';

interface Connection {
  saveData?: boolean;
  effectiveType?: string;
}

function readConnection(): Connection | undefined {
  return (navigator as Navigator & { connection?: Connection }).connection;
}

/**
 * Whether this connection should be spent on a page nobody has asked for yet.
 *
 * The catalogue is ~0.73 MB gzipped. That is a bargain if it makes the app feel instant,
 * and an imposition on someone reading three sentences on a train with one bar of
 * signal — so the reader gets a veto and the browser gets a say:
 *
 * - `saveData` is the reader saying so explicitly.
 * - `effectiveType` is the browser telling us the pipe is narrow.
 *
 * Unknown connection means no objection, which is the right default: the feature is a
 * nicety, and withholding it from every browser that does not implement the Network
 * Information API would withhold it from most of them.
 */
export function shouldPrefetch(connection: Connection | undefined): boolean {
  if (connection === undefined) return true;
  if (connection.saveData === true) return false;
  return connection.effectiveType !== 'slow-2g' && connection.effectiveType !== '2g';
}

/**
 * Warms the HTTP cache so the app opens with the catalogue already in it.
 *
 * A `<link rel="prefetch">` rather than `fetch()`: the browser owns the priority, so it
 * lands after everything the page actually needs, and it is cancelled by a navigation.
 * The app asks for the same URL with a same-origin `fetch`, so it is served from the
 * cache `public/_headers` already allows for an hour.
 *
 * Returns whether it decided to spend the bandwidth, which is what the test asserts.
 */
export function prefetchCatalog(doc: Document = document, connection = readConnection()): boolean {
  if (!shouldPrefetch(connection)) return false;

  const link = doc.createElement('link');
  link.rel = 'prefetch';
  link.as = 'fetch';
  link.href = CATALOG_URL;
  doc.head.append(link);
  return true;
}

/**
 * Runs the prefetch once the page is quiet.
 *
 * After `load` and in an idle callback, so it never competes with the fonts, the CSS or
 * the JavaScript that the reader is actually looking at. The timeout is the fallback for
 * Safari, which has never shipped `requestIdleCallback`.
 */
export function schedulePrefetch(): void {
  const run = () => {
    prefetchCatalog();
  };

  const afterLoad = () => {
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(run);
      return;
    }
    window.setTimeout(run, 1200);
  };

  if (document.readyState === 'complete') afterLoad();
  else window.addEventListener('load', afterLoad, { once: true });
}
