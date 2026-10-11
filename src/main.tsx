import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './app/App';
import { ErrorBoundary } from './app/ErrorBoundary';
import { startAnalytics } from './lib/analytics';
import './styles.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('No se encontró el elemento #root en app/index.html');
}

/*
  Registered here and nowhere else.

  A worker registered from /app/ defaults to the /app/ scope, and passing the scope
  explicitly is always allowed — only *widening* a scope needs the
  `Service-Worker-Allowed` header, which is precisely what this design avoids. So the
  landing page at the root is never controlled by this worker, never precaches the
  catalogue, and `public/_headers` stays exactly as it was.

  Development is skipped on purpose: there is no /sw.js there, and a 404 in the
  console on every load teaches everyone to ignore the console.
 */
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js', { scope: '/app/' });
  });
}

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

// A no-op outside a Vercel production build, which is the point: public/_headers allows
// only its own origin, and /_vercel/insights/script.js is that origin when it exists.
startAnalytics();
