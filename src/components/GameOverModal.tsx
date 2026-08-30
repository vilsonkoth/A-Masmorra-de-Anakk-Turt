import React from 'react';
import { useGame } from '../context/GameContext';
import { Trophy, Coins, RotateCcw, Skull, Sparkles } from 'lucide-react';

interface GameOverModalProps {
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ onRestart }) => {
  const { isGameOver, winner, players, dungeonGraveyard } = useGame();

  if (!isGameOver) return null;

  const sortedRanking = [...players].sort((a, b) => b.treasures - a.treasures);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="playmat-surface border-2 border-[#d4af37] rounded-3xl max-w-lg w-full p-6 text-center space-y-6 shadow-[0_0_60px_rgba(212,175,55,0.5)] animate-in zoom-in-95 duration-300 relative overflow-hidden card-3d">
        {/* Ambient Glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#d4af37]/15 via-transparent to-[#8b0000]/30 pointer-events-none" />

        {/* Trophy Icon */}
        <div className="w-20 h-20 mx-auto rounded-3xl btn-fantasy-gold flex items-center justify-center text-4xl shadow-2xl border-2 border-yellow-300 animate-bounce text-black">
          🏆
        </div>

        <div>
          <h2 className="text-2xl font-black text-[#d4af37] font-cinzel tracking-wider uppercase drop-shadow">
            A MASMORRA FOI CONQUISTADA!
          </h2>
          <p className="text-xs text-amber-200/70 mt-1 font-mono">
            Todos os desafios de Anakk Tur foram superados na mesa.
          </p>
        </div>

        {/* Winner Showcase */}
        {winner && (
          <div className="bg-[#140e0b] border-2 border-[#d4af37] p-4 rounded-2xl space-y-2 shadow-xl card-3d">
            <span className="text-[11px] font-black text-[#d4af37] uppercase tracking-widest font-mono">
              Grande Campeão da Masmorra
            </span>
            <div className="text-2xl font-black text-amber-100 font-cinzel flex items-center justify-center gap-2">
              <span>{winner.avatar}</span>
              <span>{winner.name}</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 text-yellow-400 font-black text-sm font-mono">
              <Coins size={18} className="text-yellow-400" />
              <span>{winner.treasures} Marcadores de Tesouro Acumulados</span>
            </div>
          </div>
        )}

        {/* Full Ranking Table */}
        <div className="space-y-2 text-left">
          <h4 className="text-xs font-bold text-amber-200/70 uppercase tracking-wider font-mono">
            Placar Final de Tesouros da Mesa:
          </h4>
          <div className="bg-[#140e0b] rounded-2xl border border-[#3d2e22] overflow-hidden divide-y divide-[#3d2e22] text-xs font-mono shadow-md">
            {sortedRanking.map((p, rank) => (
              <div key={p.id} className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                    rank === 0
                      ? 'btn-fantasy-gold text-black font-black'
                      : 'bg-[#1e150f] text-amber-200/80 border border-[#3d2e22]'
                  }`}>
                    {rank + 1}º
                  </span>
                  <span className="font-bold text-amber-100 font-cinzel text-sm">{p.name}</span>
                </div>
                <div className="flex items-center gap-1.5 text-yellow-400 font-black">
                  <Coins size={15} className="text-yellow-400" />
                  <span>{p.treasures} Tesouros</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Play Again Button */}
        <button
          onClick={onRestart}
          className="w-full py-3.5 btn-fantasy-gold text-xs uppercase font-black tracking-widest rounded-xl shadow-xl transition active:scale-98 cursor-pointer flex items-center justify-center gap-2 font-cinzel"
        >
          <RotateCcw size={16} />
          <span>Jogar Novamente</span>
        </button>
      </div>
    </div>
  );
};

