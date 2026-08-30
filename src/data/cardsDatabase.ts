import { RaiderCard, MonsterCard, EventCard } from '../types/game';
import cardBackImage from '../assets/images/card_back_anakktur_1788030785485.jpg';

// Official cardback asset
export const OFFICIAL_CARD_BACK = cardBackImage;

// Local storage key for custom card images
export const CUSTOM_IMAGES_STORAGE_KEY = 'ANAKK_TUR_CUSTOM_CARD_IMAGES';

/**
 * Returns set of all currently valid card names across all decks and categories
 */
export function getAllValidCardNames(): Set<string> {
  const names = new Set<string>();
  names.add(INITIAL_TREASURE_CARD.name);
  MASTER_RAIDER_TEMPLATES.forEach(c => names.add(c.name));
  MONSTERS_LEVEL_1.forEach(c => names.add(c.name));
  MONSTERS_LEVEL_2.forEach(c => names.add(c.name));
  MONSTERS_LEVEL_3.forEach(c => names.add(c.name));
  EVENT_CARDS_DATABASE.forEach(c => names.add(c.name));
  return names;
}

/**
 * Cleans up old, orphaned, or obsolete card overrides from localStorage
 */
export function pruneOrphanedImageOverrides(): void {
  try {
    const data = localStorage.getItem(CUSTOM_IMAGES_STORAGE_KEY);
    if (!data) return;
    const parsed = JSON.parse(data);
    const validNames = getAllValidCardNames();
    const cleaned: Record<string, string> = {};
    let hasChanges = false;

    for (const [key, val] of Object.entries(parsed)) {
      if (validNames.has(key) && typeof val === 'string' && val.trim() !== '') {
        if (!val.startsWith('data:image/svg+xml')) {
          cleaned[key] = val;
        } else {
          hasChanges = true;
        }
      } else {
        hasChanges = true;
      }
    }

    if (hasChanges) {
      localStorage.setItem(CUSTOM_IMAGES_STORAGE_KEY, JSON.stringify(cleaned));
    }
  } catch (e) {
    console.error('Error pruning orphaned image overrides:', e);
  }
}

export function getStoredImageOverrides(): Record<string, string> {
  try {
    const data = localStorage.getItem(CUSTOM_IMAGES_STORAGE_KEY);
    if (!data) return {};
    const parsed = JSON.parse(data);
    const validNames = getAllValidCardNames();
    const sanitized: Record<string, string> = {};

    for (const [key, val] of Object.entries(parsed)) {
      // Only keep overrides for active, existing cards in the database
      if (validNames.has(key) && typeof val === 'string' && val.trim() !== '') {
        // Discard legacy auto-generated SVGs to strictly respect user upload preference
        if (val.startsWith('data:image/svg+xml')) {
          continue;
        }
        sanitized[key] = val;
      }
    }
    return sanitized;
  } catch {
    return {};
  }
}

export function saveImageOverride(cardIdentifier: string, url: string) {
  try {
    const overrides = getStoredImageOverrides();
    if (url && url.trim()) {
      overrides[cardIdentifier] = url.trim();
    } else {
      delete overrides[cardIdentifier];
    }
    localStorage.setItem(CUSTOM_IMAGES_STORAGE_KEY, JSON.stringify(overrides));
  } catch (e) {
    console.error('Failed to save card image override:', e);
  }
}

/**
 * Resolves the effective image URL for any card:
 * 1. React State Overrides (if provided)
 * 2. LocalStorage Custom Overrides (user uploaded PNG/JPG Data URI or URL)
 * 3. Card object's own original imageUrl
 * 4. Empty string if no custom or original image is provided
 */
export function getEffectiveCardImage(
  card?: { name?: string; id?: string; imageUrl?: string } | null,
  contextOverrides?: Record<string, string>
): string {
  if (!card) return '';

  const name = card.name || '';
  const id = card.id || '';

  // 1. Context overrides
  if (contextOverrides) {
    if (name && contextOverrides[name]) return contextOverrides[name];
    if (id && contextOverrides[id]) return contextOverrides[id];
  }

  // 2. LocalStorage overrides
  const stored = getStoredImageOverrides();
  if (name && stored[name]) return stored[name];
  if (id && stored[id]) return stored[id];

  // 3. Card instance original image
  if (card.imageUrl && card.imageUrl.trim()) {
    return card.imageUrl.trim();
  }

  return '';
}

