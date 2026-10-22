import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { PowerUpType } from '../types/game';
import { Snowflake, EyeOff, Droplets, Sparkles } from 'lucide-react';

interface ScreenEffectsProps {
  isShaking: boolean;
  flashType: 'none' | 'red' | 'green';
  activeDebuffs: { type: PowerUpType; expiresAt: number }[];
  onWipeDebuff?: (type: PowerUpType) => void;
}

export function fireNeonConfetti() {
  const count = 180;
  const defaults = {
    origin: { y: 0.65 },
    zIndex: 9999,
  };

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
      colors: ['#06b6d4', '#10b981', '#ec4899', '#f59e0b', '#8b5cf6', '#3b82f6'],
    });
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
  });
  fire(0.2, {
    spread: 60,
  });
  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 45,
  });
}

export const ScreenEffects: React.FC<ScreenEffectsProps> = ({
  flashType,
  activeDebuffs,
  onWipeDebuff,
}) => {
  const now = Date.now();
  const currentDebuffs = activeDebuffs.filter((d) => d.expiresAt > now);

  const hasBlur = currentDebuffs.some((d) => d.type === 'screen_blur');
  const hasFreeze = currentDebuffs.some((d) => d.type === 'letter_freeze');
  const hasInk = currentDebuffs.some((d) => d.type === 'ink_splat');

  return (
    <>
      {/* Screen flash: Red on -50 Penalty, Green on Correct */}
      {flashType === 'red' && (
        <div className="fixed inset-0 pointer-events-none z-50 flash-red-effect border-8 border-rose-600/80" />
      )}
      {flashType === 'green' && (
        <div className="fixed inset-0 pointer-events-none z-50 flash-green-effect border-8 border-emerald-500/80" />
      )}

      {/* Screen Blur Fog Debuff */}
      {hasBlur && (
        <div className="fixed inset-0 z-40 backdrop-blur-md bg-purple-950/40 flex flex-col items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#181232]/95 border-2 border-purple-500 rounded-2xl p-6 text-center max-w-sm shadow-2xl">
            <EyeOff className="w-12 h-12 text-purple-400 mx-auto mb-3 animate-pulse" />
            <h3 className="text-xl font-black text-purple-200 uppercase tracking-wider mb-1">
              Screen Smoke Attack!
            </h3>
            <p className="text-xs text-purple-300 mb-4">
              The rival hit you with thick fog. Clearing in a moment...
            </p>
            {onWipeDebuff && (
              <button
                type="button"
                onClick={() => onWipeDebuff('screen_blur')}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer"
              >
                Wipe Screen (Clear Fog)
              </button>
            )}
          </div>
        </div>
      )}

      {/* Frost Freeze Debuff */}
      {hasFreeze && (
        <div className="fixed inset-0 pointer-events-none z-40 border-8 border-cyan-400/80 shadow-[inset_0_0_80px_rgba(6,182,212,0.6)] flex items-center justify-center">
          <div className="bg-[#0c1f38]/90 border border-cyan-400 px-5 py-2.5 rounded-full flex items-center gap-2 text-cyan-200 font-black text-sm shadow-xl animate-pulse">
            <Snowflake className="w-5 h-5 text-cyan-300 animate-spin" />
            <span>FROST FREEZE! (INPUT LOCKED 2s)</span>
          </div>
        </div>
      )}

      {/* Ink Splatter Debuff */}
      {hasInk && (
        <div className="fixed inset-0 z-40 pointer-events-none flex items-center justify-center overflow-hidden">
          {/* Cartoon ink splats */}
          <div className="absolute top-1/4 left-1/4 w-52 h-52 bg-slate-950/90 rounded-full blur-sm transform -rotate-12 border-4 border-rose-500/30" />
          <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-slate-950/95 rounded-full blur-sm transform rotate-45 border-4 border-rose-500/30" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 px-4 py-2 rounded-xl text-rose-400 text-xs font-black border border-rose-500">
            <Droplets className="w-4 h-4 inline mr-1" />
            INK SPLAT DISRUPTION!
          </div>
        </div>
      )}
    </>
  );
};
