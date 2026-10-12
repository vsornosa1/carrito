/**
 * What happened when the link was handed over.
 *
 * `manual` is not a failure: it is the app saying "here it is, copy it yourself", which
 * is the only thing left when the platform offers nothing and the clipboard is blocked.
 */
export type ShareOutcome = 'shared' | 'copied' | 'manual' | 'cancelled';

/**
 * The part of `navigator` this needs.
 *
 * Taken as a parameter rather than read from the global so the fallbacks are testable
 * without a browser stub library, and so `src/lib` keeps its rule of touching no globals.
 * Both members are optional because both really are optional in the platform.
 */
export interface ShareNavigator {
  share?: (data: { title: string; url: string }) => Promise<void>;
  clipboard?: { writeText: (text: string) => Promise<void> };
}

/** Whether a rejection was the user closing the sheet rather than a failure. */
function isAbort(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

/**
 * Hands the link to the platform, or to the clipboard, or back to the caller.
 *
 * A cancelled share sheet is *not* treated as a failure to fall back from: copying the
 * link after someone deliberately closed the sheet would put it on the clipboard
 * without being asked, which is a surprise dressed up as a fallback. Anything else that
 * throws — an insecure context, a denied permission — does fall through, because then
 * the user did ask and did not get.
 */
export async function shareLink(link: string, navigator: ShareNavigator): Promise<ShareOutcome> {
  if (navigator.share !== undefined) {
    try {
      await navigator.share({ title: 'Carrito', url: link });
      return 'shared';
    } catch (error) {
      if (isAbort(error)) return 'cancelled';
    }
  }

  if (navigator.clipboard !== undefined) {
    try {
      await navigator.clipboard.writeText(link);
      return 'copied';
    } catch {
      // Blocked, insecure context, or a browser that wants a gesture: show it instead.
    }
  }

  return 'manual';
}
