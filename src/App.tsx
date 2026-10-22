import React, { useState, useEffect, useRef } from 'react';
import {
  CEFRLevel,
  ChallengeQuestion,
  Player,
  PowerUpType,
  RoomState,
} from './types/game';
import { CEFR_METADATA, QUESTION_BANK, SUDDEN_DEATH_BANK, checkAnswerCorrectness } from './data/questions';
import { soundEngine } from './utils/soundEngine';
import { VsBattleBar } from './components/VsBattleBar';
import { GhostTypingBar } from './components/GhostTypingBar';
import { PowerUpBar } from './components/PowerUpBar';
import { AudioWaveform } from './components/AudioWaveform';
import { ScreenEffects, fireNeonConfetti } from './components/ScreenEffects';
import { CountdownOverlay } from './components/CountdownOverlay';
import { SuddenDeathModal } from './components/SuddenDeathModal';
import { GameSummaryModal } from './components/GameSummaryModal';
import { LobbyView } from './components/LobbyView';
import { ReactiveAvatar } from './components/ReactiveAvatar';
import {
  Send,
  Sparkles,
  Zap,
  Flame,
  Volume2,
  VolumeX,
  Music,
  Copy,
  Check,
  Share2,
  MessageSquare,
  HelpCircle,
  Lightbulb,
} from 'lucide-react';

