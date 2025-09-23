// Player JavaScript
class QuizPlayer {
    constructor() {
        this.socket = io();
        this.gameId = null;
        this.playerName = null;
        this.currentPhase = 'join';
        this.playerScore = 0;
        this.currentQuestion = null;
        this.timer = null;
        this.timeLeft = 0;
        
        this.initializeEventListeners();
        this.initializeSocketListeners();
    }

    initializeEventListeners() {
        document.getElementById('join-game').addEventListener('click', () => this.joinGame());
        
        // Enter key support for join form
        document.getElementById('game-code-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.joinGame();
        });
        
        document.getElementById('player-name-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.joinGame();
        });

        // Auto-uppercase game code input
        document.getElementById('game-code-input').addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
        });
    }

    initializeSocketListeners() {
        this.socket.on('joined-game', (data) => {
            this.gameId = data.gameId;
            this.playerName = data.player.name;
            this.showLobby();
        });

        this.socket.on('join-error', (data) => {
            this.showJoinError(data.message);
        });

        this.socket.on('game-started', (data) => {
            this.showWaitingForQuestion();
        });

        this.socket.on('question-started', (data) => {
            this.currentQuestion = data.question;
            this.showQuestion(data.question);
        });

        this.socket.on('answer-result', (data) => {
            this.showAnswerFeedback(data);
        });

        this.socket.on('question-results', (data) => {
            this.showQuestionResults(data);
        });

        this.socket.on('game-finished', (data) => {
            this.showFinalResults(data);
        });

        this.socket.on('host-disconnected', () => {
            this.showDisconnected();
        });

        this.socket.on('player-joined', (data) => {
            if (this.currentPhase === 'lobby') {
                this.updateLobbyPlayerCount(data.gameState.playerCount);
            }
        });

        this.socket.on('player-left', (data) => {
            if (this.currentPhase === 'lobby') {
                this.updateLobbyPlayerCount(data.gameState.playerCount);
            }
        });
    }

    joinGame() {
        const gameCode = document.getElementById('game-code-input').value.trim().toUpperCase();
        const playerName = document.getElementById('player-name-input').value.trim();

        // Validation
        if (!gameCode || gameCode.length !== 6) {
            this.showJoinError('Please enter a valid 6-digit game code');
            return;
        }

        if (!playerName || playerName.length < 2) {
            this.showJoinError('Please enter a name (at least 2 characters)');
            return;
        }

        if (playerName.length > 20) {
            this.showJoinError('Name must be 20 characters or less');
            return;
        }

        // Clear any previous error
        document.getElementById('join-error').style.display = 'none';

        this.socket.emit('join-game', {
            gameId: gameCode,
            playerName: playerName
        });
    }

    showJoinError(message) {
        const errorElement = document.getElementById('join-error');
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }

    showLobby() {
        this.currentPhase = 'lobby';
        this.hideAllPhases();
        document.getElementById('player-lobby-phase').style.display = 'block';
        document.getElementById('lobby-code-display').textContent = this.gameId;
        
        // Update header
        document.getElementById('player-info').style.display = 'block';
        document.getElementById('player-game-code').textContent = this.gameId;
        document.getElementById('player-name-display').textContent = this.playerName;
        document.getElementById('player-score').textContent = '0';
    }

    updateLobbyPlayerCount(count) {
        document.getElementById('lobby-player-count').textContent = count;
    }

    showWaitingForQuestion() {
        this.currentPhase = 'waiting';
        // Could show a waiting screen here if needed
    }

    showQuestion(question) {
        this.currentPhase = 'question';
        this.hideAllPhases();
        document.getElementById('question-phase').style.display = 'block';
        
        // Update question content
        document.getElementById('question-number').textContent = question.index + 1;
        document.getElementById('question-text').textContent = question.question;
        
        // Create answer options
        const optionsContainer = document.getElementById('answer-options');
        optionsContainer.innerHTML = Object.entries(question.options).map(([key, value]) => `
            <div class="answer-option" data-answer="${key}">
                <strong>${key}:</strong> ${value}
            </div>
        `).join('');

        // Add click listeners to options
        optionsContainer.querySelectorAll('.answer-option').forEach(option => {
            option.addEventListener('click', () => this.selectAnswer(option));
        });

        // Start timer
        this.startTimer(question.timeLimit || 30);
        
        // Hide answer feedback
        document.getElementById('answer-feedback').style.display = 'none';
    }

    selectAnswer(selectedOption) {
        // Remove previous selections
        document.querySelectorAll('.answer-option').forEach(option => {
            option.classList.remove('selected');
        });

        // Mark as selected
        selectedOption.classList.add('selected');
        
        // Submit answer
        const answer = selectedOption.dataset.answer;
        this.socket.emit('submit-answer', { answer });
        
        // Disable further selections
        document.querySelectorAll('.answer-option').forEach(option => {
            option.style.pointerEvents = 'none';
        });

        // Stop timer
        this.stopTimer();
    }

    startTimer(duration) {
        this.timeLeft = duration;
        const timerText = document.getElementById('timer-text');
        const timerBar = document.getElementById('timer-bar');
        
        timerText.textContent = this.timeLeft;
        timerBar.style.width = '100%';
        
        this.timer = setInterval(() => {
            this.timeLeft--;
            timerText.textContent = this.timeLeft;
            
            const percentage = (this.timeLeft / duration) * 100;
            timerBar.style.width = percentage + '%';
            
            if (this.timeLeft <= 0) {
                this.stopTimer();
                this.timeUp();
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    timeUp() {
        // Disable all options
        document.querySelectorAll('.answer-option').forEach(option => {
            option.style.pointerEvents = 'none';
            option.style.opacity = '0.6';
        });
        
        // Show time up message
        this.showAnswerFeedback({
            isCorrect: false,
            points: 0,
            message: 'Time\'s up!'
        });
    }

    showAnswerFeedback(result) {
        const feedbackElement = document.getElementById('answer-feedback');
        const feedbackIcon = document.getElementById('feedback-icon');
        const feedbackText = document.getElementById('feedback-text');
        const feedbackDetails = document.getElementById('feedback-details');
        
        feedbackIcon.className = `feedback-icon ${result.isCorrect ? 'correct' : 'incorrect'}`;
        feedbackText.textContent = result.isCorrect ? 'Correct!' : (result.message || 'Incorrect');
        feedbackDetails.textContent = `+${result.points} points`;
        
        feedbackElement.style.display = 'block';
        
        // Update player score
        this.playerScore += result.points;
        document.getElementById('player-score').textContent = this.playerScore;
    }

    showQuestionResults(data) {
        this.currentPhase = 'results';
        this.hideAllPhases();
        document.getElementById('player-results-phase').style.display = 'block';
        
        // Show correct answer
        const correctAnswerText = `${data.question.correctAnswer}: ${data.question.options[data.question.correctAnswer]}`;
        document.getElementById('correct-answer-text').textContent = correctAnswerText;
        
        // Update leaderboard
        this.updateLeaderboard(data.leaderboard);
    }

    showFinalResults(data) {
        this.currentPhase = 'final';
        this.hideAllPhases();
        document.getElementById('player-final-phase').style.display = 'block';
        
        // Find player's rank
        const playerRank = data.leaderboard.findIndex(entry => entry.name === this.playerName) + 1;
        
        document.getElementById('final-score-display').textContent = this.playerScore;
        document.getElementById('final-rank-display').textContent = `#${playerRank}`;
        
        // Update final leaderboard
        this.updateFinalLeaderboard(data.leaderboard);
    }

    updateLeaderboard(leaderboard) {
        const leaderboardContainer = document.getElementById('player-leaderboard');
        
        leaderboardContainer.innerHTML = leaderboard.map(entry => `
            <div class="leaderboard-item ${entry.name === this.playerName ? 'current-player' : ''}">
                <span class="rank">${entry.rank}</span>
                <span class="player-name">${entry.name}</span>
                <span class="score">${entry.score}</span>
            </div>
        `).join('');
    }

    updateFinalLeaderboard(leaderboard) {
        const leaderboardContainer = document.getElementById('player-final-leaderboard');
        
        leaderboardContainer.innerHTML = leaderboard.map(entry => `
            <div class="leaderboard-item ${entry.name === this.playerName ? 'current-player' : ''}">
                <span class="rank">${entry.rank}</span>
                <span class="player-name">${entry.name}</span>
                <span class="score">${entry.score}</span>
            </div>
        `).join('');
    }

    showDisconnected() {
        this.currentPhase = 'disconnected';
        this.hideAllPhases();
        document.getElementById('disconnected-phase').style.display = 'block';
    }

    hideAllPhases() {
        const phases = [
            'join-phase',
            'player-lobby-phase',
            'question-phase',
            'player-results-phase',
            'player-final-phase',
            'disconnected-phase'
        ];
        
        phases.forEach(phase => {
            const element = document.getElementById(phase);
            if (element) {
                element.style.display = 'none';
            }
        });
    }
}

// Initialize the player when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new QuizPlayer();
});

// Add styles for current player highlighting
const style = document.createElement('style');
style.textContent = `
    .leaderboard-item.current-player {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
        color: white !important;
        font-weight: bold;
        border: 2px solid #5a67d8;
    }
    
    .answer-option {
        user-select: none;
    }
    
    .answer-submission {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px;
        background: white;
        border-radius: 5px;
        margin-bottom: 5px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    
    .answer-submission .answer.correct {
        color: #48bb78;
        font-weight: bold;
    }
    
    .answer-submission .answer.incorrect {
        color: #f56565;
        font-weight: bold;
    }
    
    .answer-submission .points {
        font-weight: bold;
        color: #667eea;
    }
`;
document.head.appendChild(style);