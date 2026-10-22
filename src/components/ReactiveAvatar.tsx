import React from 'react';
import { AvatarMood } from '../types/game';
import { Flame, Sparkles, Zap } from 'lucide-react';

export interface AvatarDefinition {
  id: string;
  name: string;
  title: string;
  primaryColor: string;
  secondaryColor: string;
  renderSvg: (mood: AvatarMood) => React.ReactNode;
}

export const AVATARS_LIST: AvatarDefinition[] = [
  {
    id: 'warlock',
    name: 'Warlock',
    title: 'Tu mentor arcano',
    primaryColor: '#8b5cf6',
    secondaryColor: '#f59e0b',
    renderSvg: (mood) => (
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
        <defs>
          <radialGradient id="warlockGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#c084fc" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#6b21a8" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* Glow behind */}
        {(mood === 'fire' || mood === 'celebrate') && (
          <circle cx="50" cy="50" r="44" fill="url(#warlockGlow)" className="animate-pulse" />
        )}
        {/* Robe */}
        <path d="M 28 85 Q 50 72 72 85 L 68 96 L 32 96 Z" fill="#2e1065" stroke="#7c3aed" strokeWidth="2.5" />
        <path d="M 44 76 L 50 96 L 56 76 Z" fill="#fbbf24" />
        {/* Head */}
        <circle cx="50" cy="54" r="22" fill="#fed7aa" stroke="#fb923c" strokeWidth="2" />
        {/* Beard */}
        <path d="M 38 60 Q 50 82 62 60 Q 50 68 38 60 Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
        {/* Eyes according to mood */}
        {mood === 'wrong' ? (
          <>
            <circle cx="43" cy="50" r="4" fill="none" stroke="#ef4444" strokeWidth="2" />
            <path d="M 41 48 L 45 52 M 45 48 L 41 52" stroke="#ef4444" strokeWidth="2" />
            <circle cx="57" cy="50" r="4" fill="none" stroke="#ef4444" strokeWidth="2" />
            <path d="M 55 48 L 59 52 M 59 48 L 55 52" stroke="#ef4444" strokeWidth="2" />
            {/* Sweat drop */}
            <path d="M 68 42 C 68 40 73 34 73 38 C 73 42 68 42 68 42" fill="#38bdf8" />
          </>
        ) : mood === 'correct' || mood === 'celebrate' ? (
          <>
            {/* Joyful arched eyes */}
            <path d="M 40 52 Q 44 46 48 52" fill="none" stroke="#1e1b4b" strokeWidth="3" strokeLinecap="round" />
            <path d="M 52 52 Q 56 46 60 52" fill="none" stroke="#1e1b4b" strokeWidth="3" strokeLinecap="round" />
            <ellipse cx="50" cy="62" rx="4" ry="2" fill="#ef4444" />
          </>
        ) : mood === 'typing' ? (
          <>
            <circle cx="44" cy="50" r="3.5" fill="#06b6d4" />
            <circle cx="56" cy="50" r="3.5" fill="#06b6d4" />
            <circle cx="45" cy="49" r="1.2" fill="#ffffff" />
            <circle cx="57" cy="49" r="1.2" fill="#ffffff" />
          </>
        ) : (
          <>
            <circle cx="44" cy="50" r="3" fill="#1e1b4b" />
            <circle cx="56" cy="50" r="3" fill="#1e1b4b" />
            <circle cx="45" cy="49" r="1" fill="#ffffff" />
            <circle cx="57" cy="49" r="1" fill="#ffffff" />
          </>
        )}
        {/* Wizard Hat with Gold Buckle */}
        <path d="M 22 46 Q 50 36 78 46 L 72 40 Q 50 32 28 40 Z" fill="#4c1d95" stroke="#7c3aed" strokeWidth="2" />
        <path d="M 32 41 L 50 12 L 68 41 Q 50 34 32 41 Z" fill="#6d28d9" stroke="#9333ea" strokeWidth="2" />
        {/* Hat tip curved */}
        <path d="M 50 12 Q 54 8 62 10 Q 58 15 50 14 Z" fill="#581c87" />
        {/* Star on hat */}
        <polygon points="50,22 52,27 57,27 53,30 55,35 50,32 45,35 47,30 43,27 48,27" fill="#fbbf24" />
      </svg>
    ),
  },
  {
    id: 'ninja',
    name: 'Cyber Shinobi',
    title: 'Velocidad de rayo',
    primaryColor: '#06b6d4',
    secondaryColor: '#f43f5e',
    renderSvg: (mood) => (
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
        <circle cx="50" cy="50" r="38" fill="#0f172a" stroke="#06b6d4" strokeWidth="2.5" />
        {/* Mask */}
        <path d="M 24 50 Q 50 54 76 50 L 72 78 Q 50 88 28 78 Z" fill="#1e293b" stroke="#334155" strokeWidth="2" />
        {/* Headband */}
        <rect x="22" y="32" width="56" height="12" rx="3" fill="#e11d48" />
        <circle cx="50" cy="38" r="4" fill="#fbbf24" stroke="#ffffff" strokeWidth="1" />
        {/* Visor / Eyes */}
        {mood === 'wrong' ? (
          <path d="M 32 47 L 68 47" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" strokeDasharray="4 4" />
        ) : mood === 'fire' ? (
          <path d="M 30 47 L 70 47" stroke="#fbbf24" strokeWidth="5" strokeLinecap="round" className="animate-pulse" />
        ) : mood === 'typing' ? (
          <path d="M 32 47 L 68 47" stroke="#22d3ee" strokeWidth="4" strokeLinecap="round" />
        ) : (
          <path d="M 34 47 L 66 47" stroke="#06b6d4" strokeWidth="4" strokeLinecap="round" />
        )}
      </svg>
    ),
  },
  {
    id: 'polyglot',
    name: 'Robo-Polyglot',
    title: 'Cómputo sintáctico',
    primaryColor: '#10b981',
    secondaryColor: '#6366f1',
    renderSvg: (mood) => (
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
        {/* Antenna */}
        <line x1="50" y1="20" x2="50" y2="8" stroke="#10b981" strokeWidth="3" />
        <circle cx="50" cy="8" r="5" fill={mood === 'fire' ? '#fbbf24' : '#34d399'} className="animate-ping" />
        {/* Robot Head */}
        <rect x="22" y="20" width="56" height="52" rx="14" fill="#1e293b" stroke="#10b981" strokeWidth="3" />
        {/* Ears */}
        <rect x="15" y="38" width="7" height="16" rx="2" fill="#047857" />
        <rect x="78" y="38" width="7" height="16" rx="2" fill="#047857" />
        {/* Visor Screen */}
        <rect x="30" y="30" width="40" height="22" rx="6" fill="#022c22" stroke="#059669" strokeWidth="1.5" />
        {/* Digital eyes */}
        {mood === 'wrong' ? (
          <text x="36" y="46" fill="#ef4444" fontSize="14" fontWeight="bold">X _ X</text>
        ) : mood === 'correct' || mood === 'celebrate' ? (
          <text x="35" y="46" fill="#10b981" fontSize="14" fontWeight="bold">^ _ ^</text>
        ) : mood === 'typing' ? (
          <text x="35" y="46" fill="#38bdf8" fontSize="14" fontWeight="bold">&gt; _ &lt;</text>
        ) : (
          <text x="35" y="46" fill="#34d399" fontSize="14" fontWeight="bold">O _ O</text>
        )}
        {/* Speaker mouth */}
        <line x1="38" y1="62" x2="62" y2="62" stroke="#64748b" strokeWidth="3" strokeDasharray="3 3" />
      </svg>
    ),
  },
  {
    id: 'valkyrie',
    name: 'Neon Valkyrie',
    title: 'Furia celeste',
    primaryColor: '#ec4899',
    secondaryColor: '#38bdf8',
    renderSvg: (mood) => (
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
        {/* Wings */}
        <path d="M 18 36 Q 4 18 14 54 Q 22 42 26 44 Z" fill="#f43f5e" opacity="0.85" />
        <path d="M 82 36 Q 96 18 86 54 Q 78 42 74 44 Z" fill="#f43f5e" opacity="0.85" />
        {/* Head */}
        <circle cx="50" cy="52" r="23" fill="#fde047" stroke="#ca8a04" strokeWidth="2" />
        {/* Helmet / Crown */}
        <path d="M 28 42 L 50 20 L 72 42 L 64 36 L 50 28 L 36 36 Z" fill="#38bdf8" stroke="#0284c7" strokeWidth="2" />
        <circle cx="50" cy="28" r="4" fill="#f43f5e" />
        {/* Eyes */}
        {mood === 'wrong' ? (
          <>
            <line x1="40" y1="48" x2="48" y2="54" stroke="#e11d48" strokeWidth="2.5" />
            <line x1="48" y1="48" x2="40" y2="54" stroke="#e11d48" strokeWidth="2.5" />
            <line x1="52" y1="48" x2="60" y2="54" stroke="#e11d48" strokeWidth="2.5" />
            <line x1="60" y1="48" x2="52" y2="54" stroke="#e11d48" strokeWidth="2.5" />
          </>
        ) : (
          <>
            <ellipse cx="44" cy="50" rx="3" ry="4" fill="#0f172a" />
            <ellipse cx="56" cy="50" rx="3" ry="4" fill="#0f172a" />
            <circle cx="45" cy="49" r="1.2" fill="#ffffff" />
            <circle cx="57" cy="49" r="1.2" fill="#ffffff" />
          </>
        )}
        <path d="M 45 62 Q 50 66 55 62" fill="none" stroke="#e11d48" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
];

interface ReactiveAvatarProps {
  avatarId: string;
  mood: AvatarMood;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  streak?: number;
  showBadge?: boolean;
}

export const ReactiveAvatar: React.FC<ReactiveAvatarProps> = ({
  avatarId,
  mood,
  size = 'md',
  streak = 0,
  showBadge = true,
}) => {
  const avatar = AVATARS_LIST.find((a) => a.id === avatarId) || AVATARS_LIST[0];

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32',
  }[size];

  // Dynamic animation classes based on mood
  let moodClasses = 'transition-transform duration-200';
  if (mood === 'idle') {
    moodClasses += ' animate-bounce [animation-duration:3s]';
  } else if (mood === 'typing') {
    moodClasses += ' scale-105';
  } else if (mood === 'correct' || mood === 'celebrate') {
    moodClasses += ' scale-110 -translate-y-2';
  } else if (mood === 'wrong' || mood === 'hit') {
    moodClasses += ' shake-effect brightness-90';
  } else if (mood === 'fire') {
    moodClasses += ' scale-110 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]';
  }

  return (
    <div className="relative inline-block select-none">
      {/* On Fire Aura when 3+ streak */}
      {(streak >= 3 || mood === 'fire') && (
        <div className="absolute -top-3 -right-2 z-10 flex items-center gap-0.5 bg-gradient-to-r from-amber-500 to-rose-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-lg border border-amber-300 animate-pulse">
          <Flame className="w-3 h-3 fill-amber-300 text-amber-200" />
          <span>x{streak}</span>
        </div>
      )}

      {/* Typing sparks */}
      {mood === 'typing' && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 text-[9px] font-bold text-cyan-300 bg-cyan-950/90 px-1.5 py-0.5 rounded-md border border-cyan-500/50 animate-bounce">
          <Zap className="w-2.5 h-2.5 text-cyan-400 fill-cyan-400" />
          <span>Typing</span>
        </div>
      )}

      {/* Avatar circular frame */}
      <div
        className={`${sizeClasses} ${moodClasses} relative rounded-2xl p-1 bg-gradient-to-b from-[#1e2444] to-[#12162e] border-2 shadow-xl flex items-center justify-center overflow-hidden`}
        style={{
          borderColor:
            mood === 'wrong'
              ? '#ef4444'
              : mood === 'correct'
              ? '#10b981'
              : mood === 'fire'
              ? '#f59e0b'
              : avatar.primaryColor,
          boxShadow:
            mood === 'fire'
              ? '0 0 20px rgba(245, 158, 11, 0.5)'
              : mood === 'correct'
              ? '0 0 15px rgba(16, 185, 129, 0.4)'
              : '0 8px 20px rgba(0, 0, 0, 0.4)',
        }}
      >
        {avatar.renderSvg(mood)}
      </div>

      {showBadge && (
        <div className="text-center mt-1">
          <span className="text-[11px] font-semibold text-slate-300 block truncate max-w-[80px]">
            {avatar.name}
          </span>
        </div>
      )}
    </div>
  );
};
