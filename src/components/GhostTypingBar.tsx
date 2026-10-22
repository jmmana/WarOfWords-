import React from 'react';
import { Zap, AlertTriangle } from 'lucide-react';

interface GhostTypingBarProps {
  rivalName: string;
  charCount: number;
  isRivalTyping: boolean;
  isPenaltyActive?: boolean;
}

export const GhostTypingBar: React.FC<GhostTypingBarProps> = ({
  rivalName,
  charCount,
  isRivalTyping,
  isPenaltyActive = false,
}) => {
  const maxSlots = 16;
  const filledSlots = Math.min(maxSlots, charCount);

  return (
    <div className="w-full bg-[#12162f]/90 border border-purple-500/30 rounded-xl px-4 py-2 shadow-lg backdrop-blur-sm">
      <div className="flex items-center justify-between mb-1.5 text-xs">
        <div className="flex items-center gap-1.5">
          <Zap
            className={`w-3.5 h-3.5 ${
              isRivalTyping
                ? 'text-pink-400 fill-pink-400 animate-bounce'
                : 'text-slate-500'
            }`}
          />
          <span className="font-bold tracking-wider text-pink-300 uppercase text-[11px]">
            {rivalName} {isPenaltyActive ? '⚠️ LOCKED (PENALTY)' : 'PRESSURE GAUGE'}
          </span>
        </div>

        <div className="text-[11px] font-mono text-slate-400">
          {isPenaltyActive ? (
            <span className="text-rose-400 font-bold flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> 2s Cooldown
            </span>
          ) : charCount > 0 ? (
            <span className="text-pink-300 font-semibold animate-pulse">
              {charCount} {charCount === 1 ? 'letter' : 'letters'} typed...
            </span>
          ) : (
            <span className="text-slate-500">Thinking...</span>
          )}
        </div>
      </div>

      {/* Cyber Rune Slots for Ghost Typing */}
      <div className="flex items-center gap-1 sm:gap-1.5 w-full">
        {Array.from({ length: maxSlots }).map((_, idx) => {
          const isFilled = idx < filledSlots;
          const isLastActive = idx === filledSlots - 1;

          return (
            <div
              key={idx}
              className={`flex-1 h-3 rounded-sm transition-all duration-150 relative overflow-hidden ${
                isFilled
                  ? 'bg-gradient-to-t from-pink-600 via-rose-500 to-amber-300 shadow-[0_0_8px_rgba(244,63,94,0.7)] scale-y-110'
                  : 'bg-[#1b2144] border border-slate-700/40'
              }`}
            >
              {isLastActive && isRivalTyping && (
                <div className="absolute inset-0 bg-white/70 animate-ping" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
