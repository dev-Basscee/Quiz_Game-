// Host JavaScript
class QuizHost {
    constructor() {
        this.socket = io();
        this.gameId = null;
        this.questions = [];
        this.currentPhase = 'setup';
        this.gameState = null;
        this.currentQuestionIndex = -1;
        
        this.initializeEventListeners();
        this.initializeSocketListeners();
    }

    initializeEventListeners() {
        // Quiz builder events
        document.getElementById('add-question').addEventListener('click', () => this.addQuestion());
        document.getElementById('create-game').addEventListener('click', () => this.createGame());
        
        // Game control events
        document.getElementById('start-game').addEventListener('click', () => this.startGame());
        document.getElementById('next-question').addEventListener('click', () => this.showNextQuestion());
        document.getElementById('show-results').addEventListener('click', () => this.showResults());
        document.getElementById('next-round').addEventListener('click', () => this.nextRound());
        document.getElementById('new-game').addEventListener('click', () => this.newGame());
        
        // Enter key support for question form
        document.getElementById('question-text').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addQuestion();
        });
    }

    initializeSocketListeners() {
        this.socket.on('game-created', (data) => {
            this.gameId = data.gameId;
            this.gameState = data.gameState;
            this.showLobby();
        });

        this.socket.on('player-joined', (data) => {
            this.updateLobbyPlayers(data.gameState);
        });

        this.socket.on('player-left', (data) => {
            this.updateLobbyPlayers(data.gameState);
        });

        this.socket.on('game-started', (data) => {
            this.gameState = data.gameState;
            this.showGamePhase();
        });

        this.socket.on('answer-submitted', (data) => {
            this.displayAnswerSubmission(data);
        });

        this.socket.on('start-error', (data) => {
            this.showError(data.message);
        });
    }

    addQuestion() {
        const questionText = document.getElementById('question-text').value.trim();
        const optionA = document.getElementById('option-a').value.trim();
        const optionB = document.getElementById('option-b').value.trim();
        const optionC = document.getElementById('option-c').value.trim();
        const optionD = document.getElementById('option-d').value.trim();
        const correctAnswer = document.getElementById('correct-answer').value;
        const timeLimit = parseInt(document.getElementById('time-limit').value);

        // Validation
        if (!questionText || !optionA || !optionB || !optionC || !optionD || !correctAnswer) {
            this.showError('Please fill in all fields');
            return;
        }

        const question = {
            question: questionText,
            options: {
                A: optionA,
                B: optionB,
                C: optionC,
                D: optionD
            },
            correctAnswer: correctAnswer,
            timeLimit: timeLimit
        };

        this.questions.push(question);
        this.updateQuestionsPreview();
        this.clearQuestionForm();
    }

    updateQuestionsPreview() {
        const questionsList = document.getElementById('questions-list');
        const createButton = document.getElementById('create-game');

        if (this.questions.length === 0) {
            questionsList.innerHTML = '<p class="empty-state">No questions added yet</p>';
            createButton.disabled = true;
        } else {
            questionsList.innerHTML = this.questions.map((q, index) => `
                <div class="question-item">
                    <h4>Question ${index + 1}: ${q.question}</h4>
                    <p>Correct Answer: ${q.correctAnswer} - ${q.options[q.correctAnswer]}</p>
                    <p>Time Limit: ${q.timeLimit}s</p>
                </div>
            `).join('');
            createButton.disabled = false;
        }
    }

    clearQuestionForm() {
        document.getElementById('question-text').value = '';
        document.getElementById('option-a').value = '';
        document.getElementById('option-b').value = '';
        document.getElementById('option-c').value = '';
        document.getElementById('option-d').value = '';
        document.getElementById('correct-answer').value = '';
        document.getElementById('time-limit').value = '30';
        document.getElementById('question-text').focus();
    }

    createGame() {
        if (this.questions.length === 0) {
            this.showError('Please add at least one question');
            return;
        }

        this.socket.emit('create-game', {
            questions: this.questions
        });
    }

    showLobby() {
        this.currentPhase = 'lobby';
        this.hideAllPhases();
        document.getElementById('lobby-phase').style.display = 'block';
        document.getElementById('lobby-game-code').textContent = this.gameId;
        
        // Update header
        document.getElementById('game-info').style.display = 'block';
        document.getElementById('game-code').textContent = this.gameId;
        document.getElementById('player-count').textContent = '0';
    }

    updateLobbyPlayers(gameState) {
        const playersContainer = document.getElementById('lobby-players');
        const startButton = document.getElementById('start-game');
        
        document.getElementById('player-count').textContent = gameState.playerCount;
        
        if (gameState.playerCount === 0) {
            playersContainer.innerHTML = '<p class="empty-state">Waiting for players to join...</p>';
            startButton.disabled = true;
        } else {
            // For demo purposes, we'll show player count since we don't have individual player data
            playersContainer.innerHTML = `
                <div class="players-info">
                    <p>${gameState.playerCount} player(s) have joined</p>
                </div>
            `;
            startButton.disabled = false;
        }
    }

    startGame() {
        this.socket.emit('start-game');
    }

    showGamePhase() {
        this.currentPhase = 'game';
        this.hideAllPhases();
        document.getElementById('game-phase').style.display = 'block';
        document.getElementById('total-questions').textContent = this.questions.length;
        document.getElementById('next-question').style.display = 'block';
        document.getElementById('show-results').style.display = 'none';
        document.getElementById('next-round').style.display = 'none';
    }

    showNextQuestion() {
        this.socket.emit('next-question');
        this.currentQuestionIndex++;
        
        if (this.currentQuestionIndex < this.questions.length) {
            const question = this.questions[this.currentQuestionIndex];
            this.displayQuestion(question);
            
            document.getElementById('current-q-num').textContent = this.currentQuestionIndex + 1;
            document.getElementById('next-question').style.display = 'none';
            document.getElementById('show-results').style.display = 'block';
            
            // Clear previous answer stats
            document.getElementById('answer-stats').innerHTML = '';
        } else {
            // Game finished
            this.showFinalResults();
        }
    }

    displayQuestion(question) {
        document.getElementById('question-text-display').textContent = question.question;
        const optionsDisplay = document.getElementById('options-display');
        
        optionsDisplay.innerHTML = Object.entries(question.options).map(([key, value]) => `
            <div class="answer-option ${key === question.correctAnswer ? 'correct' : ''}">
                <strong>${key}:</strong> ${value}
            </div>
        `).join('');
    }

    showResults() {
        this.socket.emit('show-results');
        document.getElementById('show-results').style.display = 'none';
        
        if (this.currentQuestionIndex < this.questions.length - 1) {
            document.getElementById('next-round').style.display = 'block';
        } else {
            // This was the last question, show final results
            setTimeout(() => this.showFinalResults(), 3000);
        }
    }

    nextRound() {
        document.getElementById('next-round').style.display = 'none';
        document.getElementById('next-question').style.display = 'block';
    }

    displayAnswerSubmission(data) {
        const answerStats = document.getElementById('answer-stats');
        const newSubmission = document.createElement('div');
        newSubmission.className = 'answer-submission';
        newSubmission.innerHTML = `
            <span class="player-name">${data.player}</span>
            <span class="answer ${data.isCorrect ? 'correct' : 'incorrect'}">
                ${data.answer} ${data.isCorrect ? '✅' : '❌'}
            </span>
            <span class="points">+${data.points}</span>
        `;
        answerStats.appendChild(newSubmission);
    }

    showFinalResults() {
        this.currentPhase = 'results';
        this.hideAllPhases();
        document.getElementById('results-phase').style.display = 'block';
        
        // Update final leaderboard (will be populated by socket event)
    }

    newGame() {
        window.location.reload();
    }

    hideAllPhases() {
        const phases = ['setup-phase', 'lobby-phase', 'game-phase', 'results-phase'];
        phases.forEach(phase => {
            document.getElementById(phase).style.display = 'none';
        });
    }

    showError(message) {
        // Simple error display - in production, you'd want a better UI
        alert(message);
    }
}

// Initialize the host when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new QuizHost();
});