// Texture & Background Manager for Table, Grimoire, and Player Playmats
import defaultDungeonBg from '../assets/images/dungeon_background_1788099020579.jpg';

export const DEFAULT_DUNGEON_TABLE_BG = defaultDungeonBg;

export interface PlaymatTextures {
  tableBackground: string;
  playerPlaymatBackground: string;
  dungeonGrimoireBackground: string;
  raiderCardBack: string;
  dungeonCardBack: string;
}

const STORAGE_KEY = 'ANAKK_TUR_CUSTOM_PLAYMAT_TEXTURES';

export const DEFAULT_PLAYMAT_TEXTURES: PlaymatTextures = {
  tableBackground: defaultDungeonBg, // Official Live Dungeon Chamber
  playerPlaymatBackground: '',
  dungeonGrimoireBackground: '',
  raiderCardBack: '',
  dungeonCardBack: '',
};

export const PRESET_TEXTURES = [
  {
    id: 'rustic_oak',
    name: 'Carvalho Rústico da Taverna',
    category: 'Mesa',
    previewColor: '#2b1b11',
    description: 'Madeira escura nobre com entalhes medievais e iluminação de tochas.'
  },
  {
    id: 'ancient_stone',
    name: 'Pedra Rúnica da Masmorra',
    category: 'Masmorra',
    previewColor: '#171219',
    description: 'Piso de pedra antiga com runas douradas cravadas em relevo.'
  },
  {
    id: 'leather_grimoire',
    name: 'Couro & Veludo Arcano',
    category: 'Playmat',
    previewColor: '#1e1411',
    description: 'Textura de couro tratado com bordas de latão forjado.'
  },
  {
    id: 'obsidian_crypt',
    name: 'Cripta de Obsidiana Carmesim',
    category: 'Geral',
    previewColor: '#1a0d10',
    description: 'Rochas vulcânicas escuras com veios de lava carmesim resfriada.'
  }
];

export function getStoredPlaymatTextures(): PlaymatTextures {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PLAYMAT_TEXTURES };
    const parsed = JSON.parse(raw);
    return {
      tableBackground: parsed.tableBackground || DEFAULT_DUNGEON_TABLE_BG,
      playerPlaymatBackground: parsed.playerPlaymatBackground || '',
      dungeonGrimoireBackground: parsed.dungeonGrimoireBackground || '',
      raiderCardBack: parsed.raiderCardBack || '',
      dungeonCardBack: parsed.dungeonCardBack || ''
    };
  } catch {
    return { ...DEFAULT_PLAYMAT_TEXTURES };
  }
}

export function saveStoredPlaymatTextures(textures: PlaymatTextures) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(textures));
  } catch (err) {
    console.error('Falha ao salvar texturas de playmat:', err);
  }
}