export default function App() {
  // App views: 'lobby' | 'game'
  const [view, setView] = useState<'lobby' | 'game'>('lobby');

  // Audio state
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isMusicActive, setIsMusicActive] = useState<boolean>(false);

  // Screen effect triggers
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [flashType, setFlashType] = useState<'none' | 'red' | 'green'>('none');
  const [activeTaunt, setActiveTaunt] = useState<{ name: string; text: string } | null>(null);

  // Game Room State
  const [isBotMatch, setIsBotMatch] = useState<boolean>(false);
  const [roomId, setRoomId] = useState<string>('');
  const [playerId, setPlayerId] = useState<string>('');
  const [roomState, setRoomState] = useState<RoomState | null>(null);

  // Local Player Input State
  const [userInput, setUserInput] = useState<string>('');
  const [isInputLocked, setIsInputLocked] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // WebSocket reference
  const wsRef = useRef<WebSocket | null>(null);
  const botIntervalRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Handle URL room code parameter on load
  const [initialRoomCode, setInitialRoomCode] = useState<string>('');
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setInitialRoomCode(roomParam.toUpperCase());
    }
  }, []);

  // Keyboard sound effect on typing + Ghost Typing broadcast
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUserInput(val);
    soundEngine.playKeystroke();

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'ghost_typing',
          charCount: val.length,
        })
      );
    }
  };

  // Trigger screen shake & red flash
  const triggerPenaltyEffect = () => {
    setIsShaking(true);
    setFlashType('red');
    soundEngine.playErrorBuzzer();
    setTimeout(() => {
      setIsShaking(false);
      setFlashType('none');
    }, 500);
  };

  // Trigger green flash & confetti
  const triggerCorrectEffect = () => {
    setFlashType('green');
    soundEngine.playCorrectSound();
    fireNeonConfetti();
    setTimeout(() => {
      setFlashType('none');
    }, 500);
  };

  // Initialize WebSocket connection
  const connectWebSocket = (rId: string, pName: string, avatarId: string) => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host || 'localhost:3000';
    const socket = new WebSocket(`${protocol}//${host}`);

    socket.onopen = () => {
      socket.send(
        JSON.stringify({
          type: 'join_room',
          roomId: rId,
          playerName: pName,
          avatarId: avatarId,
        })
      );
    };

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'joined_as') {
          setPlayerId(msg.playerId);
        } else if (msg.type === 'room_state') {
          setRoomState(msg.state);
        } else if (msg.type === 'screen_shake') {
          triggerPenaltyEffect();
        } else if (msg.type === 'answer_status') {
          if (msg.isCorrect) {
            triggerCorrectEffect();
          } else {
            triggerPenaltyEffect();
          }
        } else if (msg.type === 'taunt_received') {
          setActiveTaunt({ name: msg.playerName, text: msg.message });
          setTimeout(() => setActiveTaunt(null), 3000);
        }
      } catch (err) {
        console.error('Socket parse error:', err);
      }
    };

    wsRef.current = socket;
  };

  // Start 1v1 Room (Host)
  const handleCreateRoom = (
    level: CEFRLevel,
    rounds: number,
    avatarId: string,
    playerName: string
  ) => {
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const digits = '23456789';
    let code = 'CLASH-';
    for (let i = 0; i < 3; i++) code += letters.charAt(Math.floor(Math.random() * letters.length));
    for (let i = 0; i < 2; i++) code += digits.charAt(Math.floor(Math.random() * digits.length));

    setRoomId(code);
    setIsBotMatch(false);
    setView('game');
    connectWebSocket(code, playerName, avatarId);

    // Update URL query parameter without full reload
    const newUrl = `${window.location.pathname}?room=${code}`;
    window.history.replaceState(null, '', newUrl);
  };

  // Join 1v1 Room
  const handleJoinRoom = (rId: string, avatarId: string, playerName: string) => {
    setRoomId(rId);
    setIsBotMatch(false);
    setView('game');
    connectWebSocket(rId, playerName, avatarId);
  };

  // Start Solo Match vs AI Bot
  const handleStartBotMatch = (
    level: CEFRLevel,
    rounds: number,
    avatarId: string,
    playerName: string
  ) => {
    setIsBotMatch(true);
    setRoomId('BOT-DUEL');
    setView('game');

    const p1Id = 'p_user';
    const botId = 'p_bot';

    const p1: Player = {
      id: p1Id,
      name: playerName,
      avatarId: avatarId,
      score: 0,
      streak: 0,
      highestStreak: 0,
      correctAnswersCount: 0,
      wrongAnswersCount: 0,
      isReady: true,
      isHost: true,
      charCount: 0,
      cooldownUntil: 0,
      activeDebuffs: [],
      unlockedPowerUps: [],
      avatarState: 'idle',
    };

    const botAvatars = ['ninja', 'polyglot', 'valkyrie'];
    const chosenBotAvatar = botAvatars[Math.floor(Math.random() * botAvatars.length)];

    const bot: Player = {
      id: botId,
      name: 'CyberRival AI',
      avatarId: chosenBotAvatar,
      score: 0,
      streak: 0,
      highestStreak: 0,
      correctAnswersCount: 0,
      wrongAnswersCount: 0,
      isReady: true,
      isHost: false,
      charCount: 0,
      cooldownUntil: 0,
      activeDebuffs: [],
      unlockedPowerUps: [],
      avatarState: 'idle',
      isBot: true,
    };

    // Filter questions
    const filtered = QUESTION_BANK.filter((q) => q.level === level);
    const questions = [...filtered].sort(() => 0.5 - Math.random()).slice(0, rounds);

    const initialRoom: RoomState = {
      roomId: 'BOT-DUEL',
      level,
      totalRounds: rounds,
      currentRoundIndex: 0,
      questions,
      currentQuestion: questions[0],
      status: 'countdown',
      roundTimeLeft: questions[0].time_limit_seconds,
      countdownSeconds: 3,
      lastRoundResult: null,
      players: { [p1Id]: p1, [botId]: bot },
      isSuddenDeath: false,
    };

    setPlayerId(p1Id);
    setRoomState(initialRoom);
  };

  // Bot AI loop for Solo Mode
  useEffect(() => {
    if (!isBotMatch || !roomState) return;

    if (roomState.status === 'in_round' && roomState.currentQuestion) {
      const q = roomState.currentQuestion;
      const targetAns = q.accepted_answers[0];
      const botPlayer = roomState.players['p_bot'];
      if (!botPlayer) return;

      let typed = 0;
      // Typing simulation
      const interval = window.setInterval(() => {
        typed++;
        setRoomState((prev) => {
          if (!prev || prev.status !== 'in_round') return prev;
          const updated = { ...prev };
          const b = updated.players['p_bot'];
          if (b) {
            b.charCount = typed;
            b.avatarState = 'typing';
          }
          return updated;
        });

        // Bot finishes typing and submits near 60% of question time
        if (typed >= Math.min(targetAns.length, 12)) {
          clearInterval(interval);
          const shouldBeCorrect = Math.random() > 0.35; // 65% bot accuracy
          setTimeout(() => {
            handleBotSubmit(shouldBeCorrect, targetAns);
          }, 800 + Math.random() * 1200);
        }
      }, 350 + Math.random() * 200);

      botIntervalRef.current = interval;
      return () => clearInterval(interval);
    }
  }, [isBotMatch, roomState?.status, roomState?.currentRoundIndex]);

  // Bot submits answer
  const handleBotSubmit = (isCorrect: boolean, correctAnswer: string) => {
    setRoomState((prev) => {
      if (!prev || prev.status !== 'in_round' || !prev.currentQuestion) return prev;
      const updated = { ...prev };
      const bot = updated.players['p_bot'];
      if (!bot) return prev;

      if (isCorrect) {
        const base = updated.isSuddenDeath ? 200 : 100;
        const speedBonus = Math.round(updated.roundTimeLeft * 5);
        const pts = base + speedBonus;
        bot.score += pts;
        bot.streak += 1;
        bot.highestStreak = Math.max(bot.highestStreak, bot.streak);
        bot.correctAnswersCount += 1;
        bot.avatarState = 'correct';

        // Power-up check
        if (bot.streak >= 3) {
          const powers: PowerUpType[] = ['screen_blur', 'letter_freeze', 'ink_splat'];
          const randomPower = powers[Math.floor(Math.random() * powers.length)];
          // Bot attacks user!
          const user = updated.players['p_user'];
          if (user) {
            user.activeDebuffs.push({
              type: randomPower,
              expiresAt: Date.now() + 3000,
            });
            soundEngine.playDebuffHit();
          }
        }

        updated.status = 'round_result';
        updated.lastRoundResult = {
          roundNumber: updated.currentRoundIndex + 1,
          winnerPlayerId: 'p_bot',
          winnerName: bot.name,
          pointsAwarded: pts,
          speedBonus,
          correctAnswerText: correctAnswer,
          isSuddenDeath: updated.isSuddenDeath,
          explanation: updated.currentQuestion?.explanation || '',
        };

        setTimeout(() => advanceBotRound(), 3500);
      } else {
        bot.score = Math.max(0, bot.score - 50);
        bot.streak = 0;
        bot.wrongAnswersCount += 1;
        bot.avatarState = 'wrong';
        bot.charCount = 0;
      }
      return updated;
    });
  };

  // Bot round timer decrement
  useEffect(() => {
    if (!isBotMatch || !roomState) return;

    const timer = setInterval(() => {
      setRoomState((prev) => {
        if (!prev) return null;
        const now = Date.now();

        // Expire debuffs
        Object.values(prev.players).forEach((p) => {
          p.activeDebuffs = p.activeDebuffs.filter((d) => d.expiresAt > now);
        });

        if (prev.status === 'countdown') {
          const nextCount = prev.countdownSeconds - 1;
          if (nextCount <= 0) {
            return {
              ...prev,
              status: 'in_round',
              roundTimeLeft: prev.currentQuestion?.time_limit_seconds || 15,
              countdownSeconds: 0,
            };
          }
          return { ...prev, countdownSeconds: nextCount };
        }

        if (prev.status === 'in_round') {
          const nextTime = prev.roundTimeLeft - 1;
          if (nextTime <= 0) {
            // Time out
            const result = {
              roundNumber: prev.currentRoundIndex + 1,
              winnerPlayerId: null,
              winnerName: null,
              pointsAwarded: 0,
              speedBonus: 0,
              correctAnswerText: prev.currentQuestion?.accepted_answers[0] || '',
              isSuddenDeath: prev.isSuddenDeath,
              explanation: prev.currentQuestion?.explanation || 'Time expired!',
            };
            setTimeout(() => advanceBotRound(), 3500);
            return {
              ...prev,
              status: 'round_result',
              roundTimeLeft: 0,
              lastRoundResult: result,
            };
          }
          return { ...prev, roundTimeLeft: nextTime };
        }

        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isBotMatch]);

  // Advance Bot Match Round
  const advanceBotRound = () => {
    setRoomState((prev) => {
      if (!prev) return null;
      if (prev.isSuddenDeath) {
        return { ...prev, status: 'game_over' };
      }

      const nextIndex = prev.currentRoundIndex + 1;
      if (nextIndex >= prev.totalRounds) {
        const p1 = prev.players['p_user'];
        const bot = prev.players['p_bot'];
        if (p1 && bot && p1.score === bot.score) {
          // Sudden death tie breaker!
          const sdQ = SUDDEN_DEATH_BANK[Math.floor(Math.random() * SUDDEN_DEATH_BANK.length)];
          return {
            ...prev,
            status: 'sudden_death_intro',
            isSuddenDeath: true,
            currentQuestion: sdQ,
            roundTimeLeft: sdQ.time_limit_seconds,
          };
        }
        return { ...prev, status: 'game_over' };
      }

      const nextQ = prev.questions[nextIndex];
      // Reset players typing & avatar states
      Object.values(prev.players).forEach((p) => {
        p.charCount = 0;
        p.avatarState = p.streak >= 3 ? 'fire' : 'idle';
      });

      return {
        ...prev,
        currentRoundIndex: nextIndex,
        currentQuestion: nextQ,
        status: 'countdown',
        countdownSeconds: 3,
        roundTimeLeft: nextQ.time_limit_seconds,
      };
    });

    setUserInput('');
    setShowHint(false);
  };

  // Handle User Answer Submission
  const handleSubmitAnswer = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userInput.trim() || isInputLocked) return;

    const myPlayer = roomState?.players[playerId];
    if (myPlayer && myPlayer.cooldownUntil > Date.now()) {
      return;
    }

    // Check if input is frozen by debuff
    const hasFreeze = myPlayer?.activeDebuffs.some((d) => d.type === 'letter_freeze');
    if (hasFreeze) {
      soundEngine.playDebuffHit();
      return;
    }

    if (isBotMatch && roomState && roomState.currentQuestion) {
      const isCorrect = checkAnswerCorrectness(
        userInput,
        roomState.currentQuestion.accepted_answers
      );

      setRoomState((prev) => {
        if (!prev || prev.status !== 'in_round' || !prev.currentQuestion) return prev;
        const updated = { ...prev };
        const user = updated.players['p_user'];
        if (!user) return prev;

        if (isCorrect) {
          triggerCorrectEffect();
          const base = updated.isSuddenDeath ? 200 : 100;
          const speedBonus = Math.round(updated.roundTimeLeft * 5);
          const pts = base + speedBonus;

          user.score += pts;
          user.streak += 1;
          user.highestStreak = Math.max(user.highestStreak, user.streak);
          user.correctAnswersCount += 1;
          user.avatarState = 'correct';

          if (user.streak >= 3) {
            const powers: PowerUpType[] = ['screen_blur', 'letter_freeze', 'ink_splat', 'time_steal'];
            const p = powers[Math.floor(Math.random() * powers.length)];
            if (!user.unlockedPowerUps.includes(p)) {
              user.unlockedPowerUps.push(p);
            }
          }

          updated.status = 'round_result';
          updated.lastRoundResult = {
            roundNumber: updated.currentRoundIndex + 1,
            winnerPlayerId: user.id,
            winnerName: user.name,
            pointsAwarded: pts,
            speedBonus,
            correctAnswerText: updated.currentQuestion?.accepted_answers[0] || '',
            isSuddenDeath: updated.isSuddenDeath,
            explanation: updated.currentQuestion?.explanation || '',
          };

          setTimeout(() => advanceBotRound(), 3500);
        } else {
          // -50 Penalty + 2s Cooldown
          triggerPenaltyEffect();
          user.score = Math.max(0, user.score - 50);
          user.streak = 0;
          user.wrongAnswersCount += 1;
          user.cooldownUntil = Date.now() + 2000;
          user.avatarState = 'wrong';

          setIsInputLocked(true);
          setTimeout(() => setIsInputLocked(false), 2000);
        }
        return updated;
      });

      setUserInput('');
    } else if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'submit_answer',
          answer: userInput,
        })
      );
      setUserInput('');
    }
  };

  // Trigger Power-up against rival
  const handleTriggerPowerUp = (powerType: PowerUpType) => {
    if (isBotMatch) {
      setRoomState((prev) => {
        if (!prev) return null;
        const updated = { ...prev };
        const user = updated.players['p_user'];
        const bot = updated.players['p_bot'];
        if (!user || !bot) return prev;

        user.unlockedPowerUps = user.unlockedPowerUps.filter((p) => p !== powerType);
        bot.activeDebuffs.push({
          type: powerType,
          expiresAt: Date.now() + 3000,
        });
        bot.avatarState = 'hit';

        if (powerType === 'time_steal') {
          updated.roundTimeLeft = Math.max(2, updated.roundTimeLeft - 3);
        }

        return updated;
      });
    } else if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'trigger_powerup',
          powerType,
        })
      );
    }
  };

  // Send Combat Quick Taunt
  const handleSendTaunt = (msg: string) => {
    soundEngine.playKeystroke();
    if (isBotMatch) {
      setActiveTaunt({ name: myPlayer?.name || 'You', text: msg });
      setTimeout(() => setActiveTaunt(null), 2500);
    } else if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'quick_taunt',
          message: msg,
        })
      );
    }
  };

  // Start game for room (Host)
  const handleStartHostGame = () => {
    soundEngine.playFightSound();
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'start_game' }));
    }
  };

  // Rematch
  const handleRematch = () => {
    soundEngine.playFightSound();
    if (isBotMatch) {
      handleStartBotMatch(
        roomState?.level || 'B1',
        roomState?.totalRounds || 5,
        myPlayer?.avatarId || 'warlock',
        myPlayer?.name || 'Player'
      );
    } else if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'rematch' }));
    }
  };

  // Return to Lobby
  const handleReturnToLobby = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    soundEngine.stopMusic();
    setIsMusicActive(false);
    setView('lobby');
    setRoomState(null);
  };

  // Wipe Screen Debuff (fog wipe)
  const handleWipeDebuff = (type: PowerUpType) => {
    soundEngine.playKeystroke();
    setRoomState((prev) => {
      if (!prev) return null;
      const updated = { ...prev };
      const me = updated.players[playerId];
      if (me) {
        me.activeDebuffs = me.activeDebuffs.filter((d) => d.type !== type);
      }
      return updated;
    });
  };

  // Copy Room Link to clipboard
  const handleCopyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  // Derive Players
  const playersList = roomState ? Object.values(roomState.players) : [];
  const myPlayer: Player =
    (roomState && roomState.players[playerId]) ||
    playersList[0] || {
      id: 'default',
      name: 'Player',
      avatarId: 'warlock',
      score: 0,
      streak: 0,
      highestStreak: 0,
      correctAnswersCount: 0,
      wrongAnswersCount: 0,
      isReady: true,
      isHost: true,
      charCount: 0,
      cooldownUntil: 0,
      activeDebuffs: [],
      unlockedPowerUps: [],
      avatarState: 'idle',
    };

  const rivalPlayer: Player | null =
    playersList.find((p) => p.id !== myPlayer.id) || null;

  const currentQ = roomState?.currentQuestion || null;
  const isCooldownActive = myPlayer.cooldownUntil > Date.now();

  return (
    <div className={`min-h-screen bg-[#0a0d1e] text-slate-100 flex flex-col relative ${isShaking ? 'shake-effect' : ''}`}>
      {/* Screen Effects & Overlays */}
      <ScreenEffects
        isShaking={isShaking}
        flashType={flashType}
        activeDebuffs={myPlayer.activeDebuffs}
        onWipeDebuff={handleWipeDebuff}
      />

      {/* Floating Combat Taunt Bubble */}
      {activeTaunt && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-[#161b3d] border-2 border-pink-500 rounded-2xl px-5 py-2.5 shadow-2xl flex items-center gap-2 animate-bounce">
          <MessageSquare className="w-4 h-4 text-pink-400" />
          <span className="text-xs font-bold text-pink-300">{activeTaunt.name}:</span>
          <span className="text-xs font-black text-white italic">"{activeTaunt.text}"</span>
        </div>
      )}

      {/* Main View Router */}
      {view === 'lobby' ? (
        <LobbyView
          onStartBotMatch={handleStartBotMatch}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          initialRoomCode={initialRoomCode}
        />
      ) : (
        <div className="flex-1 flex flex-col">
          {/* Top Street Fighter VS Battle Bar */}
          <VsBattleBar
            player1={myPlayer}
            player2={rivalPlayer}
            currentRound={roomState ? roomState.currentRoundIndex + 1 : 1}
            totalRounds={roomState ? roomState.totalRounds : 5}
            timeLeft={roomState ? roomState.roundTimeLeft : 15}
            isSuddenDeath={roomState?.isSuddenDeath || false}
            onToggleSound={() => {
              const muted = soundEngine.toggleMute();
              setIsMuted(muted);
            }}
            onToggleMusic={() => {
              const active = soundEngine.toggleMusic();
              setIsMusicActive(active);
            }}
            isSoundMuted={isMuted}
            isMusicActive={isMusicActive}
          />

          {/* Room Waiting Screen (if waiting for player 2 in multiplayer) */}
          {roomState?.status === 'lobby' && (
            <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center mb-4">
                <Share2 className="w-8 h-8 text-cyan-400 animate-pulse" />
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
                SALA DE COMBATE CREADA
              </h2>
              <p className="text-sm text-slate-400 max-w-md mb-6">
                Comparte este código o enlace con tu rival para iniciar el enfrentamiento 1v1:
              </p>

              {/* Room Code Banner */}
              <div className="flex items-center gap-3 bg-[#131733] border-2 border-indigo-500/50 rounded-2xl px-6 py-4 mb-4 shadow-xl">
                <span className="font-mono text-3xl font-black tracking-widest text-cyan-300">
                  {roomId}
                </span>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all active:scale-95 cursor-pointer shadow"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copiado!' : 'Copiar Link'}</span>
                </button>
              </div>

              {/* Connected Players Status */}
              <div className="flex items-center justify-center gap-8 my-6">
                <div className="text-center">
                  <ReactiveAvatar avatarId={myPlayer.avatarId} mood="idle" size="md" />
                  <span className="text-xs font-bold text-cyan-300 mt-1 block">{myPlayer.name} (Host)</span>
                </div>

                <span className="text-lg font-black italic text-slate-600">VS</span>

                <div className="text-center">
                  {rivalPlayer ? (
                    <>
                      <ReactiveAvatar avatarId={rivalPlayer.avatarId} mood="idle" size="md" />
                      <span className="text-xs font-bold text-rose-300 mt-1 block">{rivalPlayer.name}</span>
                    </>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-slate-700 flex items-center justify-center text-slate-600 animate-pulse">
                        ?
                      </div>
                      <span className="text-xs text-slate-500 mt-1 block">Esperando rival...</span>
                    </div>
                  )}
                </div>
              </div>

              {myPlayer.isHost && (
                <button
                  type="button"
                  onClick={handleStartHostGame}
                  className="w-full max-w-sm py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  {rivalPlayer ? '¡EMPEZAR COMBATE!' : 'INICIAR (AÚN SIN RIVAL)'}
                </button>
              )}
            </div>
          )}

          {/* Active Arena Battle Ground */}
          {roomState && (roomState.status === 'in_round' || roomState.status === 'round_result') && currentQ && (
            <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-4 sm:py-6 flex flex-col justify-between gap-4">
              {/* Rival Pressure Ghost Typing Bar */}
              {rivalPlayer && (
                <GhostTypingBar
                  rivalName={rivalPlayer.name}
                  charCount={rivalPlayer.charCount}
                  isRivalTyping={rivalPlayer.charCount > 0}
                  isPenaltyActive={rivalPlayer.cooldownUntil > Date.now()}
                />
              )}

              {/* Combat Power-up skill rack */}
              <PowerUpBar
                unlockedPowers={myPlayer.unlockedPowerUps}
                onTriggerPower={handleTriggerPowerUp}
                disabled={roomState.status !== 'in_round'}
              />

              {/* Challenge Arena Core Card */}
              <section className="bg-[#121631]/90 border border-indigo-500/30 rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-md relative overflow-hidden flex flex-col items-center">
                {/* Level and Category Tag */}
                <div className="flex items-center justify-between w-full mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border text-white font-mono"
                      style={{
                        backgroundColor: `${CEFR_METADATA[currentQ.level].color}25`,
                        borderColor: CEFR_METADATA[currentQ.level].color,
                        color: CEFR_METADATA[currentQ.level].color,
                      }}
                    >
                      {currentQ.level} · {currentQ.level_name}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      {currentQ.category}
                    </span>
                  </div>

                  <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/70 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                    +{roomState.isSuddenDeath ? '200' : '100'} Base Pts
                  </span>
                </div>

                {/* Question Prompt */}
                <h3 className="text-base sm:text-lg font-bold text-white text-center mb-4">
                  {currentQ.prompt_hint}
                </h3>

                {/* Media Challenge: Visual Image or Dynamic Audio Waveform */}
                {currentQ.type === 'image' && currentQ.media_url ? (
                  <div className="relative w-full max-w-md h-52 sm:h-64 rounded-2xl overflow-hidden border-2 border-indigo-500/40 shadow-2xl mb-4 group bg-black">
                    <img
                      src={currentQ.media_url}
                      alt="Visual Challenge"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute bottom-2 left-3 text-[11px] font-bold text-cyan-300 uppercase tracking-wider bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-sm">
                      Visual Challenge · Write in English
                    </div>
                  </div>
                ) : (
                  <div className="w-full max-w-lg mb-4">
                    <AudioWaveform
                      textToSpeak={currentQ.audio_text || ''}
                      defaultAccent={currentQ.accent_default || 'US'}
                      autoPlay={true}
                    />
                  </div>
                )}

                {/* Round Result Reveal Overlay */}
                {roomState.status === 'round_result' && roomState.lastRoundResult && (
                  <div className="w-full max-w-lg bg-[#0e1229] border-2 border-emerald-500/60 rounded-2xl p-4 text-center my-2 shadow-2xl animate-fade-in">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest block mb-1">
                      {roomState.lastRoundResult.winnerPlayerId === myPlayer.id
                        ? '🎉 ROUND WON BY YOU!'
                        : roomState.lastRoundResult.winnerName
                        ? `⚡ ${roomState.lastRoundResult.winnerName} WAS FIRST!`
                        : '⏰ TIME RAN OUT!'}
                    </span>
                    <div className="text-sm text-slate-300">
                      Answer:{' '}
                      <strong className="text-cyan-300 font-bold">
                        "{roomState.lastRoundResult.correctAnswerText}"
                      </strong>
                    </div>
                    {roomState.lastRoundResult.explanation && (
                      <p className="text-xs text-slate-400 mt-1 italic">
                        {roomState.lastRoundResult.explanation}
                      </p>
                    )}
                  </div>
                )}

                {/* Input submission box with 2-second penalty cooldown */}
                <form
                  onSubmit={handleSubmitAnswer}
                  className="w-full max-w-lg mt-2 relative"
                >
                  <div className="relative flex items-center">
                    <input
                      ref={inputRef}
                      type="text"
                      autoFocus
                      disabled={roomState.status !== 'in_round' || isCooldownActive}
                      value={userInput}
                      onChange={handleInputChange}
                      placeholder={
                        isCooldownActive
                          ? '⚠️ PENALTY COOLDOWN (2s LOCK)...'
                          : 'Type your English answer here...'
                      }
                      className={`w-full bg-[#0a0d20] border-2 rounded-2xl pl-5 pr-28 py-3.5 text-base font-semibold text-white outline-none transition-all shadow-inner ${
                        isCooldownActive
                          ? 'border-rose-500/80 bg-rose-950/20 text-rose-300 placeholder:text-rose-400'
                          : 'border-indigo-500/50 focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                      }`}
                    />

                    <button
                      type="submit"
                      disabled={roomState.status !== 'in_round' || isCooldownActive || !userInput.trim()}
                      className={`absolute right-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md ${
                        isCooldownActive || !userInput.trim()
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white cursor-pointer active:scale-95'
                      }`}
                    >
                      <span>Submit</span>
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Cooldown warning notice */}
                  {isCooldownActive && (
                    <div className="text-[11px] text-rose-400 font-bold mt-1.5 text-center flex items-center justify-center gap-1">
                      <span>-50 pts penalty applied. Locked for 2 seconds to prevent spam!</span>
                    </div>
                  )}

                  {/* Hint helper */}
                  <div className="flex items-center justify-between mt-2 px-2 text-xs text-slate-400">
                    <button
                      type="button"
                      onClick={() => setShowHint(!showHint)}
                      className="flex items-center gap-1 hover:text-amber-300 transition-colors"
                    >
                      <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                      <span>{showHint ? 'Hide Hint' : 'Need a hint?'}</span>
                    </button>

                    <span className="text-[11px] text-slate-500">
                      Press <kbd className="px-1 py-0.5 rounded bg-slate-800 text-[10px]">Enter</kbd> to submit
                    </span>
                  </div>

                  {showHint && currentQ && (
                    <div className="mt-2 p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs">
                      Hint: Starts with "<strong>{currentQ.accepted_answers[0].charAt(0).toUpperCase()}</strong>" ({currentQ.accepted_answers[0].length} letters)
                    </div>
                  )}
                </form>
              </section>

              {/* Combat Taunt Quick Bar */}
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Taunts:
                </span>
                {['Nice try!', 'Too fast!', 'Level Up!', 'GG!'].map((taunt) => (
                  <button
                    key={taunt}
                    type="button"
                    onClick={() => handleSendTaunt(taunt)}
                    className="px-2.5 py-1 rounded-lg bg-[#11152d] hover:bg-indigo-900/60 border border-slate-800 hover:border-pink-500/50 text-[11px] font-semibold text-slate-300 hover:text-pink-300 transition-all cursor-pointer"
                  >
                    {taunt}
                  </button>
                ))}
              </div>
            </main>
          )}

          {/* Countdown 3, 2, 1, FIGHT! */}
          {roomState?.status === 'countdown' && (
            <CountdownOverlay
              seconds={roomState.countdownSeconds || 3}
              title={`ROUND ${roomState.currentRoundIndex + 1} COMBAT`}
            />
          )}

          {/* Sudden Death Tie Breaker Modal */}
          {roomState?.status === 'sudden_death_intro' && (
            <SuddenDeathModal
              p1Score={myPlayer.score}
              p2Score={rivalPlayer ? rivalPlayer.score : 0}
              onContinue={() => {
                setRoomState((prev) => {
                  if (!prev) return null;
                  return { ...prev, status: 'in_round' };
                });
              }}
            />
          )}

          {/* Game Over Victory Summary */}
          {roomState?.status === 'game_over' && (
            <GameSummaryModal
              player1={myPlayer}
              player2={rivalPlayer}
              onRematch={handleRematch}
              onReturnToLobby={handleReturnToLobby}
            />
          )}
        </div>
      )}
    </div>
  );
}