// 30 Official Raider Cards (Arquétipos Oficiais)
export const MASTER_RAIDER_TEMPLATES: Omit<RaiderCard, 'id' | 'damage' | 'hasActedThisTurn'>[] = [
  {
    name: 'Águia das montanhas',
    type: 'Fera',
    maxHp: 1,
    diceCount: 2,
    treasureReward: 1,
    keywords: ['ADENTRAR', 'ULTIMO_SUSPIRO'],
    effectDescription: 'Adentrar: Coloque 1 marcador de dano em uma carta em jogo. Último Suspiro: Compre uma carta.',
    imageUrl: '',
  },
  {
    name: 'Akari, a Invocadora',
    type: 'Conjurador',
    maxHp: 3,
    diceCount: 1,
    treasureReward: 1,
    keywords: ['ADENTRAR'],
    effectDescription: 'Adentrar: Coloque um saqueador da sua mão em jogo.',
    imageUrl: '',
  },
  {
    name: 'Assassina de Lay’ann',
    type: 'Combatente',
    maxHp: 1,
    diceCount: 2,
    treasureReward: 1,
    keywords: [],
    effectDescription: 'Habilidade Ativa: Destrua um saqueador em jogo.',
    activeAbility: {
      name: 'Golpe Letal',
      description: 'Destrói 1 saqueador em jogo',
      actionType: 'DESTROY_RAIDER',
      value: 1
    },
    imageUrl: '',
  },
  {
    name: 'Azram, a ira ignea',
    type: 'Conjurador',
    maxHp: 3,
    diceCount: 2,
    treasureReward: 2,
    keywords: [],
    effectDescription: 'Habilidade Ativa: Role 1 dado de dano em todos os saqueadores do jogador escolhido.',
    activeAbility: {
      name: 'Tempestade de Fogo',
      description: 'Rola 1 dado de dano em todos os saqueadores oponentes',
      actionType: 'AOE_DAMAGE',
      value: 1
    },
    imageUrl: '',
  },
  {
    name: 'Cleo, a mestra dos desejos',
    type: 'Conjurador',
    maxHp: 2,
    diceCount: 2,
    treasureReward: 1,
    keywords: ['ADENTRAR'],
    effectDescription: 'Adentrar: Compre uma carta, em seguida, se você for o jogador com menos tesouros, ganhe 1 tesouro.',
    imageUrl: '',
  },
  {
    name: 'Dacius, o ladino de Balder',
    type: 'Combatente',
    maxHp: 2,
    diceCount: 2,
    treasureReward: 1,
    keywords: ['ADENTRAR', 'ROUBAR'],
    effectDescription: 'Adentrar / Roubar: Roube 1 tesouro do jogador com mais tesouros. Essa carta não é afetada por eventos.',
    imageUrl: '',
  },
  {
    name: 'Delilah, a Ilusionista',
    type: 'Conjurador',
    maxHp: 2,
    diceCount: 1,
    treasureReward: 1,
    keywords: ['ADENTRAR', 'CONTROLE'],
    effectDescription: 'Adentrar / Controle: Troque o controle de dois saqueadores em jogo até o final do seu turno.',
    imageUrl: '',
  },
  {
    name: 'Drumaruk, o campeão',
    type: 'Combatente',
    maxHp: 4,
    diceCount: 3,
    treasureReward: 2,
    keywords: [],
    effectDescription: 'Campeão temido nos campos de batalha armado com armadura pesada.',
    imageUrl: '',
  },
  {
    name: 'Elekk, o sabio ancião',
    type: 'Conjurador',
    maxHp: 2,
    diceCount: 1,
    treasureReward: 1,
    keywords: ['ADENTRAR'],
    effectDescription: 'Adentrar: Olhe as 3 primeiras cartas do baralho de saqueadores e organize-as na ordem desejada.',
    imageUrl: '',
  },
  {
    name: 'Freya, a dama escudeira',
    type: 'Combatente',
    maxHp: 3,
    diceCount: 2,
    treasureReward: 1,
    keywords: ['DEFENSOR'],
    effectDescription: 'Defensor / Guarda: Ataques e monstros devem atacar Freya primeiro.',
    imageUrl: '',
  },
  {
    name: 'Gimlik, o superticioso',
    type: 'Combatente',
    maxHp: 3,
    diceCount: 2,
    treasureReward: 1,
    keywords: ['ADENTRAR'],
    effectDescription: 'Adentrar: Se houver algum evento ativo, descarte-o imediatamente.',
    imageUrl: '',
  },
  {
    name: 'Iberian, caçador de monstros',
    type: 'Combatente',
    maxHp: 3,
    diceCount: 3,
    treasureReward: 2,
    keywords: [],
    effectDescription: 'Especialista em monstros: Ganha +1 dado de ataque ao atacar monstros de nível 2 ou superior.',
    imageUrl: '',
  },
  {
    name: 'Koth, o Bruxo do Caos',
    type: 'Conjurador',
    maxHp: 2,
    diceCount: 2,
    treasureReward: 1,
    keywords: ['ADENTRAR'],
    effectDescription: 'Adentrar: Cada jogador sacrifica um saqueador.',
    imageUrl: '',
  },
  {
    name: 'Kyrian, o paladino de Balder',
    type: 'Combatente',
    maxHp: 4,
    diceCount: 2,
    treasureReward: 2,
    keywords: ['DEFENSOR'],
    effectDescription: 'Defensor. Sempre que sofrer dano, cure 1 de vida de outro saqueador aliado.',
    imageUrl: '',
  },
  {
    name: 'Ladrão de Tesouros',
    type: 'Combatente',
    maxHp: 2,
    diceCount: 1,
    treasureReward: 2,
    keywords: ['ULTIMO_SUSPIRO', 'ROUBAR'],
    effectDescription: 'Último Suspiro: O jogador que destruiu esta carta ganha +1 tesouro.',
    imageUrl: '',
  },
  {
    name: 'Lee Fang, o pacífico',
    type: 'Combatente',
    maxHp: 3,
    diceCount: 1,
    treasureReward: 1,
    keywords: ['ADENTRAR'],
    effectDescription: 'Adentrar: Nenhum jogador pode atacar até o início do seu próximo turno.',
    imageUrl: '',
  },
  {
    name: 'Lobo da Selva de Tanah\'ran',
    type: 'Fera',
    maxHp: 2,
    diceCount: 2,
    treasureReward: 1,
    keywords: ['ADENTRAR', 'VINCULO'],
    effectDescription: 'Adentrar / Vínculo: Se você controlar outro saqueador Fera, compre uma carta.',
    imageUrl: '',
  },
  {
    name: 'Nyrissa, a Espectral',
    type: 'Conjurador',
    maxHp: 2,
    diceCount: 2,
    treasureReward: 1,
    keywords: ['ADENTRAR'],
    effectDescription: 'Adentrar: Escolha um monstro. Ele não ataca na próxima rodada.',
    imageUrl: '',
  },
  {
    name: 'O caçador Primal',
    type: 'Combatente',
    maxHp: 3,
    diceCount: 2,
    treasureReward: 1,
    keywords: ['ADENTRAR'],
    effectDescription: 'Adentrar: Cause 1 de dano direto a qualquer monstro na masmorra.',
    imageUrl: '',
  },
  {
    name: 'Otepp, a Maga da ruina',
    type: 'Conjurador',
    maxHp: 2,
    diceCount: 3,
    treasureReward: 2,
    keywords: ['ADENTRAR'],
    effectDescription: 'Adentrar: Destrua uma carta de masmorra não-chefe e revele a próxima.',
    imageUrl: '',
  },
  {
    name: 'Portador da praga',
    type: 'Conjurador',
    maxHp: 1,
    diceCount: 1,
    treasureReward: 1,
    keywords: ['ULTIMO_SUSPIRO'],
    effectDescription: 'Último Suspiro: Coloque 1 marcador de veneno/dano em todos os saqueadores em campo.',
    imageUrl: '',
  },
  {
    name: 'Rudolf, o mãos leves',
    type: 'Combatente',
    maxHp: 2,
    diceCount: 2,
    treasureReward: 1,
    keywords: ['ADENTRAR'],
    effectDescription: 'Adentrar: Compre 2 cartas do topo do baralho e devolva 1 para o topo.',
    imageUrl: '',
  },
  {
    name: 'Sacerdotisa de Balder',
    type: 'Conjurador',
    maxHp: 2,
    diceCount: 1,
    treasureReward: 1,
    keywords: ['ADENTRAR'],
    effectDescription: 'Adentrar: Cure todo o dano de um saqueador.',
    activeAbility: {
      name: 'Prece Curativa',
      description: 'Cura 2 de dano de um saqueador aliado',
      actionType: 'HEAL',
      value: 2
    },
    imageUrl: '',
  },
  {
    name: 'Skidd, o bombardeiro',
    type: 'Combatente',
    maxHp: 2,
    diceCount: 2,
    treasureReward: 1,
    keywords: ['ULTIMO_SUSPIRO'],
    effectDescription: 'Último Suspiro: Cause 2 de dano ao monstro atual da masmorra.',
    imageUrl: '',
  },
  {
    name: 'Skiirk, o xamã',
    type: 'Conjurador',
    maxHp: 3,
    diceCount: 2,
    treasureReward: 1,
    keywords: ['ADENTRAR'],
    effectDescription: 'Adentrar: Resgate uma carta de Fera do cemitério para a sua mão.',
    imageUrl: '',
  },
  {
    name: 'Tristan, o trapaceiro',
    type: 'Conjurador',
    maxHp: 2,
    diceCount: 2,
    treasureReward: 1,
    keywords: ['ADENTRAR', 'ROUBAR'],
    effectDescription: 'Adentrar: Escolha um oponente. Ele deve descartar 1 carta aleatória da mão.',
    imageUrl: '',
  },
  {
    name: 'Urso das montanhas gélidas',
    type: 'Fera',
    maxHp: 6,
    diceCount: 2,
    treasureReward: 2,
    keywords: ['DEFENSOR'],
    effectDescription: 'Fera titânica com 6 de vida, 2 dados de ataque e Defensor.',
    imageUrl: '',
  },
  {
    name: 'Yderon, o druida de Tanah’ran',
    type: 'Conjurador',
    maxHp: 4,
    diceCount: 2,
    treasureReward: 2,
    keywords: ['ADENTRAR', 'VINCULO'],
    effectDescription: 'Adentrar: Se você controlar uma fera compre uma carta, em seguida remova todos os marcadores de dano de seus saqueadores.',
    imageUrl: '',
  },
  {
    name: 'Zork, o bruto',
    type: 'Combatente',
    maxHp: 2,
    diceCount: 4,
    treasureReward: 2,
    keywords: [],
    effectDescription: 'Combatente impiedoso armado com machado duplo rolando 4 dados de ataque.',
    imageUrl: '',
  },
  {
    name: 'Zul’dar, o necromante',
    type: 'Conjurador',
    maxHp: 1,
    diceCount: 1,
    treasureReward: 1,
    keywords: ['ADENTRAR', 'CONTROLE'],
    effectDescription: 'Adentrar / Controle: Coloque um saqueador da pilha de descarte em jogo sob seu controle.',
    imageUrl: '',
  }
];

