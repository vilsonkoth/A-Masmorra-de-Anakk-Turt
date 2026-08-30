import { DungeonCard, MonsterCard, EventCard } from '../types/game';
import {
  INITIAL_TREASURE_CARD,
  MONSTERS_LEVEL_1,
  MONSTERS_LEVEL_2,
  MONSTERS_LEVEL_3,
  EVENT_CARDS_DATABASE,
  getStoredImageOverrides,
  getEffectiveCardImage
} from '../data/cardsDatabase';

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Builds the official Dungeon Deck strictly according to the rulebook:
 * From bottom to top:
 * 1. 1 Monstro Nível 3 (base)
 * 2. 1 Carta de Evento aleatória
 * 3. 3 Monstros Nível 2 (embaralhados)
 * 4. 1 Carta de Evento aleatória
 * 5. 5 Monstros Nível 1 (topo)
 * 6. 1 Carta inicial "Tesouro 1" (topo absoluto visível no início)
 *
 * Array representation: index 0 is TOP of the deck (drawn/active first: Tesouro 1, then Level 1 monsters),
 * and last index is the Level 3 Boss at the base.
 */
export function buildOfficialDungeonDeck(): DungeonCard[] {
  const overrides = getStoredImageOverrides();
  let idCounter = 1;

  // 0. Fixed Initial Treasure Card at the very top of the Dungeon
  const initialTreasureCard: MonsterCard = {
    ...INITIAL_TREASURE_CARD,
    id: `dungeon-treasure-${idCounter++}`,
    damage: 0,
    imageUrl: overrides[INITIAL_TREASURE_CARD.name] || INITIAL_TREASURE_CARD.imageUrl || ''
  };

  // 1. Pick 1 Level 3 Boss (Base) - fallback to Level 1 if L3 is empty
  const l3Pool = MONSTERS_LEVEL_3.length > 0 ? MONSTERS_LEVEL_3 : MONSTERS_LEVEL_1;
  const l3Shuffled = shuffleArray(l3Pool);
  const bossTemplate = l3Shuffled[0];
  const bossCard: MonsterCard = {
    ...bossTemplate,
    id: `dungeon-boss-${idCounter++}`,
    damage: 0,
    isBoss: true,
    imageUrl: overrides[bossTemplate.name] || bossTemplate.imageUrl
  };

  // 2. Pick 1 Random Event card (Bottom event)
  const eventsShuffled1 = shuffleArray(EVENT_CARDS_DATABASE);
  const bottomEventTemplate = eventsShuffled1[0];
  const bottomEventCard: EventCard = {
    ...bottomEventTemplate,
    id: `dungeon-event-${idCounter++}`,
    imageUrl: overrides[bottomEventTemplate.name] || bottomEventTemplate.imageUrl
  };

  // 3. Pick 3 Level 2 Monsters (Shuffled) - fallback to Level 1 if L2 is empty
  const l2Pool = MONSTERS_LEVEL_2.length > 0 ? MONSTERS_LEVEL_2 : MONSTERS_LEVEL_1;
  const l2Shuffled = shuffleArray(l2Pool).slice(0, 3);
  const l2Cards: MonsterCard[] = l2Shuffled.map(t => ({
    ...t,
    id: `dungeon-l2-${idCounter++}`,
    damage: 0,
    imageUrl: overrides[t.name] || t.imageUrl
  }));

  // 4. Pick 1 Random Event card (Middle event)
  const eventsShuffled2 = shuffleArray(EVENT_CARDS_DATABASE.filter(e => e.name !== bottomEventTemplate.name));
  const topEventTemplate = eventsShuffled2[0] || eventsShuffled1[1] || EVENT_CARDS_DATABASE[0];
  const topEventCard: EventCard = {
    ...topEventTemplate,
    id: `dungeon-event-${idCounter++}`,
    imageUrl: overrides[topEventTemplate.name] || topEventTemplate.imageUrl
  };

  // 5. Pick 5 Level 1 Monsters (Top of deck)
  // Ensure we have at least 5 level 1 monsters by repeating if needed
  let l1Pool = shuffleArray(MONSTERS_LEVEL_1);
  while (l1Pool.length < 5) {
    l1Pool = [...l1Pool, ...shuffleArray(MONSTERS_LEVEL_1)];
  }
  const l1Selected = l1Pool.slice(0, 5);
  const l1Cards: MonsterCard[] = l1Selected.map(t => ({
    ...t,
    id: `dungeon-l1-${idCounter++}`,
    damage: 0,
    imageUrl: overrides[t.name] || t.imageUrl
  }));

  // Assemble from TOP to BOTTOM:
  // Top: 1 Tesouro 1 (Carta inicial fixa da câmara)
  // Then: 5 Level 1 Monsters
  // Then: 1 Event
  // Then: 3 Level 2 Monsters
  // Then: 1 Event
  // Bottom: 1 Level 3 Monster (Boss)
  const deck: DungeonCard[] = [
    initialTreasureCard,
    ...l1Cards,
    topEventCard,
    ...l2Cards,
    bottomEventCard,
    bossCard
  ];

  return deck;
}
