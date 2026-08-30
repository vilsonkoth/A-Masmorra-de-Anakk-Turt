import React, { useState, useRef, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import {
  INITIAL_TREASURE_CARD,
  MASTER_RAIDER_TEMPLATES,
  MONSTERS_LEVEL_1,
  MONSTERS_LEVEL_2,
  MONSTERS_LEVEL_3,
  EVENT_CARDS_DATABASE,
  OFFICIAL_CARD_BACK,
  getStoredImageOverrides,
  pruneOrphanedImageOverrides
} from '../data/cardsDatabase';
import { PRESET_TEXTURES, PlaymatTextures } from '../utils/textureManager';
import { X, Image as ImageIcon, Save, RotateCcw, Check, Upload, Loader2, Trash2, Sparkles, Layout, Palette } from 'lucide-react';

interface CardCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Resizes and compresses any image file (PNG/JPG/WebP) using an offscreen HTML5 Canvas
 * into a lightweight JPEG Data URI (max width 400px, 0.75 quality, ~30-50KB).
 */
async function compressImage(source: File | string, maxWidth = 400, maxHeight = 560, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Maintain aspect ratio within bounding box
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.max(1, Math.round(width * ratio));
        height = Math.max(1, Math.round(height * ratio));
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        // Fallback to original source if canvas context is unavailable
        if (typeof source === 'string') {
          resolve(source);
        } else {
          const r = new FileReader();
          r.onload = () => resolve(r.result as string);
          r.readAsDataURL(source);
        }
        return;
      }

      // Neutral dark background behind image (prevents black background artifacts from transparent PNGs)
      ctx.fillStyle = '#141416';
      ctx.fillRect(0, 0, width, height);

      // Draw resized image
      ctx.drawImage(img, 0, 0, width, height);

      // Export as compressed JPEG Data URI
      try {
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => reject(new Error('Erro ao carregar a imagem para compressão'));

    if (typeof source === 'string') {
      img.src = source;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          img.src = e.target.result as string;
        } else {
          reject(new Error('Não foi possível ler o arquivo'));
        }
      };
      reader.onerror = () => reject(new Error('Erro na leitura do arquivo'));
      reader.readAsDataURL(source);
    }
  });
}

type CustomizerTab = 'RAIDERS' | 'MONSTERS_L1' | 'MONSTERS_L2' | 'MONSTERS_L3' | 'EVENTS' | 'CARDBACK' | 'PLAYMATS';

