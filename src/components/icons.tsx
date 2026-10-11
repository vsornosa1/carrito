import type { ReactElement } from 'react';

/**
 * The app's icons, in one place.
 *
 * The search glass was defined in two components and the trolley in two more, so a
 * change had to be made twice and the copies could drift. Each entry is the
 * *contents* of a 24×24 viewBox; `Icon` supplies the frame and the stroke.
 */
const PATHS: Record<string, ReactElement> = {
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </>
  ),
  cart: (
    <>
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </>
  ),
  browse: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  alert: (
    <>
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="8" x2="12" y2="13" />
      <line x1="12" y1="16.5" x2="12" y2="16.5" />
    </>
  ),
  empty: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <line x1="7" y1="9" x2="17" y2="9" />
      <line x1="7" y1="13" x2="13" y2="13" />
    </>
  ),
  heart: (
    <path d="M12 20.4 4.8 13.1a4.7 4.7 0 0 1 6.6-6.7l.6.6.6-.6a4.7 4.7 0 0 1 6.6 6.7z" />
  ),

  // ---- One per supermarket section ----
  // Drawn from primitives on purpose: 26 pictograms of bespoke squiggles would
  // drift out of one visual language within a week.
  apple: (
    <>
      <circle cx="12" cy="14" r="7" />
      <line x1="12" y1="7" x2="12" y2="3.5" />
      <path d="M12 6c1.6-2.2 3.6-1.8 4.2-1.4" />
    </>
  ),
  meat: (
    <>
      <path d="M4 13c0-4 3.5-6.5 8-6.5s8 2.5 8 6.5-3.5 6-8 6-8-2-8-6z" />
      <path d="M8.5 9.5h5.5" />
      <path d="M11.2 9.5V12" />
    </>
  ),
  fish: (
    <>
      <path d="M3 12c3.5-5 8.5-5 12 0-3.5 5-8.5 5-12 0z" />
      <path d="M15 12l6-4v8z" />
      <circle cx="7.5" cy="11.5" r="0.8" />
    </>
  ),
  cheese: (
    <>
      <path d="M3 18 12 6l9 12z" />
      <circle cx="9.5" cy="14.8" r="1.4" />
      <circle cx="14.8" cy="15.6" r="1.7" />
      <circle cx="12.2" cy="11.8" r="1.1" />
    </>
  ),
  // Rotated, because an upright rounded rectangle reads as a case. A baguette at an
  // angle with slashes across it reads as bread at 20px, which is the whole test.
  bread: (
    <g transform="rotate(-28 12 12)">
      <rect x="2.5" y="8.5" width="19" height="7" rx="3.5" />
      <line x1="7.5" y1="8.5" x2="5.8" y2="15.5" />
      <line x1="12" y1="8.5" x2="10.3" y2="15.5" />
      <line x1="16.5" y1="8.5" x2="14.8" y2="15.5" />
    </g>
  ),
  bottle: (
    <>
      <rect x="8" y="8" width="8" height="13" rx="2.5" />
      <path d="M10.5 8V4.5h3V8" />
      <line x1="8" y1="13" x2="16" y2="13" />
    </>
  ),
  jar: (
    <>
      <rect x="6" y="8" width="12" height="12" rx="2" />
      <line x1="6" y1="12" x2="18" y2="12" />
      <rect x="9" y="4.5" width="6" height="3.5" />
    </>
  ),
  // A tied bundle of pasta. An ear of wheat was the first try and it resolved as a
  // sprout at 20px: the grains were simply too small a shape to survive the size.
  pasta: (
    <>
      <line x1="8" y1="4.5" x2="8" y2="19.5" />
      <line x1="12" y1="3.5" x2="12" y2="20.5" />
      <line x1="16" y1="4.5" x2="16" y2="19.5" />
      <path d="M6.5 9h11" />
    </>
  ),
  coffee: (
    <>
      <path d="M5 9h11v4a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z" />
      <path d="M16 10.5h1.25a2.25 2.25 0 0 1 0 4.5H16" />
      <line x1="8.5" y1="3" x2="8.5" y2="5.5" />
      <line x1="12" y1="3" x2="12" y2="5.5" />
    </>
  ),
  cookie: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="9.5" cy="9.5" r="1" />
      <circle cx="14.5" cy="12" r="1" />
      <circle cx="10.5" cy="15" r="1" />
    </>
  ),
  // A chocolate bar, not a wrapped sweet: the wrapper ends read as a bow tie at
  // 20px, and the section is named for the chocolate anyway.
  chocolate: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <line x1="9" y1="6" x2="9" y2="18" />
      <line x1="15" y1="6" x2="15" y2="18" />
      <line x1="3" y1="12" x2="21" y2="12" />
    </>
  ),
  // A bowl, not a bag: the first attempt read as a waste bin, which is not what
  // anyone wants beside their aperitivos.
  snack: (
    <>
      <path d="M3 11.5h18a9 9 0 0 1-18 0z" />
      <circle cx="9" cy="8" r="1.6" />
      <circle cx="14.5" cy="6.8" r="1.6" />
    </>
  ),
  water: (
    <path d="M12 3s6 6.5 6 10.5a6 6 0 0 1-12 0C6 9.5 12 3 12 3z" />
  ),
  juice: (
    <>
      <path d="M7 6.5h10L15.6 21H8.4z" />
      <line x1="7.5" y1="12" x2="16.5" y2="12" />
      <line x1="15.5" y1="3" x2="13" y2="9" />
    </>
  ),
  wine: (
    <>
      <path d="M8 4h8l-.6 6a3.4 3.4 0 0 1-6.8 0z" />
      <line x1="12" y1="13.5" x2="12" y2="20" />
      <line x1="8.5" y1="20" x2="15.5" y2="20" />
    </>
  ),
  spray: (
    <>
      <rect x="6.5" y="9" width="7.5" height="12" rx="2" />
      <path d="M9 9V6h2.5v3" />
      <line x1="17" y1="6.5" x2="20" y2="5.5" />
      <line x1="17" y1="10" x2="20" y2="10.5" />
    </>
  ),
  soap: (
    <>
      <rect x="7" y="10" width="9" height="11" rx="2" />
      <path d="M11 10V6.5h2" />
      <path d="M13 6.5h4V9" />
    </>
  ),
  comb: (
    <>
      <rect x="3.5" y="9" width="17" height="4.5" rx="1.5" />
      <line x1="7" y1="13.5" x2="7" y2="17.5" />
      <line x1="11" y1="13.5" x2="11" y2="17.5" />
      <line x1="15" y1="13.5" x2="15" y2="17.5" />
      <line x1="18.5" y1="13.5" x2="18.5" y2="16.5" />
    </>
  ),
  lipstick: (
    <>
      <rect x="9" y="11.5" width="6" height="9" rx="1.5" />
      <path d="M9.5 11.5V6.5L12 4l2.5 2.5v5" />
    </>
  ),
  paw: (
    <>
      <circle cx="6.5" cy="11" r="1.7" />
      <circle cx="10.5" cy="7.5" r="1.7" />
      <circle cx="15" cy="8" r="1.7" />
      <circle cx="18.5" cy="11.5" r="1.7" />
      <ellipse cx="12.5" cy="17" rx="4" ry="3.2" />
    </>
  ),
  pharmacy: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </>
  ),
  egg: <ellipse cx="12" cy="13" rx="6" ry="7.5" />,
  yoghurt: (
    <>
      <path d="M6.5 8.5h11L16.3 21H7.7z" />
      <line x1="5.5" y1="8.5" x2="18.5" y2="8.5" />
    </>
  ),
  plate: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4.5" />
    </>
  ),
  snowflake: (
    <>
      <line x1="12" y1="3" x2="12" y2="21" />
      <line x1="4.2" y1="7.5" x2="19.8" y2="16.5" />
      <line x1="4.2" y1="16.5" x2="19.8" y2="7.5" />
    </>
  ),
  baby: (
    <>
      <rect x="9" y="9" width="6" height="12" rx="2.5" />
      <line x1="9" y1="13" x2="15" y2="13" />
      <path d="M10.5 9V7h3v2" />
      <circle cx="12" cy="5" r="1.6" />
    </>
  ),
};

export type IconName = keyof typeof PATHS;

interface IconProps {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

/** Decorative by default: every use sits beside a label that says the same thing. */
export function Icon({ name, size = 22, strokeWidth = 2, className }: IconProps) {
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
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
