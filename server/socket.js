const crypto = require('crypto');

// Generate UUID v4
function uuidv4() {
  return crypto.randomUUID();
}
const Filter = require('bad-words');
const Game = require('./models/Game');
const Player = require('./models/Player');
const { Quiz } = require('./models/Quiz');
const { calculateScore } = require('./lib/score');
const sampleQuizzes = require('./data/sampleQuizzes');

// In-memory storage
const games = new Map();
const players = new Map();
const hostSockets = new Map();

// Profanity filter
const filter = new Filter();

/**
 * Generate a 6-digit game PIN
 */
function generatePin() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Get unique PIN that doesn't already exist
 */
function getUniquePin() {
  let pin;
  do {
    pin = generatePin();
  } while (games.has(pin));
  return pin;
}

/**
 * Validate nickname
 */
function validateNickname(nickname) {
  if (!nickname || typeof nickname !== 'string') {
    return { valid: false, error: 'Nickname is required' };
  }

  const trimmed = nickname.trim();
  if (trimmed.length < 1 || trimmed.length > 20) {
    return { valid: false, error: 'Nickname must be 1-20 characters' };
  }

  if (filter.isProfane(trimmed)) {
    return { valid: false, error: 'Inappropriate nickname' };
  }

  return { valid: true, nickname: trimmed };
}

/**
 * Check if nickname is already taken in game
 */
function isNicknameTaken(game, nickname) {
  return Array.from(game.players.values()).some(
    player => player.nickname.toLowerCase() === nickname.toLowerCase()
  );
}

/**
 * Initialize Socket.IO handlers
 */
