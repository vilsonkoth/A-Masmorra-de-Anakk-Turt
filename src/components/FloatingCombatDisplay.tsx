import React from 'react';
import { useGame } from '../context/GameContext';

interface FloatingCombatDisplayProps {
  targetId: string;
}

export const FloatingCombatDisplay: React.FC<FloatingCombatDisplayProps> = ({ targetId }) => {
  const { floatingCombatTexts } = useGame();
  const activeTexts = (floatingCombatTexts || []).filter(f => f.targetId === targetId);

  if (activeTexts.length === 0) return null;

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-40 overflow-visible">
      {activeTexts.map(item => {
        const typeClasses = {
          damage: 'bg-red-600/95 text-white border-2 border-yellow-300 shadow-[0_0_20px_rgba(220,38,38,0.95)]',
          reaction: 'bg-rose-950/95 text-amber-200 border-2 border-red-500 shadow-[0_0_20px_rgba(185,28,28,0.9)]',
          death: 'bg-black/95 text-red-400 border-2 border-red-600 shadow-[0_0_25px_rgba(0,0,0,0.9)]',
          treasure: 'btn-fantasy-gold text-amber-950 border-2 border-yellow-200 shadow-[0_0_20px_rgba(234,179,8,0.9)]',
          heal: 'bg-emerald-600/95 text-white border-2 border-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.9)]',
        }[item.type];

        return (
          <div
            key={item.id}
            className={`animate-floating-damage px-3 py-1.5 rounded-xl font-black font-cinzel text-xs sm:text-sm tracking-wider uppercase backdrop-blur-sm ${typeClasses} my-1`}
          >
            {item.text}
          </div>
        );
      })}
    </div>
  );
};
