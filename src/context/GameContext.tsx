import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  Player,
  RaiderCard,
  MonsterCard,
  EventCard,
  DungeonCard,
  TurnPhase,
  GameMode,
  CombatLogEntry,
  CombatResolution,
  FloatingCombatText,
  PendingTargetChoice,
  isMonster,
  isEvent
} from '../types/game';
import {
  generateFullRaiderDeck,
  getStoredImageOverrides,
  saveImageOverride,
  pruneOrphanedImageOverrides
} from '../data/cardsDatabase';
import { buildOfficialDungeonDeck } from '../utils/dungeonDeckBuilder';
import { resolveAttack } from '../utils/diceEngine';
import { soundEngine } from '../utils/soundEngine';
import {
  PlaymatTextures,
  getStoredPlaymatTextures,
  saveStoredPlaymatTextures,
  DEFAULT_PLAYMAT_TEXTURES
} from '../utils/textureManager';

interface GameContextType {
  players: Player[];
  activePlayerIndex: number;
  initialPlayerIndex: number;
  activePlayer: Player;
  currentRound: number;
  turnPhase: TurnPhase;
  gameMode: GameMode;
  dungeonDeck: DungeonCard[];
  currentDungeonCard: DungeonCard | null;
  dungeonGraveyard: DungeonCard[];
  raiderDeck: RaiderCard[];
  raiderDiscard: RaiderCard[];
  gameLogs: CombatLogEntry[];
  isGameOver: boolean;
  winner: Player | null;
  hasDrawnOrPlayedInPhase1: boolean;
  hasDrawnOrPlayedInPhase3: boolean;
  pendingSacrifice: { pendingCard: RaiderCard; playerIndex: number; phase: TurnPhase } | null;
  pendingTargetChoice: PendingTargetChoice | null;
  activeDiceResolution: CombatResolution | null;
  selectedAttackerId: string | null;
  isAiThinking: boolean;
  customImageOverrides: Record<string, string>;
  artReloadNonce: number;
  dungeonFlipNonce: number;
  floatingCombatTexts: FloatingCombatText[];
  playmatTextures: PlaymatTextures;
  isSoundMuted: boolean;
  inspectedCard: RaiderCard | DungeonCard | null;

  // Game Actions
  startNewGame: (playerCount: number, botCount: number, customNames?: string[]) => void;
  drawCard: (playerIndex?: number) => boolean;
  playCardFromHand: (cardId: string, playerIndex?: number) => boolean;
  sacrificeRaider: (raiderId: string) => void;
  selectAttacker: (raiderId: string | null) => void;
  attackDungeonMonster: (attackerId: string) => void;
  attackEnemyRaider: (attackerId: string, targetPlayerIndex: number, targetRaiderId: string) => void;
  useRaiderAbility: (raiderId: string) => void;
  passPhase: () => void;
  endTurn: () => void;
  resolveCurrentEvent: () => void;
  closeDiceModal: () => void;
  resolveTargetChoice: (optionId: string) => void;
  cancelTargetChoice: () => void;
  setCustomImageOverride: (cardNameOrId: string, url: string) => void;
  triggerCardArtReload: () => void;
  triggerFloatingText: (targetId: string, text: string, type: 'damage' | 'reaction' | 'death' | 'treasure' | 'heal') => void;
  updatePlaymatTextures: (textures: Partial<PlaymatTextures>) => void;
  toggleSoundMute: () => boolean;
  inspectCard: (card: RaiderCard | DungeonCard | null) => void;
}

const PLAYER_COLORS = [
  '#ef4444', // Vermelho Rubi
  '#3b82f6', // Azul Cobalto
  '#10b981', // Verde Esmeralda
  '#f59e0b', // Âmbar Dourado
  '#8b5cf6', // Roxo Arcano
  '#ec4899', // Rosa Carmesim
];

const PLAYER_AVATARS = ['⚔️', '🛡️', '🧙', '🏹', '🐺', '👑'];