// Generates exactly 60 cards: 30 master raider types duplicated 2 times
export function generateFullRaiderDeck(): RaiderCard[] {
  const overrides = getStoredImageOverrides();
  const deck: RaiderCard[] = [];
  let idCounter = 1;

  // Duplicate each of the 30 raiders 2 times -> exactly 60 cards
  for (let copy = 1; copy <= 2; copy++) {
    for (const template of MASTER_RAIDER_TEMPLATES) {
      const cardId = `raider-${template.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${copy}-${idCounter}-${Math.random().toString(36).substring(2, 9)}`;
      deck.push({
        ...template,
        id: cardId,
        damage: 0,
        hasActedThisTurn: false,
        imageUrl: overrides[template.name] || overrides[cardId] || template.imageUrl || '',
      });
      idCounter++;
    }
  }

  // Shuffle deck using Fisher-Yates
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}

// CARTA INICIAL FIXA DA MASMORRA (Tesouro Inicial)
export const INITIAL_TREASURE_CARD: Omit<MonsterCard, 'id' | 'damage'> = {
  name: 'Tesouro 1',
  level: 1,
  maxHp: 1,
  diceCount: 0,
  treasureReward: 1,
  effectDescription: 'Baú de Tesouro Inicial da Masmorra (1 HP). Ataque no Passo 2 (Masmorra) para pilhar 1 Marcador de Tesouro sem sofrer dano de reação e revelar o primeiro Monstro Nível 1.',
  imageUrl: '',
};