function initializeSocket(io) {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Host creates a new game
    socket.on('host:create_game', ({ quizId }) => {
      try {
        const quiz = sampleQuizzes.find(q => q.id === quizId);
        if (!quiz) {
          socket.emit('error', { code: 'QUIZ_NOT_FOUND', message: 'Quiz not found' });
          return;
        }

        const gameId = uuidv4();
        const pin = getUniquePin();
        const game = new Game({
          id: gameId,
          pin,
          quizId,
          hostId: socket.id,
          quiz: new Quiz(quiz)
        });

        games.set(pin, game);
        hostSockets.set(socket.id, { gameId, pin });

        socket.join(`game:${pin}`);
        socket.join(`host:${pin}`);

        socket.emit('game:created', {
          gameId,
          pin,
          quiz: {
            id: quiz.id,
            title: quiz.title,
            description: quiz.description,
            questionCount: quiz.questions.length
          }
        });

        console.log(`Game created: ${pin} by host ${socket.id}`);
      } catch (error) {
        console.error('Error creating game:', error);
        socket.emit('error', { code: 'GAME_CREATE_ERROR', message: 'Failed to create game' });
      }
    });

    // Host starts the game
    socket.on('host:start', ({ pin }) => {
      try {
        const game = games.get(pin);
        if (!game || game.hostId !== socket.id) {
          socket.emit('error', { code: 'UNAUTHORIZED', message: 'Not authorized' });
          return;
        }

        if (game.players.size === 0) {
          socket.emit('error', { code: 'NO_PLAYERS', message: 'No players in game' });
          return;
        }

        const question = game.startQuestion();
        if (question) {
          const questionData = {
            questionId: question.id,
            questionNumber: game.currentQuestionIndex + 1,
            totalQuestions: game.quiz.questions.length,
            type: question.type,
            text: question.text,
            imageUrl: question.imageUrl,
            options: question.options,
            timeLimitSec: question.timeLimitSec
          };

          // Send to players (without correct answer)
          io.to(`game:${pin}`).emit('question:start', questionData);

          // Send to host (with correct answer info)
          socket.emit('question:start', {
            ...questionData,
            correctIndex: question.correctIndex,
            correctText: question.correctText
          });

          // Auto-end question after time limit
          setTimeout(() => {
            const currentGame = games.get(pin);
            if (currentGame && currentGame.status === 'question' && 
                currentGame.getCurrentQuestion()?.id === question.id) {
              handleQuestionEnd(io, pin);
            }
          }, question.timeLimitSec * 1000);

          console.log(`Question started in game ${pin}: ${question.text}`);
        }
      } catch (error) {
        console.error('Error starting game:', error);
        socket.emit('error', { code: 'START_ERROR', message: 'Failed to start game' });
      }
    });

    // Host ends current question manually
    socket.on('host:next', ({ pin }) => {
      try {
        const game = games.get(pin);
        if (!game || game.hostId !== socket.id) {
          socket.emit('error', { code: 'UNAUTHORIZED', message: 'Not authorized' });
          return;
        }

        if (game.status === 'question') {
          handleQuestionEnd(io, pin);
        } else if (game.status === 'reveal' || game.status === 'leaderboard') {
          // Start next question
          const question = game.startQuestion();
          if (question) {
            const questionData = {
              questionId: question.id,
              questionNumber: game.currentQuestionIndex + 1,
              totalQuestions: game.quiz.questions.length,
              type: question.type,
              text: question.text,
              imageUrl: question.imageUrl,
              options: question.options,
              timeLimitSec: question.timeLimitSec
            };

            io.to(`game:${pin}`).emit('question:start', questionData);
            socket.emit('question:start', {
              ...questionData,
              correctIndex: question.correctIndex,
              correctText: question.correctText
            });

            setTimeout(() => {
              const currentGame = games.get(pin);
              if (currentGame && currentGame.status === 'question' && 
                  currentGame.getCurrentQuestion()?.id === question.id) {
                handleQuestionEnd(io, pin);
              }
            }, question.timeLimitSec * 1000);
          } else {
            // Game over
            game.status = 'ended';
            io.to(`game:${pin}`).emit('game:ended', {
              leaderboard: game.getLeaderboard()
            });
          }
        }
      } catch (error) {
        console.error('Error proceeding to next:', error);
        socket.emit('error', { code: 'NEXT_ERROR', message: 'Failed to proceed' });
      }
    });

    // Host ends the game
    socket.on('host:end', ({ pin }) => {
      try {
        const game = games.get(pin);
        if (!game || game.hostId !== socket.id) {
          socket.emit('error', { code: 'UNAUTHORIZED', message: 'Not authorized' });
          return;
        }

        game.status = 'ended';
        io.to(`game:${pin}`).emit('game:ended', {
          leaderboard: game.getLeaderboard()
        });

        console.log(`Game ended: ${pin}`);
      } catch (error) {
        console.error('Error ending game:', error);
        socket.emit('error', { code: 'END_ERROR', message: 'Failed to end game' });
      }
    });

    // Player joins game
    socket.on('player:join', ({ pin, nickname }) => {
      try {
        const game = games.get(pin);
        if (!game) {
          socket.emit('error', { code: 'GAME_NOT_FOUND', message: 'Game not found' });
          return;
        }

        if (game.status !== 'lobby' && !game.settings.lateJoin) {
          socket.emit('error', { code: 'GAME_STARTED', message: 'Game already started' });
          return;
        }

        const validation = validateNickname(nickname);
        if (!validation.valid) {
          socket.emit('error', { code: 'INVALID_NICKNAME', message: validation.error });
          return;
        }

        if (isNicknameTaken(game, validation.nickname)) {
          socket.emit('error', { code: 'NICKNAME_TAKEN', message: 'Nickname already taken' });
          return;
        }

        const playerId = uuidv4();
        const player = new Player({
          id: playerId,
          nickname: validation.nickname,
          socketId: socket.id
        });

        game.addPlayer(player);
        players.set(socket.id, { playerId, pin });

        socket.join(`game:${pin}`);

        socket.emit('game:joined', {
          playerId,
          nickname: validation.nickname,
          gameId: game.id
        });

        // Notify host of player join
        io.to(`host:${pin}`).emit('lobby:update', {
          playerCount: game.players.size,
          players: Array.from(game.players.values()).map(p => p.toPublicInfo())
        });

        console.log(`Player ${validation.nickname} joined game ${pin}`);
      } catch (error) {
        console.error('Error joining game:', error);
        socket.emit('error', { code: 'JOIN_ERROR', message: 'Failed to join game' });
      }
    });

    // Player submits answer
    socket.on('player:answer', ({ questionId, answer }) => {
      try {
        const playerData = players.get(socket.id);
        if (!playerData) {
          socket.emit('error', { code: 'PLAYER_NOT_FOUND', message: 'Player not found' });
          return;
        }

        const game = games.get(playerData.pin);
        if (!game) {
          socket.emit('error', { code: 'GAME_NOT_FOUND', message: 'Game not found' });
          return;
        }

        const result = game.submitAnswer(playerData.playerId, questionId, answer);
        if (result.success) {
          socket.emit('answer:accepted');
          
          // Calculate and update score
          const question = game.getCurrentQuestion();
          const player = game.getPlayer(playerData.playerId);
          
          if (question && player) {
            const isCorrect = question.isCorrectAnswer(answer);
            const timeTaken = player.lastAnswer.timeMs;
            const timeLimit = question.timeLimitSec * 1000;

            const scoreData = calculateScore({
              isCorrect,
              timeTaken,
              timeLimit,
              basePoints: game.settings.pointsBase,
              speedMultiplier: game.settings.speedMultiplier,
              streak: player.streak,
              streakBonus: game.settings.streakBonus
            });

            player.updateScore(scoreData.points);
            player.updateStreak(isCorrect);

            // Send feedback to player
            socket.emit('answer:feedback', {
              isCorrect,
              points: scoreData.points,
              totalScore: player.score,
              correctAnswer: question.type === 'multiple-choice' || question.type === 'true-false' 
                ? question.correctIndex 
                : question.correctText
            });
          }
        } else {
          socket.emit('answer:rejected', { reason: result.reason });
        }
      } catch (error) {
        console.error('Error submitting answer:', error);
        socket.emit('error', { code: 'ANSWER_ERROR', message: 'Failed to submit answer' });
      }
    });

    // Player reconnect
    socket.on('player:reconnect', ({ playerId, pin }) => {
      try {
        const game = games.get(pin);
        if (!game) {
          socket.emit('error', { code: 'GAME_NOT_FOUND', message: 'Game not found' });
          return;
        }

        const player = game.getPlayer(playerId);
        if (!player) {
          socket.emit('error', { code: 'PLAYER_NOT_FOUND', message: 'Player not found' });
          return;
        }

        // Update player's socket ID and reconnect
        player.reconnect(socket.id);
        players.set(socket.id, { playerId, pin });

        socket.join(`game:${pin}`);

        socket.emit('game:rejoined', {
          playerId,
          nickname: player.nickname,
          score: player.score,
          gameStatus: game.status,
          currentQuestionIndex: game.currentQuestionIndex
        });

        // Notify host of reconnection
        io.to(`host:${pin}`).emit('player:reconnected', {
          playerId,
          nickname: player.nickname
        });

        console.log(`Player ${player.nickname} reconnected to game ${pin}`);
      } catch (error) {
        console.error('Error reconnecting player:', error);
        socket.emit('error', { code: 'RECONNECT_ERROR', message: 'Failed to reconnect' });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);

      // Handle host disconnect
      const hostData = hostSockets.get(socket.id);
      if (hostData) {
        const game = games.get(hostData.pin);
        if (game) {
          // Notify players that host disconnected
          io.to(`game:${hostData.pin}`).emit('host:disconnected');
          // Don't immediately delete the game - allow host to reconnect
        }
        hostSockets.delete(socket.id);
      }

      // Handle player disconnect
      const playerData = players.get(socket.id);
      if (playerData) {
        const game = games.get(playerData.pin);
        if (game) {
          const player = game.getPlayer(playerData.playerId);
          if (player) {
            player.disconnect();
            
            // Notify host of player disconnect
            io.to(`host:${playerData.pin}`).emit('player:disconnected', {
              playerId: playerData.playerId,
              nickname: player.nickname
            });
          }
        }
        players.delete(socket.id);
      }
    });

    // Heartbeat
    socket.on('heartbeat', () => {
      socket.emit('heartbeat');
    });
  });

  // Cleanup old games periodically
  setInterval(() => {
    const now = Date.now();
    const maxAge = 2 * 60 * 60 * 1000; // 2 hours

    games.forEach((game, pin) => {
      if (now - game.createdAt.getTime() > maxAge) {
        games.delete(pin);
        console.log(`Cleaned up old game: ${pin}`);
      }
    });
  }, 30 * 60 * 1000); // Run every 30 minutes
}

/**
 * Handle question end logic
 */
function handleQuestionEnd(io, pin) {
  const game = games.get(pin);
  if (!game) return;

  const results = game.endQuestion();
  if (results) {
    // Send results to all
    io.to(`game:${pin}`).emit('question:results', results);

    // Calculate and send leaderboard
    const leaderboard = game.getLeaderboard();
    io.to(`host:${pin}`).emit('leaderboard:update', { leaderboard });

    // Send individual rankings to players
    game.players.forEach(player => {
      const playerRank = leaderboard.find(p => p.id === player.id);
      if (playerRank && player.connected) {
        const socket = io.sockets.sockets.get(player.socketId);
        if (socket) {
          socket.emit('leaderboard:you', {
            rank: playerRank.rank,
            score: playerRank.score,
            nickname: playerRank.nickname
          });
        }
      }
    });

    game.status = 'leaderboard';

    // Check if game is over
    if (game.isGameOver()) {
      setTimeout(() => {
        game.status = 'ended';
        io.to(`game:${pin}`).emit('game:ended', {
          leaderboard: game.getLeaderboard()
        });
      }, 5000); // Show leaderboard for 5 seconds before ending
    }
  }
}

module.exports = initializeSocket;