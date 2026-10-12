import { describe, expect, it, vi } from 'vitest';

import { shareLink, type ShareNavigator } from './share.ts';

const link = 'https://carrito.dev/app/#j=1.AAAAAAAAAAAAAAAAAAAAAA.42';

/** A fake navigator, so no test needs a browser to have these APIs. */
function fakeNavigator(overrides: ShareNavigator = {}): ShareNavigator {
  return overrides;
}

function abortError() {
  const error = new Error('the user closed the sheet');
  error.name = 'AbortError';
  return error;
}

describe('shareLink', () => {
  it('uses the platform share sheet when there is one, and hands over the link', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const writeText = vi.fn().mockResolvedValue(undefined);

    const outcome = await shareLink(link, fakeNavigator({ share, clipboard: { writeText } }));

    expect(outcome).toBe('shared');
    expect(share).toHaveBeenCalledWith({ title: 'Carrito', url: link });
    expect(writeText).not.toHaveBeenCalled();
  });

  it('copies the link when there is no share sheet', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);

    const outcome = await shareLink(link, fakeNavigator({ clipboard: { writeText } }));

    expect(outcome).toBe('copied');
    expect(writeText).toHaveBeenCalledWith(link);
  });

  it('falls back to the clipboard when sharing fails for a reason that is not the user', async () => {
    const share = vi.fn().mockRejectedValue(new Error('not allowed here'));
    const writeText = vi.fn().mockResolvedValue(undefined);

    const outcome = await shareLink(link, fakeNavigator({ share, clipboard: { writeText } }));

    expect(outcome).toBe('copied');
    expect(writeText).toHaveBeenCalledWith(link);
  });

  it('does not quietly copy when the user closed the share sheet themselves', async () => {
    const share = vi.fn().mockRejectedValue(abortError());
    const writeText = vi.fn().mockResolvedValue(undefined);

    const outcome = await shareLink(link, fakeNavigator({ share, clipboard: { writeText } }));

    // Copying after a cancel would put the link on the clipboard without being asked,
    // which is a surprise dressed up as a fallback.
    expect(outcome).toBe('cancelled');
    expect(writeText).not.toHaveBeenCalled();
  });

  it('reports that it must be shown by hand when there is neither', async () => {
    expect(await shareLink(link, fakeNavigator())).toBe('manual');
  });

  it('reports that it must be shown by hand when the clipboard is blocked', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));

    expect(await shareLink(link, fakeNavigator({ clipboard: { writeText } }))).toBe('manual');
  });
});
