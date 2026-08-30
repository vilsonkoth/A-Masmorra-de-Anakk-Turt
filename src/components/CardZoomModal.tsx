import React from 'react';
import { useGame } from '../context/GameContext';
import { isMonster, isEvent, RaiderCard, MonsterCard, EventCard, RaiderType } from '../types/game';
import { CardImage } from './CardImage';
import {
  X,
  Heart,
  Swords,
  Coins,
  Shield,
  Sparkles,
  Flame,
  Skull,
  Gem,
  Compass,
  ArrowDownCircle,
  Eye
} from 'lucide-react';

export const CardZoomModal: React.FC = () => {
  const {
    inspectedCard,
    inspectCard,
    turnPhase,
    activePlayerIndex,
    hasDrawnOrPlayedInPhase1,
    hasDrawnOrPlayedInPhase3,
    playCardFromHand,
    activePlayer,
  } = useGame();

  if (!inspectedCard) return null;

  const isRaider = 'type' in inspectedCard;
  const isMonst = isMonster(inspectedCard);
  const isEv = isEvent(inspectedCard);
  const isTreasure = inspectedCard.name.includes('Tesouro');

  const getTypeColor = (type?: RaiderType) => {
    switch (type) {
      case 'Combatente':
        return 'border-red-500 bg-red-950/60 text-red-300';
      case 'Conjurador':
        return 'border-purple-500 bg-purple-950/60 text-purple-300';
      case 'Fera':
        return 'border-emerald-500 bg-emerald-950/60 text-emerald-300';
      default:
        return 'border-neutral-600 bg-neutral-900 text-neutral-300';
    }
  };

  const getTypeIcon = (type?: RaiderType) => {
    switch (type) {
      case 'Combatente':
        return '⚔️';
      case 'Conjurador':
        return '🔮';
      case 'Fera':
        return '🐺';
      default:
        return '🎴';
    }
  };

  const isCardInHand = isRaider && (activePlayer?.hand || []).some(c => c.id === inspectedCard.id);
  const canPlayNow = isCardInHand && (
    (turnPhase === 'PREPARAR' && !hasDrawnOrPlayedInPhase1) ||
    (turnPhase === 'REAGRUPAR' && !hasDrawnOrPlayedInPhase3)
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 transition-all animate-fade-in"
      onClick={() => inspectCard(null)}
    >
      <div
        className="bg-gradient-to-b from-[#241611] via-[#170e0a] to-[#0d0705] border-2 border-[#d4af37] rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-[0_0_50px_rgba(212,175,55,0.4)] relative flex flex-col space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header with Card Name & Close Button */}
        <div className="flex items-center justify-between border-b border-[#4d3221] pb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xl">
              {isRaider ? getTypeIcon((inspectedCard as RaiderCard).type) : isTreasure ? '💎' : isMonst ? '🐉' : '⚡'}
            </span>
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl font-black text-amber-100 font-cinzel uppercase tracking-wider truncate">
                {inspectedCard.name}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                {isRaider && (
                  <span className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full border ${getTypeColor((inspectedCard as RaiderCard).type)} font-mono uppercase`}>
                    {(inspectedCard as RaiderCard).type}
                  </span>
                )}
                {isMonst && (
                  <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full border border-yellow-500/80 bg-amber-950/80 text-yellow-300 font-mono uppercase">
                    {(inspectedCard as MonsterCard).isBoss ? '👑 CHEFÃO DA MASMORRA' : `NÍVEL ${(inspectedCard as MonsterCard).level}`}
                  </span>
                )}
                {isEv && (
                  <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full border border-cyan-500/80 bg-cyan-950/80 text-cyan-200 font-mono uppercase">
                    ⚡ EVENTO DA MASMORRA
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => inspectCard(null)}
            className="w-8 h-8 rounded-full bg-[#2d1b14] hover:bg-[#4a2e22] text-amber-200 flex items-center justify-center transition border border-[#5a3a2a] cursor-pointer"
            title="Fechar (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Large Card Art Showcase - 100% complete card artwork display */}
        <div className="h-64 sm:h-80 w-full rounded-xl overflow-hidden bg-[#0a0504] border-2 border-[#5a3a2a] shadow-inner relative flex items-center justify-center p-2 group">
          <CardImage
            card={inspectedCard}
            alt={inspectedCard.name}
            className="w-full h-full object-contain card-image-intact"
          />

          {/* Quick Floating Stat Tags on Art */}
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none">
            {'maxHp' in inspectedCard && (
              <div className="bg-black/85 border border-red-500/80 text-red-400 px-2.5 py-1 rounded-lg text-xs font-black font-mono flex items-center gap-1 shadow-lg backdrop-blur-sm">
                <Heart size={14} className="fill-red-500" />
                <span>{inspectedCard.maxHp - (inspectedCard.damage || 0)} / {inspectedCard.maxHp} HP</span>
              </div>
            )}
            {'diceCount' in inspectedCard && (
              <div className="bg-black/85 border border-yellow-500/80 text-yellow-300 px-2.5 py-1 rounded-lg text-xs font-black font-mono flex items-center gap-1 shadow-lg backdrop-blur-sm">
                <Swords size={14} />
                <span>{inspectedCard.diceCount} Dados de Ataque</span>
              </div>
            )}
            {'treasureReward' in inspectedCard && inspectedCard.treasureReward > 0 && (
              <div className="bg-black/85 border border-yellow-400 text-yellow-300 px-2.5 py-1 rounded-lg text-xs font-black font-mono flex items-center gap-1 shadow-lg backdrop-blur-sm">
                <Coins size={14} className="text-yellow-400" />
                <span>+{inspectedCard.treasureReward} Tesouro</span>
              </div>
            )}
          </div>
        </div>

        {/* Card Attributes & Keywords Box */}
        <div className="space-y-2 text-xs font-mono">
          {/* Keywords */}
          {isRaider && (inspectedCard as RaiderCard).keywords.length > 0 && (
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-[10px] text-amber-300/60 uppercase font-cinzel font-bold">Palavras-chave:</span>
              {(inspectedCard as RaiderCard).keywords.map((kw, i) => (
                <span
                  key={i}
                  className="badge-gold px-2 py-0.5 rounded text-[10px] font-black uppercase font-mono tracking-wider"
                >
                  {kw}
                </span>
              ))}
            </div>
          )}

          {/* Effect Description */}
          <div className="bg-[#140b08] p-3 rounded-xl border border-[#4a2e20] space-y-1">
            <div className="text-[10px] font-bold text-[#d4af37] uppercase tracking-wider font-cinzel flex items-center gap-1">
              <Sparkles size={12} />
              <span>Efeito / Habilidade Especial:</span>
            </div>
            <p className="text-amber-100 text-xs sm:text-sm leading-relaxed italic">
              "{inspectedCard.effectDescription}"
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-[#4d3221]">
          {canPlayNow && (
            <button
              onClick={() => {
                playCardFromHand(inspectedCard.id, activePlayerIndex);
                inspectCard(null);
              }}
              className="flex-1 py-2 btn-fantasy-gold text-xs sm:text-sm uppercase font-black rounded-xl cursor-pointer flex items-center justify-center gap-1.5 shadow-lg border border-yellow-300"
            >
              <ArrowDownCircle size={15} />
              <span>Jogar no Campo de Batalha</span>
            </button>
          )}
          <button
            onClick={() => inspectCard(null)}
            className="flex-1 py-2 bg-[#2d1b14] hover:bg-[#3d241c] text-amber-200 text-xs sm:text-sm uppercase font-mono font-bold rounded-xl transition cursor-pointer border border-[#5a3a2a]"
          >
            Fechar Visualização
          </button>
        </div>
      </div>
    </div>
  );
};
