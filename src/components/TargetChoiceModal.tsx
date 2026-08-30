import React from 'react';
import { PendingTargetChoice } from '../types/game';
import { CardImage } from './CardImage';
import { Sparkles, Check, X } from 'lucide-react';

interface TargetChoiceModalProps {
  choice: PendingTargetChoice;
  onSelect: (optionId: string) => void;
  onCancel?: () => void;
}

export const TargetChoiceModal: React.FC<TargetChoiceModalProps> = ({ choice, onSelect, onCancel }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-[#241712] via-[#1a100c] to-[#120b08] rounded-2xl max-w-2xl w-full p-5 shadow-[0_0_40px_rgba(212,175,55,0.4)] space-y-4 border-2 border-[#d4af37] animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#4d3624] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-950 border border-yellow-500/60 flex items-center justify-center text-yellow-400 shadow">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="text-base font-black text-amber-100 font-cinzel uppercase tracking-wider">
                {choice.title}
              </h3>
              <p className="text-xs text-[#d4af37] font-mono">
                Efeito Ativado por: <span className="font-bold underline">{choice.sourceCardName}</span>
              </p>
            </div>
          </div>

          {choice.onCancel && (
            <button
              onClick={choice.onCancel}
              className="p-1.5 rounded-lg bg-[#2a1d15] hover:bg-[#3d2a1f] text-gray-400 hover:text-white border border-[#4d3624] cursor-pointer"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Description */}
        <div className="bg-[#120b08] p-3 rounded-xl border border-[#3d2a1f]">
          <p className="text-xs text-amber-200/90 font-mono italic">
            "{choice.description}"
          </p>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-1">
          {choice.options.map((opt) => {
            const card = opt.card;

            return (
              <div
                key={opt.id}
                onClick={() => onSelect(opt.id)}
                className="group p-2.5 rounded-xl border-2 border-[#4d3624] hover:border-[#d4af37] bg-gradient-to-b from-[#1c120d] to-[#100a07] hover:from-[#2a1d15] hover:to-[#160f0b] flex flex-col justify-between transition-all duration-200 cursor-pointer shadow hover:shadow-[0_0_20px_rgba(212,175,55,0.35)] hover:scale-[1.02]"
              >
                <div className="space-y-2">
                  {/* Card Art if present */}
                  {card && (
                    <div className="h-24 w-full rounded-lg overflow-hidden bg-black border border-[#3d2a1f] relative flex items-center justify-center">
                      <CardImage
                        card={card}
                        alt={card.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute bottom-1 left-1 bg-black/80 text-yellow-400 text-[9px] font-mono font-black px-1.5 py-0.5 rounded border border-yellow-500/40">
                        {card.diceCount}d | {card.maxHp} HP
                      </div>
                    </div>
                  )}

                  {/* Card Info */}
                  <div>
                    <h4 className="text-xs font-black text-amber-100 font-cinzel uppercase group-hover:text-yellow-400 transition truncate">
                      {opt.label}
                    </h4>
                    {opt.sublabel && (
                      <p className="text-[10px] text-amber-200/60 font-mono mt-0.5 line-clamp-2">
                        {opt.sublabel}
                      </p>
                    )}
                  </div>
                </div>

                {/* Selection button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(opt.id);
                  }}
                  className="w-full mt-2.5 py-1 px-2 btn-fantasy-gold text-[10px] uppercase font-black rounded-lg cursor-pointer flex items-center justify-center gap-1 shadow group-hover:brightness-110"
                >
                  <Check size={12} />
                  <span>Escolher</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
