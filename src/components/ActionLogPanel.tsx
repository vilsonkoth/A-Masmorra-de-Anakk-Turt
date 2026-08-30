import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { ScrollText, X, Swords, Coins, Sparkles, Skull, Layers } from 'lucide-react';

interface ActionLogPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ActionLogPanel: React.FC<ActionLogPanelProps> = ({ isOpen, onClose }) => {
  const { gameLogs } = useGame();
  const [filter, setFilter] = useState<'ALL' | 'COMBAT' | 'EFFECT' | 'TREASURE'>('ALL');

  if (!isOpen) return null;

  const filteredLogs = gameLogs.filter(log => {
    if (filter === 'COMBAT') return log.type === 'combat' || log.type === 'reaction' || log.type === 'death';
    if (filter === 'EFFECT') return log.type === 'effect' || log.type === 'event';
    if (filter === 'TREASURE') return log.type === 'treasure';
    return true;
  });

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'combat':
      case 'reaction':
        return <Swords size={14} className="text-red-400" />;
      case 'treasure':
        return <Coins size={14} className="text-yellow-400" />;
      case 'effect':
      case 'event':
        return <Sparkles size={14} className="text-cyan-400" />;
      case 'death':
        return <Skull size={14} className="text-purple-400" />;
      case 'card_play':
        return <Layers size={14} className="text-amber-400" />;
      default:
        return <ScrollText size={14} className="text-amber-200" />;
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md playmat-surface border-l-2 border-[#d4af37]/60 shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col animate-in slide-in-from-right duration-200 card-3d">
      {/* Header */}
      <div className="p-4 border-b border-[#3d2e22] flex items-center justify-between bg-[#140e0b]">
        <div className="flex items-center gap-2.5">
          <ScrollText size={20} className="text-[#d4af37]" />
          <div>
            <h3 className="text-sm font-black text-amber-100 font-cinzel uppercase tracking-wider">
              CRÔNICA DE BATALHA & LOGS
            </h3>
            <p className="text-[11px] text-amber-200/60 font-mono">Registro cronológico das ações</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-amber-200/60 hover:text-white p-1.5 rounded-lg bg-[#1a140f] border border-[#3d2e22] transition cursor-pointer"
        >
          <X size={18} />
        </button>
      </div>

      {/* Filter Chips */}
      <div className="p-3 border-b border-[#3d2e22] bg-[#120e0b] flex gap-1.5 overflow-x-auto text-[11px] font-mono">
        {[
          { id: 'ALL', label: 'Todos' },
          { id: 'COMBAT', label: 'Combates' },
          { id: 'EFFECT', label: 'Efeitos' },
          { id: 'TREASURE', label: 'Tesouros' },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as any)}
            className={`px-3 py-1 rounded-lg uppercase tracking-wider text-[10px] font-black transition cursor-pointer ${
              filter === f.id
                ? 'btn-fantasy-gold shadow-md'
                : 'bg-[#18110b] text-amber-200/60 hover:text-white border border-[#3d2e22]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Logs List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5 scrollbar-thin">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-10 text-amber-200/40 text-xs font-mono">
            Nenhum evento registrado nesta categoria.
          </div>
        ) : (
          filteredLogs.map(log => (
            <div
              key={log.id}
              className="p-3 rounded-xl bg-[#140e0b]/90 border border-[#3d2e22] text-xs space-y-1.5 shadow-md card-3d"
            >
              <div className="flex items-center justify-between text-[10px] text-amber-200/50 font-mono">
                <div className="flex items-center gap-1.5 font-bold text-amber-100">
                  {getLogIcon(log.type)}
                  <span>{log.playerName}</span>
                  <span className="text-[#d4af37] font-black">• Rodada {log.round}</span>
                </div>
                <span>{log.timestamp}</span>
              </div>
              <p className="text-amber-100/90 text-[11px] leading-relaxed pl-5 font-sans">
                {log.message}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