// MONSTROS NÍVEL 1 (15 Monstros Oficiais)
export const MONSTERS_LEVEL_1: Omit<MonsterCard, 'id' | 'damage'>[] = [
  {
    name: 'Aparição',
    level: 1,
    maxHp: 3,
    diceCount: 1,
    treasureReward: 1,
    effectDescription: 'Só pode ser atacada por Conjuradores.',
    imageUrl: '',
  },
  {
    name: 'Aranha Gigante',
    level: 1,
    maxHp: 7,
    diceCount: 1,
    treasureReward: 1,
    effectDescription: 'Combatentes causam 1 de dano adicional quando causarem dano a essa carta.',
    imageUrl: '',
  },
  {
    name: 'Arauto das Sombras',
    level: 1,
    maxHp: 2,
    diceCount: 1,
    treasureReward: 1,
    effectDescription: 'Adentrar: O jogador que revelou esta carta descarta uma carta da mão. Reação: Para cada resultado nulo, o saqueador atacante descarta uma carta da mão.',
    imageUrl: '',
  },
  {
    name: 'Djinn',
    level: 1,
    maxHp: 8,
    diceCount: 1,
    treasureReward: 1,
    effectDescription: 'Último Suspiro: Quando essa carta for destruída, o jogador que a destruiu compra 1 carta.',
    imageUrl: '',
  },
  {
    name: 'Escorpião Gigante',
    level: 1,
    maxHp: 5,
    diceCount: 1,
    treasureReward: 1,
    effectDescription: 'Reação 2 de dano. (Reações dessa carta causam 2 de dano para cada resultado nulo).',
    imageUrl: '',
  },
  {
    name: 'Esqueleto',
    level: 1,
    maxHp: 6,
    diceCount: 1,
    treasureReward: 1,
    effectDescription: 'Conjuradores causam 1 de dano adicional quando causarem dano a essa carta.',
    imageUrl: '',
  },
  {
    name: 'Goblin',
    level: 1,
    maxHp: 1,
    diceCount: 1,
    treasureReward: 1,
    effectDescription: 'Adentrar: Roube 1 tesouro do último jogador que coletou tesouro.',
    imageUrl: '',
  },
  {
    name: 'Gosma Pegajosa',
    level: 1,
    maxHp: 4,
    diceCount: 1,
    treasureReward: 1,
    effectDescription: 'Adentrar: O último jogador que ganhou tesouros não joga no seu próximo turno.',
    imageUrl: '',
  },
  {
    name: 'Harpias',
    level: 1,
    maxHp: 6,
    diceCount: 1,
    treasureReward: 1,
    effectDescription: 'Adentrar: Cada jogador retorna um saqueador que controla em jogo para a mão.',
    imageUrl: '',
  },
  {
    name: 'Kobolds',
    level: 1,
    maxHp: 4,
    diceCount: 1,
    treasureReward: 1,
    effectDescription: 'No fim da rodada: Todos os saqueadores em jogo recebem 1 de dano.',
    imageUrl: '',
  },
  {
    name: 'Olho de N’Zhul',
    level: 1,
    maxHp: 6,
    diceCount: 1,
    treasureReward: 1,
    effectDescription: 'Todos os jogadores devem manter as mãos reveladas.',
    imageUrl: '',
  },
  {
    name: 'Ratos atrozes',
    level: 1,
    maxHp: 4,
    diceCount: 1,
    treasureReward: 1,
    effectDescription: 'Último Suspiro: Destrua o saqueador que derrotar essa carta.',
    imageUrl: '',
  },
  {
    name: 'Troll',
    level: 1,
    maxHp: 6,
    diceCount: 1,
    treasureReward: 1,
    effectDescription: 'No fim da rodada: Remova 1 marcador de dano dessa carta.',
    imageUrl: '',
  },
  {
    name: "Zarn'Korr, o Fenda-Mundos",
    level: 1,
    maxHp: 4,
    diceCount: 1,
    treasureReward: 1,
    effectDescription: 'Último Suspiro: Jogue um evento aleatório de fora do jogo.',
    imageUrl: '',
  },
  {
    name: 'Zumbi',
    level: 1,
    maxHp: 5,
    diceCount: 1,
    treasureReward: 1,
    effectDescription: 'Reação 2 de dano. Essa carta faz somente 1 reação por turno.',
    imageUrl: '',
  }
];

