const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", "ws:", "wss:"]
    }
  }
}));

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Game state storage
const games = new Map();
const players = new Map();

// Game class to manage quiz sessions
class Game {
  constructor(id, hostSocketId) {
    this.id = id;
    this.hostSocketId = hostSocketId;
    this.players = new Map();
    this.currentQuestion = -1;
    this.questions = [];
    this.isActive = false;
    this.startTime = null;
    this.questionStartTime = null;
    this.leaderboard = [];
  }

  addPlayer(socketId, name) {
    const player = {
      socketId,
      name,
      score: 0,
      answers: [],
      joinTime: Date.now()
    };
    this.players.set(socketId, player);
    return player;
  }

  removePlayer(socketId) {
    this.players.delete(socketId);
  }

  nextQuestion() {
    this.currentQuestion++;
    this.questionStartTime = Date.now();
    return this.currentQuestion < this.questions.length ? this.questions[this.currentQuestion] : null;
  }

  submitAnswer(socketId, answer, timeToAnswer) {
    const player = this.players.get(socketId);
    if (!player || this.currentQuestion === -1) return false;

    const question = this.questions[this.currentQuestion];
    const isCorrect = answer === question.correctAnswer;
    
    // Calculate score based on correctness and speed
    let points = 0;
    if (isCorrect) {
      const maxPoints = 1000;
      const timeBonus = Math.max(0, maxPoints - (timeToAnswer * 10));
      points = Math.floor(timeBonus);
    }

    player.answers.push({
      questionIndex: this.currentQuestion,
      answer,
      isCorrect,
      points,
      timeToAnswer
    });

    player.score += points;
    return { isCorrect, points };
  }

  updateLeaderboard() {
    this.leaderboard = Array.from(this.players.values())
      .sort((a, b) => b.score - a.score)
      .map((player, index) => ({
        rank: index + 1,
        name: player.name,
        score: player.score
      }));
  }

  getGameState() {
    return {
      id: this.id,
      isActive: this.isActive,
      currentQuestion: this.currentQuestion,
      totalQuestions: this.questions.length,
      playerCount: this.players.size,
      leaderboard: this.leaderboard
    };
  }
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Host creates a new game
  socket.on('create-game', (data) => {
    const gameId = generateGameCode();
    const game = new Game(gameId, socket.id);
    
    if (data.questions && Array.isArray(data.questions)) {
      game.questions = data.questions;
    }
    
    games.set(gameId, game);
    socket.join(gameId);
    
    socket.emit('game-created', {
      gameId,
      gameState: game.getGameState()
    });
    
    console.log(`Game created: ${gameId} by ${socket.id}`);
  });

  // Player joins a game
  socket.on('join-game', (data) => {
    const { gameId, playerName } = data;
    const game = games.get(gameId);
    
    if (!game) {
      socket.emit('join-error', { message: 'Game not found' });
      return;
    }
    
    if (game.isActive) {
      socket.emit('join-error', { message: 'Game already in progress' });
      return;
    }
    
    const player = game.addPlayer(socket.id, playerName);
    players.set(socket.id, { gameId, playerName });
    socket.join(gameId);
    
    socket.emit('joined-game', {
      gameId,
      player,
      gameState: game.getGameState()
    });
    
    // Notify host and other players
    socket.to(gameId).emit('player-joined', {
      player: { name: player.name, socketId: socket.id },
      gameState: game.getGameState()
    });
    
    console.log(`Player ${playerName} joined game ${gameId}`);
  });

  // Host starts the game
  socket.on('start-game', () => {
    const game = findGameByHost(socket.id);
    if (!game || game.questions.length === 0) {
      socket.emit('start-error', { message: 'Cannot start game' });
      return;
    }
    
    game.isActive = true;
    game.startTime = Date.now();
    
    io.to(game.id).emit('game-started', {
      gameState: game.getGameState()
    });
    
    console.log(`Game ${game.id} started`);
  });

  // Host shows next question
  socket.on('next-question', () => {
    const game = findGameByHost(socket.id);
    if (!game || !game.isActive) return;
    
    const question = game.nextQuestion();
    if (question) {
      // Send question to players (without correct answer)
      const playerQuestion = {
        index: game.currentQuestion,
        question: question.question,
        options: question.options,
        timeLimit: question.timeLimit || 30
      };
      
      io.to(game.id).emit('question-started', {
        question: playerQuestion,
        gameState: game.getGameState()
      });
      
      // Send full question to host
      socket.emit('question-details', {
        question,
        gameState: game.getGameState()
      });
    } else {
      // Game finished
      game.updateLeaderboard();
      io.to(game.id).emit('game-finished', {
        leaderboard: game.leaderboard,
        gameState: game.getGameState()
      });
    }
  });

  // Player submits answer
  socket.on('submit-answer', (data) => {
    const playerData = players.get(socket.id);
    if (!playerData) return;
    
    const game = games.get(playerData.gameId);
    if (!game || !game.isActive) return;
    
    const timeToAnswer = Date.now() - game.questionStartTime;
    const result = game.submitAnswer(socket.id, data.answer, timeToAnswer);
    
    if (result) {
      socket.emit('answer-result', result);
      
      // Notify host of answer submission
      socket.to(game.hostSocketId).emit('answer-submitted', {
        player: playerData.playerName,
        answer: data.answer,
        ...result
      });
    }
  });

  // Host shows question results
  socket.on('show-results', () => {
    const game = findGameByHost(socket.id);
    if (!game) return;
    
    game.updateLeaderboard();
    const question = game.questions[game.currentQuestion];
    
    io.to(game.id).emit('question-results', {
      question,
      leaderboard: game.leaderboard,
      gameState: game.getGameState()
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    
    // Check if it was a host
    const game = findGameByHost(socket.id);
    if (game) {
      io.to(game.id).emit('host-disconnected');
      games.delete(game.id);
      console.log(`Game ${game.id} ended due to host disconnect`);
    }
    
    // Check if it was a player
    const playerData = players.get(socket.id);
    if (playerData) {
      const playerGame = games.get(playerData.gameId);
      if (playerGame) {
        playerGame.removePlayer(socket.id);
        socket.to(playerData.gameId).emit('player-left', {
          playerName: playerData.playerName,
          gameState: playerGame.getGameState()
        });
      }
      players.delete(socket.id);
    }
  });
});

// Helper functions
function findGameByHost(hostSocketId) {
  for (const game of games.values()) {
    if (game.hostSocketId === hostSocketId) {
      return game;
    }
  }
  return null;
}

function generateGameCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/host', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'host.html'));
});

app.get('/player', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'player.html'));
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    activeGames: games.size,
    activePlayers: players.size
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🎮 Quiz Game Server running on port ${PORT}`);
  console.log(`🌐 Open http://localhost:${PORT} to get started`);
});

module.exports = { app, server };