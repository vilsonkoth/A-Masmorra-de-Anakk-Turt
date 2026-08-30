import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { RaiderCard } from '../types/game';
import { CardImage } from './CardImage';
import { FloatingCombatDisplay } from './FloatingCombatDisplay';
import { FlamingTorch } from './FlamingTorch';
import { OFFICIAL_CARD_BACK } from '../data/cardsDatabase';
import { Shield, Swords, Coins, Heart, Skull, Search, Gem, Crosshair } from 'lucide-react';

interface OpponentCardProps {
  raider: RaiderCard;
  playerIndex: number;
  hasDefenders: boolean;
  onInspect: (raider: RaiderCard) => void;
  isInverted?: boolean;
}

const OpponentRaiderSlot: React.FC<OpponentCardProps> = ({
  raider,
  playerIndex,
  hasDefenders,
  onInspect,
  isInverted = false,
}) => {
  const {
    turnPhase,
    selectedAttackerId,
    activePlayer,
    attackEnemyRaider,
  } = useGame();

  const isDefender = raider.keywords.includes('DEFENSOR');

  const selectedAttacker = (activePlayer?.field || []).find(r => r.id === selectedAttackerId);
  const isAttackerReady = selectedAttacker && !selectedAttacker.hasActedThisTurn;
  const isAttackMode = turnPhase === 'MASMORRA' && isAttackerReady;
  const isTargetable = isAttackMode && (!hasDefenders || isDefender);

  const handleExecuteAttack = () => {
    if (turnPhase !== 'MASMORRA') return;
    const attackerId = selectedAttackerId;
    if (attackerId) {
      const attacker = (activePlayer?.field || []).find(r => r.id === attackerId);
      if (attacker && !attacker.hasActedThisTurn) {
        attackEnemyRaider(attacker.id, playerIndex, raider.id);
        return;
      }
    }

    // Fallback: if no specific attacker selected, target with first available ready raider
    const readyRaiders = (activePlayer?.field || []).filter(r => !r.hasActedThisTurn);
    if (readyRaiders.length > 0) {
      attackEnemyRaider(readyRaiders[0].id, playerIndex, raider.id);
    }
  };

  return (
    <div
      data-combat-target-type="enemy-raider"
      data-target-player-index={playerIndex}
      data-combat-target-id={raider.id}
      onDoubleClick={() => onInspect(raider)}
      onClick={() => {
        if (turnPhase === 'MASMORRA') {
          handleExecuteAttack();
        }
      }}
      className={`h-16 sm:h-20 p-1 rounded-xl border flex flex-col justify-between relative overflow-hidden transition-all text-left group cursor-pointer ${
        isTargetable
          ? 'border-red-500 bg-red-950/60 hover:bg-red-900/80 shadow-[0_0_12px_rgba(220,38,38,0.7)] pulse-active-danger scale-[1.02]'
          : isAttackMode && hasDefenders && !isDefender
          ? 'border-[#2d1e14] bg-[#0c0806]/90 opacity-40 cursor-not-allowed'
          : 'border-[#3d281a] bg-[#140c08] hover:border-[#d4af37]/60'
      }`}
      title={isTargetable ? `Alvo elegível! Clique para atacar ${raider.name}` : `${raider.name} (Duplo clique para ampliar)`}
    >
      <FloatingCombatDisplay targetId={raider.id} />

      {/* Mini Inspect Button on Hover */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onInspect(raider);
        }}
        className="absolute top-1 right-1 z-20 w-4 h-4 rounded-full bg-black/80 hover:bg-yellow-400 text-yellow-300 hover:text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow"
        title="Ampliar Detalhes"
      >
        <Search size={9} />
      </button>

      {/* Name & Defender Tag */}
      <div className="flex items-center justify-between gap-1 z-10">
        <span className="text-[9px] sm:text-[10px] font-bold text-amber-100 font-cinzel truncate leading-none">
          {raider.name}
        </span>
        {isDefender && (
          <span className="badge-gold px-1 py-0.2 rounded text-[7px] font-black leading-none font-mono flex-shrink-0 border border-yellow-300">
            DEFENSOR
          </span>
        )}
      </div>

      {/* Complete Art Backdrop */}
      <div className="absolute inset-0 flex items-center justify-center opacity-70 group-hover:opacity-100 transition-opacity pointer-events-none p-1 pb-3">
        <CardImage card={raider} alt={raider.name} className="w-full h-full object-contain card-image-intact" />
      </div>

      {/* Top-Right HP Indicator */}
      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-950 border border-red-500 shadow-md flex items-center justify-center text-red-100 font-bold font-mono text-[9px] z-30">
        {raider.maxHp - (raider.damage || 0)}
      </div>

      {/* Bottom-Center Dice Indicator */}
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-yellow-950 border border-yellow-500 shadow-md px-1 py-0.5 rounded-full text-yellow-200 font-black font-mono text-[8px] z-30 flex items-center gap-0.5">
        {raider.diceCount} <Swords size={7} />
      </div>

      {/* Target Marker Overlay when Player is Aiming */}
      {isTargetable && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-red-600 via-red-600/80 to-transparent text-white text-[8px] font-black font-cinzel text-center py-0.5 tracking-wider uppercase z-20 flex items-center justify-center gap-1 shadow animate-pulse pointer-events-none">
          <Crosshair size={9} className="animate-spin" />
          <span>🎯 ATACAR</span>
        </div>
      )}
    </div>
  );
};

