interface CarritoMarkProps {
  size?: number;
  strokeWidth?: number;
  className?: string;
  /** True when the mark stands alone rather than beside the wordmark. */
  labelled?: boolean;
}

/**
 * The mark: a trolley whose basket is a list.
 *
 * The product in one shape — and the two halves are the two things the app actually
 * does. A trolley on its own would be a shopping-list app; the list inside it is what
 * makes it *this* one. Monochrome via `currentColor` on purpose, so the same mark reads
 * green in the app and ink-and-accent on the landing page without a second file to keep
 * in sync.
 */
export function CarritoMark({
  size = 24,
  strokeWidth = 2,
  className,
  labelled = false,
}: CarritoMarkProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={labelled ? 'img' : undefined}
      aria-label={labelled ? 'Carrito' : undefined}
      aria-hidden={labelled ? undefined : 'true'}
    >
      <path d="M2 3.6h2.1l1.1 2.9" />
      <path d="M5.2 6.5h15.3l-1.9 9.2a2 2 0 0 1-2 1.6H8.6a2 2 0 0 1-2-1.6z" />
      <path d="M8.7 10.3h8.4" />
      <path d="M9.6 13.5h6.5" />
      <circle cx="9" cy="20.3" r="1.3" />
      <circle cx="16.4" cy="20.3" r="1.3" />
    </svg>
  );
}
