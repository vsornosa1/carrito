import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const projectRoot = resolve(import.meta.dirname, '..');
const scriptsDir = resolve(projectRoot, 'scripts');
// The whole data strategy rests on one rule: the catalogue comes from a mirror,
// never from Mercadona. robots.txt disallows their /api and their abuse detector
// hard-blocks scrapers. This test asserts the rule at the source level, so a
// future change cannot silently reintroduce scraping.
describe('network hygiene', () => {
  const scriptFiles = existsSync(scriptsDir)
    ? readdirSync(scriptsDir).filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'))
    : [];

  it('has a fetch-catalog entry point', () => {
    expect(existsSync(resolve(scriptsDir, 'fetch-catalog.ts')), 'scripts/fetch-catalog.ts must exist').toBe(
      true,
    );
  });

  it('never references tienda.mercadona.es in any pipeline script', () => {
    expect(scriptFiles.length, 'pipeline scripts must exist').toBeGreaterThan(0);
    for (const file of scriptFiles) {
      const source = readFileSync(resolve(scriptsDir, file), 'utf8');
      expect(source, `${file} must not reference the Mercadona domain`).not.toContain(
        'tienda.mercadona.es',
      );
    }
  });
});

/** Source with comments removed, so a guard cannot fail on a sentence about a call. */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

/** Every .ts/.tsx under a directory, recursively. */
function sourceFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];

  const found: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const child = resolve(dir, entry.name);
    if (entry.isDirectory()) found.push(...sourceFiles(child));
    else if (/\.tsx?$/.test(entry.name)) found.push(child);
  }
  return found;
}

// The app's own claim — in docs/LAUNCH.md, and enforced by public/_headers — is that
// opening it contacts nobody but its own origin, plus the retailer's image CDN that
// the CSP names. Ko-fi is a link for exactly that reason: its widget loads a script
// from storage.ko-fi.com, which `script-src 'self'` blocks. This asserts the absence
// rather than trusting the decision, so a future "just drop the widget in" fails
// here instead of in the browser console.
describe('third-party isolation', () => {
  const files = sourceFiles(resolve(projectRoot, 'src'));

  it('has source files to check', () => {
    expect(files.length, 'the guard must have something to guard').toBeGreaterThan(0);
  });

  it('loads nothing from a third-party origin', () => {
    for (const file of files) {
      const source = readFileSync(file, 'utf8');
      // Deliberately narrow: this asserts resource *loading*, not the appearance of
      // a hostname. SupportLink.tsx names the Ko-fi CDN in a comment explaining why
      // it refuses to use it, and a guard that cannot tell a mention from a load
      // would cry wolf on its own documentation.
      expect(source, `${file} must not load a remote script`).not.toMatch(
        /<script[^>]+src=["']https?:/,
      );
      expect(source, `${file} must not embed a frame`).not.toMatch(/<iframe/);
      expect(source, `${file} must not fetch a remote stylesheet`).not.toMatch(
        /url\(\s*["']?https?:/,
      );
    }
  });

  it('supports the project by linking out, which is the only form the CSP allows', () => {
    const support = readFileSync(
      resolve(projectRoot, 'src', 'components', 'SupportLink.tsx'),
      'utf8',
    );
    expect(support, 'the Ko-fi page must be a plain link').toContain(
      'https://ko-fi.com/sornosa',
    );
  });
});

// A shared list promises the same thing the rest of the app does: nothing leaves the
// device unless the user sends it themselves. The link is built locally and carried in a
// fragment, so a request added to this path later — a "sync", a relay, an analytics ping
// carrying the session — would break that promise silently. This asserts the absence
// rather than trusting the design note in the spec.
describe('the sharing path', () => {
  const sharingSources = [
    resolve(projectRoot, 'src', 'lib', 'joint-session.ts'),
    resolve(projectRoot, 'src', 'lib', 'share.ts'),
    resolve(projectRoot, 'src', 'app', 'useJointSession.ts'),
  ];

  it('has the files it claims to guard', () => {
    for (const file of sharingSources) {
      expect(existsSync(file), `${file} must exist`).toBe(true);
    }
  });

  it('cannot transmit, because it has no way to make a request', () => {
    for (const file of sharingSources) {
      // Comments removed first: a guard that cannot tell a call from a sentence about
      // calling would fail on its own documentation, which is how a guard gets deleted.
      const source = stripComments(readFileSync(file, 'utf8'));
      expect(source, `${file} must not fetch`).not.toMatch(/\bfetch\s*\(/);
      expect(source, `${file} must not use XMLHttpRequest`).not.toContain('XMLHttpRequest');
      expect(source, `${file} must not use sendBeacon`).not.toContain('sendBeacon');
      expect(source, `${file} must not open a socket`).not.toMatch(/new\s+WebSocket/);
    }
  });

  it('builds the link as a fragment, never as a query string', () => {
    const source = readFileSync(
      resolve(projectRoot, 'src', 'lib', 'joint-session.ts'),
      'utf8',
    );

    // A fragment is not sent in a request line, a `Referer`, or an origin's logs, which is
    // the entire reason the format is what it is.
    expect(source, 'the link must put the payload in the fragment').toContain('/app/#');
    expect(source, 'the link must never carry the payload in a query string').not.toMatch(
      /\?j=/,
    );
  });
});
