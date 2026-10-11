import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const projectRoot = resolve(import.meta.dirname, '..');
const landingDir = resolve(projectRoot, 'src', 'landing');

/** Every .ts/.tsx/.css under a directory, recursively. */
function sourceFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];

  const found: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const child = resolve(dir, entry.name);
    if (entry.isDirectory()) found.push(...sourceFiles(child));
    else if (/\.(tsx?|css)$/.test(entry.name)) found.push(child);
  }
  return found;
}

/*
  The landing page took the root from the app, and two properties are what make that
  trade good. Both are the kind a later session could undo without noticing, because
  nothing visible would change on the developer's own machine — where the service
  worker is not even registered in development, and the catalogue is already warm.

    1. It must never pull in the catalogue. 5.8 MB in front of someone who has not
       decided to use the app yet defeats the point of having a landing page.
    2. It must never install a service worker. The worker is registered from /app and
       scoped there, which is what keeps the catalogue off this URL.

  These assert the absence, so the reason is recorded where the change would happen.
*/
describe('landing page isolation', () => {
  const files = sourceFiles(landingDir);

  it('has files to guard', () => {
    expect(files.length, 'the guard must have something to guard').toBeGreaterThan(0);
  });

  it('never reaches for the catalogue', () => {
    for (const file of files) {
      const source = readFileSync(file, 'utf8');

      // Import-shaped on purpose. hero-order.ts names products.json in a comment
      // explaining why it does not import it, and a guard that cannot tell a mention
      // from an import would fail on its own documentation — which is what happened
      // the first time this ran.
      expect(source, `${file} must not import the catalogue data`).not.toMatch(
        /(?:from|import\()\s*['"][^'"]*products\.json/,
      );
      expect(source, `${file} must not import the catalogue hook`).not.toMatch(
        /(?:from|import\()\s*['"][^'"]*useCatalog/,
      );
      expect(source, `${file} must not read a data file itself`).not.toMatch(/\breadFileSync\b/);
    }
  });

  it('never registers a service worker', () => {
    for (const file of files) {
      const source = readFileSync(file, 'utf8');
      expect(source, `${file} must not register a worker`).not.toMatch(/serviceWorker/);
      expect(source, `${file} must not name the worker script`).not.toMatch(/sw\.js/);
    }
  });

  it('sends a stranger to the app rather than a precached copy of it', () => {
    const rootHtml = readFileSync(resolve(projectRoot, 'index.html'), 'utf8');

    expect(rootHtml, 'the root must load the landing').toContain('/src/landing/main.tsx');
    expect(rootHtml, 'the root must not load the app bundle').not.toContain('/src/main.tsx');
    expect(rootHtml, 'the root must not register a worker').not.toMatch(/serviceWorker/);
  });

  it('keeps the app where the manifest says it is', () => {
    const appHtml = readFileSync(resolve(projectRoot, 'app', 'index.html'), 'utf8');

    expect(appHtml, 'the app entry must still load the app').toContain('/src/main.tsx');
  });
});
