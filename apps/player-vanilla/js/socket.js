/**
 * Socket.IO communication for the player app
 */
window.SocketManager = {
    socket: null,
    serverUrl: 'http://localhost:4000',
    heartbeatInterval: null,
    
    connect: function() {
        if (this.socket) {
            this.socket.disconnect();
        }
        
        this.socket = io(this.serverUrl, {
            transports: ['websocket', 'polling'],
            timeout: 20000,
            forceNew: true
        });
        
        this.setupEventListeners();
        GameState.socket = this.socket;
    },
    
    setupEventListeners: function() {
        const socket = this.socket;
        
        // Connection events
        socket.on('connect', () => {
            console.log('Connected to server');
            GameState.setState({ connected: true });
            UI.updateConnectionStatus(true);
            this.startHeartbeat();
        });
        
        socket.on('disconnect', (reason) => {
            console.log('Disconnected from server:', reason);
            GameState.setState({ connected: false });
            UI.updateConnectionStatus(false);
            this.stopHeartbeat();
            
            // Attempt to reconnect if not intentional
            if (reason !== 'io client disconnect') {
                setTimeout(() => this.reconnect(), 3000);
            }
        });
        
        socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
            UI.showError('Failed to connect to server. Please try again.');
        });
        
        // Game events
        socket.on('game:joined', (data) => {
            console.log('Joined game:', data);
            GameState.setState({
                playerId: data.playerId,
                nickname: data.nickname,
                gameId: data.gameId,
                status: 'waiting'
            });
            UI.showWaitingScreen();
        });
        
        socket.on('game:rejoined', (data) => {
            console.log('Rejoined game:', data);
            GameState.setState({
                playerId: data.playerId,
                nickname: data.nickname,
                score: data.score,
                status: data.gameStatus === 'question' ? 'question' : 'waiting'
            });
            
            if (data.gameStatus === 'question') {
                UI.showQuestionScreen();
            } else {
                UI.showWaitingScreen();
            }
        });
        
        socket.on('question:start', (data) => {
            console.log('Question started:', data);
            GameState.setState({
                currentQuestion: data,
                questionNumber: data.questionNumber,
                totalQuestions: data.totalQuestions || 10,
                timeRemaining: data.timeLimitSec,
                selectedAnswer: null,
                status: 'question'
            });
            UI.showQuestionScreen();
            this.startQuestionTimer(data.timeLimitSec);
        });
        
        socket.on('question:end', () => {
            console.log('Question ended');
            this.stopQuestionTimer();
            if (GameState.status === 'question') {
                GameState.setState({ status: 'answered' });
                UI.showConfirmedScreen();
            }
        });
        
        socket.on('answer:accepted', () => {
            console.log('Answer accepted');
            GameState.setState({ status: 'answered' });
            UI.showConfirmedScreen();
            
            // Haptic feedback if available
            if (navigator.vibrate) {
                navigator.vibrate(100);
            }
        });
        
        socket.on('answer:rejected', (data) => {
            console.error('Answer rejected:', data.reason);
            UI.showError(data.reason || 'Answer was rejected');
        });
        
        socket.on('answer:feedback', (data) => {
            console.log('Answer feedback:', data);
            GameState.setState({
                lastFeedback: data,
                score: data.totalScore,
                status: 'feedback'
            });
            UI.showFeedbackScreen(data);
            
            // Haptic feedback based on correctness
            if (navigator.vibrate) {
                if (data.isCorrect) {
                    navigator.vibrate([100, 50, 100]); // Success pattern
                } else {
                    navigator.vibrate(200); // Error pattern
                }
            }
        });
        
        socket.on('leaderboard:you', (data) => {
            console.log('Your rank:', data);
            GameState.setState({
                currentRank: data,
                status: 'rank'
            });
            UI.showRankScreen(data);
        });
        
        socket.on('game:ended', (data) => {
            console.log('Game ended:', data);
            GameState.setState({ status: 'ended' });
            UI.showEndedScreen(data);
        });
        
        socket.on('host:disconnected', () => {
            UI.showError('Host disconnected. The game has ended.');
            setTimeout(() => {
                this.reset();
            }, 3000);
        });
        
        // Error handling
        socket.on('error', (error) => {
            console.error('Socket error:', error);
            UI.showError(error.message || 'An error occurred');
        });
        
        // Heartbeat
        socket.on('heartbeat', () => {
            // Server responded to heartbeat
        });
    },
    
    joinGame: function(pin, nickname) {
        if (!this.socket || !this.socket.connected) {
            UI.showError('Not connected to server');
            return;
        }
        
        console.log('Attempting to join game:', pin, nickname);
        this.socket.emit('player:join', { pin, nickname });
        GameState.setState({ pin });
    },
    
    submitAnswer: function(questionId, answer) {
        if (!this.socket || !this.socket.connected) {
            UI.showError('Not connected to server');
            return;
        }
        
        console.log('Submitting answer:', questionId, answer);
        this.socket.emit('player:answer', { questionId, answer });
    },
    
    reconnect: function() {
        if (GameState.playerId && GameState.pin) {
            console.log('Attempting to reconnect...');
            if (this.socket) {
                this.socket.emit('player:reconnect', {
                    playerId: GameState.playerId,
                    pin: GameState.pin
                });
            }
        } else {
            this.connect();
        }
    },
    
    startHeartbeat: function() {
        this.stopHeartbeat();
        this.heartbeatInterval = setInterval(() => {
            if (this.socket && this.socket.connected) {
                this.socket.emit('heartbeat');
            }
        }, 15000); // Every 15 seconds
    },
    
    stopHeartbeat: function() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    },
    
    startQuestionTimer: function(seconds) {
        this.stopQuestionTimer();
        
        this.questionTimer = setInterval(() => {
            const currentTime = GameState.timeRemaining;
            if (currentTime <= 1) {
                this.stopQuestionTimer();
                GameState.updateTimer(0);
                
                // Auto-submit if no answer selected
                if (GameState.status === 'question' && GameState.currentQuestion) {
                    UI.showConfirmedScreen();
                }
            } else {
                GameState.updateTimer(currentTime - 1);
            }
        }, 1000);
    },
    
    stopQuestionTimer: function() {
        if (this.questionTimer) {
            clearInterval(this.questionTimer);
            this.questionTimer = null;
        }
    },
    
    disconnect: function() {
        this.stopHeartbeat();
        this.stopQuestionTimer();
        
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        
        GameState.socket = null;
    },
    
    reset: function() {
        this.disconnect();
        GameState.reset();
        UI.showJoinScreen();
    }
};