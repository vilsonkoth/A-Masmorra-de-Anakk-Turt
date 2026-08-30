import React from 'react';

interface OrnateCornerProps {
  position: 'tl' | 'tr' | 'bl' | 'br';
  colorVariant?: 'gold' | 'crimson' | 'iron';
}

export const OrnateCorner: React.FC<OrnateCornerProps> = ({ position, colorVariant = 'gold' }) => {
  const positionClasses = {
    tl: 'top-0 left-0',
    tr: 'top-0 right-0 rotate-90',
    bl: 'bottom-0 left-0 -rotate-90',
    br: 'bottom-0 right-0 rotate-180',
  }[position];

  const gradientId = `metal-corner-${colorVariant}-${position}`;

  return (
    <div className={`absolute ${positionClasses} w-7 h-7 pointer-events-none z-20 transition-opacity opacity-90`}>
      <svg viewBox="0 0 28 28" fill="none" className="w-full h-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
        <defs>
          {colorVariant === 'gold' && (
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f5d77f" />
              <stop offset="40%" stopColor="#d4af37" />
              <stop offset="80%" stopColor="#8c6d23" />
              <stop offset="100%" stopColor="#3d2a08" />
            </linearGradient>
          )}
          {colorVariant === 'crimson' && (
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff7b89" />
              <stop offset="40%" stopColor="#b91c1c" />
              <stop offset="80%" stopColor="#6e0f14" />
              <stop offset="100%" stopColor="#2c0507" />
            </linearGradient>
          )}
          {colorVariant === 'iron' && (
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#d1d5db" />
              <stop offset="40%" stopColor="#6b7280" />
              <stop offset="80%" stopColor="#374151" />
              <stop offset="100%" stopColor="#111827" />
            </linearGradient>
          )}
        </defs>

        {/* L-bracket metal corner plate */}
        <path
          d="M0 0 H22 C22 4 17 8 13 10 C10 14 8 19 8 26 V28 H0 V0 Z"
          fill={`url(#${gradientId})`}
          stroke="#ffe89e"
          strokeWidth="0.75"
        />

        {/* Inner engraved scrollwork filigree */}
        <path
          d="M3 3 H14 C12 6 9 8 6 9 C5 12 4 15 3 18 V3 Z"
          fill="none"
          stroke="#fff"
          strokeOpacity="0.4"
          strokeWidth="0.5"
        />

        {/* Rivets / metal screws */}
        <circle cx="5" cy="5" r="1.75" fill="#ffe89e" stroke="#523908" strokeWidth="0.5" />
        <circle cx="16" cy="4" r="1.25" fill="#f5d77f" stroke="#523908" strokeWidth="0.5" />
        <circle cx="4" cy="18" r="1.25" fill="#f5d77f" stroke="#523908" strokeWidth="0.5" />
      </svg>
    </div>
  );
};