export const CardCustomizerModal: React.FC<CardCustomizerModalProps> = ({ isOpen, onClose }) => {
  const {
    setCustomImageOverride,
    triggerCardArtReload,
    customImageOverrides,
    playmatTextures,
    updatePlaymatTextures
  } = useGame();
  const [activeTab, setActiveTab] = useState<CustomizerTab>('MONSTERS_L1');
  const [overrides, setOverrides] = useState<Record<string, string>>(() => getStoredImageOverrides());
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [targetCardForUpload, setTargetCardForUpload] = useState<string | null>(null);

  // Playmat textures local state
  const [customTextures, setCustomTextures] = useState<PlaymatTextures>(playmatTextures);

  // Automatically prune old/orphaned card keys and keep in sync
  useEffect(() => {
    if (isOpen) {
      pruneOrphanedImageOverrides();
      setOverrides(getStoredImageOverrides());
      setCustomTextures(playmatTextures);
    }
  }, [customImageOverrides, isOpen, playmatTextures]);

  if (!isOpen) return null;

  const handleTextureChange = (key: keyof PlaymatTextures, url: string) => {
    const updated = { ...customTextures, [key]: url };
    setCustomTextures(updated);
    updatePlaymatTextures(updated);
  };

  const handleTextureUpload = async (key: keyof PlaymatTextures, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessing(key);
      try {
        const compressed = await compressImage(file, 1024, 768, 0.7);
        handleTextureChange(key, compressed);
        setSavedFeedback(key);
        setTimeout(() => setSavedFeedback(null), 2000);
      } catch (err) {
        console.error('Erro ao comprimir imagem de fundo:', err);
        alert('Falha ao processar a textura.');
      } finally {
        setIsProcessing(null);
      }
    }
    e.target.value = '';
  };

  const handleUrlChange = (cardName: string, url: string) => {
    setOverrides(prev => ({
      ...prev,
      [cardName]: url
    }));
  };

  const handleSaveCard = async (cardName: string) => {
    const rawUrl = overrides[cardName] ?? '';
    setIsProcessing(cardName);

    try {
      let finalUrl = rawUrl;
      // If user pasted an uncompressed heavy base64 Data URI, compress it through canvas
      if (rawUrl.startsWith('data:image/') && rawUrl.length > 80000) {
        finalUrl = await compressImage(rawUrl, 400, 560, 0.75);
        handleUrlChange(cardName, finalUrl);
      }

      setCustomImageOverride(cardName, finalUrl);
      setSavedFeedback(cardName);
      setTimeout(() => setSavedFeedback(null), 2000);
    } catch (err) {
      console.error('Erro ao salvar imagem customizada:', err);
      // Still attempt direct save
      setCustomImageOverride(cardName, rawUrl);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && targetCardForUpload) {
      const cardTarget = targetCardForUpload;
      setIsProcessing(cardTarget);

      try {
        // Compress the image file to max 400px width with 0.75 JPEG quality (~30-50KB)
        const compressedDataUrl = await compressImage(file, 400, 560, 0.75);

        handleUrlChange(cardTarget, compressedDataUrl);
        setCustomImageOverride(cardTarget, compressedDataUrl);
        setSavedFeedback(cardTarget);
        setTimeout(() => setSavedFeedback(null), 2000);
      } catch (err) {
        console.error('Erro ao processar e comprimir imagem:', err);
        alert('Não foi possível processar a imagem selecionada. Tente outro arquivo PNG ou JPG.');
      } finally {
        setIsProcessing(null);
      }
    }
    e.target.value = '';
    setTargetCardForUpload(null);
  };

  const triggerUploadForCard = (cardName: string) => {
    setTargetCardForUpload(cardName);
    fileInputRef.current?.click();
  };

  const handlePruneAndCleanupStorage = () => {
    pruneOrphanedImageOverrides();
    setOverrides(getStoredImageOverrides());
    triggerCardArtReload();
    alert('Limpeza concluída! Todas as chaves e cartas antigas/órfãs foram removidas do armazenamento.');
  };

  const handleResetAll = () => {
    if (window.confirm('Deseja redefinir todas as imagens personalizadas para os padrões originais?')) {
      localStorage.removeItem('ANAKK_TUR_CUSTOM_CARD_IMAGES');
      setOverrides({});
      triggerCardArtReload();
    }
  };

  const renderCardRow = (
    card: { name: string; effectDescription?: string; imageUrl?: string },
    badgeText: string,
    badgeColorClass: string,
    fallbackIcon: string,
    accentColor: string = '#d4af37'
  ) => {
    const currentUrl = overrides[card.name] || card.imageUrl || '';

    return (
      <div
        key={card.name}
        className="p-3.5 bg-[#140e0b] border border-[#3d2e22] rounded-2xl flex gap-3.5 items-start shadow-md hover:border-[#d4af37]/60 transition card-3d"
      >
        {/* Thumbnail */}
        <div className="w-20 h-24 rounded-xl overflow-hidden bg-[#1e150f] border border-[#3d2e22] flex-shrink-0 relative shadow-inner">
          {currentUrl ? (
            <img
              src={currentUrl}
              alt={card.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl text-amber-200/50 bg-[#1e150f]">
              {fallbackIcon}
            </div>
          )}
        </div>

        {/* Editor Form */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-black text-xs text-amber-100 font-cinzel uppercase tracking-wider">{card.name}</h4>
            <span className={`text-[9px] px-2 py-0.5 rounded-md border font-mono font-bold ${badgeColorClass}`}>
              {badgeText}
            </span>
          </div>

          {card.effectDescription && (
            <p className="text-[10px] text-amber-200/70 font-mono line-clamp-2 leading-relaxed">
              {card.effectDescription}
            </p>
          )}

          <div className="space-y-1">
            <label className="text-[10px] text-amber-200/60 block font-mono">
              Upload PNG/JPG ou Link URL:
            </label>
            <div className="flex gap-1.5 font-mono">
              <input
                type="text"
                value={overrides[card.name] !== undefined ? overrides[card.name] : (card.imageUrl || '')}
                onChange={e => handleUrlChange(card.name, e.target.value)}
                placeholder="Cole o link ou clique em Upload..."
                className="flex-1 text-xs bg-[#1e150f] border border-[#3d2e22] rounded-xl px-2.5 py-1.5 text-amber-100 placeholder:text-amber-200/30 focus:outline-none focus:border-[#d4af37]"
              />
              <button
                onClick={() => triggerUploadForCard(card.name)}
                disabled={isProcessing === card.name}
                title="Carregar arquivo PNG/JPG do computador (comprime automaticamente)"
                className="px-2.5 py-1.5 bg-[#2a1d15] hover:bg-[#3d2e22] text-amber-200 hover:text-white rounded-xl border border-[#3d2e22] transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                {isProcessing === card.name ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
              </button>
              <button
                onClick={() => handleSaveCard(card.name)}
                disabled={isProcessing === card.name}
                style={{ backgroundColor: accentColor }}
                className="px-3 py-1.5 hover:brightness-110 text-neutral-950 font-black text-xs rounded-xl transition flex items-center gap-1 cursor-pointer disabled:opacity-50 shadow"
              >
                {savedFeedback === card.name ? (
                  <Check size={13} />
                ) : isProcessing === card.name ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Save size={13} />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      {/* Hidden File Input for uploading local card images into Data URIs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      <div className="playmat-surface border-2 border-[#d4af37] rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-[0_0_50px_rgba(212,175,55,0.35)] overflow-hidden card-3d">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#3d2e22] flex items-center justify-between bg-[#140e0b]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-[#2a1d15] to-[#140e0a] border border-[#d4af37]/60 flex items-center justify-center text-[#d4af37] shadow">
              <ImageIcon size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-amber-100 font-cinzel uppercase tracking-wider">
                GALERIA & PERSONALIZAÇÃO DAS CARTAS
              </h2>
              <p className="text-xs text-amber-200/70 font-mono">
                Faça upload de fotos (PNG/JPG) com compressão automática para personalizar as cartas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono">
            <button
              onClick={handlePruneAndCleanupStorage}
              title="Limpar chaves e cartas antigas do armazenamento"
              className="text-amber-300 hover:text-amber-200 p-2 rounded-xl bg-[#1e150f] border border-[#3d2e22] text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Trash2 size={14} />
              <span className="hidden sm:inline">Limpar Cartas Velhas</span>
            </button>

            <button
              onClick={handleResetAll}
              title="Restaurar imagens padrão"
              className="text-amber-200/70 hover:text-white p-2 rounded-xl bg-[#1e150f] border border-[#3d2e22] text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <RotateCcw size={14} />
              <span className="hidden sm:inline">Restaurar Padrões</span>
            </button>

            <button
              onClick={onClose}
              className="text-amber-200/60 hover:text-white p-2 rounded-xl bg-[#1e150f] border border-[#3d2e22] transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#3d2e22] bg-[#120e0b] px-3 sm:px-6 gap-1 sm:gap-2 overflow-x-auto scrollbar-none font-mono">
          <button
            onClick={() => setActiveTab('MONSTERS_L1')}
            className={`py-3 px-3 text-xs font-black font-cinzel uppercase tracking-wider border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'MONSTERS_L1'
                ? 'border-[#d4af37] text-yellow-400'
                : 'border-transparent text-amber-200/50 hover:text-amber-100'
            }`}
          >
            <span>👹 Monstros Nível 1 ({MONSTERS_LEVEL_1.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('MONSTERS_L2')}
            className={`py-3 px-3 text-xs font-black font-cinzel uppercase tracking-wider border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'MONSTERS_L2'
                ? 'border-purple-400 text-purple-300'
                : 'border-transparent text-amber-200/50 hover:text-amber-100'
            }`}
          >
            <span>💀 Monstros Nível 2 ({MONSTERS_LEVEL_2.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('MONSTERS_L3')}
            className={`py-3 px-3 text-xs font-black font-cinzel uppercase tracking-wider border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'MONSTERS_L3'
                ? 'border-red-500 text-red-400'
                : 'border-transparent text-amber-200/50 hover:text-amber-100'
            }`}
          >
            <span>🐲 Monstros Nível 3 ({MONSTERS_LEVEL_3.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('EVENTS')}
            className={`py-3 px-3 text-xs font-black font-cinzel uppercase tracking-wider border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'EVENTS'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-amber-200/50 hover:text-amber-100'
            }`}
          >
            <span>⚡ Eventos ({EVENT_CARDS_DATABASE.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('RAIDERS')}
            className={`py-3 px-3 text-xs font-black font-cinzel uppercase tracking-wider border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'RAIDERS'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-amber-200/50 hover:text-amber-100'
            }`}
          >
            <span>⚔️ Saqueadores ({MASTER_RAIDER_TEMPLATES.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('CARDBACK')}
            className={`py-3 px-3 text-xs font-black font-cinzel uppercase tracking-wider border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'CARDBACK'
                ? 'border-yellow-400 text-yellow-300'
                : 'border-transparent text-amber-200/50 hover:text-amber-100'
            }`}
          >
            <span>🎴 Player & Dungeon Deck Backs</span>
          </button>

          <button
            onClick={() => setActiveTab('PLAYMATS')}
            className={`py-3 px-3 text-xs font-black font-cinzel uppercase tracking-wider border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'PLAYMATS'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-amber-200/50 hover:text-amber-100'
            }`}
          >
            <span>🎨 Global Table Background & Playmats</span>
          </button>
        </div>

        {/* Cards List Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Playmat & Table Textures Customization */}
          {activeTab === 'PLAYMATS' && (
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="p-4 bg-[#18100c] border border-[#d4af37]/40 rounded-2xl space-y-2">
                <h3 className="text-sm font-black text-yellow-400 font-cinzel uppercase tracking-wider flex items-center gap-2">
                  <Palette size={16} /> Personalização de Texturas & Fundos da Mesa
                </h3>
                <p className="text-xs text-amber-200/70 font-mono">
                  Faça o upload do <strong>Global Table Background</strong>, Playmat do Jogador e Tomo/Grimório da Masmorra enviando arquivos do seu dispositivo ou inserindo URLs de imagem.
                </p>
              </div>

              {/* Textures Rows */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Mesa Global - Global Table Background */}
                <div className="p-4 bg-[#140e0b] border border-[#d4af37]/60 rounded-2xl space-y-3 shadow-md flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 font-mono font-bold">MESA / AMBIENTE</span>
                    <h4 className="text-xs font-black text-yellow-300 font-cinzel uppercase">Global Table Background</h4>
                    <p className="text-[10px] text-amber-200/60 font-mono">Fundo Global do Tabuleiro da Masmorra</p>
                    <div className="w-full h-24 rounded-xl overflow-hidden bg-[#1e150f] border border-[#3d2e22] relative flex items-center justify-center">
                      {customTextures.tableBackground ? (
                        <img src={customTextures.tableBackground} alt="Global Table Background" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs text-amber-200/40 font-mono">Madeira Rústica Padrão</span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="URL da imagem (Global Table Background)..."
                      value={customTextures.tableBackground}
                      onChange={e => handleTextureChange('tableBackground', e.target.value)}
                      className="w-full text-xs bg-[#1e150f] border border-[#3d2e22] rounded-lg px-2 py-1 text-amber-100 placeholder:text-amber-200/30"
                    />
                    <div className="flex gap-1.5">
                      <label className="flex-1 py-1.5 px-2 bg-[#2a1d15] hover:bg-[#3d2e22] text-yellow-300 rounded-lg border border-yellow-500/40 text-center text-[10px] font-mono cursor-pointer flex items-center justify-center gap-1 font-bold shadow">
                        <Upload size={12} />
                        <span>Upload Global Table Background</span>
                        <input type="file" accept="image/*" className="hidden" onChange={e => handleTextureUpload('tableBackground', e)} />
                      </label>
                      {customTextures.tableBackground && (
                        <button
                          onClick={() => handleTextureChange('tableBackground', '')}
                          className="px-2 py-1.5 bg-red-950/60 hover:bg-red-900 text-red-300 rounded-lg text-[10px] font-mono"
                        >
                          Limpar
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Playmat do Jogador */}
                <div className="p-4 bg-[#140e0b] border border-[#3d2e22] rounded-2xl space-y-3 shadow-md flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950 text-blue-300 font-mono font-bold">PLAYMAT JOGADOR</span>
                    <h4 className="text-xs font-black text-amber-100 font-cinzel uppercase">Pano do Saqueador</h4>
                    <p className="text-[10px] text-amber-200/60 font-mono">Fundo do Campo do Jogador</p>
                    <div className="w-full h-24 rounded-xl overflow-hidden bg-[#1e150f] border border-[#3d2e22] relative flex items-center justify-center">
                      {customTextures.playerPlaymatBackground ? (
                        <img src={customTextures.playerPlaymatBackground} alt="Playmat" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs text-amber-200/40 font-mono">Couro Arcano Padrão</span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="URL do Playmat..."
                      value={customTextures.playerPlaymatBackground}
                      onChange={e => handleTextureChange('playerPlaymatBackground', e.target.value)}
                      className="w-full text-xs bg-[#1e150f] border border-[#3d2e22] rounded-lg px-2 py-1 text-amber-100 placeholder:text-amber-200/30"
                    />
                    <div className="flex gap-1.5">
                      <label className="flex-1 py-1.5 px-2 bg-[#2a1d15] hover:bg-[#3d2e22] text-amber-200 rounded-lg border border-[#3d2e22] text-center text-[10px] font-mono cursor-pointer flex items-center justify-center gap-1">
                        <Upload size={12} />
                        <span>Upload Playmat</span>
                        <input type="file" accept="image/*" className="hidden" onChange={e => handleTextureUpload('playerPlaymatBackground', e)} />
                      </label>
                      {customTextures.playerPlaymatBackground && (
                        <button
                          onClick={() => handleTextureChange('playerPlaymatBackground', '')}
                          className="px-2 py-1.5 bg-red-950/60 hover:bg-red-900 text-red-300 rounded-lg text-[10px] font-mono"
                        >
                          Limpar
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. Grimório Central */}
                <div className="p-4 bg-[#140e0b] border border-[#3d2e22] rounded-2xl space-y-3 shadow-md flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-red-950 text-red-300 font-mono font-bold">GRIMÓRIO CENTRAL</span>
                    <h4 className="text-xs font-black text-amber-100 font-cinzel uppercase">Tomo da Masmorra</h4>
                    <p className="text-[10px] text-amber-200/60 font-mono">Fundo da Câmara de Combate</p>
                    <div className="w-full h-24 rounded-xl overflow-hidden bg-[#1e150f] border border-[#3d2e22] relative flex items-center justify-center">
                      {customTextures.dungeonGrimoireBackground ? (
                        <img src={customTextures.dungeonGrimoireBackground} alt="Grimório" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs text-amber-200/40 font-mono">Pedra Rúnica Padrão</span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="URL do Grimório..."
                      value={customTextures.dungeonGrimoireBackground}
                      onChange={e => handleTextureChange('dungeonGrimoireBackground', e.target.value)}
                      className="w-full text-xs bg-[#1e150f] border border-[#3d2e22] rounded-lg px-2 py-1 text-amber-100 placeholder:text-amber-200/30"
                    />
                    <div className="flex gap-1.5">
                      <label className="flex-1 py-1.5 px-2 bg-[#2a1d15] hover:bg-[#3d2e22] text-amber-200 rounded-lg border border-[#3d2e22] text-center text-[10px] font-mono cursor-pointer flex items-center justify-center gap-1">
                        <Upload size={12} />
                        <span>Upload Tomo</span>
                        <input type="file" accept="image/*" className="hidden" onChange={e => handleTextureUpload('dungeonGrimoireBackground', e)} />
                      </label>
                      {customTextures.dungeonGrimoireBackground && (
                        <button
                          onClick={() => handleTextureChange('dungeonGrimoireBackground', '')}
                          className="px-2 py-1.5 bg-red-950/60 hover:bg-red-900 text-red-300 rounded-lg text-[10px] font-mono"
                        >
                          Limpar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Card Backs for Raiders Deck (Player Deck Back) and Dungeon Deck (Dungeon Deck Back) */}
          {activeTab === 'CARDBACK' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="p-4 bg-[#1b120c] border border-[#d4af37]/50 rounded-2xl">
                <h3 className="text-sm font-black text-yellow-400 font-cinzel uppercase tracking-wider mb-1 flex items-center gap-2">
                  <span>🎴 Personalização dos Versos de Baralho (Cardbacks)</span>
                </h3>
                <p className="text-xs text-amber-200/80 font-mono leading-relaxed">
                  Faça o upload do arquivo para o <strong>Verso do Baralho de Saqueadores (Player Deck Cardback)</strong> e para o <strong>Verso do Baralho da Masmorra (Dungeon Deck Cardback)</strong>. As imagens são convertidas em Data-URL (Base64) e salvas no <code>localStorage</code> do seu navegador, sendo aplicadas imediatamente ao topo de todos os baralhos de compra e no verso de cartas ocultas/viradas para baixo.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Player Deck Back (Verso do Baralho de Saqueadores) */}
                <div className="p-5 bg-[#140e0b] border-2 border-[#d4af37]/60 rounded-2xl space-y-4 shadow-xl flex flex-col justify-between card-3d relative">
                  <div className="space-y-3 text-center">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-950 text-yellow-300 font-mono font-bold border border-yellow-500/40 uppercase">
                        Baralho de Saqueadores
                      </span>
                      {customTextures.raiderCardBack && (
                        <span className="text-[9px] text-emerald-400 font-mono font-bold flex items-center gap-1">
                          ✓ Imagem Personalizada Ativa
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-black text-amber-100 font-cinzel uppercase">
                      Verso do Baralho de Saqueadores
                    </h4>
                    <p className="text-[10px] text-amber-200/60 font-mono">
                      (Player Deck Cardback • Aplicado no monte de compra de Saqueadores e cartas na mão de oponentes)
                    </p>

                    <div className="w-48 h-64 mx-auto rounded-xl overflow-hidden border-2 border-[#d4af37] shadow-[0_0_25px_rgba(212,175,55,0.4)] bg-black relative flex items-center justify-center p-1">
                      <img
                        src={customTextures.raiderCardBack || OFFICIAL_CARD_BACK}
                        alt="Verso do Baralho de Saqueadores"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain card-image-intact rounded-lg"
                      />
                      {savedFeedback === 'raiderCardBack' && (
                        <div className="absolute inset-0 bg-emerald-950/90 text-emerald-300 font-black font-cinzel text-xs flex items-center justify-center gap-1.5 animate-fade-in">
                          <Check size={18} />
                          <span>Verso Salvo!</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-2">
                    {/* File Upload Button (Input File) */}
                    <label className="w-full py-2.5 px-3 bg-gradient-to-r from-amber-900 via-yellow-900 to-amber-900 hover:from-amber-800 hover:to-yellow-800 text-yellow-200 rounded-xl border border-yellow-500/60 text-center text-xs font-mono font-bold cursor-pointer flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95">
                      <Upload size={16} />
                      <span>{isProcessing === 'raiderCardBack' ? 'Convertendo Imagem...' : 'Enviar Arquivo do Verso dos Saqueadores'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => handleTextureUpload('raiderCardBack', e)}
                        disabled={isProcessing === 'raiderCardBack'}
                      />
                    </label>

                    {/* URL Input Fallback */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Ou insira a URL da imagem..."
                        value={customTextures.raiderCardBack}
                        onChange={e => handleTextureChange('raiderCardBack', e.target.value)}
                        className="flex-1 text-xs bg-[#1e150f] border border-[#3d2e22] rounded-lg px-2.5 py-1.5 text-amber-100 placeholder:text-amber-200/30 font-mono"
                      />
                      {customTextures.raiderCardBack && (
                        <button
                          onClick={() => handleTextureChange('raiderCardBack', '')}
                          className="px-3 py-1.5 bg-red-950/70 hover:bg-red-900 text-red-300 rounded-lg text-xs font-mono border border-red-800 flex items-center gap-1"
                          title="Restaurar Verso Padrão"
                        >
                          <RotateCcw size={12} />
                          <span>Padrão</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Dungeon Deck Back (Verso do Baralho da Masmorra) */}
                <div className="p-5 bg-[#140e0b] border-2 border-red-800/80 rounded-2xl space-y-4 shadow-xl flex flex-col justify-between card-3d relative">
                  <div className="space-y-3 text-center">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-red-950 text-red-300 font-mono font-bold border border-red-500/40 uppercase">
                        Baralho da Masmorra
                      </span>
                      {customTextures.dungeonCardBack && (
                        <span className="text-[9px] text-emerald-400 font-mono font-bold flex items-center gap-1">
                          ✓ Imagem Personalizada Ativa
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-black text-amber-100 font-cinzel uppercase">
                      Verso do Baralho da Masmorra
                    </h4>
                    <p className="text-[10px] text-amber-200/60 font-mono">
                      (Dungeon Deck Cardback • Aplicado no monte de compra da Masmorra Central)
                    </p>

                    <div className="w-48 h-64 mx-auto rounded-xl overflow-hidden border-2 border-red-700/80 shadow-[0_0_25px_rgba(220,38,38,0.4)] bg-black relative flex items-center justify-center p-1">
                      <img
                        src={customTextures.dungeonCardBack || OFFICIAL_CARD_BACK}
                        alt="Verso do Baralho da Masmorra"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain card-image-intact rounded-lg"
                      />
                      {savedFeedback === 'dungeonCardBack' && (
                        <div className="absolute inset-0 bg-emerald-950/90 text-emerald-300 font-black font-cinzel text-xs flex items-center justify-center gap-1.5 animate-fade-in">
                          <Check size={18} />
                          <span>Verso Salvo!</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-2">
                    {/* File Upload Button (Input File) */}
                    <label className="w-full py-2.5 px-3 bg-gradient-to-r from-red-950 via-red-900 to-red-950 hover:from-red-900 hover:to-red-800 text-red-200 rounded-xl border border-red-500/60 text-center text-xs font-mono font-bold cursor-pointer flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95">
                      <Upload size={16} />
                      <span>{isProcessing === 'dungeonCardBack' ? 'Convertendo Imagem...' : 'Enviar Arquivo do Verso da Masmorra'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => handleTextureUpload('dungeonCardBack', e)}
                        disabled={isProcessing === 'dungeonCardBack'}
                      />
                    </label>

                    {/* URL Input Fallback */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Ou insira a URL da imagem..."
                        value={customTextures.dungeonCardBack}
                        onChange={e => handleTextureChange('dungeonCardBack', e.target.value)}
                        className="flex-1 text-xs bg-[#1e150f] border border-[#3d2e22] rounded-lg px-2.5 py-1.5 text-amber-100 placeholder:text-amber-200/30 font-mono"
                      />
                      {customTextures.dungeonCardBack && (
                        <button
                          onClick={() => handleTextureChange('dungeonCardBack', '')}
                          className="px-3 py-1.5 bg-red-950/70 hover:bg-red-900 text-red-300 rounded-lg text-xs font-mono border border-red-800 flex items-center gap-1"
                          title="Restaurar Verso Padrão"
                        >
                          <RotateCcw size={12} />
                          <span>Padrão</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Monstros Nível 1 & Carta Inicial */}
          {activeTab === 'MONSTERS_L1' && (
            <div className="space-y-4">
              <div className="p-3 bg-gradient-to-r from-amber-950/70 to-yellow-950/40 border border-yellow-500/60 rounded-2xl">
                <div className="text-xs font-bold text-yellow-300 font-cinzel uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span>💎 CARTA INICIAL FIXA DA MASMORRA (Topo da Câmara)</span>
                </div>
                {renderCardRow(
                  INITIAL_TREASURE_CARD,
                  `INICIAL • 1 HP • 💰 1 TESOURO`,
                  'bg-amber-950/80 text-yellow-300 border-yellow-500/70',
                  '💎',
                  '#d4af37'
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {MONSTERS_LEVEL_1.map(card =>
                  renderCardRow(
                    card,
                    `NÍVEL 1 • ${card.maxHp} HP • 💎 ${card.treasureReward}`,
                    'bg-[#1e150f] text-yellow-400 border-[#d4af37]/40',
                    '👹',
                    '#d4af37'
                  )
                )}
              </div>
            </div>
          )}

          {/* Monstros Nível 2 */}
          {activeTab === 'MONSTERS_L2' && (
            <div>
              {MONSTERS_LEVEL_2.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {MONSTERS_LEVEL_2.map(card =>
                    renderCardRow(
                      card,
                      `NÍVEL 2 • ${card.maxHp} HP • 💎 ${card.treasureReward}`,
                      'bg-purple-950/60 text-purple-300 border-purple-700',
                      '💀',
                      '#a855f7'
                    )
                  )}
                </div>
              ) : (
                <div className="p-8 text-center bg-[#140e0b] border border-purple-900/40 rounded-2xl space-y-3">
                  <div className="text-3xl text-purple-400">💀</div>
                  <h4 className="text-sm font-black text-amber-100 font-cinzel uppercase tracking-wider">
                    Nenhum Monstro de Nível 2 Cadastrado
                  </h4>
                  <p className="text-xs text-amber-200/70 font-mono max-w-md mx-auto">
                    Os monstros de Nível 2 serão adicionados conforme os pergaminhos oficiais. No momento o jogo utiliza os monstros de Nível 1 ativos.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Monstros Nível 3 */}
          {activeTab === 'MONSTERS_L3' && (
            <div>
              {MONSTERS_LEVEL_3.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {MONSTERS_LEVEL_3.map(card =>
                    renderCardRow(
                      card,
                      `CHEFE NÍVEL 3 • ${card.maxHp} HP • 💎 ${card.treasureReward}`,
                      'bg-[#8b0000]/40 text-red-300 border-red-700',
                      '🐲',
                      '#ef4444'
                    )
                  )}
                </div>
              ) : (
                <div className="p-8 text-center bg-[#140e0b] border border-red-900/40 rounded-2xl space-y-3">
                  <div className="text-3xl text-red-400">🐲</div>
                  <h4 className="text-sm font-black text-amber-100 font-cinzel uppercase tracking-wider">
                    Nenhum Chefe de Nível 3 Cadastrado
                  </h4>
                  <p className="text-xs text-amber-200/70 font-mono max-w-md mx-auto">
                    Os Chefes de Nível 3 serão adicionados conforme os pergaminhos oficiais.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Eventos */}
          {activeTab === 'EVENTS' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {EVENT_CARDS_DATABASE.map(card =>
                renderCardRow(
                  card,
                  `EVENTO (${card.eventType})`,
                  'bg-cyan-950/60 text-cyan-300 border border-cyan-800',
                  '⚡',
                  '#06b6d4'
                )
              )}
            </div>
          )}

          {/* Saqueadores */}
          {activeTab === 'RAIDERS' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MASTER_RAIDER_TEMPLATES.map(card =>
                renderCardRow(
                  card,
                  `${card.type.toUpperCase()} • ${card.maxHp} HP • 🎲 ${card.diceCount}`,
                  'bg-[#1e150f] text-yellow-400 border border-[#d4af37]/40',
                  '⚔️',
                  '#d4af37'
                )
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#140e0b] border-t border-[#3d2e22] flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-amber-200/70 font-mono">
          <span className="text-[11px] text-center sm:text-left">
            Uploads de PNG/JPG são comprimidos via Canvas (~30-50KB) e persistidos sem estourar o limite de armazenamento.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 btn-fantasy-gold text-black font-black rounded-xl transition cursor-pointer uppercase text-xs font-cinzel shadow"
          >
            Concluir Edição
          </button>
        </div>
      </div>
    </div>
  );
};
