import { BRAND, MyEasyHandLogoVariant } from './brand';

interface MyEasyHandLogoIconProps {
  size?: number;
  variant?: MyEasyHandLogoVariant;
}

/**
 * Calendar + location pin — primary MyEasyHand brand mark.
 * viewBox tuned to match the official horizontal lockup proportions.
 */
export function MyEasyHandLogoIcon({ size = 36, variant = 'gradient' }: MyEasyHandLogoIconProps) {
  const onDark = variant === 'onDark';
  const calendarStroke = onDark ? BRAND.white : BRAND.navy;
  const dotFill = BRAND.teal;
  const pinFill = BRAND.teal;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {/* Calendar body */}
      <rect
        x="10"
        y="14"
        width="28"
        height="26"
        rx="4"
        stroke={calendarStroke}
        strokeWidth="2.5"
        fill="none"
      />
      {/* Binding rings */}
      <rect x="16" y="10" width="3" height="8" rx="1.5" fill={calendarStroke} />
      <rect x="29" y="10" width="3" height="8" rx="1.5" fill={calendarStroke} />
      {/* Date grid — 2 × 3 teal squares */}
      {[0, 1, 2].map((col) =>
        [0, 1].map((row) => (
          <rect
            key={`${col}-${row}`}
            x={15 + col * 7}
            y={19 + row * 7}
            width="5"
            height="5"
            rx="1"
            fill={dotFill}
          />
        )),
      )}
      {/* Location pin overlapping bottom-left */}
      <path
        d="M8 34C8 28.5 11.5 25 15.5 25C19.5 25 23 28.5 23 34C23 38 15.5 44 15.5 44C15.5 44 8 38 8 34Z"
        fill={pinFill}
      />
      <circle cx="15.5" cy="33.5" r="2.5" fill={onDark ? BRAND.navy : BRAND.white} />
    </svg>
  );
}