// MONSTROS NÍVEL 2 (OFICIAIS)
export const MONSTERS_LEVEL_2: Omit<MonsterCard, 'id' | 'damage'>[] = [
  {
    name: 'A Besta de Anakk Tur',
    level: 2,
    maxHp: 9,
    diceCount: 2,
    treasureReward: 2,
    effectDescription: 'Reações dessa carta causam dano em todos os saqueadores do jogador atacante.',
    imageUrl: '',
  },
  {
    name: 'Besta do Gelo',
    level: 2,
    maxHp: 9,
    diceCount: 2,
    treasureReward: 2,
    effectDescription: 'Adentrar: Destrua todos os saqueadores com "Defensor". Reação 2 de dano.',
    imageUrl: '',
  },
  {
    name: 'Cultista',
    level: 2,
    maxHp: 7,
    diceCount: 2,
    treasureReward: 2,
    effectDescription: 'Nenhuma habilidade pode ser usada enquanto essa carta estiver em jogo. Último Suspiro: O jogador que derrotar essa carta escolhe e destrói um saqueador sob seu controle.',
    imageUrl: '',
  },
  {
    name: 'Elemental das Chamas',
    level: 2,
    maxHp: 9,
    diceCount: 2,
    treasureReward: 2,
    effectDescription: 'Reação 2 de dano. Último Suspiro: Todos os saqueadores em jogo recebem 1 de dano.',
    imageUrl: '',
  },
  {
    name: 'Goblin Bruxo',
    level: 2,
    maxHp: 8,
    diceCount: 2,
    treasureReward: 2,
    effectDescription: 'Reação 2 de dano. Final da rodada: Cada jogador descarta duas cartas.',
    imageUrl: '',
  },
  {
    name: 'Golem Anti-mágica',
    level: 2,
    maxHp: 7,
    diceCount: 2,
    treasureReward: 2,
    effectDescription: 'Essa carta não recebe dano de Conjuradores. Reação 2 de dano.',
    imageUrl: '',
  },
  {
    name: 'Horda de Orcs',
    level: 2,
    maxHp: 10,
    diceCount: 2,
    treasureReward: 2,
    effectDescription: 'Se essa carta tiver de 1-5 marcadores de dano nela, ela terá Reação 2 de dano; se tiver 5-9, ela terá Reação 3 de dano.',
    imageUrl: '',
  },
  {
    name: 'Khajid Agressor',
    level: 2,
    maxHp: 9,
    diceCount: 2,
    treasureReward: 2,
    effectDescription: 'Reação 2 de dano. Final da rodada: Cada jogador escolhe 1 saqueador seu para receber 2 de dano.',
    imageUrl: '',
  },
  {
    name: 'Ladrão de Pensamentos',
    level: 2,
    maxHp: 8,
    diceCount: 2,
    treasureReward: 2,
    effectDescription: 'Adentrar: O jogador com mais cartas na mão perde 1 tesouro. Final de rodada: 1 de dano em todos os saqueadores do jogador com mais cartas na mão.',
    imageUrl: '',
  },
  {
    name: 'Mímico de Tesouro',
    level: 2,
    maxHp: 8,
    diceCount: 2,
    treasureReward: 2,
    effectDescription: 'Adentrar: Roube todos os tesouros do último jogador que saqueou tesouro. Reação 2 de dano.',
    imageUrl: '',
  }
];

