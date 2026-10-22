import React, { useEffect } from 'react';
import { Player } from '../types/game';
import { ReactiveAvatar } from './ReactiveAvatar';
import { Trophy, Flame, CheckCircle, XCircle, RotateCcw, Home, Award } from 'lucide-react';
import { fireNeonConfetti } from './ScreenEffects';
import { soundEngine } from '../utils/soundEngine';

interface GameSummaryModalProps {
  player1: Player;
  player2: Player | null;
  onRematch: () => void;
  onReturnToLobby: () => void;
}

export const GameSummaryModal: React.FC<GameSummaryModalProps> = ({
  player1,
  player2,
  onRematch,
  onReturnToLobby,
}) => {
  const p1Won = !player2 || player1.score > player2.score;
  const isDraw = player2 && player1.score === player2.score;
  const winner = p1Won ? player1 : player2;

  useEffect(() => {
    if (p1Won) {
      fireNeonConfetti();
      soundEngine.playCorrectSound();
    } else {
      soundEngine.playFightSound();
    }
  }, [p1Won]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-xl bg-gradient-to-b from-[#181d3d] via-[#12162e] to-[#0a0d1e] border-2 border-indigo-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl text-center">
        {/* Victory Header */}
        <div className="flex justify-center mb-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 p-0.5 shadow-xl shadow-amber-500/30">
            <div className="w-full h-full bg-[#0d1024] rounded-2xl flex items-center justify-center">
              <Trophy className="w-8 h-8 text-amber-400 fill-amber-400 animate-bounce" />
            </div>
          </div>
        </div>

        <h2 className="text-3xl sm:text-4xl font-black italic tracking-tight text-white mb-1">
          {isDraw ? 'EPIC DRAW!' : p1Won ? 'VICTORY ROYALE!' : 'DEFEAT'}
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm mb-6">
          {isDraw
            ? 'Both gladiators fought with equal skill!'
            : p1Won
            ? 'Outstanding reflexes and vocabulary mastery!'
            : `${winner?.name || 'Rival'} conquered the English Clash Arena.`}
        </p>

        {/* Players Comparison Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Player 1 Card */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              p1Won && !isDraw
                ? 'bg-cyan-950/40 border-cyan-400/60 shadow-lg shadow-cyan-500/20'
                : 'bg-[#151936] border-slate-800'
            }`}
          >
            <div className="flex justify-center mb-2">
              <ReactiveAvatar
                avatarId={player1.avatarId}
                mood={p1Won ? 'celebrate' : 'idle'}
                size="md"
                showBadge={false}
              />
            </div>
            <span className="text-xs font-bold text-cyan-300 block truncate">{player1.name} (YOU)</span>
            <span className="text-2xl font-black font-mono text-white block my-1">{player1.score} <span className="text-xs text-slate-400">pts</span></span>

            <div className="text-[11px] space-y-1 mt-2 text-slate-300 text-left border-t border-slate-800 pt-2">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1 text-emerald-400"><CheckCircle className="w-3 h-3" /> Correct:</span>
                <span className="font-bold">{player1.correctAnswersCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1 text-rose-400"><XCircle className="w-3 h-3" /> Penalties:</span>
                <span className="font-bold">{player1.wrongAnswersCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1 text-amber-400"><Flame className="w-3 h-3" /> Max Streak:</span>
                <span className="font-bold">{player1.highestStreak}</span>
              </div>
            </div>
          </div>

          {/* Player 2 Card */}
          {player2 ? (
            <div
              className={`p-4 rounded-2xl border transition-all ${
                !p1Won && !isDraw
                  ? 'bg-rose-950/40 border-rose-400/60 shadow-lg shadow-rose-500/20'
                  : 'bg-[#151936] border-slate-800'
              }`}
            >
              <div className="flex justify-center mb-2">
                <ReactiveAvatar
                  avatarId={player2.avatarId}
                  mood={!p1Won ? 'celebrate' : 'idle'}
                  size="md"
                  showBadge={false}
                />
              </div>
              <span className="text-xs font-bold text-rose-300 block truncate">{player2.name}</span>
              <span className="text-2xl font-black font-mono text-white block my-1">{player2.score} <span className="text-xs text-slate-400">pts</span></span>

              <div className="text-[11px] space-y-1 mt-2 text-slate-300 text-left border-t border-slate-800 pt-2">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1 text-emerald-400"><CheckCircle className="w-3 h-3" /> Correct:</span>
                  <span className="font-bold">{player2.correctAnswersCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1 text-rose-400"><XCircle className="w-3 h-3" /> Penalties:</span>
                  <span className="font-bold">{player2.wrongAnswersCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1 text-amber-400"><Flame className="w-3 h-3" /> Max Streak:</span>
                  <span className="font-bold">{player2.highestStreak}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl border border-dashed border-slate-800 flex items-center justify-center text-slate-500 text-xs">
              Solo practice round
            </div>
          )}
        </div>

        {/* XP & Rewards */}
        <div className="bg-[#11142b] p-3 rounded-2xl border border-indigo-500/30 flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <div className="text-left">
              <span className="text-xs font-bold text-white block">Aquelíngua Mastery XP</span>
              <span className="text-[10px] text-slate-400">Fluency points added to your CEFR journey</span>
            </div>
          </div>
          <span className="text-base font-black text-amber-400 font-mono">+{Math.max(50, player1.score * 2)} XP</span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={onRematch}
            className="w-full sm:flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 active:scale-95 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Rematch / Play Again</span>
          </button>

          <button
            type="button"
            onClick={onReturnToLobby}
            className="w-full sm:w-auto py-3.5 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-sm flex items-center justify-center gap-2 border border-slate-700 active:scale-95 transition-all cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Lobby</span>
          </button>
        </div>
      </div>
    </div>
  );
};