function createInitialGameState(
  humanCount: number = 1,
  botCount: number = 3,
  customNames: string[] = []
) {
  const totalPlayers = Math.min(6, Math.max(2, humanCount + botCount));
  const initialPlayerIndex = Math.floor(Math.random() * totalPlayers);
  const generatedRaiderDeck = generateFullRaiderDeck();
  const generatedDungeonDeck = buildOfficialDungeonDeck();

  const initialPlayers: Player[] = [];
  let deckIndex = 0;

  for (let i = 0; i < totalPlayers; i++) {
    const isBot = i >= humanCount;
    const defaultName = isBot ? `Bot Guardião ${i + 1 - humanCount}` : (customNames[i] || `Jogador ${i + 1}`);
    const startingCardsCount = i === initialPlayerIndex ? 4 : 5;
    
    const hand = generatedRaiderDeck.slice(deckIndex, deckIndex + startingCardsCount);
    deckIndex += startingCardsCount;

    initialPlayers.push({
      id: `p-${i + 1}`,
      name: defaultName,
      isBot,
      color: PLAYER_COLORS[i % PLAYER_COLORS.length],
      avatar: PLAYER_AVATARS[i % PLAYER_AVATARS.length],
      hand,
      field: [],
      treasures: 0,
      graveyard: []
    });
  }

  const remainingRaiders = generatedRaiderDeck.slice(deckIndex);
  const [firstDungeonCard, ...remainingDungeon] = generatedDungeonDeck;

  const startMsg = `🏰 Início de "A Masmorra de Anakk Tur"! ${totalPlayers} Jogadores em jogo. O 1º jogador começa com 4 cartas; os demais com 5 cartas.`;
  const dungeonMsg = firstDungeonCard 
    ? `🚪 A câmara inicial da masmorra revela: ${firstDungeonCard.name}!` 
    : '🚪 A masmorra está vazia.';

  const initialLogs: CombatLogEntry[] = [
    {
      id: `log-init-2`,
      round: 1,
      phase: 'PREPARAR',
      playerName: 'Masmorra',
      message: dungeonMsg,
      type: 'event',
      timestamp: new Date().toLocaleTimeString('pt-BR')
    },
    {
      id: `log-init-1`,
      round: 1,
      phase: 'PREPARAR',
      playerName: 'Sistema',
      message: startMsg,
      type: 'system',
      timestamp: new Date().toLocaleTimeString('pt-BR')
    }
  ];

  return {
    initialPlayers,
    initialPlayerIndex,
    remainingRaiders,
    remainingDungeon,
    firstDungeonCard: firstDungeonCard || null,
    initialLogs
  };
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [initialSetup] = useState(() => createInitialGameState(1, 3));

  const [players, setPlayers] = useState<Player[]>(() => initialSetup.initialPlayers);
  const [activePlayerIndex, setActivePlayerIndex] = useState<number>(() => initialSetup.initialPlayerIndex);
  const [initialPlayerIndex, setInitialPlayerIndex] = useState<number>(() => initialSetup.initialPlayerIndex);
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [turnPhase, setTurnPhase] = useState<TurnPhase>('PREPARAR');
  const [gameMode, setGameMode] = useState<GameMode>('BOTS');
  
  const [dungeonDeck, setDungeonDeck] = useState<DungeonCard[]>(() => initialSetup.remainingDungeon);
  const [currentDungeonCard, setCurrentDungeonCard] = useState<DungeonCard | null>(() => initialSetup.firstDungeonCard);
  const [dungeonGraveyard, setDungeonGraveyard] = useState<DungeonCard[]>([]);
  
  const [raiderDeck, setRaiderDeck] = useState<RaiderCard[]>(() => initialSetup.remainingRaiders);
  const [raiderDiscard, setRaiderDiscard] = useState<RaiderCard[]>([]);
  
  const [gameLogs, setGameLogs] = useState<CombatLogEntry[]>(() => initialSetup.initialLogs);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [winner, setWinner] = useState<Player | null>(null);

  // Turn step restrictions
  const [hasDrawnOrPlayedInPhase1, setHasDrawnOrPlayedInPhase1] = useState<boolean>(false);
  const [hasDrawnOrPlayedInPhase3, setHasDrawnOrPlayedInPhase3] = useState<boolean>(false);

  // When playing 5th raider
  const [pendingSacrifice, setPendingSacrifice] = useState<{
    pendingCard: RaiderCard;
    playerIndex: number;
    phase: TurnPhase;
  } | null>(null);

  // Manual target choice modal (e.g. Adentrar resurrect / heal / discard)
  const [pendingTargetChoice, setPendingTargetChoice] = useState<PendingTargetChoice | null>(null);

  // Active dice resolution for animation & modal
  const [activeDiceResolution, setActiveDiceResolution] = useState<CombatResolution | null>(null);
  const [selectedAttackerId, setSelectedAttackerId] = useState<string | null>(null);
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
  const [floatingCombatTexts, setFloatingCombatTexts] = useState<FloatingCombatText[]>([]);
  const [dungeonFlipNonce, setDungeonFlipNonce] = useState(0);

  const [playmatTextures, setPlaymatTextures] = useState<PlaymatTextures>(() => getStoredPlaymatTextures());
  const [isSoundMuted, setIsSoundMuted] = useState<boolean>(() => soundEngine.getIsMuted());
  
  // Full Card Zoom Modal State
  const [inspectedCard, setInspectedCard] = useState<RaiderCard | DungeonCard | null>(null);

  const inspectCard = useCallback((card: RaiderCard | DungeonCard | null) => {
    setInspectedCard(card);
  }, []);

  const toggleSoundMute = useCallback(() => {
    const muted = soundEngine.toggleMute();
    setIsSoundMuted(muted);
    return muted;
  }, []);

  const updatePlaymatTextures = useCallback((newTextures: Partial<PlaymatTextures>) => {
    setPlaymatTextures(prev => {
      const updated = { ...prev, ...newTextures };
      saveStoredPlaymatTextures(updated);
      return updated;
    });
  }, []);

  const triggerFloatingText = useCallback((
    targetId: string,
    text: string,
    type: 'damage' | 'reaction' | 'death' | 'treasure' | 'heal' = 'damage'
  ) => {
    const newEntry: FloatingCombatText = {
      id: `float-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      targetId,
      text,
      type,
      timestamp: Date.now()
    };
    setFloatingCombatTexts(prev => [...prev.slice(-12), newEntry]);
    setTimeout(() => {
      setFloatingCombatTexts(prev => prev.filter(f => f.id !== newEntry.id));
    }, 2200);
  }, []);

  const [customImageOverrides, setCustomImageOverrides] = useState<Record<string, string>>(() => {
    pruneOrphanedImageOverrides();
    return getStoredImageOverrides();
  });
  const [artReloadNonce, setArtReloadNonce] = useState(0);
  const aiTurnTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const addLog = useCallback((
    message: string,
    type: CombatLogEntry['type'] = 'system',
    playerName: string = 'Masmorra'
  ) => {
    const entry: CombatLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      round: currentRound,
      phase: turnPhase,
      playerName,
      message,
      type,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
    setGameLogs(prev => [entry, ...prev.slice(0, 99)]);
  }, [currentRound, turnPhase]);

  // Initial Game Setup
  const startNewGame = useCallback((
    humanCount: number = 1,
    botCount: number = 3,
    customNames: string[] = []
  ) => {
    const setup = createInitialGameState(humanCount, botCount, customNames);

    setPlayers(setup.initialPlayers);
    setInitialPlayerIndex(setup.initialPlayerIndex);
    setActivePlayerIndex(setup.initialPlayerIndex);
    setCurrentRound(1);
    setTurnPhase('PREPARAR');
    setGameMode(botCount > 0 && humanCount === 1 ? 'BOTS' : 'PASS_AND_PLAY');
    setRaiderDeck(setup.remainingRaiders);
    setRaiderDiscard([]);
    setDungeonDeck(setup.remainingDungeon);
    setCurrentDungeonCard(setup.firstDungeonCard);
    setDungeonGraveyard([]);
    setGameLogs(setup.initialLogs);
    setIsGameOver(false);
    setWinner(null);
    setHasDrawnOrPlayedInPhase1(false);
    setHasDrawnOrPlayedInPhase3(false);
    setPendingSacrifice(null);
    setActiveDiceResolution(null);
    setSelectedAttackerId(null);
    setIsAiThinking(false);
    setFloatingCombatTexts([]);
  }, []);

  const activePlayer = (players && players[activePlayerIndex]) || (players && players[0]) || {
    id: 'p-1',
    name: 'Jogador 1',
    isBot: false,
    color: PLAYER_COLORS[0],
    avatar: PLAYER_AVATARS[0],
    hand: [],
    field: [],
    treasures: 0,
    graveyard: []
  };

  // Reload card images helper - updates all game state synchronously with latest overrides
  const triggerCardArtReload = useCallback(() => {
    const overrides = getStoredImageOverrides();
    setCustomImageOverrides(overrides);

    setPlayers(prev => prev.map(p => ({
      ...p,
      hand: p.hand.map(c => ({ ...c, imageUrl: overrides[c.name] || overrides[c.id] || c.imageUrl })),
      field: p.field.map(c => ({ ...c, imageUrl: overrides[c.name] || overrides[c.id] || c.imageUrl })),
      graveyard: p.graveyard.map(c => ({ ...c, imageUrl: overrides[c.name] || overrides[c.id] || c.imageUrl })),
    })));

    setRaiderDeck(prev => prev.map(c => ({ ...c, imageUrl: overrides[c.name] || overrides[c.id] || c.imageUrl })));
    setDungeonDeck(prev => prev.map(c => ({ ...c, imageUrl: overrides[c.name] || overrides[c.id] || c.imageUrl })));

    if (currentDungeonCard) {
      setCurrentDungeonCard(prev => prev ? ({ ...prev, imageUrl: overrides[prev.name] || overrides[prev.id] || prev.imageUrl }) : null);
    }

    setArtReloadNonce(n => n + 1);
  }, [currentDungeonCard]);

  // Direct custom art updater
  const setCustomImageOverride = useCallback((cardNameOrId: string, url: string) => {
    saveImageOverride(cardNameOrId, url);
    const overrides = getStoredImageOverrides();
    setCustomImageOverrides(overrides);

    setPlayers(prev => prev.map(p => ({
      ...p,
      hand: p.hand.map(c => ({ ...c, imageUrl: overrides[c.name] || overrides[c.id] || c.imageUrl })),
      field: p.field.map(c => ({ ...c, imageUrl: overrides[c.name] || overrides[c.id] || c.imageUrl })),
      graveyard: p.graveyard.map(c => ({ ...c, imageUrl: overrides[c.name] || overrides[c.id] || c.imageUrl })),
    })));

    setRaiderDeck(prev => prev.map(c => ({ ...c, imageUrl: overrides[c.name] || overrides[c.id] || c.imageUrl })));
    setDungeonDeck(prev => prev.map(c => ({ ...c, imageUrl: overrides[c.name] || overrides[c.id] || c.imageUrl })));

    setCurrentDungeonCard(prev => prev ? ({ ...prev, imageUrl: overrides[prev.name] || overrides[prev.id] || prev.imageUrl }) : null);

    setArtReloadNonce(n => n + 1);
  }, []);

  // Reveal next card in dungeon when monster is defeated or event resolved
  const revealNextDungeonCard = useCallback(() => {
    setDungeonFlipNonce(n => n + 1);
    soundEngine.playPageFlipSound();
    setDungeonDeck(prevDeck => {
      if (prevDeck.length === 0) {
        // Dungeon cleared completely!
        addLog('🏆 Todas as câmaras da Masmorra foram superadas!', 'system');
        // Check winner with most treasures
        setPlayers(currentPlayers => {
          const sorted = [...currentPlayers].sort((a, b) => b.treasures - a.treasures);
          setWinner(sorted[0]);
          setIsGameOver(true);
          addLog(`👑 ${sorted[0].name} venceu o jogo com ${sorted[0].treasures} Tesouros!`, 'treasure');
          return currentPlayers;
        });
        setCurrentDungeonCard(null);
        return [];
      }

      const [nextCard, ...rest] = prevDeck;
      setCurrentDungeonCard(nextCard);
      addLog(`🚪 A próxima câmara revela: ${nextCard.name}!`, 'event');

      // Check if Boss
      if (isMonster(nextCard) && nextCard.isBoss) {
        addLog(`⚠️ ATENÇÃO: O CHEFE DA MASMORRA (${nextCard.name}) FOI REVELADO!`, 'event');
      }

      return rest;
    });
  }, [addLog]);

  // Trigger ADENTRAR keyword effects across official raiders
  const triggerAdentrarEffect = useCallback((card: RaiderCard, playerIdx: number) => {
    if (!card.keywords.includes('ADENTRAR')) return;

    setPlayers(prevPlayers => {
      const updated = [...prevPlayers];
      const p = { ...updated[playerIdx] };
      const norm = card.name.toLowerCase();

      if (norm.includes('águia')) {
        // Águia das montanhas: Coloque 1 marcador de dano em uma carta em jogo.
        setCurrentDungeonCard(curr => {
          if (curr && isMonster(curr)) {
            const newDmg = curr.damage + 1;
            addLog(`🦅 ADENTRAR de ${card.name}: Infligiu 1 de dano direto a ${curr.name}!`, 'effect', p.name);
            if (newDmg >= curr.maxHp) {
              addLog(`💀 ${curr.name} foi abatido pelo ataque da Águia! +${curr.treasureReward} Tesouro(s)!`, 'death', p.name);
              p.treasures += curr.treasureReward;
              setTimeout(() => revealNextDungeonCard(), 600);
              return null;
            }
            return { ...curr, damage: newDmg };
          }
          return curr;
        });
      } else if (norm.includes('akari')) {
        // Akari: Coloque um saqueador da sua mão em jogo
        if (p.hand.length > 0 && p.field.length < 4) {
          const bonusRaider = p.hand[0];
          p.hand = p.hand.slice(1);
          p.field = [...p.field, { ...bonusRaider, damage: 0, hasActedThisTurn: false }];
          addLog(`🔮 ADENTRAR de ${card.name}: Convocou ${bonusRaider.name} diretamente da mão para o campo!`, 'effect', p.name);
        }
      } else if (norm.includes('cleo')) {
        // Cleo: Compre uma carta, em seguida, se for o com menos tesouros, ganhe 1 tesouro
        let minTreasures = Infinity;
        updated.forEach(pl => { if (pl.treasures < minTreasures) minTreasures = pl.treasures; });
        if (p.treasures <= minTreasures) {
          p.treasures += 1;
          addLog(`💰 ADENTRAR de ${card.name}: Cleo realizou seu desejo: comprou 1 carta e ganhou +1 Tesouro!`, 'treasure', p.name);
        } else {
          addLog(`📜 ADENTRAR de ${card.name}: Cleo concedeu a compra de 1 carta!`, 'effect', p.name);
        }
      } else if (norm.includes('dacius')) {
        // Dacius: Roube 1 tesouro do jogador com mais tesouros
        let maxTreasures = 0;
        let richestIdx = -1;
        updated.forEach((pl, idx) => {
          if (idx !== playerIdx && pl.treasures > maxTreasures) {
            maxTreasures = pl.treasures;
            richestIdx = idx;
          }
        });
        if (richestIdx !== -1 && maxTreasures > 0) {
          const richest = { ...updated[richestIdx] };
          richest.treasures -= 1;
          p.treasures += 1;
          updated[richestIdx] = richest;
          addLog(`🗡️ ADENTRAR [ROUBAR] de ${card.name}: Dacius furtou 1 Tesouro de ${richest.name}!`, 'treasure', p.name);
        } else {
          addLog(`🗡️ ADENTRAR de ${card.name}: Nenhum oponente possui tesouros para serem roubados.`, 'effect', p.name);
        }
      } else if (norm.includes('delilah')) {
        // Delilah: Troque o controle de dois saqueadores em jogo (CONTROLE)
        const opponentIndices = updated.map((_, idx) => idx).filter(idx => idx !== playerIdx && updated[idx].field.length > 0);
        if (opponentIndices.length > 0 && p.field.length < 4) {
          const randOppIdx = opponentIndices[0];
          const opp = { ...updated[randOppIdx] };
          const stolenRaider = opp.field.pop()!;
          p.field = [...p.field, stolenRaider];
          updated[randOppIdx] = opp;
          addLog(`🎭 ADENTRAR [CONTROLE] de ${card.name}: Iludiu e tomou controle de ${stolenRaider.name} de ${opp.name}!`, 'effect', p.name);
        }
      } else if (norm.includes('elekk')) {
        addLog(`🧙 ADENTRAR de ${card.name}: Elekk vislumbrou e reorganizou as 3 cartas do topo do baralho!`, 'effect', p.name);
      } else if (norm.includes('gimlik')) {
        setCurrentDungeonCard(curr => {
          if (curr && isEvent(curr)) {
            addLog(`⚒️ ADENTRAR de ${card.name}: Gimlik quebrou a superstição e anulou o evento [${curr.name}]!`, 'effect', p.name);
            setDungeonGraveyard(g => [...g, curr]);
            setTimeout(() => revealNextDungeonCard(), 500);
            return null;
          }
          return curr;
        });
      } else if (norm.includes('koth')) {
        // Koth: Cada jogador sacrifica um saqueador
        updated.forEach((pl, idx) => {
          if (pl.field.length > 0) {
            const sac = pl.field.find(r => r.id !== card.id) || pl.field[0];
            pl.field = pl.field.filter(r => r.id !== sac.id);
            pl.graveyard = [...pl.graveyard, sac];
            addLog(`🔥 ADENTRAR de ${card.name}: O caos exigiu sacrifício! ${pl.name} sacrificou ${sac.name}.`, 'death', p.name);
          }
        });
      } else if (norm.includes('lee fang')) {
        addLog(`🕊️ ADENTRAR de ${card.name}: Aura de paz instaurada! Trégua de ataques até a próxima rodada.`, 'effect', p.name);
      } else if (norm.includes('lobo')) {
        const hasOtherBeast = p.field.some(r => r.id !== card.id && r.type === 'Fera');
        if (hasOtherBeast) {
          addLog(`🐺 ADENTRAR [VÍNCULO DE FERA] de ${card.name}: Matilha unida! Comprou 1 carta extra.`, 'effect', p.name);
        }
      } else if (norm.includes('nyrissa')) {
        addLog(`👻 ADENTRAR de ${card.name}: Nyrissa amaldiçoou o monstro da masmorra, impedindo seu contra-ataque!`, 'effect', p.name);
      } else if (norm.includes('caçador primal')) {
        setCurrentDungeonCard(curr => {
          if (curr && isMonster(curr)) {
            const newDmg = curr.damage + 1;
            addLog(`🏹 ADENTRAR de ${card.name}: Disparo certeiro causou 1 de dano direto a ${curr.name}!`, 'effect', p.name);
            if (newDmg >= curr.maxHp) {
              addLog(`💀 ${curr.name} foi abatido! +${curr.treasureReward} Tesouro(s)!`, 'death', p.name);
              p.treasures += curr.treasureReward;
              setTimeout(() => revealNextDungeonCard(), 500);
              return null;
            }
            return { ...curr, damage: newDmg };
          }
          return curr;
        });
      } else if (norm.includes('otepp')) {
        setCurrentDungeonCard(curr => {
          if (curr && isMonster(curr) && !curr.isBoss) {
            addLog(`⚡ ADENTRAR de ${card.name}: Otepp obliterou ${curr.name} com magia pura!`, 'death', p.name);
            setDungeonGraveyard(g => [...g, curr]);
            setTimeout(() => revealNextDungeonCard(), 600);
            return null;
          }
          return curr;
        });
      } else if (norm.includes('rudolf')) {
        addLog(`🎲 ADENTRAR de ${card.name}: Rudolf investigou as 2 cartas do topo com mãos leves!`, 'effect', p.name);
      } else if (norm.includes('sacerdotisa')) {
        let maxDmg = 0;
        let targetAlly: RaiderCard | null = null;
        p.field.forEach(r => {
          if (r.damage > maxDmg) {
            maxDmg = r.damage;
            targetAlly = r;
          }
        });
        if (targetAlly) {
          p.field = p.field.map(r => r.id === (targetAlly as RaiderCard).id ? { ...r, damage: 0 } : r);
          addLog(`✨ ADENTRAR de ${card.name}: Curou COMPLETAMENTE todo o dano de ${(targetAlly as RaiderCard).name}!`, 'effect', p.name);
        }
      } else if (norm.includes('skiirk')) {
        const beastInGrave = p.graveyard.filter(r => r.type === 'Fera');
        if (beastInGrave.length > 0) {
          if (!p.isBot) {
            // Human player manual selection
            setPendingTargetChoice({
              id: `skiirk-${Date.now()}`,
              title: 'Resgatar Fera do Cemitério',
              description: 'Escolha 1 Fera do seu Cemitério para resgatar de volta para a sua Mão.',
              sourceCardName: card.name,
              options: beastInGrave.map(b => ({
                id: b.id,
                label: b.name,
                sublabel: `${b.diceCount}d | ${b.maxHp} HP - "${b.effectDescription}"`,
                card: b
              })),
              onSelect: (optionId: string) => {
                setPlayers(cur => {
                  const up = [...cur];
                  const pl = { ...up[playerIdx] };
                  const target = pl.graveyard.find(g => g.id === optionId);
                  if (target) {
                    pl.graveyard = pl.graveyard.filter(g => g.id !== optionId);
                    pl.hand = [...pl.hand, target];
                    addLog(`🐾 ADENTRAR de ${card.name}: Skiirk resgatou ${target.name} do cemitério para a sua mão!`, 'effect', pl.name);
                  }
                  up[playerIdx] = pl;
                  return up;
                });
                setPendingTargetChoice(null);
              },
              onCancel: () => setPendingTargetChoice(null)
            });
          } else {
            const chosen = beastInGrave[0];
            p.graveyard = p.graveyard.filter(r => r.id !== chosen.id);
            p.hand = [...p.hand, chosen];
            addLog(`🐾 ADENTRAR de ${card.name}: Skiirk resgatou ${chosen.name} do cemitério para a mão!`, 'effect', p.name);
          }
        }
      } else if (norm.includes('tristan')) {
        const opponentIndices = updated.map((_, idx) => idx).filter(idx => idx !== playerIdx && updated[idx].hand.length > 0);
        if (opponentIndices.length > 0) {
          const randOppIdx = opponentIndices[Math.floor(Math.random() * opponentIndices.length)];
          const opp = { ...updated[randOppIdx] };
          const discardedCard = opp.hand.pop()!;
          opp.graveyard = [...opp.graveyard, discardedCard];
          updated[randOppIdx] = opp;
          addLog(`🃏 ADENTRAR de ${card.name}: Tristan fez ${opp.name} descartar 1 carta da mão (${discardedCard.name})!`, 'effect', p.name);
        }
      } else if (norm.includes('yderon')) {
        const hasBeast = p.field.some(r => r.type === 'Fera');
        p.field = p.field.map(r => ({ ...r, damage: 0 }));
        addLog(`🌿 ADENTRAR de ${card.name}: Yderon purificou todos os ferimentos dos seus saqueadores em campo!`, 'effect', p.name);
      } else if (norm.includes('zul’dar') || norm.includes('zuldar') || norm.includes('necromante')) {
        if (p.graveyard.length > 0 && p.field.length < 4) {
          if (!p.isBot) {
            // Human player manual choice modal for resurrection
            setPendingTargetChoice({
              id: `zuldar-${Date.now()}`,
              title: 'Ressuscitar do Cemitério',
              description: 'Escolha 1 Saqueador do seu Cemitério para ressuscitar diretamente no seu campo.',
              sourceCardName: card.name,
              options: p.graveyard.map(g => ({
                id: g.id,
                label: g.name,
                sublabel: `${g.type} | ${g.diceCount}d | ${g.maxHp} HP - "${g.effectDescription}"`,
                card: g
              })),
              onSelect: (optionId: string) => {
                setPlayers(cur => {
                  const up = [...cur];
                  const pl = { ...up[playerIdx] };
                  const target = pl.graveyard.find(g => g.id === optionId);
                  if (target && pl.field.length < 4) {
                    pl.graveyard = pl.graveyard.filter(g => g.id !== optionId);
                    pl.field = [...pl.field, { ...target, damage: 0, hasActedThisTurn: false }];
                    addLog(`💀 ADENTRAR [CONTROLE] de ${card.name}: Ressuscitou ${target.name} diretamente para o campo!`, 'effect', pl.name);
                  }
                  up[playerIdx] = pl;
                  return up;
                });
                setPendingTargetChoice(null);
              },
              onCancel: () => setPendingTargetChoice(null)
            });
          } else {
            const anyGraveRaider = p.graveyard[0];
            p.graveyard = p.graveyard.filter(r => r.id !== anyGraveRaider.id);
            p.field = [...p.field, { ...anyGraveRaider, damage: 0, hasActedThisTurn: false }];
            addLog(`💀 ADENTRAR [CONTROLE] de ${card.name}: Ressuscitou ${anyGraveRaider.name} diretamente para o seu campo!`, 'effect', p.name);
          }
        }
      }

      updated[playerIdx] = p;
      return updated;
    });

    // Draw trigger handling for cards with draw keyword on Adentrar
    const norm = card.name.toLowerCase();
    if (norm.includes('águia') || norm.includes('cleo') || norm.includes('lobo') || (norm.includes('yderon') && true)) {
      setRaiderDeck(deck => {
        if (deck.length > 0) {
          const [drawn, ...rest] = deck;
          setPlayers(prev => {
            const updated = [...prev];
            updated[playerIdx] = {
              ...updated[playerIdx],
              hand: [...updated[playerIdx].hand, drawn]
            };
            return updated;
          });
          return rest;
        }
        return deck;
      });
    }
  }, [addLog, revealNextDungeonCard]);

  // Trigger ULTIMO SUSPIRO keyword effects across official raiders
  const triggerUltimoSuspiroEffect = useCallback((card: RaiderCard, playerIdx: number, killerName?: string) => {
    if (!card.keywords.includes('ULTIMO_SUSPIRO')) return;

    setPlayers(prevPlayers => {
      const updated = [...prevPlayers];
      const p = { ...updated[playerIdx] };
      const norm = card.name.toLowerCase();

      if (norm.includes('águia')) {
        addLog(`🦅 ULTIMO SUSPIRO de ${card.name}: Ao cair, a Águia permitiu comprar 1 carta!`, 'effect', p.name);
        setRaiderDeck(deck => {
          if (deck.length > 0) {
            const [drawn, ...rest] = deck;
            p.hand = [...p.hand, drawn];
            return rest;
          }
          return deck;
        });
      } else if (norm.includes('ladrão de tesouros')) {
        // Ladrão de Tesouros: O jogador que destruiu esta carta ganha +1 tesouro
        addLog(`💰 ULTIMO SUSPIRO [ROUBAR] de ${card.name}: O abate rendeu +1 Marcador de Tesouro para o vencedor (${killerName || 'Atacante'})!`, 'treasure');
      } else if (norm.includes('portador da praga')) {
        // Portador da praga: Coloque 1 marcador de veneno/dano em todos os saqueadores em campo
        addLog(`☠️ ULTIMO SUSPIRO de ${card.name}: Praga cadavérica liberada! Todos os saqueadores em campo sofrem 1 de dano!`, 'death');
        updated.forEach((pl, idx) => {
          const remainingField: RaiderCard[] = [];
          pl.field.forEach(r => {
            const newDmg = r.damage + 1;
            if (newDmg >= r.maxHp) {
              pl.graveyard.push(r);
            } else {
              remainingField.push({ ...r, damage: newDmg });
            }
          });
          pl.field = remainingField;
        });
      } else if (norm.includes('skidd')) {
        // Skidd: Cause 2 de dano ao monstro atual da masmorra
        setCurrentDungeonCard(curr => {
          if (curr && isMonster(curr)) {
            const newDmg = curr.damage + 2;
            addLog(`💣 ULTIMO SUSPIRO de ${card.name}: Bomba final causou 2 de dano explosivo a ${curr.name}!`, 'effect', p.name);
            if (newDmg >= curr.maxHp) {
              addLog(`💀 ${curr.name} foi aniquilado pela explosão! +${curr.treasureReward} Tesouros!`, 'death', p.name);
              p.treasures += curr.treasureReward;
              setTimeout(() => revealNextDungeonCard(), 500);
              return null;
            }
            return { ...curr, damage: newDmg };
          }
          return curr;
        });
      }

      updated[playerIdx] = p;
      return updated;
    });
  }, [addLog, revealNextDungeonCard]);

  // Action: Draw a card
  const drawCard = useCallback((playerIndex?: number): boolean => {
    const targetIdx = playerIndex !== undefined ? playerIndex : activePlayerIndex;
    const player = players[targetIdx];
    if (!player) return false;

    // Check phase restrictions
    if (turnPhase === 'PREPARAR' && hasDrawnOrPlayedInPhase1) {
      addLog(`⚠️ Você já executou uma ação no PASSO 1 (PREPARAR). Avance para a Masmorra.`, 'system', player.name);
      return false;
    }
    if (turnPhase === 'REAGRUPAR' && hasDrawnOrPlayedInPhase3) {
      addLog(`⚠️ Você já executou uma ação no PASSO 3 (REAGRUPAR). Finalize o turno.`, 'system', player.name);
      return false;
    }
    if (turnPhase === 'MASMORRA') {
      addLog(`⚠️ No PASSO 2 (MASMORRA), as ações são apenas de combate ou habilidades dos seus saqueadores.`, 'system', player.name);
      return false;
    }

    if (raiderDeck.length === 0) {
      // Reshuffle discard into deck if empty
      if (raiderDiscard.length === 0) {
        addLog(`⚠️ O baralho de Saqueadores e o descarte estão esgotados!`, 'system', player.name);
        return false;
      }
      const newDeck = [...raiderDiscard];
      for (let i = newDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
      }
      setRaiderDeck(newDeck.slice(1));
      setRaiderDiscard([]);
      const drawn = newDeck[0];
      setPlayers(prev => {
        const updated = [...prev];
        updated[targetIdx] = {
          ...updated[targetIdx],
          hand: [...updated[targetIdx].hand, drawn]
        };
        return updated;
      });
    } else {
      const [drawn, ...rest] = raiderDeck;
      setRaiderDeck(rest);
      setPlayers(prev => {
        const updated = [...prev];
        updated[targetIdx] = {
          ...updated[targetIdx],
          hand: [...updated[targetIdx].hand, drawn]
        };
        return updated;
      });
    }
    soundEngine.playDrawCardSound();
    addLog(`🎴 ${player.name} comprou 1 carta de Saqueador.`, 'card_play', player.name);

    if (turnPhase === 'PREPARAR') {
      setHasDrawnOrPlayedInPhase1(true);
    } else if (turnPhase === 'REAGRUPAR') {
      setHasDrawnOrPlayedInPhase3(true);
    }

    return true;
  }, [activePlayerIndex, players, turnPhase, hasDrawnOrPlayedInPhase1, hasDrawnOrPlayedInPhase3, raiderDeck, raiderDiscard, addLog]);

  // Action: Play Card from Hand (Enforcing 4-raider field limit!)
  const playCardFromHand = useCallback((cardId: string, playerIndex?: number): boolean => {
    const targetIdx = playerIndex !== undefined ? playerIndex : activePlayerIndex;
    const player = players[targetIdx];
    if (!player) return false;

    if (turnPhase === 'PREPARAR' && hasDrawnOrPlayedInPhase1) {
      addLog(`⚠️ Você já executou uma ação no PASSO 1 (PREPARAR).`, 'system', player.name);
      return false;
    }
    if (turnPhase === 'REAGRUPAR' && hasDrawnOrPlayedInPhase3) {
      addLog(`⚠️ Você já executou uma ação no PASSO 3 (REAGRUPAR).`, 'system', player.name);
      return false;
    }
    if (turnPhase === 'MASMORRA') {
      addLog(`⚠️ Não é possível baixar cartas durante o PASSO 2 (MASMORRA).`, 'system', player.name);
      return false;
    }

    const card = player.hand.find(c => c.id === cardId);
    if (!card) return false;

    // CHECK FIELD LIMIT: 4 Raiders
    if (player.field.length >= 4) {
      // Must choose 1 of existing 4 to sacrifice!
      setPendingSacrifice({
        pendingCard: card,
        playerIndex: targetIdx,
        phase: turnPhase
      });
      addLog(`⚠️ Limite de 4 saqueadores atingido! Escolha 1 saqueador em campo para destruir e dar espaço a ${card.name}.`, 'system', player.name);
      return true;
    }

    // Put directly onto field
    setPlayers(prev => {
      const updated = [...prev];
      const p = { ...updated[targetIdx] };
      p.hand = p.hand.filter(c => c.id !== cardId);
      p.field = [...p.field, { ...card, damage: 0, hasActedThisTurn: false }];
      updated[targetIdx] = p;
      return updated;
    });

    soundEngine.playCardPlaySound();
    addLog(`🛡️ ${player.name} jogou ${card.name} (${card.type}) no campo!`, 'card_play', player.name);
    triggerAdentrarEffect(card, targetIdx);

    if (turnPhase === 'PREPARAR') {
      setHasDrawnOrPlayedInPhase1(true);
    } else if (turnPhase === 'REAGRUPAR') {
      setHasDrawnOrPlayedInPhase3(true);
    }

    return true;
  }, [activePlayerIndex, players, turnPhase, hasDrawnOrPlayedInPhase1, hasDrawnOrPlayedInPhase3, addLog, triggerAdentrarEffect]);

  // Sacrifice a raider to make room for 5th card
  const sacrificeRaider = useCallback((raiderId: string) => {
    if (!pendingSacrifice) return;
    const { pendingCard, playerIndex, phase } = pendingSacrifice;
    const player = players[playerIndex];
    if (!player) return;

    const sacrificed = player.field.find(r => r.id === raiderId);
    if (!sacrificed) return;

    setPlayers(prev => {
      const updated = [...prev];
      const p = { ...updated[playerIndex] };
      p.field = p.field.filter(r => r.id !== raiderId);
      p.graveyard = [...p.graveyard, sacrificed];
      p.hand = p.hand.filter(c => c.id !== pendingCard.id);
      p.field = [...p.field, { ...pendingCard, damage: 0, hasActedThisTurn: false }];
      updated[playerIndex] = p;
      return updated;
    });

    addLog(`⚰️ ${player.name} destruiu ${sacrificed.name} para invocar ${pendingCard.name}!`, 'death', player.name);
    triggerUltimoSuspiroEffect(sacrificed, playerIndex);
    triggerAdentrarEffect(pendingCard, playerIndex);

    if (phase === 'PREPARAR') {
      setHasDrawnOrPlayedInPhase1(true);
    } else if (phase === 'REAGRUPAR') {
      setHasDrawnOrPlayedInPhase3(true);
    }

    setPendingSacrifice(null);
  }, [pendingSacrifice, players, addLog, triggerUltimoSuspiroEffect, triggerAdentrarEffect]);

  // Attack Dungeon Monster
  const attackDungeonMonster = useCallback((attackerId: string) => {
    setPendingTargetChoice(null);
    setPendingSacrifice(null);

    if (turnPhase !== 'MASMORRA') {
      addLog(`⚠️ Ataques só podem ser realizados durante o PASSO 2: MASMORRA!`, 'system', activePlayer.name);
      return;
    }

    const attacker = activePlayer.field.find(r => r.id === attackerId);
    if (!attacker) return;
    if (attacker.hasActedThisTurn) {
      addLog(`⚠️ ${attacker.name} já realizou uma ação neste turno!`, 'system', activePlayer.name);
      return;
    }

    if (!currentDungeonCard) {
      addLog(`⚠️ Não há uma carta ativa para enfrentar na Masmorra no momento.`, 'system', activePlayer.name);
      return;
    }

    if (isEvent(currentDungeonCard)) {
      addLog(`✨ A câmara contém o evento "${currentDungeonCard.name}". Resolva o evento antes de atacar!`, 'event', activePlayer.name);
      return;
    }

    const monster = currentDungeonCard;

    // Type interactions and Special Abilities:
    // Combatente vs Level 2+ (Iberian bonus), Conjurador bonuses, etc.
    let bonusFlatDamage = 0;
    let extraDice = 0;
    let reactionMultiplier = 1;

    // Type interaction: Iberian caçador de monstros
    if (attacker.name.includes('Iberian') && monster.level >= 2) {
      extraDice += 1;
      addLog(`🎯 BÔNUS ESPECIALISTA: Iberian ganhou +1 dado de ataque contra monstros Nível ${monster.level}!`, 'effect', activePlayer.name);
    }

    // Type interaction: Combatente attacking specific monsters (e.g. Aranha / Bestas)
    if (attacker.type === 'Combatente' && (monster.name.toLowerCase().includes('aranha') || monster.name.toLowerCase().includes('lobo'))) {
      bonusFlatDamage += 1;
      addLog(`⚔️ BÔNUS DE TIPO COMBATENTE: +1 dano bônus contra ${monster.name}!`, 'effect', activePlayer.name);
    }

    // Type interaction: Conjurador attacking undead/spectral monsters
    if (attacker.type === 'Conjurador' && (monster.name.toLowerCase().includes('esqueleto') || monster.name.toLowerCase().includes('espectro') || monster.name.toLowerCase().includes('fantasma') || monster.name.toLowerCase().includes('múmia'))) {
      bonusFlatDamage += 1;
      addLog(`🔮 BÔNUS DE TIPO CONJURADOR: +1 dano mágico direto contra mortos-vivos (${monster.name})!`, 'effect', activePlayer.name);
    }

    // Check VINCULO bonus
    if (attacker.keywords.includes('VINCULO')) {
      const matchingTypeCount = activePlayer.field.filter(r => r.id !== attacker.id && r.type === attacker.type).length;
      if (matchingTypeCount > 0) {
        extraDice += (attacker.type === 'Conjurador' ? 2 : 1);
        addLog(`🔗 VÍNCULO de ${attacker.name} ativado (+${attacker.type === 'Conjurador' ? 2 : 1} dado de ataque)!`, 'effect', activePlayer.name);
      }
    }

    soundEngine.playAttackSound();
    const resolution = resolveAttack(attacker, activePlayer.name, monster, 'Masmorra', extraDice, bonusFlatDamage, reactionMultiplier);
    setActiveDiceResolution(resolution);
    addLog(resolution.message, 'combat', activePlayer.name);

    // Trigger Floating Damage on Monster
    if (resolution.damageDealt > 0) {
      triggerFloatingText(monster.id, `-${resolution.damageDealt} HP`, 'damage');
    }
    if (resolution.targetDied) {
      setTimeout(() => {
        triggerFloatingText(monster.id, monster.name.includes('Tesouro') ? '💎 PILHADO!' : '💀 DERROTADO!', 'death');
      }, 500);
    }
    if (resolution.reactionDamage > 0) {
      triggerFloatingText(attacker.id, `-${resolution.reactionDamage} HP (REAÇÃO)`, 'reaction');
    }
    if (resolution.attackerDied) {
      setTimeout(() => {
        triggerFloatingText(attacker.id, '💀 TOMBOU!', 'death');
      }, 500);
    }
    if (resolution.treasureEarned > 0) {
      triggerFloatingText(activePlayer.id, `+${resolution.treasureEarned} 💎 TESOURO`, 'treasure');
    }

    // Apply outcomes
    setPlayers(prev => {
      const updated = [...prev];
      const p = { ...updated[activePlayerIndex] };
      
      // Update attacker status
      p.field = p.field.map(r => {
        if (r.id === attacker.id) {
          const newDamage = r.damage + resolution.reactionDamage;
          return { ...r, damage: newDamage, hasActedThisTurn: true };
        }
        return r;
      });

      // If attacker died by reaction
      if (resolution.attackerDied) {
        const deadAttacker = p.field.find(r => r.id === attacker.id);
        if (deadAttacker) {
          p.field = p.field.filter(r => r.id !== attacker.id);
          p.graveyard = [...p.graveyard, deadAttacker];
          triggerUltimoSuspiroEffect(deadAttacker, activePlayerIndex, monster.name);
        }
      }

      // Add treasures if monster died / treasure was plundered
      if (resolution.targetDied) {
        p.treasures += resolution.treasureEarned;
      }

      updated[activePlayerIndex] = p;
      return updated;
    });

    // Update monster status
    if (resolution.targetDied) {
      setDungeonGraveyard(g => [...g, monster]);
      setTimeout(() => {
        revealNextDungeonCard();
      }, 1200);
    } else {
      setCurrentDungeonCard(prev => prev && isMonster(prev) ? { ...prev, damage: prev.damage + resolution.damageDealt } : prev);
    }

    setSelectedAttackerId(null);
  }, [turnPhase, activePlayer, currentDungeonCard, activePlayerIndex, addLog, triggerUltimoSuspiroEffect, revealNextDungeonCard]);

  // Attack Enemy Raider (Strict DEFENSOR Priority Check!)
  const attackEnemyRaider = useCallback((attackerId: string, targetPlayerIndex: number, targetRaiderId: string) => {
    setPendingTargetChoice(null);
    setPendingSacrifice(null);

    if (turnPhase !== 'MASMORRA') {
      addLog(`⚠️ Ataques só podem ser realizados no PASSO 2: MASMORRA!`, 'system', activePlayer.name);
      return;
    }

    const attacker = activePlayer.field.find(r => r.id === attackerId);
    if (!attacker) return;
    if (attacker.hasActedThisTurn) {
      addLog(`⚠️ ${attacker.name} já realizou sua ação neste turno!`, 'system', activePlayer.name);
      return;
    }

    const targetPlayer = players[targetPlayerIndex];
    if (!targetPlayer) return;

    const targetRaider = targetPlayer.field.find(r => r.id === targetRaiderId);
    if (!targetRaider) return;

    // STRICT DEFENSOR CHECK: If opponent has any raider with DEFENSOR, must attack one with DEFENSOR!
    const defenderRaiders = targetPlayer.field.filter(r => r.keywords.includes('DEFENSOR'));
    if (defenderRaiders.length > 0 && !targetRaider.keywords.includes('DEFENSOR')) {
      const defNames = defenderRaiders.map(d => d.name).join(', ');
      addLog(`🛡️ REGRA DEFENSOR: ${targetPlayer.name} possui saqueador com DEFENSOR (${defNames})! Você deve atacá-lo primeiro!`, 'system', activePlayer.name);
      return;
    }

    // Check VINCULO bonus
    let extraDice = 0;
    if (attacker.keywords.includes('VINCULO')) {
      const matchingTypeCount = activePlayer.field.filter(r => r.id !== attacker.id && r.type === attacker.type).length;
      if (matchingTypeCount > 0) {
        extraDice = attacker.type === 'Conjurador' ? 2 : 1;
        addLog(`🔗 VÍNCULO de ${attacker.name} ativado (+${extraDice} dado)!`, 'effect', activePlayer.name);
      }
    }

    const resolution = resolveAttack(attacker, activePlayer.name, targetRaider, targetPlayer.name, extraDice);
    setActiveDiceResolution(resolution);
    addLog(resolution.message, 'combat', activePlayer.name);

    // Trigger Floating Damage on Target Raider & Attacker
    if (resolution.damageDealt > 0) {
      triggerFloatingText(targetRaider.id, `-${resolution.damageDealt} HP`, 'damage');
    }
    if (resolution.targetDied) {
      setTimeout(() => {
        triggerFloatingText(targetRaider.id, '💀 DERROTADO!', 'death');
      }, 500);
    }
    if (resolution.reactionDamage > 0) {
      triggerFloatingText(attacker.id, `-${resolution.reactionDamage} HP (REAÇÃO)`, 'reaction');
    }
    if (resolution.attackerDied) {
      setTimeout(() => {
        triggerFloatingText(attacker.id, '💀 TOMBOU!', 'death');
      }, 500);
    }
    if (resolution.treasureEarned > 0) {
      triggerFloatingText(activePlayer.id, `+${resolution.treasureEarned} 💎 TESOURO`, 'treasure');
    }

    // Apply outcomes to both players
    setPlayers(prev => {
      const updated = [...prev];
      const pAttacker = { ...updated[activePlayerIndex] };
      const pTarget = { ...updated[targetPlayerIndex] };

      // Update attacker
      pAttacker.field = pAttacker.field.map(r => {
        if (r.id === attacker.id) {
          return { ...r, damage: r.damage + resolution.reactionDamage, hasActedThisTurn: true };
        }
        return r;
      });

      if (resolution.attackerDied) {
        const deadAttacker = pAttacker.field.find(r => r.id === attacker.id);
        if (deadAttacker) {
          pAttacker.field = pAttacker.field.filter(r => r.id !== attacker.id);
          pAttacker.graveyard = [...pAttacker.graveyard, deadAttacker];
          triggerUltimoSuspiroEffect(deadAttacker, activePlayerIndex, targetRaider.name);
        }
      }

      // Update target
      if (resolution.targetDied) {
        pTarget.field = pTarget.field.filter(r => r.id !== targetRaider.id);
        pTarget.graveyard = [...pTarget.graveyard, targetRaider];
        pAttacker.treasures += resolution.treasureEarned;
        triggerUltimoSuspiroEffect(targetRaider, targetPlayerIndex, attacker.name);
      } else {
        pTarget.field = pTarget.field.map(r => {
          if (r.id === targetRaider.id) {
            return { ...r, damage: r.damage + resolution.damageDealt };
          }
          return r;
        });
      }

      updated[activePlayerIndex] = pAttacker;
      updated[targetPlayerIndex] = pTarget;
      return updated;
    });

    setSelectedAttackerId(null);
  }, [turnPhase, activePlayer, players, activePlayerIndex, addLog, triggerUltimoSuspiroEffect]);

  // Use Raider Active Ability (Passo 2 action) with interactive manual target choice
  const useRaiderAbility = useCallback((raiderId: string) => {
    if (turnPhase !== 'MASMORRA') {
      addLog(`⚠️ Habilidades ativas só podem ser utilizadas no PASSO 2: MASMORRA!`, 'system', activePlayer.name);
      return;
    }

    const raider = activePlayer.field.find(r => r.id === raiderId);
    if (!raider) return;
    if (raider.hasActedThisTurn) {
      addLog(`⚠️ ${raider.name} já realizou sua ação neste turno!`, 'system', activePlayer.name);
      return;
    }

    const norm = raider.name.toLowerCase();

    // 1. Assassina de Lay'ann: Destrua um saqueador em jogo
    if (norm.includes('assassina') || raider.activeAbility?.actionType === 'DESTROY_RAIDER') {
      const enemyRaiders: { raider: RaiderCard; playerIdx: number; playerName: string }[] = [];
      players.forEach((opp, oppIdx) => {
        if (oppIdx !== activePlayerIndex) {
          (opp.field || []).forEach(r => {
            enemyRaiders.push({ raider: r, playerIdx: oppIdx, playerName: opp.name });
          });
        }
      });

      if (enemyRaiders.length === 0) {
        addLog(`🗡️ HABILIDADE ATIVA [Golpe Letal] de ${raider.name}: Nenhum alvo oponente em jogo para assassinar!`, 'system', activePlayer.name);
        return;
      }

      if (!activePlayer.isBot) {
        setPendingTargetChoice({
          id: `assassina-${Date.now()}`,
          title: '🗡️ Golpe Letal - Escolha o Alvo',
          description: 'Selecione 1 Saqueador oponente em jogo para destruir instantaneamente:',
          sourceCardName: raider.name,
          options: enemyRaiders.map(item => ({
            id: `${item.playerIdx}:${item.raider.id}`,
            label: `${item.raider.name} (${item.playerName})`,
            sublabel: `${item.raider.type} | ${item.raider.maxHp - (item.raider.damage || 0)}/${item.raider.maxHp} HP | ${item.raider.diceCount}d - "${item.raider.effectDescription}"`,
            card: item.raider,
          })),
          onSelect: (optionId: string) => {
            const [pIdxStr, rId] = optionId.split(':');
            const targetPIdx = parseInt(pIdxStr, 10);
            setPlayers(prev => {
              const updated = [...prev];
              const targetP = { ...updated[targetPIdx] };
              const targetR = targetP.field.find(r => r.id === rId);
              if (targetR) {
                targetP.field = targetP.field.filter(r => r.id !== rId);
                targetP.graveyard = [...targetP.graveyard, targetR];
                updated[targetPIdx] = targetP;
                addLog(`🗡️ HABILIDADE ATIVA [Golpe Letal] de ${raider.name}: Assassina eliminou instantaneamente ${targetR.name} de ${targetP.name}!`, 'death', activePlayer.name);
                triggerFloatingText(targetR.id, '💀 ELIMINADO!', 'death');
                triggerUltimoSuspiroEffect(targetR, targetPIdx, raider.name);
              }
              // Mark raider as acted
              const actP = { ...updated[activePlayerIndex] };
              actP.field = actP.field.map(r => r.id === raiderId ? { ...r, hasActedThisTurn: true } : r);
              updated[activePlayerIndex] = actP;
              return updated;
            });
            setPendingTargetChoice(null);
          },
          onCancel: () => setPendingTargetChoice(null),
        });
      } else {
        // Bot auto-picks first target
        const targetItem = enemyRaiders[0];
        setPlayers(prev => {
          const updated = [...prev];
          const targetP = { ...updated[targetItem.playerIdx] };
          targetP.field = targetP.field.filter(r => r.id !== targetItem.raider.id);
          targetP.graveyard = [...targetP.graveyard, targetItem.raider];
          updated[targetItem.playerIdx] = targetP;
          addLog(`🗡️ HABILIDADE ATIVA [Golpe Letal] de ${raider.name}: Assassina eliminou instantaneamente ${targetItem.raider.name} de ${targetP.name}!`, 'death', activePlayer.name);
          triggerUltimoSuspiroEffect(targetItem.raider, targetItem.playerIdx, raider.name);
          const actP = { ...updated[activePlayerIndex] };
          actP.field = actP.field.map(r => r.id === raiderId ? { ...r, hasActedThisTurn: true } : r);
          updated[activePlayerIndex] = actP;
          return updated;
        });
      }
      setSelectedAttackerId(null);
      return;
    }

    // 2. Azram: Tempestade de Fogo (Role 1 dado de dano em todos os saqueadores do jogador escolhido)
    if (norm.includes('azram') || raider.activeAbility?.actionType === 'AOE_DAMAGE') {
      const validOpponents = players
        .map((p, idx) => ({ player: p, index: idx }))
        .filter(x => x.index !== activePlayerIndex && (x.player.field || []).length > 0);

      if (validOpponents.length === 0) {
        addLog(`🔥 HABILIDADE ATIVA [Tempestade Ígnea] de ${raider.name}: Nenhum oponente com saqueadores em campo para incendiar!`, 'system', activePlayer.name);
        return;
      }

      if (!activePlayer.isBot) {
        setPendingTargetChoice({
          id: `azram-${Date.now()}`,
          title: '🔥 Tempestade Ígnea - Escolha o Oponente',
          description: 'Escolha qual oponente terá todos os seus Saqueadores atingidos por 1 dado de dano de fogo:',
          sourceCardName: raider.name,
          options: validOpponents.map(item => ({
            id: `${item.index}`,
            label: `${item.player.name} (${item.player.field.length} saqueadores em campo)`,
            sublabel: `Alvos: ${item.player.field.map(r => r.name).join(', ')}`,
          })),
          onSelect: (optionId: string) => {
            const targetPIdx = parseInt(optionId, 10);
            setPlayers(prev => {
              const updated = [...prev];
              const opp = { ...updated[targetPIdx] };
              addLog(`🔥 HABILIDADE ATIVA [Tempestade Ígnea] de ${raider.name}: Lança chamas sobre o campo de ${opp.name}!`, 'effect', activePlayer.name);
              const remainingField: RaiderCard[] = [];
              opp.field.forEach(r => {
                const die = Math.floor(Math.random() * 6) + 1;
                const dmg = die >= 4 ? 1 : 0;
                const newDmg = r.damage + dmg;
                if (dmg > 0) {
                  addLog(`💥 Dano de fogo (Dado: ${die} - Acerto): ${r.name} sofreu 1 de dano!`, 'combat');
                  triggerFloatingText(r.id, `-1 HP (FOGO)`, 'damage');
                } else {
                  addLog(`💨 Dano de fogo (Dado: ${die} - Esquiva): ${r.name} escapou das chamas!`, 'combat');
                }
                if (newDmg >= r.maxHp) {
                  opp.graveyard.push(r);
                  triggerUltimoSuspiroEffect(r, targetPIdx, raider.name);
                } else {
                  remainingField.push({ ...r, damage: newDmg });
                }
              });
              opp.field = remainingField;
              updated[targetPIdx] = opp;

              const actP = { ...updated[activePlayerIndex] };
              actP.field = actP.field.map(r => r.id === raiderId ? { ...r, hasActedThisTurn: true } : r);
              updated[activePlayerIndex] = actP;
              return updated;
            });
            setPendingTargetChoice(null);
          },
          onCancel: () => setPendingTargetChoice(null),
        });
      } else {
        // Bot auto-picks first valid opponent
        const targetPIdx = validOpponents[0].index;
        setPlayers(prev => {
          const updated = [...prev];
          const opp = { ...updated[targetPIdx] };
          addLog(`🔥 HABILIDADE ATIVA [Tempestade Ígnea] de ${raider.name}: Lança chamas sobre o campo de ${opp.name}!`, 'effect', activePlayer.name);
          const remainingField: RaiderCard[] = [];
          opp.field.forEach(r => {
            const die = Math.floor(Math.random() * 6) + 1;
            const dmg = die >= 4 ? 1 : 0;
            const newDmg = r.damage + dmg;
            if (dmg > 0) {
              addLog(`💥 Dano de fogo (Dado: ${die} - Acerto): ${r.name} sofreu 1 de dano!`, 'combat');
            }
            if (newDmg >= r.maxHp) {
              opp.graveyard.push(r);
              triggerUltimoSuspiroEffect(r, targetPIdx, raider.name);
            } else {
              remainingField.push({ ...r, damage: newDmg });
            }
          });
          opp.field = remainingField;
          updated[targetPIdx] = opp;
          const actP = { ...updated[activePlayerIndex] };
          actP.field = actP.field.map(r => r.id === raiderId ? { ...r, hasActedThisTurn: true } : r);
          updated[activePlayerIndex] = actP;
          return updated;
        });
      }
      setSelectedAttackerId(null);
      return;
    }

    // 3. Sacerdotisa de Balder: Prece Curativa (Cura 2 de dano de um aliado ferido)
    if (norm.includes('sacerdotisa') || raider.activeAbility?.actionType === 'HEAL') {
      const allies = activePlayer.field || [];
      if (allies.length === 0) return;

      if (!activePlayer.isBot) {
        setPendingTargetChoice({
          id: `sacerdotisa-${Date.now()}`,
          title: '✨ Prece Curativa - Escolha o Saqueador Aliado',
          description: 'Selecione 1 Saqueador aliado no seu campo para curar 2 pontos de vida:',
          sourceCardName: raider.name,
          options: allies.map(ally => ({
            id: ally.id,
            label: `${ally.name} (${ally.maxHp - ally.damage}/${ally.maxHp} HP)`,
            sublabel: ally.damage > 0 ? `Ferido (-${ally.damage} HP)! Recupera até 2 HP` : `Vida cheia (${ally.maxHp} HP)`,
            card: ally,
          })),
          onSelect: (optionId: string) => {
            setPlayers(prev => {
              const updated = [...prev];
              const p = { ...updated[activePlayerIndex] };
              const targetAlly = p.field.find(r => r.id === optionId);
              if (targetAlly) {
                p.field = p.field.map(r => r.id === optionId ? { ...r, damage: Math.max(0, r.damage - 2) } : r);
                addLog(`✨ HABILIDADE ATIVA [Prece Curativa] de ${raider.name}: Curou 2 de dano de ${targetAlly.name}!`, 'effect', activePlayer.name);
                triggerFloatingText(targetAlly.id, `+2 HP (CURA)`, 'treasure');
              }
              p.field = p.field.map(r => r.id === raiderId ? { ...r, hasActedThisTurn: true } : r);
              updated[activePlayerIndex] = p;
              return updated;
            });
            setPendingTargetChoice(null);
          },
          onCancel: () => setPendingTargetChoice(null),
        });
      } else {
        // Bot heals most damaged ally
        let mostDamaged: RaiderCard | null = null;
        let maxD = 0;
        allies.forEach(r => {
          if (r.damage > maxD) {
            maxD = r.damage;
            mostDamaged = r;
          }
        });
        setPlayers(prev => {
          const updated = [...prev];
          const p = { ...updated[activePlayerIndex] };
          if (mostDamaged) {
            p.field = p.field.map(r => r.id === (mostDamaged as RaiderCard).id ? { ...r, damage: Math.max(0, r.damage - 2) } : r);
            addLog(`✨ HABILIDADE ATIVA [Prece Curativa] de ${raider.name}: Curou 2 de dano de ${(mostDamaged as RaiderCard).name}!`, 'effect', activePlayer.name);
          }
          p.field = p.field.map(r => r.id === raiderId ? { ...r, hasActedThisTurn: true } : r);
          updated[activePlayerIndex] = p;
          return updated;
        });
      }
      setSelectedAttackerId(null);
      return;
    }

    // Default generic ability fallback
    setPlayers(prev => {
      const updated = [...prev];
      const p = { ...updated[activePlayerIndex] };
      addLog(`✨ ${raider.name} ativou sua habilidade especial de campo!`, 'effect', p.name);
      p.field = p.field.map(r => r.id === raiderId ? { ...r, hasActedThisTurn: true } : r);
      updated[activePlayerIndex] = p;
      return updated;
    });

    setSelectedAttackerId(null);
  }, [turnPhase, activePlayer, activePlayerIndex, players, addLog, triggerFloatingText, triggerUltimoSuspiroEffect]);

  const lastResolvedEventIdRef = useRef<string | null>(null);
  const eventAutoResolveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Execute specific event card logic
  const executeEventLogic = useCallback((event: EventCard) => {
    const norm = event.name.toLowerCase();

    if (norm.includes('espinhos')) {
      // Armadilha de espinhos: Todos os saqueadores em jogo recebem 1 de dano.
      addLog(`⚡ EVENTO [${event.name}]: Espinhos brotam do piso da masmorra! Todos os saqueadores em jogo sofrem 1 de dano.`, 'event');
      setPlayers(prev => prev.map(p => {
        const remainingField: RaiderCard[] = [];
        const newGraveyard = [...p.graveyard];
        p.field.forEach(r => {
          const newDmg = r.damage + 1;
          if (newDmg >= r.maxHp) {
            newGraveyard.push(r);
          } else {
            remainingField.push({ ...r, damage: newDmg });
          }
        });
        return { ...p, field: remainingField, graveyard: newGraveyard };
      }));
    } else if (norm.includes('caos instaurado')) {
      // Caos instaurado: Destrua todos os Combatentes.
      addLog(`⚡ EVENTO [${event.name}]: Fúria incontrolável! Todos os Combatentes em jogo são destruídos.`, 'event');
      setPlayers(prev => prev.map(p => {
        const remainingField: RaiderCard[] = [];
        const newGraveyard = [...p.graveyard];
        p.field.forEach(r => {
          if (r.type === 'Combatente') {
            newGraveyard.push(r);
          } else {
            remainingField.push(r);
          }
        });
        return { ...p, field: remainingField, graveyard: newGraveyard };
      }));
    } else if (norm.includes('findar magia')) {
      // Findar magia: Destrua todos os Conjuradores.
      addLog(`⚡ EVENTO [${event.name}]: Anulação arcana total! Todos os Conjuradores em jogo são destruídos.`, 'event');
      setPlayers(prev => prev.map(p => {
        const remainingField: RaiderCard[] = [];
        const newGraveyard = [...p.graveyard];
        p.field.forEach(r => {
          if (r.type === 'Conjurador') {
            newGraveyard.push(r);
          } else {
            remainingField.push(r);
          }
        });
        return { ...p, field: remainingField, graveyard: newGraveyard };
      }));
    } else if (norm.includes('devastação')) {
      // Devastação: Destrua todos os saqueadores em jogo.
      addLog(`⚡ EVENTO [${event.name}]: Cataclismo da masmorra! Todos os saqueadores em jogo foram destruídos!`, 'death');
      setPlayers(prev => prev.map(p => ({
        ...p,
        graveyard: [...p.graveyard, ...p.field],
        field: []
      })));
    } else if (norm.includes('inundar')) {
      // Inundar: Cada jogador retorna seus saqueadores no jogo para a mão.
      addLog(`⚡ EVENTO [${event.name}]: Águas torrenciais invadem a câmara! Todos os saqueadores em jogo retornam para as mãos de seus donos.`, 'event');
      setPlayers(prev => prev.map(p => ({
        ...p,
        hand: [...p.hand, ...p.field.map(r => ({ ...r, damage: 0, hasActedThisTurn: false }))],
        field: []
      })));
    } else if (norm.includes('dilaceração mental')) {
      // Dilaceração mental: Cada jogador descarta uma carta da própria mão, em seguida, cada jogador escolhe um saqueador seu para receber 1 de dano.
      addLog(`⚡ EVENTO [${event.name}]: Tormento psíquico! Cada jogador descarta 1 carta da mão e 1 saqueador em campo sofre 1 de dano.`, 'event');
      setPlayers(prev => prev.map(p => {
        let newHand = [...p.hand];
        let newGraveyard = [...p.graveyard];
        if (newHand.length > 0) {
          const disc = newHand.pop()!;
          newGraveyard.push(disc);
        }
        const remainingField: RaiderCard[] = [];
        p.field.forEach((r, idx) => {
          if (idx === 0) {
            const newDmg = r.damage + 1;
            if (newDmg >= r.maxHp) {
              newGraveyard.push(r);
            } else {
              remainingField.push({ ...r, damage: newDmg });
            }
          } else {
            remainingField.push(r);
          }
        });
        return { ...p, hand: newHand, field: remainingField, graveyard: newGraveyard };
      }));
    } else if (norm.includes('conspiração velada')) {
      // Conspiração Velada: O mais apontado / com mais cartas descarta 2 cartas.
      setPlayers(prev => {
        let maxCards = -1;
        let targetIdx = 0;
        prev.forEach((p, idx) => {
          if (p.hand.length > maxCards) {
            maxCards = p.hand.length;
            targetIdx = idx;
          }
        });
        addLog(`⚡ EVENTO [${event.name}]: Conspiração nos corredores! ${prev[targetIdx].name} foi o alvo e descartou até 2 cartas.`, 'event');
        return prev.map((p, idx) => {
          if (idx === targetIdx && p.hand.length > 0) {
            const count = Math.min(2, p.hand.length);
            const disc = p.hand.slice(-count);
            return {
              ...p,
              hand: p.hand.slice(0, p.hand.length - count),
              graveyard: [...p.graveyard, ...disc]
            };
          }
          return p;
        });
      });
    } else if (norm.includes('portais instáveis')) {
      // Portais Instáveis: Cada jogador embaralha seus saqueadores no baralho, então revela a mesma quantidade e coloca em jogo.
      addLog(`⚡ EVENTO [${event.name}]: Portais dimensionais se abrem e reorganizam os combatentes no campo!`, 'event');
      setPlayers(prev => prev.map(p => {
        if (p.field.length === 0) return p;
        return {
          ...p,
          field: p.field.map(r => ({ ...r, damage: 0, hasActedThisTurn: false }))
        };
      }));
    } else if (norm.includes('revezamento da perdição')) {
      // Revezamento da perdição: Cada jogador passa todos os seus tesouros para o jogador à esquerda.
      addLog(`⚡ EVENTO [${event.name}]: Maldição da avareza! Todos os tesouros foram passados para o jogador à esquerda!`, 'treasure');
      setPlayers(prev => {
        const n = prev.length;
        if (n <= 1) return prev;
        return prev.map((p, i) => {
          const donorIdx = (i - 1 + n) % n;
          return {
            ...p,
            treasures: prev[donorIdx].treasures
          };
        });
      });
    } else if (norm.includes('tesouro excedente')) {
      // Tesouro excedente: O jogador com menos tesouros ganha 1 tesouro.
      setPlayers(prev => {
        let minTreasures = Infinity;
        prev.forEach(p => { if (p.treasures < minTreasures) minTreasures = p.treasures; });
        return prev.map(p => {
          if (p.treasures === minTreasures) {
            addLog(`💰 EVENTO [${event.name}]: ${p.name} (menor pontuação) recebeu +1 Tesouro de compensação!`, 'treasure', p.name);
            return { ...p, treasures: p.treasures + 1 };
          }
          return p;
        });
      });
    } else if (norm.includes('tributo inesperado')) {
      // Tributo Inesperado: O jogador com mais tesouros perde 1 tesouro.
      setPlayers(prev => {
        let maxTreasures = 0;
        prev.forEach(p => { if (p.treasures > maxTreasures) maxTreasures = p.treasures; });
        if (maxTreasures === 0) {
          addLog(`⚡ EVENTO [${event.name}]: Nenhum jogador possui tesouros para pagar o tributo.`, 'event');
          return prev;
        }
        return prev.map(p => {
          if (p.treasures === maxTreasures && p.treasures > 0) {
            addLog(`⚠️ EVENTO [${event.name}]: ${p.name} (maior pontuação) pagou tributo de 1 Tesouro para a masmorra!`, 'event', p.name);
            return { ...p, treasures: p.treasures - 1 };
          }
          return p;
        });
      });
    } else if (norm.includes('traição')) {
      // Traição: Cada jogador rouba uma carta aleatória da mão do jogador à esquerda.
      addLog(`⚡ EVENTO [${event.name}]: Punhaladas pelas costas! Cada jogador furta 1 carta da mão do jogador à esquerda.`, 'event');
      setPlayers(prev => {
        const n = prev.length;
        if (n <= 1) return prev;
        const stolenCards = prev.map((p) => {
          if (p.hand.length === 0) return null;
          const randIdx = Math.floor(Math.random() * p.hand.length);
          return { card: p.hand[randIdx], fromIdx: randIdx };
        });
        return prev.map((p, i) => {
          const donorIdx = (i + 1) % n;
          const stolenFromMe = stolenCards[i];
          let newHand = stolenFromMe ? p.hand.filter((_, idx) => idx !== stolenFromMe.fromIdx) : [...p.hand];
          const stolenFromDonor = stolenCards[donorIdx];
          if (stolenFromDonor) {
            newHand.push(stolenFromDonor.card);
          }
          return { ...p, hand: newHand };
        });
      });
    } else if (norm.includes('combater o mal')) {
      addLog(`⚡ EVENTO [${event.name}]: MANDATO ATIVO: No próximo turno, cada jogador deve atacar monstros com todos os seus saqueadores aptos!`, 'event');
    } else if (norm.includes('maldição da desavença')) {
      addLog(`⚡ EVENTO [${event.name}]: MALDIÇÃO ATIVA: No próximo turno, cada jogador deve atacar outros jogadores com todos os seus saqueadores aptos!`, 'event');
    } else if (norm.includes('maldição do eco')) {
      addLog(`⚡ EVENTO [${event.name}]: MALDIÇÃO DO ECO: Silêncio na masmorra! Falar qualquer palavra no próximo turno custará 1 Tesouro!`, 'event');
    } else {
      addLog(`⚡ EVENTO [${event.name}]: ${event.effectDescription}`, 'event');
    }
  }, [addLog]);

  // Resolve current event card if present in the dungeon (can be called manually or auto-triggered)
  const resolveCurrentEvent = useCallback(() => {
    if (!currentDungeonCard || !isEvent(currentDungeonCard)) return;

    if (eventAutoResolveTimeoutRef.current) {
      clearTimeout(eventAutoResolveTimeoutRef.current);
      eventAutoResolveTimeoutRef.current = null;
    }

    const event = currentDungeonCard;
    if (lastResolvedEventIdRef.current !== event.id) {
      lastResolvedEventIdRef.current = event.id;
      executeEventLogic(event);
    }

    setDungeonGraveyard(g => [...g, event]);
    revealNextDungeonCard();
  }, [currentDungeonCard, executeEventLogic, revealNextDungeonCard]);

  // Automatically execute and discard Event cards when revealed in the dungeon
  useEffect(() => {
    if (!currentDungeonCard || !isEvent(currentDungeonCard)) return;

    const event = currentDungeonCard;

    // Prevent re-triggering logic for the same event instance
    if (lastResolvedEventIdRef.current !== event.id) {
      lastResolvedEventIdRef.current = event.id;
      executeEventLogic(event);
    }

    // Events resolve immediately when revealed. Visual animation must not
    // block the logical game state.
    setDungeonGraveyard(g => g.some(c => c.id === event.id) ? g : [...g, event]);
    revealNextDungeonCard();

    return () => {
      if (eventAutoResolveTimeoutRef.current) {
        clearTimeout(eventAutoResolveTimeoutRef.current);
        eventAutoResolveTimeoutRef.current = null;
      }
    };
  }, [currentDungeonCard, executeEventLogic, revealNextDungeonCard]);

  // End of Round triggers ("NO FINAL DE CADA RODADA")
  const triggerEndOfRoundEffects = useCallback(() => {
    addLog(`🌙 Fim da Rodada ${currentRound}! Disparando efeitos 'NO FINAL DE CADA RODADA'...`, 'system');

    setPlayers(prev => {
      const updated = [...prev];
      updated.forEach((p, pIdx) => {
        p.field.forEach(r => {
          if (r.keywords.includes('FIM_DE_RODADA')) {
            if (r.name.includes('Alquimista')) {
              p.treasures += 1;
              addLog(`⚗️ FIM DE RODADA de ${r.name}: ${p.name} gerou +1 Marcador de Tesouro!`, 'treasure', p.name);
            } else if (r.name.includes('Basilisco')) {
              setCurrentDungeonCard(curr => {
                if (curr && isMonster(curr)) {
                  const newDmg = curr.damage + 1;
                  addLog(`🐍 FIM DE RODADA de ${r.name}: Causou 1 de dano ao monstro da masmorra (${curr.name})!`, 'effect', p.name);
                  if (newDmg >= curr.maxHp) {
                    addLog(`💀 ${curr.name} foi eliminado pelo veneno do Basilisco!`, 'death');
                    p.treasures += curr.treasureReward;
                    setTimeout(() => revealNextDungeonCard(), 500);
                    return null;
                  }
                  return { ...curr, damage: newDmg };
                }
                return curr;
              });
            }
          }
        });
        updated[pIdx] = p;
      });
      return updated;
    });

    setCurrentRound(r => r + 1);
  }, [currentRound, addLog, revealNextDungeonCard]);

  // Pass Turn Phase (Step 1 -> Step 2 -> Step 3 -> End Turn)
  const passPhase = useCallback(() => {
    if (turnPhase === 'PREPARAR') {
      setTurnPhase('MASMORRA');
      // Ensure all raiders on active player's field are ready to attack in Step 2!
      setPlayers(prev => {
        const updated = [...prev];
        updated[activePlayerIndex] = {
          ...updated[activePlayerIndex],
          field: updated[activePlayerIndex].field.map(r => ({ ...r, hasActedThisTurn: false }))
        };
        return updated;
      });
      addLog(`⚔️ PASSO 2: MASMORRA! Cada saqueador de ${activePlayer.name} pode atacar ou usar habilidades.`, 'phase', activePlayer.name);
    } else if (turnPhase === 'MASMORRA') {
      setTurnPhase('REAGRUPAR');
      addLog(`🛡️ PASSO 3: REAGRUPAR! Compre 1 carta OU jogue 1 carta da mão.`, 'phase', activePlayer.name);
    } else if (turnPhase === 'REAGRUPAR') {
      // Reset raiders action readiness
      setPlayers(prev => {
        const updated = [...prev];
        updated[activePlayerIndex] = {
          ...updated[activePlayerIndex],
          field: updated[activePlayerIndex].field.map(r => ({ ...r, hasActedThisTurn: false }))
        };
        return updated;
      });

      const nextPlayerIdx = (activePlayerIndex + 1) % players.length;
      
      // If the turn returns to the player who started the round, the round is complete.
      if (nextPlayerIdx === initialPlayerIndex) {
        triggerEndOfRoundEffects();
      }

      setActivePlayerIndex(nextPlayerIdx);
      setTurnPhase('PREPARAR');
      setHasDrawnOrPlayedInPhase1(false);
      setHasDrawnOrPlayedInPhase3(false);
      setSelectedAttackerId(null);

      const nextP = players[nextPlayerIdx];
      addLog(`🔄 Turno de ${nextP.name}! PASSO 1: PREPARAR (Compre 1 carta OU jogue da mão).`, 'phase', nextP.name);
    }
  }, [turnPhase, activePlayer, activePlayerIndex, initialPlayerIndex, players, addLog, triggerEndOfRoundEffects]);

  const endTurn = useCallback(() => {
    // Force advance to end of turn if currently in step 1 or 2
    setTurnPhase('REAGRUPAR');
    setHasDrawnOrPlayedInPhase3(true);
    passPhase();
  }, [passPhase]);

  const selectAttacker = useCallback((raiderId: string | null) => {
    setSelectedAttackerId(raiderId);
  }, []);

  const closeDiceModal = useCallback(() => {
    setActiveDiceResolution(null);
  }, []);

  const resolveTargetChoice = useCallback((optionId: string) => {
    if (pendingTargetChoice) {
      pendingTargetChoice.onSelect(optionId);
    }
  }, [pendingTargetChoice]);

  const cancelTargetChoice = useCallback(() => {
    if (pendingTargetChoice) {
      if (pendingTargetChoice.onCancel) {
        pendingTargetChoice.onCancel();
      } else {
        setPendingTargetChoice(null);
      }
    }
  }, [pendingTargetChoice]);

  // Smart Phase Transition for Human Players:
  // Automatically advances ONLY when the required action of the current step is completed.
  useEffect(() => {
    if (isGameOver || !activePlayer || activePlayer.isBot) return;
    if (activeDiceResolution || pendingTargetChoice || pendingSacrifice) return;

    let timer: NodeJS.Timeout | null = null;

    if (turnPhase === 'PREPARAR') {
      // Step 1: Advance to Step 2 (MASMORRA) once the single draw/play action is performed
      if (hasDrawnOrPlayedInPhase1) {
        timer = setTimeout(() => {
          if (turnPhase === 'PREPARAR' && !activePlayer.isBot && !pendingTargetChoice && !pendingSacrifice) {
            passPhase();
          }
        }, 750);
      }
    } else if (turnPhase === 'MASMORRA') {
      // Step 2: In Masmorra, NEVER auto-attack! Combat requires manual player aim & target choice.
      // Auto-advance to Step 3 ONLY when all raiders on the active player's field have acted (or field has 0 raiders)
      const field = activePlayer.field || [];
      const readyRaiders = field.filter(r => !r.hasActedThisTurn);
      const allActed = field.length === 0 || (field.length > 0 && readyRaiders.length === 0);

      if (allActed) {
        timer = setTimeout(() => {
          if (turnPhase === 'MASMORRA' && !activePlayer.isBot && !activeDiceResolution && !pendingTargetChoice) {
            passPhase();
          }
        }, 900);
      }
    } else if (turnPhase === 'REAGRUPAR') {
      // Step 3: Advance to next player's turn once the single draw/play action is performed
      if (hasDrawnOrPlayedInPhase3) {
        timer = setTimeout(() => {
          if (turnPhase === 'REAGRUPAR' && !activePlayer.isBot && !pendingTargetChoice && !pendingSacrifice) {
            passPhase();
          }
        }, 750);
      }
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [
    turnPhase,
    activePlayer,
    activePlayerIndex,
    hasDrawnOrPlayedInPhase1,
    hasDrawnOrPlayedInPhase3,
    activeDiceResolution,
    pendingTargetChoice,
    pendingSacrifice,
    isGameOver,
    passPhase
  ]);

  // AI BOT Automation Engine
  useEffect(() => {
    if (isGameOver || !activePlayer || !activePlayer.isBot) return;
    if (activeDiceResolution || pendingTargetChoice || pendingSacrifice) return;

    setIsAiThinking(true);
    if (aiTurnTimeoutRef.current) clearTimeout(aiTurnTimeoutRef.current);

    aiTurnTimeoutRef.current = setTimeout(() => {
      if (turnPhase === 'PREPARAR') {
        // Step 1: Play 1 card OR draw 1 card
        if (activePlayer.hand.length > 0 && activePlayer.field.length < 4 && !hasDrawnOrPlayedInPhase1) {
          const cardToPlay = activePlayer.hand[0];
          playCardFromHand(cardToPlay.id, activePlayerIndex);
        } else if (!hasDrawnOrPlayedInPhase1) {
          drawCard(activePlayerIndex);
        }
        
        setTimeout(() => {
          passPhase();
        }, 800);
      } else if (turnPhase === 'MASMORRA') {
        // Step 2: Bot sequentially acts with all ready raiders
        const readyRaiders = (activePlayer.field || []).filter(r => !r.hasActedThisTurn);
        
        if (readyRaiders.length > 0) {
          const attacker = readyRaiders[0];
          
          if (currentDungeonCard && (isMonster(currentDungeonCard) || currentDungeonCard.name.includes('Tesouro'))) {
            attackDungeonMonster(attacker.id);
            setTimeout(() => {
              closeDiceModal();
            }, 1800);
          } else {
            // Target enemy raider respecting DEFENSOR
            const targetOpponentIdx = players.findIndex((p, idx) => idx !== activePlayerIndex && (p.field || []).length > 0);
            if (targetOpponentIdx !== -1) {
              const opp = players[targetOpponentIdx];
              const defender = opp.field.find(r => r.keywords.includes('DEFENSOR')) || opp.field[0];
              if (defender) {
                attackEnemyRaider(attacker.id, targetOpponentIdx, defender.id);
                setTimeout(() => {
                  closeDiceModal();
                }, 1800);
              } else {
                passPhase();
              }
            } else {
              passPhase();
            }
          }
        } else {
          // No ready raiders left, advance to Step 3
          passPhase();
        }
      } else if (turnPhase === 'REAGRUPAR') {
        // Step 3: Play 1 card OR draw 1 card
        if (activePlayer.hand.length > 0 && activePlayer.field.length < 4 && !hasDrawnOrPlayedInPhase3) {
          playCardFromHand(activePlayer.hand[0].id, activePlayerIndex);
        } else if (!hasDrawnOrPlayedInPhase3) {
          drawCard(activePlayerIndex);
        }

        setTimeout(() => {
          passPhase();
          setIsAiThinking(false);
        }, 800);
      }
    }, 1100);

    return () => {
      if (aiTurnTimeoutRef.current) clearTimeout(aiTurnTimeoutRef.current);
    };
  }, [
    activePlayer,
    turnPhase,
    activePlayerIndex,
    isGameOver,
    hasDrawnOrPlayedInPhase1,
    hasDrawnOrPlayedInPhase3,
    currentDungeonCard,
    players,
    activeDiceResolution,
    pendingTargetChoice,
    pendingSacrifice,
    playCardFromHand,
    drawCard,
    attackDungeonMonster,
    attackEnemyRaider,
    passPhase,
    closeDiceModal
  ]);

  return (
    <GameContext.Provider
      value={{
        players,
        activePlayerIndex,
        initialPlayerIndex,
        activePlayer,
        currentRound,
        turnPhase,
        gameMode,
        dungeonDeck,
        currentDungeonCard,
        dungeonGraveyard,
        raiderDeck,
        raiderDiscard,
        gameLogs,
        isGameOver,
        winner,
        hasDrawnOrPlayedInPhase1,
        hasDrawnOrPlayedInPhase3,
        pendingSacrifice,
        pendingTargetChoice,
        activeDiceResolution,
        selectedAttackerId,
        isAiThinking,
        startNewGame,
        drawCard,
        playCardFromHand,
        sacrificeRaider,
        selectAttacker,
        attackDungeonMonster,
        attackEnemyRaider,
        useRaiderAbility,
        passPhase,
        endTurn,
        resolveCurrentEvent,
        closeDiceModal,
        resolveTargetChoice,
        cancelTargetChoice,
        customImageOverrides,
        artReloadNonce,
        dungeonFlipNonce,
        playmatTextures,
        updatePlaymatTextures,
        isSoundMuted,
        toggleSoundMute,
        setCustomImageOverride,
        triggerCardArtReload,
        floatingCombatTexts,
        triggerFloatingText,
        inspectedCard,
        inspectCard,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
