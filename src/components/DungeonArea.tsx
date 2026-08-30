import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { isMonster, isEvent } from '../types/game';
import { OFFICIAL_CARD_BACK } from '../data/cardsDatabase';
import { CardImage } from './CardImage';
import { OrnateCorner } from './OrnateCorner';
import { FloatingCombatDisplay } from './FloatingCombatDisplay';
import {
  Skull,
  Swords,
  Coins,
  Dices,
  Shield,
  Sparkles,
  Layers,
  Flame,
  Target,
  Compass,
  Gem,
  Search,
  Hand,
  Crosshair
} from 'lucide-react';

export const DungeonArea: React.FC = () => {
  const {
    currentDungeonCard,
    dungeonDeck,
    dungeonGraveyard,
    raiderDeck,
    raiderDiscard,
    turnPhase,
    selectedAttackerId,
    activePlayer,
    activePlayerIndex,
    hasDrawnOrPlayedInPhase1,
    hasDrawnOrPlayedInPhase3,
    attackDungeonMonster,
    resolveCurrentEvent,
    dungeonFlipNonce,
    playmatTextures,
    selectAttacker,
    drawCard,
    inspectCard,
  } = useGame();

  const selectedAttacker = (activePlayer?.field || []).find(r => r.id === selectedAttackerId);
  const readyRaiders = (activePlayer?.field || []).filter(r => !r.hasActedThisTurn);
  const canAttackDungeon = turnPhase === 'MASMORRA' && !!selectedAttacker && !selectedAttacker.hasActedThisTurn && currentDungeonCard && isMonster(currentDungeonCard);
  const isTreasureCard = currentDungeonCard && currentDungeonCard.name.includes('Tesouro');

  const canDrawRaiderCard = (turnPhase === 'PREPARAR' && !hasDrawnOrPlayedInPhase1) || (turnPhase === 'REAGRUPAR' && !hasDrawnOrPlayedInPhase3);

  const handleDungeonCombatClick = () => {
    if (turnPhase !== 'MASMORRA' || !currentDungeonCard || !isMonster(currentDungeonCard)) return;

    if (selectedAttacker && !selectedAttacker.hasActedThisTurn) {
      attackDungeonMonster(selectedAttacker.id);
    } else if (readyRaiders.length > 0) {
      // Auto-trigger with first ready raider
      attackDungeonMonster(readyRaiders[0].id);
    }
  };

  return (
    <div
      className="rustic-dungeon-frame rounded-2xl p-2.5 sm:p-4 relative overflow-hidden card-3d w-full shadow-2xl border-2 border-[#5a2e2e]"
      style={
        playmatTextures.dungeonGrimoireBackground
          ? { backgroundImage: `url(${playmatTextures.dungeonGrimoireBackground})`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : undefined
      }
    >
      {/* 4 Ornate Antique Brass Corner Plates */}
      <OrnateCorner position="tl" colorVariant="crimson" />
      <OrnateCorner position="tr" colorVariant="crimson" />
      <OrnateCorner position="bl" colorVariant="crimson" />
      <OrnateCorner position="br" colorVariant="crimson" />

      {/* Atmospheric center spotlighting & Dungeon Torches */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/10 via-red-950/20 to-transparent pointer-events-none" />

      {/* Header bar of Dungeon */}
      <div className="flex items-center justify-between border-b border-[#4d252a] pb-1.5 mb-2 gap-2 relative z-10">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-b from-[#2a1215] to-[#12080a] border border-[#d4af37]/50 flex items-center justify-center text-sm text-red-500 shadow flex-shrink-0">
            🔥
          </div>
          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-black text-[#d4af37] font-cinzel tracking-wider uppercase flex items-center gap-1.5 drop-shadow truncate">
              <span>CÂMARA CENTRAL DA MASMORRA</span>
              {isTreasureCard ? (
                <span className="text-[9px] bg-amber-950 text-yellow-300 border border-yellow-500 px-1.5 py-0.2 rounded uppercase font-mono tracking-wider animate-pulse flex-shrink-0">
                  💎 TESOURO ABERTO
                </span>
              ) : currentDungeonCard && isMonster(currentDungeonCard) ? (
                <span className="text-[9px] bg-red-900 text-yellow-200 border border-red-500 px-1.5 py-0.2 rounded uppercase font-mono tracking-wider animate-pulse flex-shrink-0">
                  ⚔️ COMBATE ATIVO
                </span>
              ) : null}
            </h2>
          </div>
        </div>

        {/* Level Progression Indicator */}
        <div className="flex items-center gap-1 badge-gold px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-mono flex-shrink-0">
          <Compass size={11} className="text-[#d4af37]" />
          <span className="hidden sm:inline">1x Tesouro ➔ 5x N1 ➔ 1x Evento ➔ 3x N2 ➔ 1x Evento ➔ Boss</span>
          <span className="sm:hidden">Masmorra Central</span>
        </div>
      </div>

      {/* Main Table Setup: Left Decks + Central Monster Chamber + Right Discard Piles */}
      {currentDungeonCard ? (
        <div className="grid grid-cols-12 gap-2 sm:gap-3 items-center relative z-10">
          
          {/* LEFT FLANK: Raider Draw Deck & Dungeon Deck */}
          <div className="col-span-3 sm:col-span-3 flex flex-col gap-2">
            
            {/* 1. Interactive Raider Deck (Baralho de Saqueadores) */}
            <div
              onClick={() => {
                if (canDrawRaiderCard) {
                  drawCard(activePlayerIndex);
                }
              }}
              className={`flex flex-col items-center justify-center space-y-1.5 transition-all duration-300 select-none relative ${
                canDrawRaiderCard
                  ? 'animate-deck-glow cursor-pointer hover:scale-105 active:scale-95 z-20'
                  : 'cursor-default'
              }`}
              title={canDrawRaiderCard ? 'Clique para COMPRAR 1 carta de Saqueador do Baralho' : 'Baralho de Saqueadores'}
            >
              {canDrawRaiderCard && (
                <div className="absolute -top-2 inset-x-0 flex justify-center pointer-events-none">
                  <span className="bg-gradient-to-r from-yellow-500 via-amber-300 to-yellow-500 text-yellow-950 text-[7px] sm:text-[8px] font-black font-cinzel px-2 py-0.2 rounded-full uppercase tracking-wider shadow-md border border-yellow-200 flex items-center gap-0.5 animate-bounce">
                    <Sparkles size={8} className="text-yellow-950 animate-spin" />
                    <span>DISPONÍVEL</span>
                  </span>
                </div>
              )}

              <div className="text-[8px] sm:text-[9px] font-bold text-amber-200/90 font-cinzel uppercase tracking-tight flex items-center gap-1">
                <Layers size={10} className={canDrawRaiderCard ? 'text-yellow-300 animate-pulse' : 'text-[#d4af37]'} />
                <span>Deck Saqueadores</span>
              </div>

              <div className={`relative w-12 sm:w-16 h-16 sm:h-22 rounded-lg overflow-hidden border shadow-md bg-black flex items-center justify-center p-0.5 transition-transform ${
                canDrawRaiderCard ? 'border-yellow-300 shadow-[0_0_15px_rgba(234,179,8,0.5)] scale-102' : 'border-yellow-500/60'
              }`}>
                <img
                  src={playmatTextures.raiderCardBack || OFFICIAL_CARD_BACK}
                  alt="Baralho de Saqueadores"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain card-image-intact"
                />
                <div className="absolute bottom-0.5 right-0.5 bg-black/85 text-yellow-300 text-[8px] font-bold px-1 rounded font-mono border border-yellow-500/40">
                  {raiderDeck.length}
                </div>
              </div>

              {canDrawRaiderCard ? (
                <div className="w-full text-center">
                  <span className="w-full py-0.5 px-1 bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-400 text-yellow-950 text-[8px] sm:text-[9px] font-black font-cinzel rounded uppercase tracking-wider flex items-center justify-center gap-1 shadow hover:brightness-110">
                    <Hand size={9} /> COMPRAR
                  </span>
                </div>
              ) : (
                <span className="text-[8px] text-gray-400 font-mono">{raiderDeck.length} no deck</span>
              )}
            </div>

            {/* 2. Dungeon Deck (Baralho da Masmorra) */}
            <div className="flex flex-col items-center justify-center space-y-1">
              <div className="text-[8px] sm:text-[9px] font-bold text-amber-200/70 font-cinzel uppercase tracking-tight flex items-center gap-1">
                <Flame size={10} className="text-red-400" />
                <span>Deck Masmorra</span>
              </div>

              <div className="relative w-12 sm:w-16 h-16 sm:h-22 rounded-lg overflow-hidden border border-[#d4af37]/60 shadow-md bg-black flex items-center justify-center p-0.5">
                <img
                  src={playmatTextures.dungeonCardBack || OFFICIAL_CARD_BACK}
                  alt="Baralho da Masmorra"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain card-image-intact"
                />
                <div className="absolute bottom-0.5 right-0.5 bg-black/85 text-[#d4af37] text-[8px] font-bold px-1 rounded font-mono border border-[#d4af37]/40">
                  {dungeonDeck.length + 1}
                </div>
              </div>

              <span className="text-[8px] text-gray-400 font-mono">{dungeonDeck.length} restantes</span>
            </div>

          </div>

          {/* CENTER: Active Monster / Event Chamber Showcase & Drop Target */}
          <div
            className="col-span-6 sm:col-span-6 flex flex-col items-center justify-center text-center"
            data-combat-target-type="dungeon"
            data-combat-target-id={currentDungeonCard.id}
          >
            <div
              key={`dungeon-card-${dungeonFlipNonce}-${currentDungeonCard.id}`}
              onDoubleClick={() => inspectCard(currentDungeonCard)}
              onClick={handleDungeonCombatClick}
              className={`w-full max-w-[280px] sm:max-w-[320px] rounded-xl overflow-hidden shadow-[0_12px_35px_rgba(0,0,0,0.95)] border-2 animate-dungeon-page-flip transition-all duration-300 relative group cursor-pointer ${
                (canAttackDungeon && isMonster(currentDungeonCard))
                  ? 'border-red-500 bg-red-950/40 ring-2 ring-red-500/80 scale-[1.02] shadow-[0_0_35px_rgba(220,38,38,0.7)]'
                  : isTreasureCard
                  ? 'border-yellow-400 ring-2 ring-amber-500/70 bg-transparent'
                  : isMonster(currentDungeonCard) && currentDungeonCard.isBoss
                  ? 'border-yellow-500 ring-2 ring-red-900 bg-transparent'
                  : isEvent(currentDungeonCard)
                  ? 'border-cyan-400 bg-transparent'
                  : 'border-[#8b2635] bg-transparent'
              }`}
            >
              {/* Floating Combat Numbers / Damage text on monster */}
              <FloatingCombatDisplay targetId={currentDungeonCard.id} />

              {/* Targeting Crosshair Indicator when an attacker is aiming at Dungeon */}
              {canAttackDungeon && isMonster(currentDungeonCard) && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-red-600 via-red-600/80 to-transparent text-white text-[10px] font-black font-cinzel text-center py-1 tracking-wider uppercase z-20 flex items-center justify-center gap-1 shadow animate-pulse pointer-events-none">
                  <Crosshair size={12} className="animate-spin" />
                  <span>🎯 ATACAR ALVO</span>
                </div>
              )}

              {/* Quick Zoom Tooltip Icon */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  inspectCard(currentDungeonCard);
                }}
                className="absolute top-2 right-2 z-20 w-6 h-6 rounded-full bg-black/80 hover:bg-yellow-500 hover:text-black text-amber-200 border border-yellow-500/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow"
                title="Ampliar Carta (Duplo Clique)"
              >
                <Search size={12} />
              </button>

              {/* Top-Right HP Indicator */}
              {isMonster(currentDungeonCard) && (
                <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-full border-2 shadow-lg flex items-center justify-center font-bold font-mono text-[11px] z-30 ${isTreasureCard ? 'bg-amber-950 border-yellow-400 text-yellow-200' : 'bg-red-950 border-red-500 text-white'}`}>
                  {currentDungeonCard.maxHp - currentDungeonCard.damage}
                </div>
              )}

              {/* Bottom-Center Dice Indicator */}
              {isMonster(currentDungeonCard) && (
                <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 border-2 shadow-lg px-2 py-0.5 rounded-full font-black font-mono text-[10px] z-30 flex items-center gap-1 ${isTreasureCard ? 'bg-amber-950 border-yellow-400 text-yellow-200' : 'bg-red-950 border-red-500 text-white'}`}>
                  {currentDungeonCard.diceCount} <Swords size={10} />
                </div>
              )}

              {/* Card Art Area - 100% complete card artwork display */}
              <div className="h-64 sm:h-72 w-full relative bg-transparent flex flex-col items-center justify-center p-2">
                <CardImage
                  card={currentDungeonCard}
                  alt={currentDungeonCard.name}
                  fallbackIcon={
                    <span className="text-4xl opacity-40">
                      {isTreasureCard ? '💎' : isEvent(currentDungeonCard) ? '⚡' : isMonster(currentDungeonCard) && currentDungeonCard.isBoss ? '🐉' : '🧌'}
                    </span>
                  }
                  className="w-full h-full object-contain card-image-intact group-hover:scale-105 transition-transform duration-500"
                />
                {/* Level / Event Tag */}
                <div className="absolute top-1.5 left-1.5 pointer-events-none">
                  {isTreasureCard ? (
                    <span className="text-[9px] font-bold uppercase bg-amber-950/95 text-yellow-300 px-2 py-0.5 rounded border border-yellow-500 backdrop-blur-sm font-mono shadow-md flex items-center gap-0.5">
                      💎 TESOURO
                    </span>
                  ) : isMonster(currentDungeonCard) ? (
                    <span className="text-[9px] font-bold uppercase bg-black/85 text-[#d4af37] px-2 py-0.5 rounded border border-[#d4af37]/60 backdrop-blur-sm font-mono shadow-md">
                      Nível {currentDungeonCard.level}
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold uppercase bg-cyan-950/90 text-cyan-200 px-2 py-0.5 rounded border border-cyan-400 backdrop-blur-sm font-mono shadow-md">
                      ⚡ EVENTO
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Combat Actions for Center Card */}
            <div className="mt-2 w-full flex flex-col items-center gap-1">
              {isEvent(currentDungeonCard) && (
                <button
                  onClick={resolveCurrentEvent}
                  className="px-5 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-xs uppercase tracking-wider rounded-full shadow-[0_0_15px_rgba(6,182,212,0.5)] border border-cyan-300 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  <Sparkles size={14} />
                  <span>RESOLVER EFEITO DO EVENTO</span>
                </button>
              )}
            </div>
          </div>

          {/* RIGHT FLANK: Raider Graveyard & Dungeon Graveyard */}
          <div className="col-span-3 sm:col-span-3 flex flex-col gap-2">
            
            {/* 1. Raider Graveyard (Cemitério dos Saqueadores) */}
            <div className="flex flex-col items-center justify-center space-y-1">
              <div className="text-[8px] sm:text-[9px] font-bold text-amber-200/80 font-cinzel uppercase tracking-tight flex items-center gap-1">
                <Skull size={10} className="text-amber-400" />
                <span>Cemitério Saq.</span>
              </div>

              <div className="w-12 sm:w-16 h-16 sm:h-22 rounded-lg border border-dashed border-[#52242b] bg-[#120709] flex flex-col items-center justify-center text-center p-1">
                {raiderDiscard.length > 0 ? (
                  <div className="space-y-0.5">
                    <div className="w-5 h-5 rounded-full bg-amber-950/80 border border-amber-700 flex items-center justify-center text-amber-300 text-[9px] font-bold font-mono mx-auto">
                      {raiderDiscard.length}
                    </div>
                    <span className="text-[7px] text-gray-300 font-cinzel line-clamp-1">
                      {raiderDiscard[raiderDiscard.length - 1].name}
                    </span>
                  </div>
                ) : (
                  <span className="text-[7px] text-gray-600 uppercase font-mono">0 mortos</span>
                )}
              </div>

              <span className="text-[8px] text-gray-400 font-mono">{raiderDiscard.length} cartas</span>
            </div>

            {/* 2. Dungeon Graveyard (Masmorra Superada) */}
            <div className="flex flex-col items-center justify-center space-y-1">
              <div className="text-[8px] sm:text-[9px] font-bold text-red-300/80 font-cinzel uppercase tracking-tight flex items-center gap-1">
                <Skull size={10} className="text-red-400" />
                <span>Monstros Abatidos</span>
              </div>

              <div className="w-12 sm:w-16 h-16 sm:h-22 rounded-lg border border-dashed border-[#52242b] bg-[#120709] flex flex-col items-center justify-center text-center p-1">
                {dungeonGraveyard.length > 0 ? (
                  <div className="space-y-0.5">
                    <div className="w-5 h-5 rounded-full bg-red-950/80 border border-red-700 flex items-center justify-center text-red-400 text-[9px] font-bold font-mono mx-auto">
                      {dungeonGraveyard.length}
                    </div>
                    <span className="text-[7px] text-gray-300 font-cinzel line-clamp-1">
                      {dungeonGraveyard[dungeonGraveyard.length - 1].name}
                    </span>
                  </div>
                ) : (
                  <span className="text-[7px] text-gray-600 uppercase font-mono">0 abatidos</span>
                )}
              </div>

              <span className="text-[8px] text-gray-400 font-mono">{dungeonGraveyard.length} cartas</span>
            </div>

          </div>

        </div>
      ) : (
        <div className="text-center py-6 rounded-xl border border-dashed border-[#52242b] bg-[#14080a] relative z-10">
          <h3 className="text-base font-bold text-[#d4af37] font-cinzel uppercase tracking-widest">
            A Masmorra foi Conquistada!
          </h3>
          <p className="text-[10px] text-amber-200/70 mt-0.5 font-mono">
            Todos os monstros e chefes foram superados.
          </p>
        </div>
      )}
    </div>
  );
};
