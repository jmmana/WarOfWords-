import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import { CEFRLevel, PowerUpType, RoomState, Player, ChallengeQuestion } from './src/types/game';
import { QUESTION_BANK, SUDDEN_DEATH_BANK, checkAnswerCorrectness } from './src/data/questions';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = 3000;
const isProd = process.env.NODE_ENV === 'production';

// In-memory room store
const rooms = new Map<string, RoomState>();
const socketMeta = new WeakMap<WebSocket, { roomId: string; playerId: string }>();

function generateRoomCode(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const digits = '23456789';
  let code = 'CLASH-';
  for (let i = 0; i < 3; i++) {
    code += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  for (let i = 0; i < 2; i++) {
    code += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  return code;
}

function broadcastToRoom(roomId: string, message: object) {
  const payload = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      const meta = socketMeta.get(client);
      if (meta && meta.roomId === roomId) {
        client.send(payload);
      }
    }
  });
}

function sendToPlayer(roomId: string, playerId: string, message: object) {
  const payload = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      const meta = socketMeta.get(client);
      if (meta && meta.roomId === roomId && meta.playerId === playerId) {
        client.send(payload);
      }
    }
  });
}

function getQuestionsForLevel(level: CEFRLevel, count: number): ChallengeQuestion[] {
  const filtered = QUESTION_BANK.filter((q) => q.level === level);
  const shuffled = [...filtered].sort(() => 0.5 - Math.random());
  if (shuffled.length >= count) {
    return shuffled.slice(0, count);
  }
  // If not enough for this exact level, supplement with adjacent levels
  const allShuffled = [...QUESTION_BANK].sort(() => 0.5 - Math.random());
  const combined = [...shuffled, ...allShuffled.filter((q) => q.level !== level)];
  return combined.slice(0, count);
}

// Room timer engine
setInterval(() => {
  const now = Date.now();
  rooms.forEach((room, roomId) => {
    // Clean up expired debuffs
    Object.values(room.players).forEach((p) => {
      p.activeDebuffs = p.activeDebuffs.filter((d) => d.expiresAt > now);
      // Reset mood if was temporarily hit or celebrate
      if (p.avatarState === 'hit' || p.avatarState === 'wrong') {
        p.avatarState = p.streak >= 3 ? 'fire' : 'idle';
      }
    });

    // Handle countdown state
    if (room.status === 'countdown') {
      room.countdownSeconds--;
      if (room.countdownSeconds <= 0) {
        room.status = 'in_round';
        room.currentQuestion = room.questions[room.currentRoundIndex] || null;
        room.roundTimeLeft = room.currentQuestion ? room.currentQuestion.time_limit_seconds : 15;
      }
      broadcastToRoom(roomId, { type: 'room_state', state: room });
      return;
    }

    // Handle active round timer
    if (room.status === 'in_round') {
      room.roundTimeLeft--;
      if (room.roundTimeLeft <= 0) {
        // Round timed out!
        handleRoundTimeout(room);
      }
      broadcastToRoom(roomId, { type: 'room_state', state: room });
    }
  });
}, 1000);

function handleRoundTimeout(room: RoomState) {
  room.status = 'round_result';
  room.lastRoundResult = {
    roundNumber: room.currentRoundIndex + 1,
    winnerPlayerId: null,
    winnerName: null,
    pointsAwarded: 0,
    speedBonus: 0,
    correctAnswerText: room.currentQuestion?.accepted_answers[0] || '',
    isSuddenDeath: room.isSuddenDeath,
    explanation: room.currentQuestion?.explanation || 'Time ran out! No points awarded.',
  };

  // Schedule transition to next round or end of game
  setTimeout(() => {
    advanceRoomRound(room);
  }, 4000);
}

function advanceRoomRound(room: RoomState) {
  // Check if sudden death just finished
  if (room.isSuddenDeath) {
    room.status = 'game_over';
    broadcastToRoom(room.roomId, { type: 'room_state', state: room });
    return;
  }

  // Next round
  room.currentRoundIndex++;
  if (room.currentRoundIndex >= room.totalRounds) {
    // Check for a tie between player 1 and player 2
    const players = Object.values(room.players);
    if (players.length >= 2 && players[0].score === players[1].score) {
      // Trigger Correction Sudden Death!
      room.status = 'sudden_death_intro';
      room.isSuddenDeath = true;
      const sdQuestion = SUDDEN_DEATH_BANK[Math.floor(Math.random() * SUDDEN_DEATH_BANK.length)];
      room.currentQuestion = sdQuestion;
      room.roundTimeLeft = sdQuestion.time_limit_seconds;
      broadcastToRoom(room.roomId, { type: 'room_state', state: room });
      return;
    }

    // Normal Game Over
    room.status = 'game_over';
    broadcastToRoom(room.roomId, { type: 'room_state', state: room });
    return;
  }

  // Prepare next regular question
  room.currentQuestion = room.questions[room.currentRoundIndex];
  room.roundTimeLeft = room.currentQuestion.time_limit_seconds;
  room.status = 'countdown';
  room.countdownSeconds = 3;
  broadcastToRoom(room.roomId, { type: 'room_state', state: room });
}

wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());

      if (msg.type === 'join_room') {
        const { roomId, playerName, avatarId } = msg;
        let room = rooms.get(roomId);

        if (!room) {
          room = {
            roomId,
            level: 'B1',
            totalRounds: 5,
            currentRoundIndex: 0,
            questions: [],
            currentQuestion: null,
            status: 'lobby',
            roundTimeLeft: 15,
            countdownSeconds: 3,
            lastRoundResult: null,
            players: {},
            isSuddenDeath: false,
          };
          rooms.set(roomId, room);
        }

        const existingPlayerIds = Object.keys(room.players);
        const playerId = `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const isHost = existingPlayerIds.length === 0;

        const newPlayer: Player = {
          id: playerId,
          name: playerName || (isHost ? 'Host' : 'Challenger'),
          avatarId: avatarId || 'warlock',
          score: 0,
          streak: 0,
          highestStreak: 0,
          correctAnswersCount: 0,
          wrongAnswersCount: 0,
          isReady: isHost,
          isHost,
          charCount: 0,
          cooldownUntil: 0,
          activeDebuffs: [],
          unlockedPowerUps: [],
          avatarState: 'idle',
        };

        room.players[playerId] = newPlayer;
        socketMeta.set(ws, { roomId, playerId });

        ws.send(JSON.stringify({ type: 'joined_as', playerId, roomId }));
        broadcastToRoom(roomId, { type: 'room_state', state: room });
      }

      if (msg.type === 'change_settings') {
        const meta = socketMeta.get(ws);
        if (!meta) return;
        const room = rooms.get(meta.roomId);
        if (room && room.status === 'lobby') {
          if (msg.level) room.level = msg.level;
          if (msg.totalRounds) room.totalRounds = msg.totalRounds;
          broadcastToRoom(room.roomId, { type: 'room_state', state: room });
        }
      }

      if (msg.type === 'start_game') {
        const meta = socketMeta.get(ws);
        if (!meta) return;
        const room = rooms.get(meta.roomId);
        if (room && room.status === 'lobby') {
          room.questions = getQuestionsForLevel(room.level, room.totalRounds);
          room.currentRoundIndex = 0;
          room.currentQuestion = room.questions[0];
          room.status = 'countdown';
          room.countdownSeconds = 3;
          room.isSuddenDeath = false;
          broadcastToRoom(room.roomId, { type: 'room_state', state: room });
        }
      }

      if (msg.type === 'ghost_typing') {
        const meta = socketMeta.get(ws);
        if (!meta) return;
        const room = rooms.get(meta.roomId);
        if (room && room.status === 'in_round') {
          const player = room.players[meta.playerId];
          if (player) {
            player.charCount = Math.max(0, Number(msg.charCount) || 0);
            player.avatarState = player.charCount > 0 ? 'typing' : (player.streak >= 3 ? 'fire' : 'idle');
            broadcastToRoom(room.roomId, {
              type: 'rival_typing',
              playerId: meta.playerId,
              charCount: player.charCount,
            });
          }
        }
      }

      if (msg.type === 'submit_answer') {
        const meta = socketMeta.get(ws);
        if (!meta) return;
        const room = rooms.get(meta.roomId);
        if (!room || room.status !== 'in_round' || !room.currentQuestion) return;

        const player = room.players[meta.playerId];
        if (!player) return;

        // Check if player is on penalty cooldown
        if (player.cooldownUntil > Date.now()) {
          ws.send(JSON.stringify({
            type: 'answer_status',
            isCorrect: false,
            message: 'You are currently locked for 2 seconds due to penalty!',
            pointsDelta: 0,
          }));
          return;
        }

        const isCorrect = checkAnswerCorrectness(
          msg.answer || '',
          room.currentQuestion.accepted_answers
        );

        if (isCorrect) {
          // Base + Speed Bonus
          const basePoints = room.isSuddenDeath ? 200 : 100;
          const speedBonus = Math.max(0, Math.round(room.roundTimeLeft * 5));
          const totalPoints = basePoints + speedBonus;

          player.score += totalPoints;
          player.streak += 1;
          player.highestStreak = Math.max(player.highestStreak, player.streak);
          player.correctAnswersCount += 1;
          player.avatarState = 'correct';

          // Unlock combat power-up on 3-streak!
          if (player.streak >= 3) {
            const availablePowers: PowerUpType[] = ['screen_blur', 'letter_freeze', 'ink_splat', 'time_steal'];
            const randomPower = availablePowers[Math.floor(Math.random() * availablePowers.length)];
            if (!player.unlockedPowerUps.includes(randomPower)) {
              player.unlockedPowerUps.push(randomPower);
            }
          }

          // Round winner detected!
          room.status = 'round_result';
          room.lastRoundResult = {
            roundNumber: room.currentRoundIndex + 1,
            winnerPlayerId: player.id,
            winnerName: player.name,
            pointsAwarded: totalPoints,
            speedBonus,
            correctAnswerText: room.currentQuestion.accepted_answers[0],
            isSuddenDeath: room.isSuddenDeath,
            explanation: room.currentQuestion.explanation,
          };

          broadcastToRoom(room.roomId, {
            type: 'answer_status',
            playerId: player.id,
            isCorrect: true,
            pointsDelta: totalPoints,
            message: `CORRECT! +${totalPoints} pts (+${speedBonus} speed bonus)`,
          });

          broadcastToRoom(room.roomId, { type: 'room_state', state: room });

          // Next round after brief celebration
          setTimeout(() => {
            advanceRoomRound(room);
          }, 3500);
        } else {
          // Penalty: -50 points + 2 seconds cooldown
          player.score = Math.max(0, player.score - 50);
          player.streak = 0;
          player.wrongAnswersCount += 1;
          player.cooldownUntil = Date.now() + 2000;
          player.avatarState = 'wrong';

          // Send screen shake & red flash to penalized player
          ws.send(JSON.stringify({
            type: 'screen_shake',
            playerId: player.id,
            intensity: 'intense',
            isPenalty: true,
          }));

          ws.send(JSON.stringify({
            type: 'answer_status',
            playerId: player.id,
            isCorrect: false,
            pointsDelta: -50,
            message: 'WRONG! -50 pts penalty. Input locked for 2s!',
          }));

          broadcastToRoom(room.roomId, { type: 'room_state', state: room });
        }
      }

      if (msg.type === 'trigger_powerup') {
        const meta = socketMeta.get(ws);
        if (!meta) return;
        const room = rooms.get(meta.roomId);
        if (!room) return;

        const player = room.players[meta.playerId];
        const powerType: PowerUpType = msg.powerType;

        if (player && player.unlockedPowerUps.includes(powerType)) {
          // Consume power-up
          player.unlockedPowerUps = player.unlockedPowerUps.filter((p) => p !== powerType);

          // Find rival player
          const rival = Object.values(room.players).find((p) => p.id !== player.id);
          if (rival) {
            const duration = powerType === 'letter_freeze' ? 2000 : 3000;
            rival.activeDebuffs.push({
              type: powerType,
              expiresAt: Date.now() + duration,
            });
            rival.avatarState = 'hit';

            if (powerType === 'time_steal') {
              room.roundTimeLeft = Math.max(2, room.roundTimeLeft - 3);
            }

            room.activePowerBroadcast = {
              fromPlayerId: player.id,
              fromPlayerName: player.name,
              targetPlayerId: rival.id,
              type: powerType,
            };

            broadcastToRoom(room.roomId, { type: 'room_state', state: room });

            setTimeout(() => {
              if (room.activePowerBroadcast) {
                room.activePowerBroadcast = null;
                broadcastToRoom(room.roomId, { type: 'room_state', state: room });
              }
            }, 2500);
          }
        }
      }

      if (msg.type === 'quick_taunt') {
        const meta = socketMeta.get(ws);
        if (!meta) return;
        const room = rooms.get(meta.roomId);
        if (!room) return;
        const player = room.players[meta.playerId];
        if (player) {
          broadcastToRoom(room.roomId, {
            type: 'taunt_received',
            playerId: player.id,
            playerName: player.name,
            message: String(msg.message || '').slice(0, 40),
          });
        }
      }

      if (msg.type === 'rematch') {
        const meta = socketMeta.get(ws);
        if (!meta) return;
        const room = rooms.get(meta.roomId);
        if (!room) return;

        // Reset player states
        Object.values(room.players).forEach((p) => {
          p.score = 0;
          p.streak = 0;
          p.highestStreak = 0;
          p.correctAnswersCount = 0;
          p.wrongAnswersCount = 0;
          p.unlockedPowerUps = [];
          p.activeDebuffs = [];
          p.avatarState = 'idle';
        });

        room.questions = getQuestionsForLevel(room.level, room.totalRounds);
        room.currentRoundIndex = 0;
        room.currentQuestion = room.questions[0];
        room.status = 'countdown';
        room.countdownSeconds = 3;
        room.isSuddenDeath = false;
        broadcastToRoom(room.roomId, { type: 'room_state', state: room });
      }
    } catch (err) {
      console.error('WebSocket message parsing error:', err);
    }
  });

  ws.on('close', () => {
    const meta = socketMeta.get(ws);
    if (meta) {
      const room = rooms.get(meta.roomId);
      if (room) {
        delete room.players[meta.playerId];
        if (Object.keys(room.players).length === 0) {
          rooms.delete(meta.roomId);
        } else {
          broadcastToRoom(meta.roomId, { type: 'room_state', state: room });
        }
      }
    }
  });
});

// REST Endpoints
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    activeRooms: rooms.size,
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/questions', (req, res) => {
  const level = (req.query.level as CEFRLevel) || 'B1';
  const questions = QUESTION_BANK.filter((q) => q.level === level);
  res.json({ level, count: questions.length, questions });
});

// Vite Middleware Integration for Development / Static for Production
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`⚡ English Clash 1v1 Arena Server running on port ${PORT}`);
  });
}

startServer();