export const TopOpponent: React.FC = () => {
  const {
    players,
    activePlayerIndex,
    inspectCard,
    playmatTextures,
  } = useGame();

  const opponents = players
    .map((player, index) => ({ player, index }))
    .filter(({ index }) => index !== activePlayerIndex);

  if (opponents.length === 0) return null;

  // Primary Opponent (Opponent 1 - Top Center of Table)
  const { player: topPlayer, index: topIdx } = opponents[0];
  const topField = topPlayer.field || [];
  const hasDefenders = topField.some(r => r.keywords.includes('DEFENSOR'));

  return (
    <div className="w-full max-w-4xl mx-auto mb-1">
      <div className="relative">
        {/* Top Header: Inverted Opponent Profile Badge with Animated Flaming Torch */}
        <div className="flex items-center justify-between pb-1.5 mb-2">
          {/* Profile & Name */}
          <div className="flex items-center gap-2 min-w-0">
            <FlamingTorch isActive={activePlayerIndex === topIdx} size="sm" className="-my-1 flex-shrink-0" />
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold text-white shadow border border-[#d4af37]/60 flex-shrink-0"
              style={{ backgroundColor: topPlayer.color }}
            >
              {topPlayer.avatar}
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-black text-amber-100 font-cinzel uppercase flex items-center gap-1.5 truncate">
                <span className="truncate">{topPlayer.name}</span>
                <span className="text-[9px] text-amber-400 font-mono font-normal">
                  ({topPlayer.field?.length || 0}/4 em campo)
                </span>
                {topPlayer.isBot && (
                  <span className="text-[8px] bg-red-950/90 text-red-300 border border-red-800 px-1 py-0.2 rounded font-mono font-bold flex-shrink-0">
                    BOT
                  </span>
                )}
                {activePlayerIndex === topIdx && (
                  <span className="text-[8px] bg-amber-950 text-yellow-300 border border-yellow-500 px-1 py-0.2 rounded font-mono font-bold animate-pulse flex-shrink-0">
                    VEZ ATIVA
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Inverted Hand Visual Representation */}
          <div className="flex items-center gap-2">
            {/* Visual Opponent Hand Stack (Face-down cards with dynamic Card Back) */}
            <div className="flex items-center -space-x-2">
              {Array.from({ length: Math.min(6, topPlayer.hand?.length || 0) }).map((_, i) => (
                <div
                  key={i}
                  className="w-5 h-7 rounded overflow-hidden border border-yellow-600/40 shadow transform -rotate-6 hover:translate-y-1 transition bg-black"
                  title={`${topPlayer.hand.length} cartas na mão`}
                >
                  <img
                    src={playmatTextures.raiderCardBack || OFFICIAL_CARD_BACK}
                    alt="Verso do Baralho"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>

            {/* Treasure Gem Badge */}
            <div className="badge-gold px-2.5 py-0.5 rounded-lg text-xs font-mono font-black flex items-center gap-1">
              <Coins size={12} className="text-yellow-400" />
              <span>{topPlayer.treasures || 0}</span>
            </div>
          </div>
        </div>

        {/* 4 Battlefield Slots (Top Inverted Perspective) */}
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, sIdx) => {
            const raider = topField[sIdx];
            if (!raider) {
              return (
                <div
                  key={`top-empty-${sIdx}`}
                  className="h-16 sm:h-20 rounded-xl border border-dashed border-white/5 bg-transparent flex flex-col items-center justify-center text-[9px] text-amber-200/10 font-mono"
                >
                  <span className="text-[7px]">{sIdx + 1}</span>
                </div>
              );
            }

            return (
              <OpponentRaiderSlot
                key={raider.id}
                raider={raider}
                playerIndex={topIdx}
                hasDefenders={hasDefenders}
                onInspect={inspectCard}
                isInverted={true}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const SideOpponents: React.FC<{ position: 'left' | 'right' }> = ({ position }) => {
  const {
    players,
    activePlayerIndex,
    inspectCard,
    playmatTextures,
  } = useGame();

  const allOpponents = players
    .map((player, index) => ({ player, index }))
    .filter(({ index }) => index !== activePlayerIndex);

  // Remaining opponents (excluding top opponent 0)
  const sideOpponentsList = allOpponents.slice(1);
  if (sideOpponentsList.length === 0) return null;

  // Distribute between left and right flanks
  const opponentsForSide = sideOpponentsList.filter((_, idx) => {
    if (position === 'left') return idx % 2 === 0;
    return idx % 2 === 1;
  });

  if (opponentsForSide.length === 0) return null;

  return (
    <div className="flex flex-col gap-2.5 w-full">
      {opponentsForSide.map(({ player: opp, index: oppIdx }) => {
        const oppField = opp.field || [];
        const hasDefenders = oppField.some(r => r.keywords.includes('DEFENSOR'));

        return (
          <div
            key={opp.id}
            className="space-y-1.5"
          >
            {/* Opponent Mini Bar with Flaming Torch */}
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <FlamingTorch isActive={activePlayerIndex === oppIdx} size="sm" className="-my-1 flex-shrink-0" />
                <div
                  className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold text-white shadow border border-[#d4af37]/40 flex-shrink-0"
                  style={{ backgroundColor: opp.color }}
                >
                  {opp.avatar}
                </div>
                <div className="text-[10px] sm:text-xs font-bold text-amber-100 font-cinzel uppercase truncate flex items-center gap-1">
                  <span>{opp.name}</span>
                  {activePlayerIndex === oppIdx && (
                    <span className="text-[7px] bg-amber-950 text-yellow-300 border border-yellow-500 px-1 py-0.2 rounded font-mono font-bold animate-pulse">
                      VEZ
                    </span>
                  )}
                </div>
              </div>

              <div className="badge-gold px-1.5 py-0.2 rounded text-[9px] font-mono font-bold flex items-center gap-0.5">
                <Coins size={9} className="text-yellow-400" />
                <span>{opp.treasures || 0}</span>
              </div>
            </div>

            {/* 4 slots compact grid (2x2) */}
            <div className="grid grid-cols-2 gap-1">
              {Array.from({ length: 4 }).map((_, sIdx) => {
                const raider = oppField[sIdx];
                if (!raider) {
                  return (
                    <div
                      key={`side-empty-${sIdx}`}
                      className="h-12 rounded-lg border border-dashed border-white/5 bg-transparent flex items-center justify-center text-[8px] text-amber-200/10 font-mono"
                    >
                      {sIdx + 1}
                    </div>
                  );
                }

                return (
                  <OpponentRaiderSlot
                    key={raider.id}
                    raider={raider}
                    playerIndex={oppIdx}
                    hasDefenders={hasDefenders}
                    onInspect={inspectCard}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const OpponentsOverview: React.FC = () => {
  return <TopOpponent />;
};

