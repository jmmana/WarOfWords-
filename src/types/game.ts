export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type QuestionType = 'image' | 'audio';

export type PowerUpType = 'screen_blur' | 'letter_freeze' | 'ink_splat' | 'time_steal';

export type AvatarMood = 'idle' | 'typing' | 'correct' | 'wrong' | 'hit' | 'celebrate' | 'fire';

export interface ChallengeQuestion {
  id: string;
  level: CEFRLevel;
  type: QuestionType;
  media_url?: string;
  accepted_answers: string[];
  prompt_hint: string;
  audio_text?: string;
  time_limit_seconds: number;
  level_name: string;
  category: string;
  accent_default?: 'US' | 'UK' | 'AU';
  explanation?: string;
}

export interface Player {
  id: string;
  name: string;
  avatarId: string;
  score: number;
  streak: number;
  highestStreak: number;
  correctAnswersCount: number;
  wrongAnswersCount: number;
  isReady: boolean;
  isHost: boolean;
  charCount: number;
  cooldownUntil: number; // timestamp in ms
  activeDebuffs: {
    type: PowerUpType;
    expiresAt: number;
  }[];
  unlockedPowerUps: PowerUpType[];
  avatarState: AvatarMood;
  isBot?: boolean;
}

export type GameStatus =
  | 'lobby'
  | 'countdown'
  | 'in_round'
  | 'round_result'
  | 'sudden_death_intro'
  | 'game_over';

export interface RoundResultData {
  roundNumber: number;
  winnerPlayerId: string | null;
  winnerName: string | null;
  pointsAwarded: number;
  speedBonus: number;
  correctAnswerText: string;
  isSuddenDeath: boolean;
  explanation?: string;
}

export interface RoomState {
  roomId: string;
  level: CEFRLevel;
  totalRounds: number;
  currentRoundIndex: number;
  questions: ChallengeQuestion[];
  currentQuestion: ChallengeQuestion | null;
  status: GameStatus;
  roundTimeLeft: number;
  countdownSeconds: number;
  lastRoundResult: RoundResultData | null;
  players: Record<string, Player>;
  isSuddenDeath: boolean;
  activePowerBroadcast?: {
    fromPlayerId: string;
    fromPlayerName: string;
    targetPlayerId: string;
    type: PowerUpType;
  } | null;
}

export interface ClientToServerEvents {
  join_room: { roomId: string; playerName: string; avatarId: string };
  leave_room: { roomId: string };
  set_ready: { roomId: string; ready: boolean };
  change_settings: { roomId: string; level: CEFRLevel; totalRounds: number };
  start_game: { roomId: string };
  ghost_typing: { roomId: string; charCount: number };
  submit_answer: { roomId: string; answer: string; timeLeft: number };
  trigger_powerup: { roomId: string; powerType: PowerUpType };
  quick_taunt: { roomId: string; message: string };
  rematch: { roomId: string };
}

export interface ServerToClientEvents {
  room_state: RoomState;
  screen_shake: { playerId: string; intensity: 'mild' | 'intense'; isPenalty: boolean };
  answer_status: { playerId: string; isCorrect: boolean; pointsDelta: number; message: string };
  taunt_received: { playerId: string; playerName: string; message: string };
  error_message: { text: string };
}