// MONSTROS NÍVEL 3 (BOSSES / BASE DO DECK - OFICIAIS)
export const MONSTERS_LEVEL_3: Omit<MonsterCard, 'id' | 'damage'>[] = [
  {
    name: "Ar'Thess, Teia do Medo",
    level: 3,
    maxHp: 13,
    diceCount: 3,
    treasureReward: 3,
    isBoss: true,
    effectDescription: 'Adentrar: No próximo turno de cada jogador, todos os seus saqueadores devem atacar esta carta. Saqueadores que sofrerem dano desta carta não atacam no turno seguinte. Além disso, roube 1 tesouro do jogador que sofreu o dano.',
    imageUrl: '',
  },
  {
    name: 'Colosso Ancestral',
    level: 3,
    maxHp: 19,
    diceCount: 3,
    treasureReward: 3,
    isBoss: true,
    effectDescription: 'Reação 2 de dano. Reações dessa carta causam dano em todos os saqueadores do jogador atacante.',
    imageUrl: '',
  },
  {
    name: 'Demônio Abissal',
    level: 3,
    maxHp: 15,
    diceCount: 3,
    treasureReward: 3,
    isBoss: true,
    effectDescription: 'Reação 2 de dano. Adentrar: Cada jogador destrói um saqueador que controla. Fim da rodada: Cada jogador descarta uma carta da mão.',
    imageUrl: '',
  },
  {
    name: 'Dragão Vermelho',
    level: 3,
    maxHp: 15,
    diceCount: 3,
    treasureReward: 3,
    isBoss: true,
    effectDescription: 'Reação 3 de dano. Adentrar: Cada saqueador recebe 1 de dano. Final da rodada: 1 de dano em todos os saqueadores.',
    imageUrl: '',
  },
  {
    name: 'Invocador do Abismo',
    level: 3,
    maxHp: 14,
    diceCount: 3,
    treasureReward: 3,
    isBoss: true,
    effectDescription: 'Adentrar: Jogue um evento aleatório de fora do jogo. Final da rodada: Jogue um evento aleatório de fora do jogo.',
    imageUrl: '',
  },
  {
    name: 'Mantícora',
    level: 3,
    maxHp: 13,
    diceCount: 3,
    treasureReward: 3,
    isBoss: true,
    effectDescription: 'Reação 2 de dano. Adentrar: Cada jogador destrói um saqueador seu. Fim da rodada: 1 de dano em todos os saqueadores.',
    imageUrl: '',
  },
  {
    name: 'Nahrzul, o Dragão da Cobiça',
    level: 3,
    maxHp: 12,
    diceCount: 3,
    treasureReward: 3,
    isBoss: true,
    effectDescription: 'Adentrar: Cada jogador ganha 1 tesouro. Reação 3 de dano. Fim da rodada: Cada jogador perde 1 tesouro.',
    imageUrl: '',
  },
  {
    name: 'O Rei dos Esqueletos',
    level: 3,
    maxHp: 17,
    diceCount: 3,
    treasureReward: 3,
    isBoss: true,
    effectDescription: 'No próximo turno de cada jogador, ele destrói todos os seus saqueadores. Em seguida, devolve à mão o mesmo número de saqueadores da pilha de descarte.',
    imageUrl: '',
  },
  {
    name: 'Olgroth, o Arauto da Guerra',
    level: 3,
    maxHp: 12,
    diceCount: 3,
    treasureReward: 3,
    isBoss: true,
    effectDescription: 'Reação 3 de dano. Adentrar: Cada jogador aponta para outro jogador. Todos os jogadores apontados devem atacar Olgroth no próximo turno com todos os seus saqueadores.',
    imageUrl: '',
  },
  {
    name: 'Vampiro Sanguinário',
    level: 3,
    maxHp: 13,
    diceCount: 3,
    treasureReward: 3,
    isBoss: true,
    effectDescription: 'Adentrar: Destrua o último saqueador que atacou. Reação 3 de dano, reações dessa carta removem marcadores de dano sobre ela igual aos resultados nulos de cada ataque.',
    imageUrl: '',
  }
];

