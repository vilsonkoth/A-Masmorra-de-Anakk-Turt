export type RaiderType = 'Combatente' | 'Conjurador' | 'Fera';

export type MonsterLevel = 1 | 2 | 3;

export type KeywordEffect = 'ADENTRAR' | 'ULTIMO_SUSPIRO' | 'DEFENSOR' | 'FIM_DE_RODADA' | 'VINCULO' | 'CONTROLE' | 'ROUBAR';

export type TurnPhase = 'PREPARAR' | 'MASMORRA' | 'REAGRUPAR';

export type GameMode = 'BOTS' | 'PASS_AND_PLAY';

export interface RaiderCard {
  id: string;
  name: string;
  type: RaiderType;
  maxHp: number;
  damage: number; // current damage markers applied
  diceCount: number;
  treasureReward: number; // value if defeated or bounty
  keywords: KeywordEffect[];
  effectDescription: string;
  imageUrl?: string;
  hasActedThisTurn?: boolean;
  activeAbility?: {
    name: string;
    description: string;
    actionType: 'HEAL' | 'BUFF_DICE' | 'DIRECT_DAMAGE' | 'DRAW' | 'DESTROY_RAIDER' | 'AOE_DAMAGE';
    value: number;
  };
}

export interface MonsterCard {
  id: string;
  name: string;
  level: MonsterLevel;
  maxHp: number;
  damage: number; // current damage markers applied
  diceCount: number;
  treasureReward: number;
  effectDescription: string;
  imageUrl?: string;
  isBoss?: boolean;
  onEnterDungeonEffect?: string;
}

export interface EventCard {
  id: string;
  name: string;
  effectDescription: string;
  imageUrl?: string;
  eventType: 'TRAP' | 'BLESSING' | 'AMBUSH' | 'TREASURE_HOARD';
  resolved?: boolean;
}

export type DungeonCard = MonsterCard | EventCard;

export function isMonster(card: DungeonCard): card is MonsterCard {
  return 'level' in card;
}

export function isEvent(card: DungeonCard): card is EventCard {
  return 'eventType' in card;
}

export interface Player {
  id: string;
  name: string;
  isBot: boolean;
  color: string;
  avatar: string;
  hand: RaiderCard[];
  field: RaiderCard[];
  treasures: number;
  graveyard: RaiderCard[];
}

export interface DiceResult {
  dieNumber: number;
  value: number; // 1-6
  damageValue: number; // 1: 1 Dano, 2: 1 Dano, 3: 2 Danos, 4: 3 Danos, 5: 0 Dano, 6: 0 Dano
  isHit: boolean; // Faces 1, 2, 3, 4 are Hits (>0 damage)
  isBlank: boolean; // Faces 5, 6 are Blanks (0 damage / Reação)
}

export interface CombatResolution {
  attackerId: string;
  attackerName: string;
  attackerIsRaider: boolean;
  targetId: string;
  targetName: string;
  targetIsMonster: boolean;
  targetOwnerId?: string;
  diceRolled: DiceResult[];
  hits: number;
  blanks: number;
  damageDealt: number;
  targetDied: boolean;
  reactionDamage: number;
  attackerDied: boolean;
  treasureEarned: number;
  message: string;
}

export interface CombatLogEntry {
  id: string;
  round: number;
  phase: TurnPhase;
  playerName: string;
  message: string;
  type: 'combat' | 'reaction' | 'phase' | 'card_play' | 'death' | 'treasure' | 'event' | 'system';
  timestamp: string;
}

export interface FloatingCombatText {
  id: string;
  targetId: string;
  text: string;
  type: 'damage' | 'reaction' | 'death' | 'treasure' | 'heal';
  timestamp: number;
}

export interface TargetChoiceOption {
  id: string;
  label: string;
  sublabel?: string;
  card?: RaiderCard;
}

export interface PendingTargetChoice {
  id: string;
  title: string;
  description: string;
  sourceCardName: string;
  options: TargetChoiceOption[];
  onSelect: (optionId: string) => void;
  onCancel?: () => void;
}
