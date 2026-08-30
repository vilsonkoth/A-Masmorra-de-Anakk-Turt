import React from 'react';
import { Sparkles } from 'lucide-react';

export const LivingDungeonAtmosphere: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 select-none">
      {/* 1. Left Wall Torch Light Flicker Halo */}
      <div
        className="absolute w-72 h-72 rounded-full bg-radial from-amber-500/25 via-orange-600/10 to-transparent blur-2xl animate-dungeon-torch-spot"
        style={{ left: '23%', top: '32%', transform: 'translate(-50%, -50%)' }}
      />
      {/* Small Torch Sparkles Left */}
      <div
        className="absolute w-12 h-12 flex items-center justify-center animate-flame-outer"
        style={{ left: '26.5%', top: '38%' }}
      >
        <div className="w-2 h-2 rounded-full bg-yellow-200 blur-xs animate-ember-1" />
      </div>

      {/* 2. Right Pillar Torch Light Flicker Halo */}
      <div
        className="absolute w-80 h-80 rounded-full bg-radial from-amber-500/30 via-orange-600/15 to-transparent blur-2xl animate-dungeon-torch-spot"
        style={{ right: '22%', top: '30%', transform: 'translate(50%, -50%)', animationDelay: '0.7s' }}
      />
      {/* Small Torch Sparkles Right */}
      <div
        className="absolute w-12 h-12 flex items-center justify-center animate-flame-middle"
        style={{ right: '25.2%', top: '36%' }}
      >
        <div className="w-2 h-2 rounded-full bg-amber-100 blur-xs animate-ember-2" />
      </div>

      {/* 3. Golden Treasure Shimmer Effects (Bottom-Right Treasure Mound) */}
      <div
        className="absolute w-96 h-56 rounded-full bg-radial from-yellow-400/15 via-amber-500/5 to-transparent blur-xl pointer-events-none"
        style={{ right: '12%', bottom: '8%' }}
      />
      {/* Sparkles on Gold Coins Bottom Right */}
      <div
        className="absolute animate-gold-sparkle text-yellow-300"
        style={{ right: '24%', bottom: '22%', animationDelay: '0.2s' }}
      >
        <Sparkles size={16} className="drop-shadow-[0_0_8px_rgba(253,224,71,0.9)]" />
      </div>
      <div
        className="absolute animate-gold-sparkle text-amber-200"
        style={{ right: '18%', bottom: '16%', animationDelay: '1.1s' }}
      >
        <Sparkles size={20} className="drop-shadow-[0_0_10px_rgba(253,224,71,0.9)]" />
      </div>
      <div
        className="absolute animate-gold-sparkle text-yellow-400"
        style={{ right: '28%', bottom: '12%', animationDelay: '1.8s' }}
      >
        <Sparkles size={14} className="drop-shadow-[0_0_6px_rgba(253,224,71,0.9)]" />
      </div>
      <div
        className="absolute animate-gold-sparkle text-amber-100"
        style={{ right: '15%', bottom: '28%', animationDelay: '0.9s' }}
      >
        <Sparkles size={12} className="drop-shadow-[0_0_8px_rgba(253,224,71,0.9)]" />
      </div>

      {/* 4. Upper Alcove Gold Vault Shimmer (Top Right Crypt Vault) */}
      <div
        className="absolute animate-gold-sparkle text-yellow-300"
        style={{ right: '37%', top: '22%', animationDelay: '1.4s' }}
      >
        <Sparkles size={14} className="drop-shadow-[0_0_6px_rgba(253,224,71,0.8)]" />
      </div>

      {/* 5. Ambient Vignette and Vignette Contrast */}
      <div className="absolute inset-0 bg-radial from-transparent via-black/35 to-black/85 pointer-events-none" />
    </div>
  );
};
