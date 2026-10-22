import React, { useEffect } from 'react';
import { Zap, AlertOctagon, Flame } from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';

interface SuddenDeathModalProps {
  onContinue: () => void;
  p1Score: number;
  p2Score: number;
}

export const SuddenDeathModal: React.FC<SuddenDeathModalProps> = ({
  onContinue,
  p1Score,
  p2Score,
}) => {
  useEffect(() => {
    soundEngine.playSuddenDeathAlarm();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-lg p-4 animate-fade-in">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-[#240e1b] via-[#1a0f26] to-[#0c0d1c] border-2 border-rose-500 rounded-3xl p-6 sm:p-8 text-center shadow-[0_0_60px_rgba(244,63,94,0.5)] overflow-hidden">
        {/* Ambient fire glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-rose-600/30 rounded-full blur-3xl pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950/80 border border-rose-500/60 text-rose-300 text-xs font-black uppercase tracking-wider mb-4 animate-pulse">
          <AlertOctagon className="w-4 h-4" />
          <span>Tie Breaker Round</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-rose-500 to-red-500 drop-shadow-[0_0_30px_rgba(239,68,68,0.8)] mb-2">
          SUDDEN DEATH!
        </h2>

        <p className="text-slate-300 text-sm mb-6 max-w-md mx-auto">
          Scores are deadlocked at <span className="font-bold font-mono text-cyan-300">{p1Score}</span> vs{' '}
          <span className="font-bold font-mono text-rose-300">{p2Score}</span>.
          One final question with <strong className="text-amber-400 font-black">2X POINTS</strong>!
          Speed and accuracy decide the ultimate champion!
        </p>

        <div className="flex items-center justify-center gap-4 py-3 px-6 bg-black/40 rounded-2xl border border-rose-500/30 mb-6">
          <div className="flex items-center gap-1.5 text-amber-400 font-black text-sm">
            <Flame className="w-4 h-4 fill-amber-400 animate-bounce" />
            <span>200 Base Points</span>
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
          <div className="flex items-center gap-1.5 text-rose-400 font-black text-sm">
            <Zap className="w-4 h-4" />
            <span>Extreme 10s Timer</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onContinue}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-black text-base uppercase tracking-wider shadow-xl shadow-rose-900/50 transition-transform active:scale-95 cursor-pointer border border-amber-400/40"
        >
          ENTER THE DUEL!
        </button>
      </div>
    </div>
  );
};
