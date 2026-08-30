import React, { useState, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { RaiderCard, RaiderType } from '../types/game';
import { CardImage } from './CardImage';
import { FloatingCombatDisplay } from './FloatingCombatDisplay';
import { TargetChoiceModal } from './TargetChoiceModal';
import { FlamingTorch } from './FlamingTorch';
import {
  Shield,
  Swords,
  Coins,
  Sparkles,
  Heart,
  ArrowDownCircle,
  Dices,
  Layers,
  Hand,
  Gem,
  Search,
  Crosshair,
} from 'lucide-react';

export const PlayerPlaymat: React.FC = () => {
  const {
    activePlayer,
    activePlayerIndex,
    turnPhase,
    hasDrawnOrPlayedInPhase1,
    hasDrawnOrPlayedInPhase3,
    selectedAttackerId,
    pendingTargetChoice,
    resolveTargetChoice,
    cancelTargetChoice,
    playCardFromHand,
    selectAttacker,
    attackDungeonMonster,
    useRaiderAbility,
    playmatTextures,
    inspectCard,
    startTargeting,
    drawCard,
    raiderDeck,
  } = useGame();

  const [isDiamondTooltipOpen, setIsDiamondTooltipOpen] = useState(false);

  const getTypeColor = (type: RaiderType) => {
    switch (type) {
      case 'Combatente':
        return 'border-red-600/70 bg-red-950/40 text-red-300';
      case 'Conjurador':
        return 'border-purple-600/70 bg-purple-950/40 text-purple-300';
      case 'Fera':
        return 'border-emerald-600/70 bg-emerald-950/40 text-emerald-300';
      default:
        return 'border-neutral-700 bg-neutral-900 text-neutral-300';
    }
  };

  const getTypeIcon = (type: RaiderType) => {
    switch (type) {
      case 'Combatente':
        return '⚔️';
      case 'Conjurador':
        return '🔮';
      case 'Fera':
        return '🐺';
    }
  };

  const canPerformStepAction = () => {
    if (turnPhase === 'PREPARAR') return !hasDrawnOrPlayedInPhase1;
    if (turnPhase === 'REAGRUPAR') return !hasDrawnOrPlayedInPhase3;
    return false;
  };

  const totalDiceInField = (activePlayer?.field || []).reduce((acc, r) => acc + (r.diceCount || 0), 0);
  const handCards = activePlayer?.hand || [];
  const treasureCount = activePlayer?.treasures || 0;
  const victoryProgress = Math.min(100, Math.round((treasureCount / 5) * 100));

  return (
    <div className="w-full flex flex-col space-y-2 relative">
      
      {/* Interactive Target Choice Modal (for Adentrar effects like Necromante / Skiirk) */}
      {pendingTargetChoice && (
        <TargetChoiceModal
          choice={pendingTargetChoice}
          onSelect={resolveTargetChoice}
          onCancel={cancelTargetChoice}
        />
      )}

      {/* Player Header Bar: Identity + Dice + Diamond Treasure Counter */}
      <div
        className="px-3 py-1.5 flex items-center justify-between relative"
      >
        {/* Left: Player Identity Badge with Animated Flaming Torch */}
        <div className="flex items-center gap-2 min-w-0">
          <FlamingTorch isActive={true} size="md" className="-my-1 flex-shrink-0" />
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shadow border border-[#d4af37]/60 font-bold flex-shrink-0"
            style={{ backgroundColor: activePlayer?.color || '#8b0000' }}
          >
            {activePlayer?.avatar || '⚔️'}
          </div>
          <div className="min-w-0">
            <div className="text-xs sm:text-sm font-black text-amber-100 font-cinzel uppercase truncate flex items-center gap-1.5">
              <span>{activePlayer?.name}</span>
              <span className="text-[10px] text-amber-400 font-mono font-normal">({activePlayer?.field?.length || 0}/4 em campo)</span>
            </div>
          </div>
        </div>

        {/* Right: Total Dice + DIAMOND TREASURE COUNTER WITH TOOLTIP */}
        <div className="flex items-center gap-2.5 text-xs font-mono flex-shrink-0">
          {/* Total Attack Dice in Field */}
          <div className="flex items-center gap-1 bg-[#100a07] px-2.5 py-0.5 rounded border border-[#3d281a] text-emerald-300 shadow-inner">
            <Dices size={13} className="text-emerald-400" />
            <span className="font-bold">{totalDiceInField}d</span>
          </div>

          {/* DIAMOND TREASURE COUNTER (Faceted Gem with rich Tooltip) */}
          <div
            className="relative cursor-pointer"
            onMouseEnter={() => setIsDiamondTooltipOpen(true)}
            onMouseLeave={() => setIsDiamondTooltipOpen(false)}
            onClick={() => setIsDiamondTooltipOpen(prev => !prev)}
          >
            <div className="bg-gradient-to-r from-amber-950 via-yellow-900 to-amber-950 border-2 border-yellow-400 px-3 py-0.5 rounded-lg flex items-center gap-1.5 font-black text-yellow-300 shadow-[0_0_15px_rgba(212,175,55,0.4)] hover:scale-105 transition-all">
              <span className="text-base animate-pulse">💎</span>
              <span className="text-sm font-cinzel">{treasureCount} / 5</span>
            </div>

            {/* Diamond Treasure Tooltip */}
            {isDiamondTooltipOpen && (
              <div className="absolute right-0 bottom-8 z-50 w-64 bg-[#180e0a] border-2 border-yellow-500 rounded-xl p-3 shadow-2xl text-left font-sans space-y-2 pointer-events-none animate-fade-in">
                <div className="flex items-center justify-between border-b border-yellow-500/40 pb-1">
                  <span className="text-xs font-black text-yellow-300 font-cinzel uppercase flex items-center gap-1">
                    💎 Tesouros de Anakk Tur
                  </span>
                  <span className="text-[10px] text-amber-200/80 font-mono font-bold">
                    {treasureCount}/5 ({victoryProgress}%)
                  </span>
                </div>

                <p className="text-[10px] text-amber-100/90 leading-tight">
                  Derrote Monstros da Masmorra ou saqueie oponentes para acumular tesouros. Ao atingir <strong>5 Tesouros</strong>, você vence o jogo imediatamente!
                </p>

                {/* Progress bar */}
                <div className="w-full h-2 bg-black rounded-full overflow-hidden border border-yellow-500/50">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-300 transition-all duration-500 shadow-[0_0_8px_rgba(234,179,8,0.8)]"
                    style={{ width: `${victoryProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4 BATTLEFIELD RAIDER SLOTS WITH DRAG-AND-DROP DROPZONES & ATTACK TARGETING */}
      <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
        {Array.from({ length: 4 }).map((_, slotIdx) => {
          const raider = activePlayer?.field?.[slotIdx];

          if (!raider) {
            return (
              <div
                key={`empty-slot-${slotIdx}`}
                className="h-44 sm:h-52 rounded-xl border border-dashed flex flex-col items-center justify-center gap-1.5 p-2 text-center transition-all duration-200 border-white/5 bg-transparent text-amber-200/10 hover:border-[#d4af37]/20"
              >
                <div className="w-6 h-6 rounded-lg bg-black/40 flex items-center justify-center text-[10px] font-bold text-amber-200/20 border border-white/5 font-mono">
                  {slotIdx + 1}
                </div>
              </div>
            );
          }

          const isSelected = selectedAttackerId === raider.id;
          const canAct = turnPhase === 'MASMORRA' && !raider.hasActedThisTurn;
          const hasDefender = raider.keywords.includes('DEFENSOR');

          return (
            <div
              key={raider.id}
              onDoubleClick={() => inspectCard(raider)}
              onClick={() => {
                if (turnPhase === 'MASMORRA') {
                  selectAttacker(isSelected ? null : raider.id);
                }
              }}
              className={`h-44 sm:h-52 rounded-xl border transition-all duration-200 flex flex-col justify-between overflow-hidden relative cursor-pointer group ${
                isSelected
                  ? 'border-[#d4af37] ring-2 ring-[#d4af37]/70 bg-gradient-to-b from-[#2a1e12] to-[#140e08] shadow-[0_0_18px_rgba(212,175,55,0.7)] scale-[1.02] z-20'
                  : canAct
                  ? 'border-[#5a422e] hover:border-[#d4af37] bg-gradient-to-b from-[#1c140e] to-[#100b08] shadow-md hover:scale-[1.01]'
                  : 'border-[#2d1e14] bg-[#0e0906] opacity-75'
              }`}
            >
              {/* Floating Combat Numbers */}
              <FloatingCombatDisplay targetId={raider.id} />

              {/* Slot Header: Type & DEF & Zoom Icon */}
              <div className="px-2 py-1 flex items-center justify-between bg-black/40 border-b border-[#2d1e14]/50 z-10 absolute top-0 left-0 right-0">
                <span className="text-[9px] font-bold text-amber-100 flex items-center gap-1 font-mono uppercase truncate text-shadow-sm">
                  {getTypeIcon(raider.type)} {raider.name}
                </span>
                <div className="flex items-center gap-1">
                  {hasDefender && (
                    <span className="badge-gold text-[7px] font-black px-1 rounded flex-shrink-0 font-mono">
                      DEF
                    </span>
                  )}
                  {/* Zoom button on hover */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      inspectCard(raider);
                    }}
                    className="w-4 h-4 rounded-full bg-black/80 hover:bg-yellow-400 text-yellow-300 hover:text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow"
                    title="Ampliar Carta (Duplo Clique)"
                  >
                    <Search size={9} />
                  </button>
                </div>
              </div>

              {/* Top-Right HP Indicator */}
              <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-red-950 border-2 border-red-500 shadow-md flex items-center justify-center text-red-100 font-bold font-mono text-[10px] z-30">
                {raider.maxHp - raider.damage}
              </div>

              {/* Art Area - Complete card artwork display */}
              <div className="h-full w-full relative bg-transparent flex flex-col items-center justify-center p-0.5 pt-4 pb-4">
                <CardImage
                  card={raider}
                  alt={raider.name}
                  fallbackIcon={<span className="text-2xl opacity-20">{getTypeIcon(raider.type)}</span>}
                  className="w-full h-full object-contain card-image-intact group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Bottom-Center Dice Indicator */}
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-yellow-950 border-2 border-yellow-500 shadow-md px-1.5 py-0.5 rounded-full text-yellow-200 font-black font-mono text-[9px] z-30 flex items-center gap-0.5">
                {raider.diceCount} <Swords size={9} />
              </div>

              {/* Status & Actions Overlay (Active Ability / Acted check) */}
              <div className="absolute bottom-3 left-1 right-1 z-20 flex flex-col gap-1">
                {turnPhase === 'MASMORRA' && !raider.hasActedThisTurn && (raider.activeAbility || raider.effectDescription.toLowerCase().includes('habilidade ativa') || raider.name.toLowerCase().includes('assassina') || raider.name.toLowerCase().includes('azram') || raider.name.toLowerCase().includes('sacerdotisa')) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      useRaiderAbility(raider.id);
                    }}
                    className="w-full py-0.5 px-1 bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-900 hover:from-purple-800 hover:to-indigo-800 text-purple-200 border border-purple-400/80 rounded text-[8px] font-cinzel font-bold uppercase flex items-center justify-center gap-1 shadow-md hover:brightness-110 active:scale-95 transition cursor-pointer"
                  >
                    <Sparkles size={8} className="text-purple-300" />
                    <span>Habilidade</span>
                  </button>
                )}
                {turnPhase === 'MASMORRA' && raider.hasActedThisTurn && (
                  <div className="text-[8px] text-gray-400 font-mono text-center py-0.5 uppercase bg-black/80 rounded border border-[#2d1e14]">
                    ✓ Já agiu
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* OVERLAPPING FAN HAND SECTION WITH DRAG-AND-DROP & ZOOM */}
      <div className="w-full relative pt-1 pb-1">
        <div className="flex items-center justify-between px-1 mb-1 gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-amber-200/80 font-cinzel uppercase tracking-wider flex items-center gap-1">
              <Sparkles size={11} className="text-[#d4af37]" />
              <span>Sua Mão ({handCards.length})</span>
            </span>
            {canPerformStepAction() && (
              <span className="text-[8px] bg-amber-950/80 text-yellow-300 border border-yellow-500/60 px-1.5 py-0.2 rounded uppercase font-mono font-bold animate-pulse">
                Ação Disponível (1/1)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {canPerformStepAction() && (
              <button
                onClick={() => drawCard(activePlayerIndex)}
                className="text-[8px] sm:text-[9px] bg-gradient-to-r from-yellow-500 via-amber-300 to-yellow-500 text-yellow-950 px-2 py-0.5 rounded-md font-black font-cinzel uppercase flex items-center gap-1 shadow-md hover:brightness-110 active:scale-95 animate-deck-glow cursor-pointer border border-yellow-200"
                title="Clique para Comprar 1 Carta de Saqueador do Baralho"
              >
                <Hand size={10} className="text-yellow-950" />
                <span>COMPRAR DO BARALHO ({raiderDeck.length})</span>
              </button>
            )}
            <span className="text-[9px] text-amber-200/50 font-mono hidden sm:inline">
              {canPerformStepAction() ? 'Arraste para o campo OU compre do baralho' : 'Ações de mão no Passo 1 e 3'}
            </span>
          </div>
        </div>

        {handCards.length === 0 ? (
          <div className="text-center py-3 text-amber-200/60 text-[10px] bg-[#100b08]/70 rounded-xl border border-dashed border-[#4a3625] font-mono flex flex-col items-center justify-center gap-1">
            <span>Mão vazia.</span>
            {canPerformStepAction() && (
              <button
                onClick={() => drawCard(activePlayerIndex)}
                className="mt-1 px-3 py-1 btn-fantasy-gold text-[9px] font-black uppercase font-cinzel rounded flex items-center gap-1 shadow cursor-pointer animate-bounce"
              >
                <Hand size={10} /> COMPRAR 1 CARTA DO BARALHO
              </button>
            )}
          </div>
        ) : (
          <div className="hand-fan-container relative flex justify-center items-end h-28 sm:h-32">
            {handCards.map((card, idx) => {
              const totalCards = handCards.length;
              const centerIdx = (totalCards - 1) / 2;
              const offsetFromCenter = idx - centerIdx;
              const rotationDeg = offsetFromCenter * 3;
              const translateY = Math.abs(offsetFromCenter) * 3;
              const overlapMargin = totalCards > 1 ? (totalCards > 6 ? '-ml-7 sm:-ml-9' : '-ml-5 sm:-ml-7') : '';

              return (
                <div
                  key={card.id}
                  onDoubleClick={() => inspectCard(card)}
                  onClick={() => inspectCard(card)}
                  style={{
                    transform: `rotate(${rotationDeg}deg) translateY(${translateY}px)`,
                    zIndex: idx + 1,
                  }}
                  className={`hand-fan-card ${idx > 0 ? overlapMargin : ''} w-24 sm:w-28 h-28 sm:h-32 rounded-xl border-2 border-[#4a3625] bg-gradient-to-b from-[#1c140e] to-[#0e0906] flex flex-col justify-between overflow-hidden group select-none flex-shrink-0 relative`}
                >
                  {/* Top Bar */}
                  <div className="px-1.5 py-0.5 bg-black/75 border-b border-[#2d1e14] flex items-center justify-between text-[8px] font-mono font-bold text-amber-100">
                    <span className="truncate">{card.name}</span>
                    <span className="text-yellow-400">{card.diceCount}d</span>
                  </div>

                  {/* Card Art - 100% complete view without crop */}
                  <div className="flex-1 w-full relative bg-black flex items-center justify-center p-0.5">
                    <CardImage
                      card={card}
                      alt={card.name}
                      fallbackIcon={<span className="text-xl opacity-30">{getTypeIcon(card.type)}</span>}
                      className="w-full h-full object-contain card-image-intact"
                    />
                    <div className="absolute bottom-0.5 left-0.5 bg-black/80 text-red-400 text-[8px] font-mono font-bold px-1 rounded shadow">
                      {card.maxHp} HP
                    </div>

                    {/* Zoom Icon on Hover */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        inspectCard(card);
                      }}
                      className="absolute top-1 right-1 z-20 w-4 h-4 rounded-full bg-black/80 hover:bg-yellow-400 text-yellow-300 hover:text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow"
                      title="Ampliar Carta"
                    >
                      <Search size={9} />
                    </button>
                  </div>

                  {/* Action on Card Bottom */}
                  <div className="p-1 bg-[#140e0a] border-t border-[#2d1e14]">
                    {canPerformStepAction() ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          playCardFromHand(card.id, activePlayerIndex);
                        }}
                        className="w-full py-0.5 btn-fantasy-gold text-[8px] font-black uppercase rounded cursor-pointer shadow flex items-center justify-center gap-0.5"
                      >
                        <ArrowDownCircle size={9} />
                        <span>Baixar</span>
                      </button>
                    ) : (
                      <div className="text-[7px] text-gray-500 font-mono text-center uppercase truncate">
                        {card.type}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
