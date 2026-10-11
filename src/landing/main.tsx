import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { Landing } from './Landing.tsx';
import { schedulePrefetch } from './prefetch-catalog.ts';
import './landing.css';

/**
 * The landing page's entry point.
 *
 * Deliberately **no service worker and no catalogue**. The worker is registered only
 * from `src/main.tsx`, which serves `/app`, and it is scoped there — so this page
 * transfers a document and its own small bundle, and the 5.8 MB of product data stays
 * with the people who are actually using the app.
 *
 * That is the whole architectural reason this file exists separately.
 */
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('No se encontró el elemento #root en index.html');
}

createRoot(rootElement).render(
  <StrictMode>
    <Landing />
  </StrictMode>,
);

/*
  Warming the catalogue while the reader is still deciding.

  A deliberate reversal of this page's original rule, which was to fetch nothing at all.
  The trade is about 0.73 MB gzipped, spent only after the page has gone quiet and only
  on a connection that did not ask to be spared, to make the app open against a warm
  cache instead of a cold one.

  What does NOT change: the catalogue is still absent from this bundle. The guard that
  forbids importing it stays exactly as it was, because bundling it would make this page
  heavy to read rather than merely heavy to leave.
*/
schedulePrefetch();
