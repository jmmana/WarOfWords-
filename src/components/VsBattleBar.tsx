import React from 'react';
import { Player } from '../types/game';
import { ReactiveAvatar } from './ReactiveAvatar';
import { Flame, Swords, Volume2, VolumeX, Music, Clock } from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';

interface VsBattleBarProps {
  player1: Player;
  player2: Player | null;
  currentRound: number;
  totalRounds: number;
  timeLeft: number;
  isSuddenDeath: boolean;
  onToggleSound?: () => void;
  onToggleMusic?: () => void;
  isSoundMuted?: boolean;
  isMusicActive?: boolean;
}

export const VsBattleBar: React.FC<VsBattleBarProps> = ({
  player1,
  player2,
  currentRound,
  totalRounds,
  timeLeft,
  isSuddenDeath,
  onToggleSound,
  onToggleMusic,
  isSoundMuted = false,
  isMusicActive = false,
}) => {
  // Score Tug-of-war calculation
  const s1 = Math.max(0, player1.score);
  const s2 = player2 ? Math.max(0, player2.score) : 0;
  const scoreDiff = s1 - s2;

  let p1Percentage = 50;
  if (s1 + s2 > 0) {
    p1Percentage = Math.round((s1 / (s1 + s2)) * 100);
    p1Percentage = Math.min(85, Math.max(15, p1Percentage)); // Prevent total collapse for aesthetic balance
  }

  const p2Percentage = 100 - p1Percentage;

  return (
    <header className="w-full bg-[#0d1124]/95 border-b border-indigo-950/80 px-3 py-2.5 shadow-2xl backdrop-blur-xl relative z-20">
      <div className="max-w-6xl mx-auto">
        {/* Top small meta strip */}
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-1 px-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 font-bold tracking-wider text-cyan-400 uppercase">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              {player1.name} (YOU)
            </span>
            {player1.streak >= 2 && (
              <span className="flex items-center gap-0.5 text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/40 text-[10px]">
                <Flame className="w-2.5 h-2.5 fill-amber-400" />
                Streak {player1.streak}
              </span>
            )}
          </div>

          {/* Sound & Music Controls in top bar */}
          <div className="flex items-center gap-2">
            {onToggleMusic && (
              <button
                type="button"
                onClick={onToggleMusic}
                title={isMusicActive ? 'Mute Synthwave BGM' : 'Play Synthwave BGM'}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                  isMusicActive
                    ? 'bg-indigo-600/40 text-indigo-300 border border-indigo-500/50 shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Music className="w-2.5 h-2.5" />
                <span>BGM</span>
              </button>
            )}

            {onToggleSound && (
              <button
                type="button"
                onClick={onToggleSound}
                title={isSoundMuted ? 'Unmute SFX' : 'Mute SFX'}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                {isSoundMuted ? <VolumeX className="w-3 h-3 text-rose-400" /> : <Volume2 className="w-3 h-3 text-cyan-400" />}
              </button>
            )}

            <div className="bg-[#171c38] px-2.5 py-0.5 rounded-full border border-indigo-500/30 text-indigo-200 font-bold">
              {isSuddenDeath ? (
                <span className="text-amber-400 animate-pulse">⚡ SUDDEN DEATH</span>
              ) : (
                <span>ROUND {currentRound} / {totalRounds}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {player2 && player2.streak >= 2 && (
              <span className="flex items-center gap-0.5 text-rose-400 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-500/40 text-[10px]">
                <Flame className="w-2.5 h-2.5 fill-rose-400" />
                Streak {player2.streak}
              </span>
            )}
            <span className="flex items-center gap-1 font-bold tracking-wider text-rose-400 uppercase">
              {player2 ? player2.name : 'WAITING RIVAL...'}
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
            </span>
          </div>
        </div>

        {/* Central Street Fighter Battle Health Bar & VS Crest */}
        <div className="relative flex items-center justify-between gap-3">
          {/* Player 1 Left Card & Score */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <ReactiveAvatar
              avatarId={player1.avatarId}
              mood={player1.avatarState}
              size="sm"
              streak={player1.streak}
              showBadge={false}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-xl sm:text-2xl font-black text-cyan-300 tracking-tight font-mono">
                  {player1.score}
                  <span className="text-xs font-normal text-cyan-500 ml-1">pts</span>
                </span>
                {scoreDiff > 0 && (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/70 px-1.5 rounded border border-emerald-500/30">
                    +{scoreDiff}
                  </span>
                )}
              </div>
              {/* Tug-of-war Bar P1 */}
              <div className="h-3.5 w-full bg-[#161a33] rounded-l-full overflow-hidden p-0.5 border border-cyan-500/30 relative">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 rounded-l-full transition-all duration-500 shadow-[0_0_12px_rgba(6,182,212,0.6)]"
                  style={{ width: `${p1Percentage}%`, marginLeft: 'auto' }}
                />
              </div>
            </div>
          </div>

          {/* Center VS Crest & Timer */}
          <div className="relative flex flex-col items-center justify-center shrink-0 px-2">
            <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-700 via-purple-700 to-rose-700 p-0.5 shadow-xl shadow-purple-900/40 border border-purple-400/50 -rotate-3 hover:rotate-0 transition-transform">
              <div className="w-full h-full bg-[#0f132a] rounded-xl flex items-center justify-center">
                <span className="text-base font-black italic tracking-tighter bg-gradient-to-r from-amber-300 via-rose-300 to-cyan-300 bg-clip-text text-transparent">
                  VS
                </span>
              </div>
            </div>

            {/* Floating Timer Badge */}
            <div
              className={`mt-1 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-black shadow-md border font-mono ${
                timeLeft <= 5
                  ? 'bg-rose-950 text-rose-300 border-rose-500 animate-bounce'
                  : timeLeft <= 10
                  ? 'bg-amber-950 text-amber-300 border-amber-500'
                  : 'bg-[#181d3d] text-indigo-200 border-indigo-500/40'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>{timeLeft}s</span>
            </div>
          </div>

          {/* Player 2 Right Card & Score */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0 flex-row-reverse">
            {player2 ? (
              <ReactiveAvatar
                avatarId={player2.avatarId}
                mood={player2.avatarState}
                size="sm"
                streak={player2.streak}
                showBadge={false}
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl border-2 border-dashed border-slate-700 flex items-center justify-center text-slate-500 text-xs">
                ?
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between mb-1 flex-row-reverse">
                <span className="text-xl sm:text-2xl font-black text-rose-300 tracking-tight font-mono">
                  {player2 ? player2.score : 0}
                  <span className="text-xs font-normal text-rose-500 ml-1">pts</span>
                </span>
                {scoreDiff < 0 && (
                  <span className="text-[10px] font-bold text-rose-400 bg-rose-950/70 px-1.5 rounded border border-rose-500/30">
                    +{Math.abs(scoreDiff)}
                  </span>
                )}
              </div>
              {/* Tug-of-war Bar P2 */}
              <div className="h-3.5 w-full bg-[#161a33] rounded-r-full overflow-hidden p-0.5 border border-rose-500/30 relative">
                <div
                  className="h-full bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500 rounded-r-full transition-all duration-500 shadow-[0_0_12px_rgba(244,63,94,0.6)]"
                  style={{ width: `${p2Percentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
