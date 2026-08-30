import React from 'react';

interface FlamingTorchProps {
  isActive?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showSmoke?: boolean;
}

export const FlamingTorch: React.FC<FlamingTorchProps> = ({
  isActive = true,
  size = 'md',
  className = '',
  showSmoke = true,
}) => {
  const sizeMap = {
    sm: { width: 18, height: 28, scale: 'scale-75' },
    md: { width: 24, height: 38, scale: 'scale-100' },
    lg: { width: 32, height: 50, scale: 'scale-125' },
  };

  const { width, height } = sizeMap[size];

  return (
    <div
      className={`relative inline-flex flex-col items-center select-none ${className}`}
      title={isActive ? 'Tocha Acesa: Vez Ativa' : 'Tocha em Brasa'}
    >
      {/* Dynamic Ambient Torch Halo Glow */}
      {isActive && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-radial from-amber-500/50 via-orange-600/20 to-transparent pointer-events-none animate-torch-halo blur-xs" />
      )}

      {/* SVG Torch with Animated Flame */}
      <svg
        width={width}
        height={height}
        viewBox="0 0 24 38"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
      >
        {/* Rising Ember Sparks */}
        {isActive && (
          <>
            <circle cx="11" cy="4" r="0.9" fill="#ffedd5" className="animate-ember-1 opacity-90" />
            <circle cx="14" cy="2" r="0.7" fill="#fed7aa" className="animate-ember-2 opacity-80" />
            <circle cx="9" cy="6" r="0.6" fill="#fde047" className="animate-ember-3 opacity-85" />
          </>
        )}

        {/* Outer Crimson / Orange Flame (Dynamic morph flicker) */}
        <path
          d="M12 2C12 2 17 8 17 14C17 17.5 14.8 19.5 12 19.5C9.2 19.5 7 17.5 7 14C7 8 12 2 12 2Z"
          fill={isActive ? '#ea580c' : '#7c2d12'}
          className={isActive ? 'animate-flame-outer origin-bottom' : 'opacity-60'}
        />

        {/* Middle Vibrant Amber/Gold Flame */}
        <path
          d="M12 5C12 5 15.5 9.5 15.5 14C15.5 16.5 13.8 18 12 18C10.2 18 8.5 16.5 8.5 14C8.5 9.5 12 5 12 5Z"
          fill={isActive ? '#f59e0b' : '#b45309'}
          className={isActive ? 'animate-flame-middle origin-bottom' : 'opacity-70'}
        />

        {/* Inner White-Hot Core Flame */}
        <path
          d="M12 9C12 9 14 12 14 14.5C14 16 13 17 12 17C11 17 10 16 10 14.5C10 12 12 9 12 9Z"
          fill={isActive ? '#fffbeb' : '#fef08a'}
          className={isActive ? 'animate-flame-inner origin-bottom' : 'opacity-80'}
        />

        {/* Cast Iron Torch Sconce Basket */}
        <path
          d="M8 18H16L15 22H9L8 18Z"
          fill="#271c14"
          stroke="#785338"
          strokeWidth="0.75"
        />
        <line x1="10" y1="18" x2="9.5" y2="22" stroke="#a16207" strokeWidth="0.6" />
        <line x1="14" y1="18" x2="14.5" y2="22" stroke="#a16207" strokeWidth="0.6" />
        <line x1="12" y1="18" x2="12" y2="22" stroke="#a16207" strokeWidth="0.6" />

        {/* Torch Wooden Shaft Handle */}
        <path
          d="M10.5 22H13.5L13 34C13 34.5 12.5 35 12 35C11.5 35 11 34.5 11 34L10.5 22Z"
          fill="#452718"
          stroke="#1c1009"
          strokeWidth="0.75"
        />
        {/* Metal Rivet Rings */}
        <rect x="10" y="24" width="4" height="1.5" rx="0.5" fill="#a16207" />
        <rect x="10.5" y="30" width="3" height="1.5" rx="0.5" fill="#a16207" />
      </svg>
    </div>
  );
};
