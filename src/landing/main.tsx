import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { Landing } from './Landing.tsx';
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
