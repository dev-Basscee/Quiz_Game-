import { create } from 'zustand';
import { io } from 'socket.io-client';

const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';

const useGameStore = create((set, get) => ({
  // Connection state
  socket: null,
  connected: false,
  
  // Game state
  gameId: null,
  pin: null,
  quiz: null,
  status: 'idle', // idle, lobby, question, reveal, leaderboard, ended
  currentQuestion: null,
  currentQuestionIndex: -1,
  totalQuestions: 0,
  
  // Players state
  players: [],
  playerCount: 0,
  
  // Question state
  questionStartTime: null,
  timeRemaining: 0,
  questionResults: null,
  leaderboard: [],
  
  // UI state
  loading: false,
  error: null,
  showSettings: false,
  
  // Game settings
  settings: {
    pointsBase: 1000,
    speedMultiplier: 0.5,
    allowAnswerChange: false,
    lateJoin: false,
    streakBonus: true,
    timePerQuestion: 30
  },

  // Actions
  connectSocket: () => {
    const socket = io(serverUrl);
    
    socket.on('connect', () => {
      console.log('Connected to server');
      set({ socket, connected: true, error: null });
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      set({ connected: false });
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
      set({ error: error.message });
    });

    // Game events
    socket.on('game:created', (data) => {
      set({ 
        gameId: data.gameId, 
        pin: data.pin, 
        quiz: data.quiz,
        status: 'lobby',
        totalQuestions: data.quiz.questionCount,
        loading: false 
      });
    });

    socket.on('lobby:update', (data) => {
      set({ 
        players: data.players, 
        playerCount: data.playerCount 
      });
    });

    socket.on('question:start', (data) => {
      set({ 
        status: 'question',
        currentQuestion: data,
        currentQuestionIndex: data.questionNumber - 1,
        questionStartTime: Date.now(),
        timeRemaining: data.timeLimitSec,
        questionResults: null
      });
      
      // Start countdown timer
      get().startTimer(data.timeLimitSec);
    });

    socket.on('question:results', (data) => {
      set({ 
        status: 'reveal',
        questionResults: data,
        timeRemaining: 0
      });
    });

    socket.on('leaderboard:update', (data) => {
      set({ 
        status: 'leaderboard',
        leaderboard: data.leaderboard 
      });
    });

    socket.on('game:ended', (data) => {
      set({ 
        status: 'ended',
        leaderboard: data.leaderboard 
      });
    });

    socket.on('player:join_request', (data) => {
      // Handle player join approval if needed
      console.log('Player join request:', data);
    });

    socket.on('player:disconnected', (data) => {
      const currentPlayers = get().players;
      const updatedPlayers = currentPlayers.map(player => 
        player.id === data.playerId 
          ? { ...player, connected: false }
          : player
      );
      set({ players: updatedPlayers });
    });

    socket.on('player:reconnected', (data) => {
      const currentPlayers = get().players;
      const updatedPlayers = currentPlayers.map(player => 
        player.id === data.playerId 
          ? { ...player, connected: true }
          : player
      );
      set({ players: updatedPlayers });
    });

    set({ socket });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, connected: false });
    }
  },

  createGame: (quizId) => {
    const { socket } = get();
    if (!socket) return;
    
    set({ loading: true, error: null });
    socket.emit('host:create_game', { quizId });
  },

  startGame: () => {
    const { socket, pin } = get();
    if (!socket || !pin) return;
    
    socket.emit('host:start', { pin });
  },

  nextQuestion: () => {
    const { socket, pin } = get();
    if (!socket || !pin) return;
    
    socket.emit('host:next', { pin });
  },

  endGame: () => {
    const { socket, pin } = get();
    if (!socket || !pin) return;
    
    socket.emit('host:end', { pin });
  },

  startTimer: (seconds) => {
    const timer = setInterval(() => {
      const currentTime = get().timeRemaining;
      if (currentTime <= 1) {
        clearInterval(timer);
        set({ timeRemaining: 0 });
      } else {
        set({ timeRemaining: currentTime - 1 });
      }
    }, 1000);
  },

  updateSettings: (newSettings) => {
    set(state => ({
      settings: { ...state.settings, ...newSettings }
    }));
  },

  setError: (error) => {
    set({ error });
  },

  clearError: () => {
    set({ error: null });
  },

  toggleSettings: () => {
    set(state => ({ showSettings: !state.showSettings }));
  },

  resetGame: () => {
    set({
      gameId: null,
      pin: null,
      quiz: null,
      status: 'idle',
      currentQuestion: null,
      currentQuestionIndex: -1,
      players: [],
      playerCount: 0,
      questionStartTime: null,
      timeRemaining: 0,
      questionResults: null,
      leaderboard: [],
      loading: false,
      error: null
    });
  }
}));

export default useGameStore;