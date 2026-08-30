import React from 'react';
import { DiceResult } from '../types/game';

// 6-Pointed Star SVG component (Estrela de 6 Pontas / Hexagram)
export const SixPointedStar: React.FC<{ size?: number; className?: string }> = ({ size = 20, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.85))' }}
  >
    {/* Clean geometric 6-pointed star with dual overlapping equilateral triangles */}
    <path
      d="M12 2 L15.5 8 L22 8 L17 12 L19.5 18.5 L12 14.5 L4.5 18.5 L7 12 L2 8 L8.5 8 Z"
      fill="#fde047"
      stroke="#ca8a04"
      strokeWidth="0.8"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="11.5" r="2.2" fill="#fffbeb" />
  </svg>
);

// Blood Drop SVG component (Gota de Sangue para faces Nulas)
export const BloodDrop: React.FC<{ size?: number; className?: string }> = ({ size = 20, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    style={{ filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.9))' }}
  >
    <path
      d="M12 2.5 C12 2.5 5 11.5 5 16 C5 19.86 8.13 23 12 23 C15.87 23 19 19.86 19 16 C19 11.5 12 2.5 12 2.5 Z"
      fill="#dc2626"
      stroke="#7f1d1d"
      strokeWidth="1"
    />
    {/* Gloss highlight on upper left curve of droplet */}
    <ellipse cx="9.5" cy="14" rx="2" ry="3.5" transform="rotate(-25 9.5 14)" fill="#fca5a5" opacity="0.75" />
    <circle cx="9" cy="11.5" r="0.8" fill="#ffffff" opacity="0.9" />
  </svg>
);

interface ThemedDice3DProps {
  die: DiceResult;
  isRolling: boolean;
  index: number;
}

export const ThemedDice3D: React.FC<ThemedDice3DProps> = ({ die, isRolling, index }) => {
  // Official "A Masmorra de Anakk Tur" Brown D6 3D Face Mapping:
  // Face 1 (Front - 0deg): 1 Dano (1 Estrela de 6 Pontas)
  // Face 2 (Back - 180deg): 1 Dano (1 Estrela de 6 Pontas)
  // Face 3 (Right - -90deg Y): 2 Danos (2 Estrelas de 6 Pontas)
  // Face 4 (Left - 90deg Y): 3 Danos (3 Estrelas de 6 Pontas)
  // Face 5 (Top - -90deg X): NULO (Gota de Sangue)
  // Face 6 (Bottom - 90deg X): NULO (Gota de Sangue)
  const getSettledRotation = (value: number) => {
    switch (value) {
      case 1: // 1 Dano Front
        return 'rotateX(0deg) rotateY(0deg)';
      case 2: // 1 Dano Back
        return 'rotateX(0deg) rotateY(180deg)';
      case 3: // 2 Danos Right
        return 'rotateX(0deg) rotateY(-90deg)';
      case 4: // 3 Danos Left
        return 'rotateX(0deg) rotateY(90deg)';
      case 5: // 0 Dano Top (Nulo - Gota de Sangue)
        return 'rotateX(-90deg) rotateY(0deg)';
      case 6: // 0 Dano Bottom (Nulo - Gota de Sangue)
        return 'rotateX(90deg) rotateY(0deg)';
      default:
        return 'rotateX(0deg) rotateY(0deg)';
    }
  };

  const rollingClass = isRolling
    ? index % 3 === 0
      ? 'animate-dice-tumble-1'
      : index % 3 === 1
      ? 'animate-dice-tumble-2'
      : 'animate-dice-tumble-3'
    : '';

  return (
    <div className="flex flex-col items-center gap-2 group">
      {/* 3D Scene Container */}
      <div className="dice-3d-scene w-18 h-18 sm:w-20 sm:h-20 flex items-center justify-center">
        <div
          className={`dice-3d-cube w-16 h-16 sm:w-18 sm:h-18 ${rollingClass}`}
          style={{
            transform: isRolling ? undefined : getSettledRotation(die.value),
          }}
        >
          {/* Face 1: 1 DANO (Front) - 1 Estrela de 6 pontas */}
          <div className="dice-3d-face dice-face-front dice-face-brown">
            <SixPointedStar size={22} className="text-yellow-300" />
            <span className="text-[10px] font-black font-cinzel text-amber-200 mt-0.5 tracking-wider">
              1 DANO
            </span>
          </div>

          {/* Face 2: 1 DANO (Back) - 1 Estrela de 6 pontas */}
          <div className="dice-3d-face dice-face-back dice-face-brown">
            <SixPointedStar size={22} className="text-yellow-300" />
            <span className="text-[10px] font-black font-cinzel text-amber-200 mt-0.5 tracking-wider">
              1 DANO
            </span>
          </div>

          {/* Face 3: 2 DANOS (Right) - 2 Estrelas de 6 pontas */}
          <div className="dice-3d-face dice-face-right dice-face-brown ring-1 ring-yellow-500/60">
            <div className="flex items-center justify-center gap-1">
              <SixPointedStar size={17} className="text-yellow-200" />
              <SixPointedStar size={17} className="text-yellow-200" />
            </div>
            <span className="text-[10px] font-black font-cinzel text-yellow-300 mt-0.5 tracking-wider">
              2 DANOS
            </span>
          </div>

          {/* Face 4: 3 DANOS (Left) - 3 Estrelas de 6 pontas */}
          <div className="dice-3d-face dice-face-left dice-face-brown ring-2 ring-yellow-400">
            <div className="flex items-center justify-center gap-0.5">
              <SixPointedStar size={15} className="text-yellow-100 animate-pulse" />
              <SixPointedStar size={16} className="text-yellow-200 animate-pulse" />
              <SixPointedStar size={15} className="text-yellow-100 animate-pulse" />
            </div>
            <span className="text-[10px] font-black font-cinzel text-yellow-200 mt-0.5 tracking-wider">
              3 DANOS
            </span>
          </div>

          {/* Face 5: NULO (Top) - Gota de Sangue */}
          <div className="dice-3d-face dice-face-top dice-face-brown-null">
            <BloodDrop size={22} className="text-red-500 animate-bounce" />
            <span className="text-[10px] font-black font-cinzel text-red-300 mt-0.5 tracking-wider">
              NULO
            </span>
          </div>

          {/* Face 6: NULO (Bottom) - Gota de Sangue */}
          <div className="dice-3d-face dice-face-bottom dice-face-brown-null">
            <BloodDrop size={22} className="text-red-500" />
            <span className="text-[10px] font-black font-cinzel text-red-300 mt-0.5 tracking-wider">
              NULO
            </span>
          </div>
        </div>
      </div>

      {/* Result Status Tag under the die */}
      <div className="text-center transition-all duration-300">
        {isRolling ? (
          <span className="text-[10px] text-amber-300/70 font-mono animate-pulse">
            🎲 Rolando...
          </span>
        ) : die.isHit ? (
          <span className="text-[11px] font-black uppercase text-yellow-300 bg-amber-950/90 border border-yellow-500/70 px-2 py-0.5 rounded-md shadow-md font-mono flex items-center gap-1">
            <span className="text-xs">⚔️</span> +{die.damageValue} DANO{die.damageValue > 1 ? 'S' : ''}
          </span>
        ) : (
          <span className="text-[11px] font-bold uppercase text-red-300 bg-red-950/90 border border-red-800 px-2 py-0.5 rounded-md shadow-md font-mono flex items-center gap-1">
            <span className="text-xs">🩸</span> 0 DANO (NULO)
          </span>
        )}
      </div>
    </div>
  );
};
