import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Testing Library auto-cleanup requires vitest globals; register it explicitly
// so each component test starts from a clean DOM.
afterEach(() => {
  cleanup();
});

// jsdom implements no layout, so scrolling is a no-op the app would otherwise
// trip over every time it moves focus to a new view.
window.scrollTo = () => {};

// jsdom implements no IntersectionObserver, and framer-motion's `whileInView` needs one
// to decide when to reveal — without it every landing-page test throws before it can
// assert anything.
//
// Like the dialog stub below, this makes the element observable and no more: the stub
// never reports an intersection, so a reveal stays where it started. The animation is
// verified in a real browser, not here.
if (typeof globalThis.IntersectionObserver === 'undefined') {
  globalThis.IntersectionObserver = class IntersectionObserverStub {
    readonly root = null;
    readonly rootMargin = '';
    readonly thresholds: readonly number[] = [];
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  } as unknown as typeof IntersectionObserver;
}

// jsdom implements the dialog *element* but not its modal methods, so a component
// using <dialog> cannot open at all under test. This stub makes the element
// visible; it deliberately does NOT imitate the behaviour that makes a native
// <dialog> worth using — the focus trap, Esc, and an inert background — because a
// stub cannot prove those. They are verified in a real browser instead.
if (typeof HTMLDialogElement !== 'undefined') {
  if (!HTMLDialogElement.prototype.showModal) {
    HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
      this.open = true;
    };
  }
  if (!HTMLDialogElement.prototype.close) {
    HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
      this.open = false;
      this.dispatchEvent(new Event('close'));
    };
  }
}

