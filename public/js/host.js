// Host JavaScript
class QuizHost {
    constructor() {
        this.socket = io();
        this.gameId = null;
        this.questions = [];
        this.currentPhase = 'setup';
        this.gameState = null;
        this.currentQuestionIndex = -1;
        this.selectedTemplate = null;
        this.templates = [];
        
        this.initializeEventListeners();
        this.initializeSocketListeners();
        this.loadTemplates();
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
        
        // Template tab switching
        document.getElementById('template-tab').addEventListener('click', () => this.showTemplateTab());
        document.getElementById('custom-tab').addEventListener('click', () => this.showCustomTab());
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

    // Template functionality
    async loadTemplates() {
        try {
            const response = await fetch('/api/quiz-templates');
            this.templates = await response.json();
            this.renderTemplates();
        } catch (error) {
            console.error('Failed to load templates:', error);
            document.getElementById('template-grid').innerHTML = 
                '<div class="error-message">Failed to load templates</div>';
        }
    }

    renderTemplates() {
        const templateGrid = document.getElementById('template-grid');
        templateGrid.innerHTML = this.templates.map(template => `
            <div class="template-card" data-template-id="${template.id}">
                <h4>${template.title}</h4>
                <p>${template.description}</p>
                <div class="template-meta">
                    <span class="template-questions">${template.questions.length} questions</span>
                </div>
            </div>
        `).join('');

        // Add click handlers for template selection
        templateGrid.querySelectorAll('.template-card').forEach(card => {
            card.addEventListener('click', () => {
                const templateId = card.dataset.templateId;
                this.selectTemplate(templateId);
            });
        });
    }

    selectTemplate(templateId) {
        this.selectedTemplate = this.templates.find(t => t.id === templateId);
        
        // Update UI to show selected template
        document.querySelectorAll('.template-card').forEach(card => {
            card.classList.remove('selected');
        });
        document.querySelector(`[data-template-id="${templateId}"]`).classList.add('selected');
        
        // Enable create game button and show selected template info
        this.showSelectedTemplate();
    }

    showSelectedTemplate() {
        const templateContent = document.getElementById('template-content');
        const selectedDiv = templateContent.querySelector('.selected-template');
        
        if (selectedDiv) {
            selectedDiv.remove();
        }

        if (this.selectedTemplate) {
            const selectedTemplate = document.createElement('div');
            selectedTemplate.className = 'selected-template';
            selectedTemplate.innerHTML = `
                <div>
                    <h4>${this.selectedTemplate.title}</h4>
                    <p>${this.selectedTemplate.questions.length} questions ready to use</p>
                </div>
                <button class="btn-use-template" id="use-template-btn">Use This Template</button>
            `;
            templateContent.insertBefore(selectedTemplate, document.getElementById('template-grid'));
            
            // Add event listener for the button
            document.getElementById('use-template-btn').addEventListener('click', () => this.useTemplate());
        }
    }

    useTemplate() {
        if (!this.selectedTemplate) return;
        
        // Convert template format to internal format
        this.questions = this.selectedTemplate.questions.map(q => {
            let options = {};
            let correctAnswer = '';
            
            if (q.type === 'multiple-choice' || q.type === 'true-false') {
                // Map options to A, B, C, D format
                options = {
                    A: q.options[0],
                    B: q.options[1],
                    C: q.options[2] || '',
                    D: q.options[3] || ''
                };
                correctAnswer = ['A', 'B', 'C', 'D'][q.correctIndex];
            } else if (q.type === 'short-text') {
                // For short text questions, create dummy multiple choice
                options = {
                    A: q.correctText,
                    B: 'Wrong answer',
                    C: 'Wrong answer',
                    D: 'Wrong answer'
                };
                correctAnswer = 'A';
            }
            
            return {
                question: q.text,
                options: options,
                correctAnswer: correctAnswer,
                timeLimit: q.timeLimitSec || 30
            };
        });
        
        this.updateQuestionsPreview();
        document.getElementById('create-game').disabled = false;
        this.showCustomTab(); // Switch to custom tab to show the imported questions
    }

    showTemplateTab() {
        document.getElementById('template-tab').classList.add('active');
        document.getElementById('custom-tab').classList.remove('active');
        document.getElementById('template-content').style.display = 'block';
        document.getElementById('custom-content').style.display = 'none';
    }

    showCustomTab() {
        document.getElementById('custom-tab').classList.add('active');
        document.getElementById('template-tab').classList.remove('active');
        document.getElementById('custom-content').style.display = 'block';
        document.getElementById('template-content').style.display = 'none';
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
            questionsList.innerHTML = this.questions.map((q, index) => {
                const correctAnswerText = q.options[q.correctAnswer] || q.correctAnswer;
                return `
                    <div class="question-item">
                        <h4>Question ${index + 1}: ${q.question}</h4>
                        <p>Correct Answer: ${q.correctAnswer} - ${correctAnswerText}</p>
                        <p>Time Limit: ${q.timeLimit}s</p>
                    </div>
                `;
            }).join('');
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

// Initialize the host when the page loads and make it globally accessible
let quizHost;
document.addEventListener('DOMContentLoaded', () => {
    quizHost = new QuizHost();
});