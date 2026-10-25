import React from 'react';

export interface LogoMarkProps {
  size?: number;
  outline?: boolean;
  className?: string;
  asLink?: boolean;
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
  'aria-label'?: string;
}

export interface LogoProps {
  size?: number;
  theme?: 'light' | 'dark' | 'auto';
  outline?: boolean;
  className?: string;
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
  asLink?: boolean;
}

/**
 * Official Gatherly Icon SVG
 * Geometry and colors preserved exactly as specified.
 */
export const LogoMark: React.FC<LogoMarkProps> = ({
  size = 40,
  outline = false,
  className = '',
  asLink = false,
  href = '#',
  onClick,
  'aria-label': ariaLabel = 'Gatherly home',
}) => {
  const borderRadius = (58 / 256) * size;

  const svgContent = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      role="img"
      aria-label="Gatherly"
      width={size}
      height={size}
      className={`shrink-0 block ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: `${borderRadius}px`,
        outline: outline ? '1px solid #2A2A2A' : undefined,
        outlineOffset: '-1px',
      }}
    >
      <rect width="256" height="256" rx="58" fill="#3b2fb8" />
      <path
        d="M170.4 85.6A60 60 0 1 0 188 128H150"
        fill="none"
        stroke="#fff"
        strokeWidth="22"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="187" cy="102" r="8" fill="#ff6a3d" />
    </svg>
  );

  if (asLink) {
    return (
      <a
        href={href}
        onClick={onClick}
        aria-label={ariaLabel}
        className="inline-flex items-center justify-center rounded-xl focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#ff6a3d] focus-visible:ring-offset-2 transition-opacity hover:opacity-95"
      >
        {svgContent}
      </a>
    );
  }

  return svgContent;
};

/**
 * Official Gatherly Logo (Icon + Wordmark)
 * Wordmark: Fraunces 800, letter-spacing -0.02em, font-size = 0.46 × icon height.
 * Light surface: #111111, Dark surface: #F2F2F2. Followed by coral period (#ff6a3d).
 */
export const Logo: React.FC<LogoProps> = ({
  size = 40,
  theme = 'auto',
  outline = false,
  className = '',
  href = '#',
  onClick,
  asLink = true,
}) => {
  const fontSize = Math.round(size * 0.46);
  // Clear space padding equal to half the icon width when needed or spacing
  const gapSize = Math.max(8, Math.round(size * 0.25));

  const textColorClass =
    theme === 'dark'
      ? 'text-[#F2F2F2]'
      : theme === 'light'
      ? 'text-[#111111]'
      : 'text-[#111111] dark:text-[#F2F2F2]';

  const inner = (
    <span
      className={`inline-flex items-center select-none ${className}`}
      style={{ gap: `${gapSize}px` }}
    >
      <LogoMark size={size} outline={outline} />
      <span
        className={`font-serif font-[800] leading-none ${textColorClass}`}
        style={{
          fontFamily: "'Fraunces', Georgia, serif",
          fontWeight: 800,
          letterSpacing: '-0.02em',
          fontSize: `${fontSize}px`,
        }}
      >
        Gatherly<span style={{ color: '#ff6a3d' }}>.</span>
      </span>
    </span>
  );

  if (asLink) {
    return (
      <a
        href={href}
        onClick={onClick}
        aria-label="Gatherly home"
        className="inline-flex items-center rounded-xl p-1 -m-1 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#ff6a3d] focus-visible:ring-offset-2 transition-opacity hover:opacity-95"
      >
        {inner}
      </a>
    );
  }

  return inner;
};

export default Logo;
