import React from 'react';
import { PowerUpType } from '../types/game';
import { EyeOff, Snowflake, Droplets, Hourglass, Zap } from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';

interface PowerUpBarProps {
  unlockedPowers: PowerUpType[];
  onTriggerPower: (type: PowerUpType) => void;
  disabled?: boolean;
}

export const POWER_UP_CONFIG: Record<
  PowerUpType,
  {
    name: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    bgGradient: string;
    badge: string;
  }
> = {
  screen_blur: {
    name: 'Screen Smoke',
    description: 'Blurs rival screen with thick fog for 3s',
    icon: <EyeOff className="w-4 h-4" />,
    color: '#a855f7',
    bgGradient: 'from-purple-600 to-indigo-600',
    badge: 'BLUR 3s',
  },
  letter_freeze: {
    name: 'Frost Freeze',
    description: 'Freezes rival input box with ice for 2s',
    icon: <Snowflake className="w-4 h-4" />,
    color: '#06b6d4',
    bgGradient: 'from-cyan-500 to-blue-600',
    badge: 'FREEZE 2s',
  },
  ink_splat: {
    name: 'Ink Splat',
    description: 'Blasts opaque ink splatters across rival screen',
    icon: <Droplets className="w-4 h-4" />,
    color: '#f43f5e',
    bgGradient: 'from-rose-600 to-pink-600',
    badge: 'INK ATTACK',
  },
  time_steal: {
    name: 'Chronos Steal',
    description: 'Subtracts 3 seconds from the timer',
    icon: <Hourglass className="w-4 h-4" />,
    color: '#eab308',
    bgGradient: 'from-amber-500 to-orange-600',
    badge: 'TIME STEAL',
  },
};

export const PowerUpBar: React.FC<PowerUpBarProps> = ({
  unlockedPowers,
  onTriggerPower,
  disabled = false,
}) => {
  if (unlockedPowers.length === 0) {
    return (
      <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-[#0f132a]/80 border border-slate-800 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Combat Power-Ups:</span>
        </div>
        <span className="text-slate-500 italic">Score 3-streak to unlock rival debuffs</span>
      </div>
    );
  }

  return (
    <div className="bg-[#121630] border border-amber-500/40 rounded-xl p-2.5 shadow-xl">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
          <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-pulse" />
          <span>POWER-UP UNLOCKED! (STREAK BONUS)</span>
        </div>
        <span className="text-[10px] text-amber-200/80 font-mono">Tap power to disrupt rival!</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {unlockedPowers.map((powerType, idx) => {
          const cfg = POWER_UP_CONFIG[powerType];
          return (
            <button
              key={`${powerType}-${idx}`}
              type="button"
              disabled={disabled}
              onClick={() => {
                soundEngine.playPowerUp();
                onTriggerPower(powerType);
              }}
              className={`flex items-center gap-2 p-2 rounded-lg bg-gradient-to-r ${cfg.bgGradient} text-white font-bold text-xs shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer border border-white/20`}
            >
              <div className="p-1 rounded bg-black/30 shrink-0">{cfg.icon}</div>
              <div className="text-left min-w-0">
                <span className="block truncate text-[11px] leading-tight">{cfg.name}</span>
                <span className="text-[9px] opacity-80 block">{cfg.badge}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