// CARTAS DE EVENTO DA MASMORRA (OFICIAIS)
export const EVENT_CARDS_DATABASE: Omit<EventCard, 'id'>[] = [
  {
    name: 'Armadilha de Espinhos',
    eventType: 'TRAP',
    effectDescription: 'Todos os saqueadores em jogo recebem 1 de dano.',
    imageUrl: '',
  },
  {
    name: 'Caos Instaurado',
    eventType: 'AMBUSH',
    effectDescription: 'Destrua todos os Combatentes.',
    imageUrl: '',
  },
  {
    name: 'Combater o Mal',
    eventType: 'BLESSING',
    effectDescription: 'No próximo turno de cada jogador, ele deve atacar monstros com todos os seus saqueadores se estiverem aptos.',
    imageUrl: '',
  },
  {
    name: 'Conspiração Velada',
    eventType: 'TRAP',
    effectDescription: 'Todos os jogadores apontam ao mesmo tempo para um jogador. O mais apontado descarta 2 cartas. Em caso de empate, cada jogador descarta 1 carta da mão.',
    imageUrl: '',
  },
  {
    name: 'Devastação',
    eventType: 'TRAP',
    effectDescription: 'Destrua todos os saqueadores em jogo.',
    imageUrl: '',
  },
  {
    name: 'Dilaceração Mental',
    eventType: 'TRAP',
    effectDescription: 'Cada jogador descarta uma carta da própria mão, em seguida, cada jogador escolhe um saqueador seu para receber 1 de dano.',
    imageUrl: '',
  },
  {
    name: 'Findar Magia',
    eventType: 'AMBUSH',
    effectDescription: 'Destrua todos os Conjuradores.',
    imageUrl: '',
  },
  {
    name: 'Inundar',
    eventType: 'BLESSING',
    effectDescription: 'Cada jogador retorna seus saqueadores no jogo para a mão.',
    imageUrl: '',
  },
  {
    name: 'Maldição da Desavença',
    eventType: 'TRAP',
    effectDescription: 'No próximo turno de cada jogador, ele deve atacar outros jogadores com todos os seus saqueadores se estiverem aptos.',
    imageUrl: '',
  },
  {
    name: 'Maldição do Eco',
    eventType: 'TRAP',
    effectDescription: 'No próximo turno de cada jogador, se ele falar qualquer palavra, ele perde 1 tesouro.',
    imageUrl: '',
  },
  {
    name: 'Portais Instáveis',
    eventType: 'BLESSING',
    effectDescription: 'Cada jogador embaralha seus saqueadores no baralho, então revela do topo a mesma quantidade e os coloca em jogo.',
    imageUrl: '',
  },
  {
    name: 'Revezamento da Perdição',
    eventType: 'TREASURE_HOARD',
    effectDescription: 'Cada jogador passa todos os seus tesouros para o jogador à esquerda.',
    imageUrl: '',
  },
  {
    name: 'Tesouro Excedente',
    eventType: 'TREASURE_HOARD',
    effectDescription: 'O jogador com menos tesouros ganha 1 tesouro.',
    imageUrl: '',
  },
  {
    name: 'Traição',
    eventType: 'AMBUSH',
    effectDescription: 'Cada jogador rouba uma carta aleatória da mão do jogador à esquerda.',
    imageUrl: '',
  },
  {
    name: 'Tributo Inesperado',
    eventType: 'TRAP',
    effectDescription: 'O jogador com mais tesouros perde 1 tesouro.',
    imageUrl: '',
  }
];
