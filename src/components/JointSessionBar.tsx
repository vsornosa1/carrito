interface JointSessionBarProps {
  sessionId: string;
  onShare: () => void;
  onUnbind: () => void;
  /** What just happened, in the user's words: a copy, or why sharing could not happen. */
  notice?: string | null;
  /** The link, when the app had to show it rather than send it. */
  manualLink?: string | null;
}

/** Enough of the id to confirm two people are on one list, not enough to be a secret. */
function shortId(sessionId: string): string {
  return sessionId.slice(0, 6);
}

/**
 * The bound state, said plainly.
 *
 * The copy carries the one fact that matters and that a "shared list" does not imply on
 * its own: nothing arrives on its own. There is no server, so two phones are in step only
 * when a link goes across — and the bar says so, in visible text, rather than letting
 * "compartida" be read as "synced".
 *
 * It also never reports a member count. The app cannot know how many devices joined, and
 * a number it cannot know would be exactly the kind of confident guess this app refuses
 * to make about nutrition.
 */
export function JointSessionBar({
  sessionId,
  onShare,
  onUnbind,
  notice,
  manualLink,
}: JointSessionBarProps) {
  return (
    <section className="joint-bar" aria-label="Lista compartida">
      <p className="joint-bar__what">
        Lista compartida <span className="joint-bar__id">{shortId(sessionId)}</span>
      </p>
      <p className="joint-bar__how">
        Lo que cambies aquí solo llega a los demás cuando vuelvas a enviar el enlace.
      </p>

      <div className="joint-bar__actions">
        <button type="button" className="joint-bar__share" onClick={onShare}>
          Compartir
        </button>
        <button type="button" className="joint-bar__leave" onClick={onUnbind}>
          Desvincularme
        </button>
      </div>

      {manualLink ? (
        <input
          className="joint-bar__link"
          aria-label="Enlace para compartir"
          readOnly
          value={manualLink}
          // Selecting on focus is what makes the fallback usable: the field exists
          // precisely because nothing could copy it automatically.
          onFocus={(event) => event.currentTarget.select()}
        />
      ) : null}

      {notice ? (
        <p className="joint-bar__notice" role="status">
          {notice}
        </p>
      ) : null}
    </section>
  );
}
