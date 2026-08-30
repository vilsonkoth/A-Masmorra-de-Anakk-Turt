import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import {
  BookOpen,
  Image,
  RotateCcw,
  ScrollText,
  Sparkles,
  Volume2,
  VolumeX,
  Music,
  Music2,
  Sliders,
  X
} from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';

interface HeaderProps {
  onOpenRulebook: () => void;
  onOpenCardCustomizer: () => void;
  onOpenNewGame: () => void;
  onToggleLog: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenRulebook,
  onOpenCardCustomizer,
  onOpenNewGame,
  onToggleLog,
}) => {
  const [isSfxMuted, setIsSfxMuted] = useState(() => soundEngine.getIsMuted());
  const [isMusicMuted, setIsMusicMuted] = useState(() => soundEngine.getIsMusicMuted());
  const [isMusicPlaying, setIsMusicPlaying] = useState(() => soundEngine.getIsMusicPlaying());
  const [showAudioPopover, setShowAudioPopover] = useState(false);
  const [sfxVolume, setSfxVolumeState] = useState(() => soundEngine.getSfxVolume());
  const [musicVolume, setMusicVolumeState] = useState(() => soundEngine.getMusicVolume());

  const {
    activePlayer,
    currentRound,
    turnPhase,
    players,
    passPhase,
    hasDrawnOrPlayedInPhase1,
    hasDrawnOrPlayedInPhase3,
    isAiThinking,
    isGameOver
  } = useGame();

  const handleToggleSfx = () => {
    const nextMute = soundEngine.toggleMute();
    setIsSfxMuted(nextMute);
  };

  const handleToggleMusic = () => {
    const nextMusicMute = soundEngine.toggleMusic();
    setIsMusicMuted(nextMusicMute);
    setIsMusicPlaying(!nextMusicMute);
  };

  const handleSfxVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setSfxVolumeState(val);
    soundEngine.setSfxVolume(val);
  };

  const handleMusicVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setMusicVolumeState(val);
    soundEngine.setMusicVolume(val);
  };

  const getPhaseName = () => {
    switch (turnPhase) {
      case 'PREPARAR':
        return 'PASSO 1: PREPARAR';
      case 'MASMORRA':
        return 'PASSO 2: MASMORRA';
      case 'REAGRUPAR':
        return 'PASSO 3: REAGRUPAR';
      default:
        return turnPhase;
    }
  };

  const getPhaseDescription = () => {
    switch (turnPhase) {
      case 'PREPARAR':
        return hasDrawnOrPlayedInPhase1
          ? '✓ Ação realizada! Avançando para o Passo 2...'
          : 'Compre 1 carta do baralho OU jogue 1 saqueador da mão.';
      case 'MASMORRA':
        return 'Declare ataques selecionando o saqueador e o alvo, ou ative habilidades.';
      case 'REAGRUPAR':
        return hasDrawnOrPlayedInPhase3
          ? '✓ Ação realizada! Finalizando turno...'
          : 'Compre 1 carta do baralho OU jogue 1 saqueador da mão.';
    }
  };

  return (
    <header className="bg-gradient-to-b from-[#1c140e] to-[#120d09] border-b-2 border-[#4a3625] sticky top-0 z-30 px-3 py-2 sm:px-6 sm:py-3 shadow-[0_4px_25px_rgba(0,0,0,0.85)]">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Game Title & Brand */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-b from-[#2e1d13] to-[#140b07] border-2 border-[#d4af37]/60 flex items-center justify-center shadow-lg text-xl font-bold text-[#d4af37]">
              ⚜️
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-widest text-[#d4af37] font-cinzel leading-none uppercase drop-shadow">
                A Masmorra de Anakk Tur
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-amber-200/60 uppercase tracking-widest font-mono">
                  Mesa 3D • Rodada <span className="text-amber-100 font-bold">{currentRound.toString().padStart(2, '0')}</span>
                </span>
                <span className="text-amber-500/40">•</span>
                <span className="text-[10px] text-amber-300/80 uppercase font-mono tracking-tight">
                  Regras Oficiais
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats for Mobile */}
          <div className="flex md:hidden items-center gap-2">
            <span className="badge-gold text-xs px-2.5 py-0.5 rounded font-mono font-black">
              R{currentRound}
            </span>
          </div>
        </div>

        {/* Current Turn & Phase Indicator */}
        <div className="flex items-center gap-4 bg-gradient-to-b from-[#18110b] to-[#0d0906] border border-[#3d2e22] px-4 py-2 rounded-xl shadow-inner w-full md:w-auto justify-between md:justify-center">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full ring-2 ring-[#d4af37]/60 shadow-[0_0_8px_#22c55e]"
                style={{ backgroundColor: activePlayer?.color || '#22c55e' }}
              />
              <div className="text-left">
                <div className="text-xs text-amber-200/70 flex items-center gap-1.5 font-medium tracking-tight">
                  <span className="text-amber-200/50 uppercase text-[10px] font-mono">Vez de:</span>
                  <span className="text-amber-100 font-black uppercase text-[12px] font-cinzel">{activePlayer?.name}</span>
                  {activePlayer?.isBot && (
                    <span className="text-[9px] bg-red-950/70 text-red-300 border border-red-800 px-1 rounded uppercase font-mono font-bold">
                      BOT
                    </span>
                  )}
                  {isAiThinking && (
                    <span className="text-[10px] text-[#d4af37] animate-pulse flex items-center gap-1 font-mono font-bold">
                      <Sparkles size={11} /> Pensando...
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded uppercase tracking-wider font-cinzel ${
                    turnPhase === 'MASMORRA'
                      ? 'btn-fantasy-crimson text-white shadow-[0_0_12px_rgba(139,0,0,0.6)]'
                      : 'badge-gold'
                  }`}>
                    {getPhaseName()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {!isGameOver && !activePlayer?.isBot && (
            <button
              onClick={passPhase}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer whitespace-nowrap font-cinzel ${
                turnPhase === 'MASMORRA'
                  ? 'btn-fantasy-crimson shadow-[0_0_15px_rgba(220,38,38,0.6)]'
                  : 'btn-fantasy-gold shadow-lg'
              }`}
            >
              {turnPhase === 'REAGRUPAR' ? 'Passar Turno ⏭️' : 'Avançar Passo ➡️'}
            </button>
          )}
        </div>

        {/* Navigation & Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 relative">
          {/* Audio Popover Toggle */}
          <div className="relative">
            <button
              onClick={() => setShowAudioPopover(prev => !prev)}
              title="Ajustes de Áudio (Música Medieval & SFX)"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition cursor-pointer ${
                !isMusicMuted || !isSfxMuted
                  ? 'bg-[#22160d] text-amber-300 border-[#d4af37]/60 shadow-[0_0_10px_rgba(212,175,55,0.3)]'
                  : 'bg-[#18110b] text-gray-400 border-[#3d2e22]'
              }`}
            >
              {!isMusicMuted ? (
                <Music2 size={13} className="text-[#d4af37] animate-pulse" />
              ) : !isSfxMuted ? (
                <Volume2 size={13} className="text-amber-400" />
              ) : (
                <VolumeX size={13} className="text-red-400" />
              )}
              <span className="hidden sm:inline text-[11px] uppercase tracking-tight">Áudio</span>
            </button>

            {/* Audio Controls Dropdown Menu */}
            {showAudioPopover && (
              <div className="absolute right-0 top-full mt-2 w-64 p-4 rounded-2xl bg-[#140e0a] border-2 border-[#d4af37]/60 shadow-[0_10px_30px_rgba(0,0,0,0.95)] space-y-3 z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-[#3d2e22] pb-2">
                  <h4 className="text-xs font-black font-cinzel text-amber-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Music size={14} className="text-[#d4af37]" /> Áudio & Efeitos
                  </h4>
                  <button
                    onClick={() => setShowAudioPopover(false)}
                    className="text-gray-400 hover:text-white p-0.5 rounded cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* 1. Medieval Background Music Loop */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-amber-200/90 font-bold flex items-center gap-1">
                      🎵 Música Medieval
                    </span>
                    <button
                      onClick={handleToggleMusic}
                      className={`text-[10px] px-2 py-0.5 rounded font-black uppercase transition cursor-pointer ${
                        !isMusicMuted
                          ? 'bg-amber-950 text-yellow-300 border border-yellow-500/70'
                          : 'bg-stone-900 text-gray-400 border border-stone-700'
                      }`}
                    >
                      {!isMusicMuted ? 'Ligada' : 'Muda'}
                    </button>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={musicVolume}
                    onChange={handleMusicVolumeChange}
                    className="w-full accent-yellow-400 cursor-pointer h-1.5 bg-[#2a1d15] rounded-lg"
                  />
                </div>

                {/* 2. Sound Effects (SFX) */}
                <div className="space-y-1.5 pt-1 border-t border-[#2a1d15]">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-amber-200/90 font-bold flex items-center gap-1">
                      ⚔️ Efeitos Sonoros
                    </span>
                    <button
                      onClick={handleToggleSfx}
                      className={`text-[10px] px-2 py-0.5 rounded font-black uppercase transition cursor-pointer ${
                        !isSfxMuted
                          ? 'bg-amber-950 text-yellow-300 border border-yellow-500/70'
                          : 'bg-stone-900 text-gray-400 border border-stone-700'
                      }`}
                    >
                      {!isSfxMuted ? 'Ligado' : 'Mudo'}
                    </button>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={sfxVolume}
                    onChange={handleSfxVolumeChange}
                    className="w-full accent-yellow-400 cursor-pointer h-1.5 bg-[#2a1d15] rounded-lg"
                  />
                </div>

                <div className="text-[9px] text-amber-200/50 font-mono text-center pt-1 leading-tight">
                  Trilha sonora em loop gerada proceduralmente em Web Audio API.
                </div>
              </div>
            )}
          </div>

          <button
            onClick={onOpenRulebook}
            title="Livro de Regras Oficiais"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#18110b] hover:bg-[#2a1d13] text-amber-200 text-xs rounded-xl border border-[#3d2e22] hover:border-[#d4af37]/60 transition cursor-pointer font-mono font-bold"
          >
            <BookOpen size={13} className="text-[#d4af37]" />
            <span className="hidden sm:inline text-[11px] uppercase tracking-tight">Regras</span>
          </button>

          <button
            onClick={onOpenCardCustomizer}
            title="Galeria & Personalizar Imagens das Cartas, Versos e Mesa"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#18110b] hover:bg-[#2a1d13] text-amber-200 text-xs rounded-xl border border-[#3d2e22] hover:border-[#d4af37]/60 transition cursor-pointer font-mono font-bold"
          >
            <Image size={13} className="text-cyan-400" />
            <span className="hidden sm:inline text-[11px] uppercase tracking-tight">Imagens</span>
          </button>

          <button
            onClick={onToggleLog}
            title="Histórico de Combate"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#18110b] hover:bg-[#2a1d13] text-amber-200 text-xs rounded-xl border border-[#3d2e22] hover:border-[#d4af37]/60 transition cursor-pointer font-mono font-bold"
          >
            <ScrollText size={13} className="text-emerald-400" />
            <span className="hidden sm:inline text-[11px] uppercase tracking-tight">Log</span>
          </button>

          <button
            onClick={onOpenNewGame}
            title="Configurar Nova Partida"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#18110b] hover:bg-red-950 text-amber-200 hover:text-red-200 text-xs rounded-xl border border-[#3d2e22] hover:border-red-600 transition cursor-pointer font-mono font-bold"
          >
            <RotateCcw size={13} className="text-red-400" />
            <span className="hidden sm:inline text-[11px] uppercase tracking-tight">Reiniciar</span>
          </button>
        </div>
      </div>

      {/* Phase status tip banner */}
      <div className="max-w-7xl mx-auto mt-2 pt-1.5 border-t border-[#3d2e22] flex items-center justify-between text-[10px] text-amber-200/50 uppercase tracking-tight">
        <div className="flex items-center gap-2">
          <span className="text-[#d4af37] font-black font-cinzel">{getPhaseName()}:</span>
          <span className="text-amber-100/80 normal-case">{getPhaseDescription()}</span>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-amber-200/40 font-mono">
          <span>Capacidade: 4 Saqueadores</span>
          <span>•</span>
          <span>{players.length} Jogadores na Mesa</span>
        </div>
      </div>
    </header>
  );
};
