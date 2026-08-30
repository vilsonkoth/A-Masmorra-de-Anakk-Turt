import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { ThemedDice3D } from './ThemedDice3D';
import { OrnateCorner } from './OrnateCorner';
import { soundEngine } from '../utils/soundEngine';
import {
  Swords,
  Skull,
  ShieldAlert,
  Coins,
  Sparkles,
  X,
  Dices,
  RotateCw,
  Zap,
  Flame,
  Shield
} from 'lucide-react';

export const DiceRollModal: React.FC = () => {
  const { activeDiceResolution, closeDiceModal } = useGame();
  const [isRolling, setIsRolling] = useState(true);
  const [suspenseProgress, setSuspenseProgress] = useState(0);
  const [remainingDisplayTime, setRemainingDisplayTime] = useState<number | null>(null);
  const hasPlayedResultSoundRef = useRef(false);

  useEffect(() => {
    if (!activeDiceResolution) return;

    // Reset rolling suspense state whenever a new combat resolution is opened
    setIsRolling(true);
    setSuspenseProgress(0);
    setRemainingDisplayTime(null);
    hasPlayedResultSoundRef.current = false;

    // Play rolling dice sound
    soundEngine.playDiceRollSound();

    const rollDuration = 1200; // Exactly 1.2s of 3D rolling animation
    const displayDuration = 2400; // Exactly 2.4s of result display before closing
    const totalDuration = rollDuration + displayDuration; // 3.6s total

    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;

      if (elapsed < rollDuration) {
        setIsRolling(true);
        const progress = Math.min(100, Math.floor((elapsed / rollDuration) * 100));
        setSuspenseProgress(progress);
        setRemainingDisplayTime(null);
      } else if (elapsed < totalDuration) {
        setIsRolling(false);
        setSuspenseProgress(100);
        const displayElapsed = elapsed - rollDuration;
        const remaining = Math.max(0, Math.ceil((displayDuration - displayElapsed) / 1000));
        setRemainingDisplayTime(remaining);

        // Trigger hit or blank SFX upon settling
        if (!hasPlayedResultSoundRef.current) {
          hasPlayedResultSoundRef.current = true;
          if (activeDiceResolution.hits > 0) {
            soundEngine.playDiceHitSound();
            if (activeDiceResolution.targetDied) {
              setTimeout(() => {
                soundEngine.playMonsterRoarSound();
                if (activeDiceResolution.treasureEarned > 0) {
                  setTimeout(() => soundEngine.playTreasureSound(), 300);
                }
              }, 400);
            }
          } else {
            soundEngine.playDiceBlankSound();
          }
        }
      } else {
        setIsRolling(false);
        clearInterval(interval);
        closeDiceModal();
      }
    }, 30);

    return () => clearInterval(interval);
  }, [activeDiceResolution, closeDiceModal]);

  if (!activeDiceResolution) return null;

  const {
    attackerName,
    targetName,
    diceRolled,
    hits,
    blanks,
    targetDied,
    reactionDamage,
    attackerDied,
    treasureEarned,
  } = activeDiceResolution;

  const handleReplayRoll = () => {
    setIsRolling(true);
    setSuspenseProgress(0);
    setRemainingDisplayTime(null);

    const rollDuration = 1200; // Exactly 1.2s
    const displayDuration = 2400; // Exactly 2.4s
    const totalDuration = rollDuration + displayDuration;
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;

      if (elapsed < rollDuration) {
        setIsRolling(true);
        const progress = Math.min(100, Math.floor((elapsed / rollDuration) * 100));
        setSuspenseProgress(progress);
        setRemainingDisplayTime(null);
      } else if (elapsed < totalDuration) {
        setIsRolling(false);
        setSuspenseProgress(100);
        const displayElapsed = elapsed - rollDuration;
        const remaining = Math.max(0, Math.ceil((displayDuration - displayElapsed) / 1000));
        setRemainingDisplayTime(remaining);
      } else {
        setIsRolling(false);
        clearInterval(interval);
        closeDiceModal();
      }
    }, 30);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="playmat-surface border-2 border-[#d4af37] rounded-3xl max-w-xl w-full p-5 sm:p-7 shadow-[0_0_60px_rgba(212,175,55,0.45)] space-y-6 animate-in fade-in zoom-in-95 duration-200 relative overflow-hidden card-3d my-auto">
        {/* Antique Metal Corner Plates */}
        <OrnateCorner position="tl" colorVariant="gold" />
        <OrnateCorner position="tr" colorVariant="gold" />
        <OrnateCorner position="bl" colorVariant="gold" />
        <OrnateCorner position="br" colorVariant="gold" />

        {/* Ambient Glows */}
        <div className="absolute -right-24 -top-24 w-60 h-60 bg-[#d4af37]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-24 -bottom-24 w-60 h-60 bg-[#8b0000]/25 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#4a3625] pb-3.5 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-b from-[#312012] to-[#140c07] border-2 border-yellow-500/70 flex items-center justify-center text-yellow-400 shadow-xl">
              <Dices size={24} className={isRolling ? 'animate-spin' : ''} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-amber-100 font-cinzel uppercase tracking-wider flex items-center gap-2">
                <span>COMBATE: ROLAGEM DE DADOS 3D</span>
                {isRolling && (
                  <span className="text-[10px] bg-red-900 text-yellow-200 border border-red-500 px-2 py-0.5 rounded uppercase font-mono tracking-wider animate-pulse">
                    Rolando...
                  </span>
                )}
              </h3>
              <p className="text-xs text-amber-200/70 font-mono flex items-center gap-1.5 mt-0.5">
                <span className="text-yellow-300 font-bold">{attackerName}</span>
                <span className="text-red-400 font-black">⚔️ ATACA ➔</span>
                <span className="text-amber-100 font-bold">{targetName}</span>
              </p>
            </div>
          </div>

          <button
            onClick={closeDiceModal}
            className="text-amber-200/60 hover:text-white p-2 rounded-xl bg-[#1a130e] border border-[#4a3625] hover:border-yellow-500/60 transition cursor-pointer"
            title="Fechar Modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Suspense Bar & Status */}
        <div className="space-y-1.5 relative z-10">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-amber-200/80 font-bold flex items-center gap-1.5">
              <Sparkles size={14} className="text-yellow-400 animate-pulse" />
              {isRolling
                ? 'Rolando dados de ataque na mesa (1.2s)...'
                : remainingDisplayTime !== null
                ? `Exibindo resultado do combate (fechando em ${remainingDisplayTime}s)...`
                : 'Rolagem finalizada com sucesso!'}
            </span>
            <span className="text-yellow-400 font-black">
              {isRolling ? `${suspenseProgress}%` : `${diceRolled.length} Dados Rolados`}
            </span>
          </div>

          <div className="w-full h-2 bg-[#140e0a] rounded-full overflow-hidden border border-[#4a3625]">
            <div
              className={`h-full transition-all duration-75 ${
                isRolling
                  ? 'bg-gradient-to-r from-yellow-600 via-amber-400 to-red-500 animate-pulse'
                  : 'bg-gradient-to-r from-emerald-500 to-yellow-400'
              }`}
              style={{ width: `${isRolling ? suspenseProgress : 100}%` }}
            />
          </div>
        </div>

        {/* 3D Physical Dice Tray Box */}
        <div className="space-y-3 relative z-10">
          <div className="dice-tray p-5 sm:p-7 rounded-2xl flex flex-wrap gap-5 sm:gap-7 justify-center items-center shadow-[inset_0_0_30px_rgba(0,0,0,0.95)] border-2 border-[#5c4028]">
            {diceRolled.map((die, idx) => (
              <ThemedDice3D
                key={idx}
                die={die}
                isRolling={isRolling}
                index={idx}
              />
            ))}
          </div>

          {/* Quick Explanation Badge */}
          <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-amber-200/60 px-1 gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 border border-yellow-300" />
              <span>Faces 1-2 = <strong>1 Dano</strong> | Face 3 = <strong>2 Danos</strong> | Face 4 = <strong>3 Danos</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-stone-500 border border-stone-300" />
              <span>Faces 5-6 = <strong>0 Dano (Nulo/Reação)</strong></span>
            </div>
          </div>
        </div>

        {/* Highlighted Results Breakdown */}
        <div className="space-y-3 relative z-10">
          {/* Summary Badges: Hits vs Blanks */}
          <div className="grid grid-cols-2 gap-3">
            <div className={`p-3 rounded-2xl border-2 flex items-center justify-between transition-all ${
              hits > 0
                ? 'bg-gradient-to-r from-red-950/80 to-amber-950/60 border-red-500/80 shadow-[0_0_15px_rgba(220,38,38,0.4)]'
                : 'bg-[#18110b] border-[#3d2e22] opacity-75'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-900/80 border border-red-400 flex items-center justify-center text-yellow-200">
                  <Swords size={18} />
                </div>
                <div>
                  <div className="text-[10px] text-amber-300/70 uppercase font-mono">Dano Total Causado</div>
                  <div className="text-base sm:text-lg font-black text-yellow-300 font-cinzel">
                    {hits} {hits === 1 ? 'Ponto de Dano' : 'Pontos de Dano'}
                  </div>
                </div>
              </div>
              <span className="text-xs font-black font-mono text-red-300 bg-red-950 px-2 py-1 rounded border border-red-500/60">
                {hits > 0 ? `-${hits} HP` : '0 HP'}
              </span>
            </div>

            <div className={`p-3 rounded-2xl border-2 flex items-center justify-between transition-all ${
              blanks > 0
                ? 'bg-gradient-to-r from-stone-900/90 to-neutral-900/80 border-stone-600 shadow-md'
                : 'bg-[#18110b] border-[#3d2e22] opacity-75'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-stone-800 border border-stone-500 flex items-center justify-center text-gray-300">
                  <Shield size={18} />
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 uppercase font-mono">Dados Nulos</div>
                  <div className="text-base sm:text-lg font-black text-gray-200 font-cinzel">
                    {blanks} {blanks === 1 ? 'Nulo' : 'Nulos'}
                  </div>
                </div>
              </div>
              <span className="text-xs font-black font-mono text-amber-300 bg-stone-950 px-2 py-1 rounded border border-stone-700">
                {targetDied ? 'Sem Reação' : reactionDamage > 0 ? `⚡ -${reactionDamage} HP` : '0 Reação'}
              </span>
            </div>
          </div>

          {/* Target Resolution Banner with Floating Damage Effect */}
          <div className={`p-3.5 sm:p-4 rounded-2xl border-2 flex flex-wrap items-center justify-between gap-3 transition-all ${
            targetDied
              ? 'bg-gradient-to-r from-emerald-950/80 to-[#102419] border-emerald-500 text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
              : 'bg-[#150d09] border-[#4a3625] text-amber-100'
          }`}>
            <div className="flex items-center gap-3">
              {targetDied ? (
                <div className="w-10 h-10 rounded-xl bg-emerald-900/80 border border-emerald-400 flex items-center justify-center text-emerald-300 shadow-lg">
                  <Skull size={22} className="animate-bounce" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-red-950/80 border border-red-500 flex items-center justify-center text-red-400 shadow-lg">
                  <Flame size={22} />
                </div>
              )}
              <div>
                <div className="font-black uppercase font-cinzel tracking-wider text-sm sm:text-base flex items-center gap-2">
                  <span>{targetDied ? `💥 ${targetName} FOI DERROTADO!` : `🎯 ${targetName} sofreu ${hits} de Dano.`}</span>
                  {!targetDied && hits > 0 && (
                    <span className="text-xs text-red-400 font-black font-mono animate-pulse">
                      (-{hits} HP)
                    </span>
                  )}
                </div>
                <div className="text-xs text-amber-200/70 font-mono mt-0.5">
                  {targetDied
                    ? 'O monstro/saqueador tombou em combate! Não haverá dano de reação.'
                    : 'O alvo sobreviveu ao ataque e revidou com dano de reação proporcional aos dados nulos!'}
                </div>
              </div>
            </div>

            {targetDied && treasureEarned > 0 && (
              <div className="btn-fantasy-gold px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-mono font-black shadow-lg">
                <Coins size={16} className="text-amber-950 animate-bounce" />
                <span className="text-amber-950">+{treasureEarned} TESOURO{treasureEarned > 1 ? 'S' : ''}</span>
              </div>
            )}
          </div>

          {/* Reaction Damage Resolution Banner */}
          {!targetDied && (
            <div className={`p-3.5 sm:p-4 rounded-2xl border-2 flex flex-wrap items-center justify-between gap-3 ${
              reactionDamage > 0
                ? 'bg-gradient-to-r from-red-950/80 to-[#2e090e] border-red-500 text-red-200 shadow-[0_0_20px_rgba(220,38,38,0.3)]'
                : 'bg-[#140e0a] border-[#3d2e22] text-amber-200/60'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-900/80 border border-rose-400 flex items-center justify-center text-rose-200 shadow-lg">
                  <ShieldAlert size={22} className="animate-pulse" />
                </div>
                <div>
                  <div className="font-black uppercase tracking-wider font-cinzel text-sm sm:text-base text-red-300 flex items-center gap-2">
                    <span>⚡ DANO DE REAÇÃO: {reactionDamage} MARCADOR(ES)</span>
                    {reactionDamage > 0 && (
                      <span className="text-xs text-red-400 font-black font-mono animate-pulse">
                        (-{reactionDamage} HP no atacante)
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-amber-200/70 font-mono mt-0.5">
                    Causado por {blanks} dado(s) nulo(s) da rolagem sobre o alvo sobrevivente.
                  </div>
                </div>
              </div>

              {attackerDied && (
                <span className="btn-fantasy-crimson text-xs text-white font-black px-3 py-1.5 rounded-xl border border-red-400 uppercase font-mono shadow-lg flex items-center gap-1.5">
                  <Skull size={15} /> ATACANTE TOMBOU
                </span>
              )}
            </div>
          )}
        </div>

        {/* Modal Controls */}
        <div className="flex flex-col sm:flex-row gap-3 relative z-10 pt-2">
          <button
            onClick={handleReplayRoll}
            className="flex-1 py-3 px-4 rounded-xl bg-[#1f1610] hover:bg-[#2b1f17] border border-[#4a3625] hover:border-yellow-500/60 text-amber-200 text-xs uppercase font-bold tracking-wider font-mono flex items-center justify-center gap-2 cursor-pointer transition active:scale-95"
          >
            <RotateCw size={15} className={isRolling ? 'animate-spin' : ''} />
            <span>Repetir Animação 3D</span>
          </button>

          <button
            onClick={closeDiceModal}
            className="flex-2 py-3.5 px-6 btn-fantasy-gold text-xs uppercase font-black tracking-widest rounded-xl shadow-xl cursor-pointer transition transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
          >
            <Zap size={16} />
            <span>
              {remainingDisplayTime !== null
                ? `Confirmar e Continuar (${remainingDisplayTime}s)`
                : 'Confirmar e Continuar a Batalha'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
