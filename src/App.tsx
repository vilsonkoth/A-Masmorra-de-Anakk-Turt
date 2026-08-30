import React, { useState } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors, MouseSensor, TouchSensor } from '@dnd-kit/core';
import { GameProvider, useGame } from './context/GameContext';
import { Header } from './components/Header';
import { DungeonArea } from './components/DungeonArea';
import { PlayerPlaymat } from './components/PlayerPlaymat';
import { TopOpponent, SideOpponents } from './components/OpponentsOverview';
import { LivingDungeonAtmosphere } from './components/LivingDungeonAtmosphere';
import { CardZoomModal } from './components/CardZoomModal';
import { DiceRollModal } from './components/DiceRollModal';
import { SacrificeModal } from './components/SacrificeModal';
import { RulebookModal } from './components/RulebookModal';
import { CardCustomizerModal } from './components/CardCustomizerModal';
import { ActionLogPanel } from './components/ActionLogPanel';
import { GameOverModal } from './components/GameOverModal';
import { NewGameModal } from './components/NewGameModal';

function GameDashboard() {
  const { players, activePlayerIndex, playmatTextures } = useGame();

  const [isRulebookOpen, setIsRulebookOpen] = useState(false);
  const [isCardCustomizerOpen, setIsCardCustomizerOpen] = useState(false);
  const [isNewGameOpen, setIsNewGameOpen] = useState(false);
  const [isLogOpen, setIsLogOpen] = useState(false);

  const opponentsCount = (players?.length || 1) - 1;
  const hasSideOpponents = opponentsCount > 1;

  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
    // If the attacker wasn't selected yet, we auto-select it if it's on the field
    const [, source, id] = (event.active.id as string).split('|');
    if (source === 'field' && turnPhase === 'MASMORRA') {
      selectAttacker(id);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);
    if (!over) return;

    const activeIdStr = String(active.id);
    const overIdStr = String(over.id);

    // Parse IDs. Convention: "type|source|id"
    const [aType, aSource, aId] = activeIdStr.split('|');
    const [oType, oSource, oId] = overIdStr.split('|');

    // 1. Play from Hand to Field
    if (aType === 'raider' && aSource === 'hand' && oType === 'slot' && oSource === 'field') {
      const canPerformStepAction = () => {
        if (turnPhase === 'PREPARAR') return !hasDrawnOrPlayedInPhase1;
        if (turnPhase === 'REAGRUPAR') return !hasDrawnOrPlayedInPhase3;
        return false;
      };
      if (canPerformStepAction()) {
        playCardFromHand(aId, activePlayerIndex);
      }
      return;
    }

    // 2. Attack from Field to Dungeon
    if (aType === 'raider' && aSource === 'field' && oType === 'target' && oSource === 'dungeon' && turnPhase === 'MASMORRA') {
      const activePlayer = players[activePlayerIndex];
      const raider = activePlayer.field.find(r => r.id === aId);
      if (raider && !raider.hasActedThisTurn) {
        attackDungeonMonster(aId);
      }
      return;
    }

    // 3. Attack from Field to Enemy
    if (aType === 'raider' && aSource === 'field' && oType === 'target' && oSource === 'enemy' && turnPhase === 'MASMORRA') {
       const activePlayer = players[activePlayerIndex];
       const raider = activePlayer.field.find(r => r.id === aId);
       if (raider && !raider.hasActedThisTurn) {
         // oId has format: playerIndex:raiderId
         const [targetPIdxStr, targetRId] = oId.split(':');
         attackEnemyRaider(aId, parseInt(targetPIdxStr, 10), targetRId);
       }
       return;
    }
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
    <div
      className="min-h-screen bg-wood-table text-gray-200 flex flex-col selection:bg-[#d4af37]/30 selection:text-[#d4af37] table-surface relative overflow-x-hidden"
      style={
        playmatTextures?.tableBackground
          ? {
              backgroundImage: `url(${playmatTextures.tableBackground})`,
              backgroundSize: 'cover',
              backgroundAttachment: 'fixed',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }
          : undefined
      }
    >
      {/* Immersive Living Dungeon Atmosphere Overlay (Torches Flicker & Gold Sparkles) */}
      <LivingDungeonAtmosphere />

      {/* Top Navigation & Status Bar */}
      <Header
        onOpenRulebook={() => setIsRulebookOpen(true)}
        onOpenCardCustomizer={() => setIsCardCustomizerOpen(true)}
        onOpenNewGame={() => setIsNewGameOpen(true)}
        onToggleLog={() => setIsLogOpen(prev => !prev)}
      />

      {/* Main Tabletop Arena Layout with Central Dungeon and Radial/Circular Arranged Players */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-2 sm:px-6 md:px-8 py-3 sm:py-5 space-y-4 table-perspective-container relative z-10">
        
        {/* TOP ARC OF CIRCULAR TABLE: Primary Opponent (Inverted Perspective Facing Table) */}
        <div className="table-tilt-opponents">
          <TopOpponent />
        </div>

        {/* CENTER ABSOLUTE: Central Dungeon Chamber flanked Radially by Side Opponents */}
        <div className="table-tilt-dungeon">
          {hasSideOpponents ? (
            <div className="grid grid-cols-12 gap-2 sm:gap-3 items-center">
              {/* Left Flank Opponents (Left Arc) */}
              <div className="col-span-12 md:col-span-3 order-2 md:order-1">
                <SideOpponents position="left" />
              </div>

              {/* Central Dungeon Chamber (Absolute Table Center) */}
              <div className="col-span-12 md:col-span-6 order-1 md:order-2">
                <DungeonArea />
              </div>

              {/* Right Flank Opponents (Right Arc) */}
              <div className="col-span-12 md:col-span-3 order-3 md:order-3">
                <SideOpponents position="right" />
              </div>
            </div>
          ) : (
            <div className="w-full max-w-4xl mx-auto">
              <DungeonArea />
            </div>
          )}
        </div>

        {/* BOTTOM ARC OF CIRCULAR TABLE: Local Active Player Playmat & Fan Hand */}
        <div className="table-tilt-player w-full max-w-4xl mx-auto">
          <PlayerPlaymat />
        </div>
      </main>

      {/* Card Zoom / Full Inspection Modal */}
      <CardZoomModal />

      {/* Dice 3D Roll Resolution Modal */}
      <DiceRollModal />

      {/* 5th Raider Placement Sacrifice Modal */}
      <SacrificeModal />

      {/* Victory / Game Over Modal */}
      <GameOverModal onRestart={() => setIsNewGameOpen(true)} />

      {/* Rulebook Modal */}
      <RulebookModal
        isOpen={isRulebookOpen}
        onClose={() => setIsRulebookOpen(false)}
      />

      {/* Card Art & Customizer Modal */}
      <CardCustomizerModal
        isOpen={isCardCustomizerOpen}
        onClose={() => setIsCardCustomizerOpen(false)}
      />

      {/* New Game Setup Modal */}
      <NewGameModal
        isOpen={isNewGameOpen}
        onClose={() => setIsNewGameOpen(false)}
      />

      {/* Detailed Combat & Event Action Log Drawer */}
      <ActionLogPanel
        isOpen={isLogOpen}
        onClose={() => setIsLogOpen(false)}
      />
      <DragOverlay dropAnimation={null}>
        {activeDragId ? (
          <div className="w-24 sm:w-28 h-28 sm:h-32 rounded-xl border-2 border-yellow-500 bg-black shadow-[0_0_20px_rgba(234,179,8,0.5)] opacity-80" />
        ) : null}
      </DragOverlay>
    </div>
    </DndContext>
  );
}

export default function App() {
  return (
    <GameProvider>
      <GameDashboard />
    </GameProvider>
  );
}
