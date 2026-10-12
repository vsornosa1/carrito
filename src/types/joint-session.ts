/** Which answer a handshake applied, so the next one can be pre-answered. */
export type BindChoice = 'merge' | 'replace';

/** What to do with the shared list when leaving it. */
export type UnbindChoice = 'keep' | 'clear';

/**
 * This device's membership in a shared list.
 *
 * Its absence means the device is solo. There is no user, no account and no member
 * roster here: a device is bound or it is not, and that is the whole notion of
 * membership.
 */
export interface JointBinding {
  /** Opaque, 16 random bytes as base64url. The session is the list, not a person. */
  sessionId: string;
  /** ISO timestamp, from this device's own clock — no server means no other clock. */
  joinedAt: string;
  /** Who opened the session. Only the bar's copy uses it. */
  origin: 'created' | 'joined';
}
