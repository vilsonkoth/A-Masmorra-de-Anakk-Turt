import React from 'react';
import { useGame } from '../context/GameContext';
import { Skull, AlertTriangle, Shield, Heart } from 'lucide-react';

export const SacrificeModal: React.FC = () => {
  const { pendingSacrifice, players, sacrificeRaider } = useGame();

  if (!pendingSacrifice) return null;

  const { pendingCard, playerIndex } = pendingSacrifice;
  const player = players[playerIndex];
  if (!player) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="playmat-surface border-2 border-red-700 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-[0_0_50px_rgba(139,0,0,0.5)] space-y-4 animate-in fade-in zoom-in-95 duration-200 card-3d">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-[#3d2e22] pb-3">
          <div className="w-10 h-10 rounded-xl bg-red-950/80 border border-red-600 flex items-center justify-center text-red-400 shadow-md">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-red-400 font-cinzel uppercase tracking-wider">
              LIMITE DE SAQUEADORES (MÁXIMO 4)
            </h3>
            <p className="text-xs text-amber-200/70 font-mono">
              Você está convocando <span className="text-yellow-400 font-bold">{pendingCard.name}</span> para a mesa.
            </p>
          </div>
        </div>

        <div className="text-xs text-amber-100 bg-[#140e0b] p-3.5 rounded-xl border border-[#3d2e22] leading-relaxed">
          ⚠️ <span className="font-bold text-yellow-400 font-cinzel">Regra Oficial:</span> Escolha 1 dos seus saqueadores em campo para ser <span className="text-red-400 font-black uppercase">sacrificado</span> e abrir espaço. Se possuir "ÚLTIMO SUSPIRO", seu efeito será ativado.
        </div>

        {/* 4 Raiders Selection Cards */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          {(player?.field || []).map(raider => {
            const hasUltimoSuspiro = raider.keywords.includes('ULTIMO_SUSPIRO');

            return (
              <div
                key={raider.id}
                onClick={() => sacrificeRaider(raider.id)}
                className="p-3 bg-[#140e0b] border-2 border-[#3d2e22] hover:border-red-500 rounded-2xl cursor-pointer transition-all hover:scale-[1.02] shadow-lg flex flex-col justify-between h-32 group card-3d"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-100 group-hover:text-red-300 truncate font-cinzel">
                      {raider.name}
                    </span>
                    {hasUltimoSuspiro && (
                      <span className="text-[8px] bg-purple-950 text-purple-200 px-1.5 py-0.5 rounded border border-purple-600 font-mono font-bold">
                        ÚLTIMO SUSPIRO
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-amber-200/50 mt-1 font-mono uppercase">
                    Tipo: {raider.type}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-semibold pt-1.5 border-t border-[#3d2e22] font-mono">
                  <span className="text-red-400 flex items-center gap-1 font-bold">
                    <Heart size={12} /> {raider.maxHp - raider.damage}/{raider.maxHp} HP
                  </span>
                  <span className="btn-fantasy-crimson text-[10px] text-white font-bold px-2 py-0.5 rounded group-hover:scale-105 uppercase flex items-center gap-0.5 shadow-md">
                    <Skull size={12} /> Sacrificar
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

