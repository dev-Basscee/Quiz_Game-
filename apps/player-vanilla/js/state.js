/**
 * Global state management for the player app
 */
window.GameState = {
    // Connection state
    socket: null,
    connected: false,
    
    // Player state
    playerId: null,
    nickname: null,
    score: 0,
    
    // Game state
    gameId: null,
    pin: null,
    status: 'joining', // joining, waiting, question, answered, feedback, rank, ended
    
    // Question state
    currentQuestion: null,
    selectedAnswer: null,
    timeRemaining: 0,
    questionNumber: 0,
    totalQuestions: 0,
    
    // Results state
    lastFeedback: null,
    currentRank: null,
    
    // Methods
    setState: function(newState) {
        Object.assign(this, newState);
        this.notifyStateChange();
    },
    
    updateScore: function(newScore) {
        this.score = newScore;
        this.updateScoreDisplay();
    },
    
    updateTimer: function(timeLeft) {
        this.timeRemaining = timeLeft;
        this.updateTimerDisplay();
    },
    
    updateScoreDisplay: function() {
        const scoreElements = document.querySelectorAll('[id*="score"]');
        scoreElements.forEach(el => {
            if (el.textContent !== undefined) {
                el.textContent = this.score.toLocaleString();
            }
        });
    },
    
    updateTimerDisplay: function() {
        const timerEl = document.getElementById('timer');
        if (timerEl) {
            timerEl.textContent = this.timeRemaining;
            
            // Update timer styling based on time remaining
            timerEl.className = 'timer';
            if (this.timeRemaining <= 5) {
                timerEl.classList.add('danger');
            } else if (this.timeRemaining <= 10) {
                timerEl.classList.add('warning');
            }
        }
    },
    
    notifyStateChange: function() {
        // Trigger custom event for state changes
        window.dispatchEvent(new CustomEvent('gameStateChange', {
            detail: { state: this }
        }));
    },
    
    reset: function() {
        this.playerId = null;
        this.nickname = null;
        this.score = 0;
        this.gameId = null;
        this.pin = null;
        this.status = 'joining';
        this.currentQuestion = null;
        this.selectedAnswer = null;
        this.timeRemaining = 0;
        this.questionNumber = 0;
        this.totalQuestions = 0;
        this.lastFeedback = null;
        this.currentRank = null;
        this.notifyStateChange();
    }
};