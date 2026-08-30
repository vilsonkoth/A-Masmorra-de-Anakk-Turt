import React, { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  MouseSensor,
  TouchSensor,
} from '@dnd-kit/core';

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

function MainMenu({ onPlay }: { onPlay: () => void }) {
  const {
    playmatTextures,
    isSoundMuted,
    toggleSoundMute,
  } = useGame();

  const [isRulebookOpen, setIsRulebookOpen] = useState(false);

  return (
    <div
      className="min-h-screen bg-black text-gray-200 flex items-center justify-center relative overflow-hidden"
      style={
        playmatTextures?.tableBackground
          ? {
              backgroundImage: `url(${playmatTextures.tableBackground})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }
          : undefined
      }
    >
      {/* Atmosfera da masmorra */}
      <LivingDungeonAtmosphere />

      {/* Escurece o cenário para destacar o menu */}
      <div className="absolute inset-0 bg-black/70" />

      {/* Menu principal */}
      <div className="relative z-10 w-full max-w-xl px-6 text-center">

        {/* Título */}
        <div className="mb-12">
          <h1
            className="text-5xl md:text-7xl font-black tracking-wider text-[#d4af37]"
            style={{
              textShadow:
                '0 0 10px rgba(212,175,55,.6), 0 5px 25px rgba(0,0,0,.95)',
            }}
          >
            A MASMORRA
          </h1>

          <h2
            className="text-3xl md:text-5xl font-black tracking-widest text-white mt-1"
            style={{
              textShadow: '0 5px 20px rgba(0,0,0,.95)',
            }}
          >
            DE ANAKK TUR
          </h2>

          <p className="mt-5 text-[#d4af37] tracking-[0.35em] text-xs md:text-sm font-bold">
            AVENTURE-SE • SOBREVIVA • SAQUEIE
          </p>
        </div>

        {/* Botões */}
        <div className="flex flex-col gap-3 max-w-sm mx-auto">

          {/* JOGAR */}
          <button
            onClick={onPlay}
            className="
              w-full
              py-4
              rounded-lg
              border-2
              border-[#d4af37]
              bg-[#3a2708]/95
              text-[#f5d76e]
              font-black
              text-xl
              tracking-widest
              hover:bg-[#d4af37]
              hover:text-black
              hover:scale-[1.02]
              transition-all
              duration-200
              shadow-[0_0_25px_rgba(212,175,55,.25)]
            "
          >
            JOGAR
          </button>

          {/* REGRAS */}
          <button
            onClick={() => setIsRulebookOpen(true)}
            className="
              w-full
              py-3
              rounded-lg
              border
              border-[#8b6b24]
              bg-black/60
              text-gray-200
              font-bold
              tracking-wider
              hover:bg-[#241b0b]
              hover:border-[#d4af37]
              hover:text-[#d4af37]
              transition
            "
          >
            REGRAS
          </button>

          {/* COLEÇÃO */}
          <button
            disabled
            className="
              w-full
              py-3
              rounded-lg
              border
              border-gray-700
              bg-black/40
              text-gray-500
              font-bold
              tracking-wider
              cursor-not-allowed
            "
          >
            COLEÇÃO
          </button>

          {/* SOM */}
          <button
            onClick={toggleSoundMute}
            className="
              w-full
              py-3
              rounded-lg
              border
              border-gray-700
              bg-black/40
              text-gray-300
              font-bold
              tracking-wider
              hover:border-[#d4af37]
              hover:text-[#d4af37]
              transition
            "
          >
            {isSoundMuted ? 'SOM: DESLIGADO' : 'SOM: LIGADO'}
          </button>

        </div>

        {/* Versão */}
        <p className="mt-10 text-xs text-gray-500">
          A Masmorra de Anakk Tur
        </p>
      </div>

      {/* Livro de regras */}
      <RulebookModal
        isOpen={isRulebookOpen}
        onClose={() => setIsRulebookOpen(false)}
      />
    </div>
  );
}

function GameDashboard() {
  const {
    players,
    activePlayerIndex,
    playmatTextures,
    turnPhase,
    hasDrawnOrPlayedInPhase1,
    hasDrawnOrPlayedInPhase3,
    selectAttacker,
    playCardFromHand,
    attackDungeonMonster,
    attackEnemyRaider,
  } = useGame();

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

    const [, source, id] = String(event.active.id).split('|');

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

    const [aType, aSource, aId] = activeIdStr.split('|');
    const [oType, oSource, oId] = overIdStr.split('|');

    // Jogar carta da mão para o campo
    if (
      aType === 'raider' &&
      aSource === 'hand' &&
      oType === 'slot' &&
      oSource === 'field'
    ) {
      const canPerformStepAction = () => {
        if (turnPhase === 'PREPARAR') {
          return !hasDrawnOrPlayedInPhase1;
        }

        if (turnPhase === 'REAGRUPAR') {
          return !hasDrawnOrPlayedInPhase3;
        }

        return false;
      };

      if (canPerformStepAction()) {
        playCardFromHand(aId, activePlayerIndex);
      }

      return;
    }

    // Atacar monstro
    if (
      aType === 'raider' &&
      aSource === 'field' &&
      oType === 'target' &&
      oSource === 'dungeon' &&
      turnPhase === 'MASMORRA'
    ) {
      const activePlayer = players[activePlayerIndex];
      const raider = activePlayer.field.find((r) => r.id === aId);

      if (raider && !raider.hasActedThisTurn) {
        attackDungeonMonster(aId);
      }

      return;
    }

    // Atacar saqueador inimigo
    if (
      aType === 'raider' &&
      aSource === 'field' &&
      oType === 'target' &&
      oSource === 'enemy' &&
      turnPhase === 'MASMORRA'
    ) {
      const activePlayer = players[activePlayerIndex];
      const raider = activePlayer.field.find((r) => r.id === aId);

      if (raider && !raider.hasActedThisTurn) {
        const [targetPIdxStr, targetRId] = oId.split(':');

        attackEnemyRaider(
          aId,
          parseInt(targetPIdxStr, 10),
          targetRId
        );
      }

      return;
    }
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div
        className="
          min-h-screen
          bg-wood-table
          text-gray-200
          flex
          flex-col
          selection:bg-[#d4af37]/30
          selection:text-[#d4af37]
          table-surface
          relative
          overflow-x-hidden
        "
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
        <LivingDungeonAtmosphere />

        <Header
          onOpenRulebook={() => setIsRulebookOpen(true)}
          onOpenCardCustomizer={() => setIsCardCustomizerOpen(true)}
          onOpenNewGame={() => setIsNewGameOpen(true)}
          onToggleLog={() => setIsLogOpen((prev) => !prev)}
        />

        <main
          className="
            flex-1
            max-w-[1600px]
            w-full
            mx-auto
            px-2
            sm:px-6
            md:px-8
            py-3
            sm:py-5
            space-y-4
            table-perspective-container
            relative
            z-10
          "
        >
          {/* Oponente superior */}
          <div className="table-tilt-opponents">
            <TopOpponent />
          </div>

          {/* Masmorra central */}
          <div className="table-tilt-dungeon">
            {hasSideOpponents ? (
              <div className="grid grid-cols-12 gap-2 sm:gap-3 items-center">

                <div className="col-span-12 md:col-span-3 order-2 md:order-1">
                  <SideOpponents position="left" />
                </div>

                <div className="col-span-12 md:col-span-6 order-1 md:order-2">
                  <DungeonArea />
                </div>

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

          {/* Jogador */}
          <div className="table-tilt-player w-full max-w-4xl mx-auto">
            <PlayerPlaymat />
          </div>
        </main>

        {/* Modais */}
        <CardZoomModal />

        <DiceRollModal />

        <SacrificeModal />

        <GameOverModal
          onRestart={() => setIsNewGameOpen(true)}
        />

        <RulebookModal
          isOpen={isRulebookOpen}
          onClose={() => setIsRulebookOpen(false)}
        />

        <CardCustomizerModal
          isOpen={isCardCustomizerOpen}
          onClose={() => setIsCardCustomizerOpen(false)}
        />

        <NewGameModal
          isOpen={isNewGameOpen}
          onClose={() => setIsNewGameOpen(false)}
        />

        <ActionLogPanel
          isOpen={isLogOpen}
          onClose={() => setIsLogOpen(false)}
        />

        <DragOverlay dropAnimation={null}>
          {activeDragId ? (
            <div
              className="
                w-24
                sm:w-28
                h-28
                sm:h-32
                rounded-xl
                border-2
                border-yellow-500
                bg-black
                shadow-[0_0_20px_rgba(234,179,8,0.5)]
                opacity-80
              "
            />
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}

export default function App() {
  const [showMenu, setShowMenu] = useState(true);

  return (
    <GameProvider>
      {showMenu ? (
        <MainMenu
          onPlay={() => {
            setShowMenu(false);
          }}
        />
      ) : (
        <GameDashboard />
      )}
    </GameProvider>
  );
}
