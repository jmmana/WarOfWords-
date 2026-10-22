import React, { useState } from 'react';
import { CEFRLevel } from '../types/game';
import { CEFR_METADATA } from '../data/questions';
import { AVATARS_LIST, ReactiveAvatar } from './ReactiveAvatar';
import {
  Swords,
  Bot,
  Users,
  Copy,
  Check,
  Sparkles,
  Zap,
  Volume2,
  ShieldAlert,
  Flame,
  ArrowRight,
} from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';

interface LobbyViewProps {
  onStartBotMatch: (level: CEFRLevel, rounds: number, avatarId: string, playerName: string) => void;
  onCreateRoom: (level: CEFRLevel, rounds: number, avatarId: string, playerName: string) => void;
  onJoinRoom: (roomId: string, avatarId: string, playerName: string) => void;
  initialRoomCode?: string;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  onStartBotMatch,
  onCreateRoom,
  onJoinRoom,
  initialRoomCode = '',
}) => {
  const [selectedLevel, setSelectedLevel] = useState<CEFRLevel>('B1');
  const [selectedRounds, setSelectedRounds] = useState<number>(5);
  const [selectedAvatarId, setSelectedAvatarId] = useState<string>('warlock');
  const [playerName, setPlayerName] = useState<string>('Gladiator');
  const [roomCodeInput, setRoomCodeInput] = useState<string>(initialRoomCode);
  const [activeTab, setActiveTab] = useState<'create' | 'join' | 'bot'>('create');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const levels: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  const handleStartGame = () => {
    soundEngine.playFightSound();
    if (activeTab === 'bot') {
      onStartBotMatch(selectedLevel, selectedRounds, selectedAvatarId, playerName || 'Player');
    } else if (activeTab === 'create') {
      onCreateRoom(selectedLevel, selectedRounds, selectedAvatarId, playerName || 'Player');
    } else {
      if (roomCodeInput.trim()) {
        onJoinRoom(roomCodeInput.trim().toUpperCase(), selectedAvatarId, playerName || 'Player');
      }
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 sm:py-10">
      {/* Brand Header inspired by Aquelíngua reference */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 pb-6 border-b border-indigo-950/80">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-0.5 shadow-xl shadow-indigo-600/30 flex items-center justify-center">
            <div className="w-full h-full bg-[#0d1024] rounded-2xl flex items-center justify-center">
              <span className="text-2xl font-black bg-gradient-to-r from-cyan-400 to-indigo-300 bg-clip-text text-transparent">
                a
              </span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                aquelíngua
              </h1>
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded-full border border-indigo-800">
                CLASH 1v1
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Juego de combate de inglés en tiempo real estilo Street Fighter + Duolingo
            </p>
          </div>
        </div>

        {/* Quick features banner */}
        <div className="flex items-center gap-3 bg-[#131733] px-3.5 py-1.5 rounded-2xl border border-indigo-500/20 text-xs">
          <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
            <Zap className="w-3.5 h-3.5" />
            <span>Ghost Typing</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-slate-700" />
          <div className="flex items-center gap-1.5 text-pink-400 font-bold">
            <Flame className="w-3.5 h-3.5" />
            <span>Power-Ups</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-slate-700" />
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <Volume2 className="w-3.5 h-3.5" />
            <span>US/UK/AU</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Player Customization & Level Selection */}
        <div className="lg:col-span-7 space-y-6">
          {/* Player Profile & Avatar Selector */}
          <div className="bg-[#131733]/90 border border-indigo-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl backdrop-blur-md">
            <h2 className="text-sm font-bold text-indigo-300 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              1. Tu Gladiador & Avatar
            </h2>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nombre de Jugador
              </label>
              <input
                type="text"
                value={playerName}
                maxLength={18}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Ingresa tu apodo..."
                className="w-full bg-[#0a0d1f] border border-slate-700 focus:border-cyan-400 rounded-xl px-4 py-2.5 text-sm text-white font-semibold outline-none transition-colors shadow-inner"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Selecciona tu Avatar Reactivo
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {AVATARS_LIST.map((avatar) => {
                  const isSelected = selectedAvatarId === avatar.id;
                  return (
                    <button
                      key={avatar.id}
                      type="button"
                      onClick={() => {
                        setSelectedAvatarId(avatar.id);
                        soundEngine.playKeystroke();
                      }}
                      className={`p-3 rounded-2xl flex flex-col items-center text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-b from-indigo-900/60 to-purple-900/40 border-2 border-cyan-400 shadow-lg shadow-cyan-500/20 scale-105'
                          : 'bg-[#0b0e22] border border-slate-800/80 hover:border-slate-700 opacity-80 hover:opacity-100'
                      }`}
                    >
                      <ReactiveAvatar
                        avatarId={avatar.id}
                        mood={isSelected ? 'fire' : 'idle'}
                        size="md"
                        showBadge={false}
                      />
                      <span className="text-xs font-bold text-white mt-2 block truncate">
                        {avatar.name}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate">
                        {avatar.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* CEFR Level Selector (A1 - C2) */}
          <div className="bg-[#131733]/90 border border-indigo-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                2. Nivel de Dificultad CEFR
              </h2>
              <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950/80 px-2.5 py-0.5 rounded-full border border-cyan-500/30">
                {CEFR_METADATA[selectedLevel].badge}
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Las preguntas visuales y de audio se calibran según el nivel lingüístico seleccionado:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {levels.map((lvl) => {
                const meta = CEFR_METADATA[lvl];
                const isSelected = selectedLevel === lvl;
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => {
                      setSelectedLevel(lvl);
                      soundEngine.playKeystroke();
                    }}
                    className={`p-3 rounded-2xl text-left transition-all border cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-br from-indigo-950/90 to-purple-950/80 border-cyan-400 shadow-md shadow-indigo-500/20 scale-[1.02]'
                        : 'bg-[#0b0e22] border-slate-800/80 hover:border-slate-700 opacity-85 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-base font-black text-white">{lvl}</span>
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: meta.color }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-200 block truncate">
                      {meta.title.split('·')[1]?.trim() || meta.title}
                    </span>
                    <span className="text-[10px] text-slate-400 block line-clamp-1 mt-0.5">
                      {meta.subtitle}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Rounds Selector */}
            <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">
                Rondas por partida:
              </span>
              <div className="flex items-center gap-1.5 bg-[#0a0d20] p-1 rounded-xl border border-slate-800">
                {[3, 5, 7].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setSelectedRounds(num)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      selectedRounds === num
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {num} Rondas
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Game Modes & Matchmaking */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#131733]/90 border border-indigo-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl backdrop-blur-md">
            <h2 className="text-sm font-bold text-indigo-300 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Swords className="w-4 h-4 text-pink-400" />
              3. Modo de Juego
            </h2>

            {/* Mode selection tabs */}
            <div className="grid grid-cols-3 gap-1.5 bg-[#090c1f] p-1 rounded-2xl border border-slate-800 mb-6">
              <button
                type="button"
                onClick={() => setActiveTab('create')}
                className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'create'
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Crear Sala 1v1
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('join')}
                className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'join'
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Unirme a Sala
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('bot')}
                className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'bot'
                    ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                vs Rival AI
              </button>
            </div>

            {/* Mode Description & Inputs */}
            {activeTab === 'create' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-[#0b0e22] border border-indigo-500/20 text-xs text-slate-300">
                  <div className="flex items-center gap-2 text-cyan-300 font-bold mb-1">
                    <Users className="w-4 h-4" />
                    <span>Duelo 1v1 en Tiempo Real</span>
                  </div>
                  <p>
                    Se generará un código de sala y link directo para compartir con tu amigo o rival.
                    Sincronización instantánea de respuestas y barra de presión en vivo.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'join' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Código de Sala (ej. CLASH-482)
                  </label>
                  <input
                    type="text"
                    value={roomCodeInput}
                    onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                    placeholder="Escribe el código..."
                    className="w-full bg-[#0a0d1f] border border-slate-700 focus:border-cyan-400 rounded-xl px-4 py-2.5 text-sm text-white font-mono font-bold tracking-wider outline-none transition-colors uppercase shadow-inner"
                  />
                </div>
              </div>
            )}

            {activeTab === 'bot' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-gradient-to-r from-pink-950/40 to-purple-950/40 border border-pink-500/30 text-xs text-slate-300">
                  <div className="flex items-center gap-2 text-pink-300 font-bold mb-1">
                    <Bot className="w-4 h-4" />
                    <span>Duelo Instantáneo vs Bot IA</span>
                  </div>
                  <p>
                    Juega de inmediato sin esperar a nadie. El bot simula mecanografía humana,
                    comete fallos realistas y lanza poderes competitivos según tu nivel.
                  </p>
                </div>
              </div>
            )}

            {/* Primary Action Button */}
            <button
              type="button"
              onClick={handleStartGame}
              className="mt-6 w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-pink-500 hover:from-cyan-400 hover:to-pink-400 text-white font-black text-base uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/40 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer border border-white/20"
            >
              <Swords className="w-5 h-5" />
              <span>
                {activeTab === 'create'
                  ? 'CREAR SALA & PELEAR'
                  : activeTab === 'join'
                  ? 'INGRESAR A LA ARENA'
                  : 'INICIAR DUELO VS BOT'}
              </span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Combat Rules / Street Fighter Mechanics Summary */}
          <div className="bg-[#0f132b]/80 border border-slate-800 rounded-2xl p-4 text-xs space-y-2.5 text-slate-300">
            <div className="flex items-center gap-1.5 font-bold text-amber-300">
              <ShieldAlert className="w-4 h-4" />
              <span>Reglas de Combate English Clash:</span>
            </div>
            <ul className="space-y-1.5 text-[11px] text-slate-400">
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-400 font-bold">+100 pts:</span>
                <span>Al primero en acertar la palabra o transcripción (+ bonos por tiempo).</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-rose-400 font-bold">-50 pts & 2s lock:</span>
                <span>Por respuesta incorrecta, con Screen Shake y destello rojo.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-pink-400 font-bold">Racha x3:</span>
                <span>Desbloquea Screen Smoke, Frost Freeze o Ink Splat contra el rival.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-amber-400 font-bold">Empate:</span>
                <span>Activa ronda de Correction Sudden Death a 2x puntos.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
