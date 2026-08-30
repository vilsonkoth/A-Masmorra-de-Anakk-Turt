import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { X, Users, Bot, Play, Shield, Swords } from 'lucide-react';

interface NewGameModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewGameModal: React.FC<NewGameModalProps> = ({ isOpen, onClose }) => {
  const { startNewGame } = useGame();
  const [mode, setMode] = useState<'SOLO_BOTS' | 'LOCAL_HUMANS'>('SOLO_BOTS');
  const [totalPlayers, setTotalPlayers] = useState<number>(4);
  const [playerNames, setPlayerNames] = useState<string[]>([
    'Aventureiro',
    'Jogador 2',
    'Jogador 3',
    'Jogador 4',
    'Jogador 5',
    'Jogador 6'
  ]);

  if (!isOpen) return null;

  const handleStart = () => {
    if (mode === 'SOLO_BOTS') {
      const humanCount = 1;
      const botCount = totalPlayers - 1;
      startNewGame(humanCount, botCount, [playerNames[0]]);
    } else {
      startNewGame(totalPlayers, 0, playerNames.slice(0, totalPlayers));
    }
    onClose();
  };

  const handleNameChange = (idx: number, name: string) => {
    setPlayerNames(prev => {
      const updated = [...prev];
      updated[idx] = name;
      return updated;
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="playmat-surface border-2 border-[#d4af37] rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-[0_0_50px_rgba(212,175,55,0.35)] space-y-5 animate-in fade-in zoom-in-95 duration-200 card-3d">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#3d2e22] pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-[#2a1d15] to-[#140e0a] border border-[#d4af37]/60 flex items-center justify-center text-[#d4af37] shadow">
              <Swords size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-amber-100 font-cinzel uppercase tracking-wider">
                NOVA PARTIDA NA MESA
              </h2>
              <p className="text-xs text-amber-200/60 font-mono">
                Configure os aventureiros e bots (2 a 6 jogadores)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-amber-200/60 hover:text-white p-2 rounded-lg bg-[#1a140f] border border-[#3d2e22] transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-amber-200/80 font-mono uppercase tracking-wider">Modo de Jogo:</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setMode('SOLO_BOTS')}
              className={`p-3.5 rounded-2xl border-2 text-left flex flex-col justify-between transition cursor-pointer ${
                mode === 'SOLO_BOTS'
                  ? 'border-[#d4af37] bg-gradient-to-b from-[#2a1d13] to-[#140d08] text-amber-100 shadow-xl'
                  : 'border-[#3d2e22] bg-[#140e0b] text-amber-200/50 hover:border-[#d4af37]/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Bot size={18} className={mode === 'SOLO_BOTS' ? 'text-yellow-400' : 'text-gray-400'} />
                <span className="font-black text-xs font-cinzel uppercase tracking-wider">Você vs Bots</span>
              </div>
              <p className="text-[10px] text-amber-200/60 mt-1.5 font-mono leading-relaxed">
                Jogue sozinho contra guardiões controlados pela inteligência da Masmorra.
              </p>
            </button>

            <button
              onClick={() => setMode('LOCAL_HUMANS')}
              className={`p-3.5 rounded-2xl border-2 text-left flex flex-col justify-between transition cursor-pointer ${
                mode === 'LOCAL_HUMANS'
                  ? 'border-[#d4af37] bg-gradient-to-b from-[#2a1d13] to-[#140d08] text-amber-100 shadow-xl'
                  : 'border-[#3d2e22] bg-[#140e0b] text-amber-200/50 hover:border-[#d4af37]/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users size={18} className={mode === 'LOCAL_HUMANS' ? 'text-yellow-400' : 'text-gray-400'} />
                <span className="font-black text-xs font-cinzel uppercase tracking-wider">Multijogador Local</span>
              </div>
              <p className="text-[10px] text-amber-200/60 mt-1.5 font-mono leading-relaxed">
                Pass-and-play para 2 a 6 jogadores dividindo a mesma mesa.
              </p>
            </button>
          </div>
        </div>

        {/* Number of Players */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold text-amber-200/80 font-mono">
            <span>Quantidade Total de Jogadores:</span>
            <span className="text-yellow-400 font-black">{totalPlayers} Jogadores</span>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {[2, 3, 4, 5, 6].map(num => (
              <button
                key={num}
                onClick={() => setTotalPlayers(num)}
                className={`py-2 rounded-xl text-xs transition cursor-pointer border-2 font-mono ${
                  totalPlayers === num
                    ? 'btn-fantasy-gold text-black shadow-md font-black'
                    : 'bg-[#140e0b] border-[#3d2e22] text-amber-200/60 hover:border-[#d4af37]/50'
                }`}
              >
                {num}P
              </button>
            ))}
          </div>
        </div>

        {/* Player Names Configuration */}
        <div className="space-y-2 max-h-44 overflow-y-auto pr-1 scrollbar-thin">
          <label className="text-xs font-bold text-amber-200/80 font-mono uppercase tracking-wider">Nomes dos Jogadores:</label>
          <div className="space-y-2">
            {Array.from({ length: totalPlayers }).map((_, idx) => {
              const isBot = mode === 'SOLO_BOTS' && idx > 0;

              return (
                <div key={idx} className="flex items-center gap-2 font-mono">
                  <span className="text-xs font-bold text-amber-200/70 w-16">
                    {idx === 0 ? 'Você (P1):' : `P${idx + 1}:`}
                  </span>
                  <input
                    type="text"
                    disabled={isBot}
                    value={isBot ? `Guardião Bot ${idx}` : playerNames[idx] || `Jogador ${idx + 1}`}
                    onChange={e => handleNameChange(idx, e.target.value)}
                    className="flex-1 text-xs bg-[#140e0b] border border-[#3d2e22] rounded-xl px-3 py-2 text-amber-100 focus:outline-none focus:border-[#d4af37] disabled:opacity-50 font-cinzel"
                  />
                  {isBot && (
                    <span className="text-[9px] bg-red-950 text-red-300 px-2 py-1 rounded border border-red-800 uppercase font-bold">
                      BOT IA
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Start Button */}
        <div className="pt-2 border-t border-[#3d2e22] flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-[#1a140f] hover:bg-[#2a1e16] text-amber-200/70 text-xs font-bold uppercase rounded-xl border border-[#3d2e22] transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleStart}
            className="flex-2 py-2.5 btn-fantasy-gold text-black text-xs font-black uppercase tracking-wider rounded-xl shadow-xl transition flex items-center justify-center gap-2 cursor-pointer active:scale-98 font-cinzel"
          >
            <Play size={15} />
            <span>Iniciar Partida</span>
          </button>
        </div>
      </div>
    </div>
  );
};

