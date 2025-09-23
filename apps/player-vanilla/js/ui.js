/**
 * UI management for the player app
 */
window.UI = {
    currentScreen: 'join-screen',
    
    // Screen management
    showScreen: function(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
        });
        
        // Show target screen
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.remove('hidden');
            this.currentScreen = screenId;
            
            // Trigger screen-specific setup
            this.onScreenShown(screenId);
        }
    },
    
    onScreenShown: function(screenId) {
        switch (screenId) {
            case 'join-screen':
                this.focusJoinForm();
                break;
            case 'question-screen':
                this.setupQuestionScreen();
                break;
        }
    },
    
    // Join Screen
    showJoinScreen: function() {
        this.showScreen('join-screen');
    },
    
    focusJoinForm: function() {
        const pinInput = document.getElementById('pin-input');
        if (pinInput) {
            pinInput.focus();
        }
    },
    
    // Waiting Screen
    showWaitingScreen: function() {
        this.updatePlayerInfo();
        this.showScreen('waiting-screen');
    },
    
    updatePlayerInfo: function() {
        const nicknameEl = document.getElementById('player-nickname');
        const scoreEl = document.getElementById('player-score');
        const avatarEl = document.getElementById('player-avatar');
        
        if (nicknameEl) nicknameEl.textContent = GameState.nickname || 'Player';
        if (scoreEl) scoreEl.textContent = GameState.score.toLocaleString();
        if (avatarEl && GameState.nickname) {
            avatarEl.textContent = GameState.nickname.charAt(0).toUpperCase();
        }
    },
    
    // Question Screen
    showQuestionScreen: function() {
        this.showScreen('question-screen');
    },
    
    setupQuestionScreen: function() {
        const question = GameState.currentQuestion;
        if (!question) return;
        
        this.updateQuestionProgress();
        this.updateQuestionContent();
        this.setupAnswerSection();
        this.updateTimer();
    },
    
    updateQuestionProgress: function() {
        const questionNumberEl = document.getElementById('question-number');
        const totalQuestionsEl = document.getElementById('total-questions');
        
        if (questionNumberEl) questionNumberEl.textContent = GameState.questionNumber;
        if (totalQuestionsEl) totalQuestionsEl.textContent = GameState.totalQuestions;
    },
    
    updateQuestionContent: function() {
        const question = GameState.currentQuestion;
        const textEl = document.getElementById('question-text');
        const imageEl = document.getElementById('question-image');
        
        if (textEl) textEl.textContent = question.text;
        
        if (imageEl) {
            if (question.imageUrl) {
                imageEl.innerHTML = `<img src="${question.imageUrl}" alt="Question image" loading="lazy">`;
            } else {
                imageEl.innerHTML = '';
            }
        }
    },
    
    setupAnswerSection: function() {
        const question = GameState.currentQuestion;
        const answerSection = document.getElementById('answer-section');
        const submitSection = document.getElementById('submit-section');
        
        if (!answerSection) return;
        
        answerSection.innerHTML = '';
        
        if (question.type === 'multiple-choice' || question.type === 'true-false') {
            this.setupMultipleChoiceAnswers();
        } else if (question.type === 'short-text') {
            this.setupTextAnswer();
        }
        
        this.updateSubmitButton();
    },
    
    setupMultipleChoiceAnswers: function() {
        const question = GameState.currentQuestion;
        const answerSection = document.getElementById('answer-section');
        
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'answer-options';
        
        question.options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'answer-option';
            optionElement.setAttribute('data-index', index);
            optionElement.setAttribute('role', 'button');
            optionElement.setAttribute('tabindex', '0');
            optionElement.setAttribute('aria-label', `Option ${String.fromCharCode(65 + index)}: ${option}`);
            
            optionElement.innerHTML = `
                <span class="option-label">${String.fromCharCode(65 + index)}</span>
                ${option}
            `;
            
            // Click handler
            optionElement.addEventListener('click', () => {
                this.selectAnswer(index);
            });
            
            // Keyboard handler
            optionElement.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.selectAnswer(index);
                }
            });
            
            optionsContainer.appendChild(optionElement);
        });
        
        answerSection.appendChild(optionsContainer);
    },
    
    setupTextAnswer: function() {
        const answerSection = document.getElementById('answer-section');
        
        const textInput = document.createElement('input');
        textInput.type = 'text';
        textInput.className = 'text-input';
        textInput.placeholder = 'Type your answer here...';
        textInput.maxLength = 100;
        textInput.id = 'text-answer-input';
        
        textInput.addEventListener('input', (e) => {
            const value = e.target.value.trim();
            GameState.selectedAnswer = value;
            this.updateSubmitButton();
        });
        
        textInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.submitAnswer();
            }
        });
        
        answerSection.appendChild(textInput);
        
        // Focus the input
        setTimeout(() => textInput.focus(), 100);
    },
    
    selectAnswer: function(index) {
        if (GameState.status !== 'question') return;
        
        // Update visual selection
        document.querySelectorAll('.answer-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        const selectedOption = document.querySelector(`[data-index="${index}"]`);
        if (selectedOption) {
            selectedOption.classList.add('selected');
        }
        
        GameState.selectedAnswer = index;
        this.updateSubmitButton();
    },
    
    updateSubmitButton: function() {
        const submitBtn = document.getElementById('submit-btn');
        if (!submitBtn) return;
        
        const hasAnswer = GameState.selectedAnswer !== null && GameState.selectedAnswer !== '';
        submitBtn.disabled = !hasAnswer || GameState.status !== 'question';
        
        if (hasAnswer && GameState.status === 'question') {
            submitBtn.textContent = 'Submit Answer';
        } else {
            submitBtn.textContent = 'Select an answer';
        }
    },
    
    submitAnswer: function() {
        if (GameState.selectedAnswer === null || GameState.selectedAnswer === '') return;
        if (GameState.status !== 'question') return;
        
        const question = GameState.currentQuestion;
        if (!question) return;
        
        SocketManager.submitAnswer(question.questionId, GameState.selectedAnswer);
        
        // Disable submit button
        const submitBtn = document.getElementById('submit-btn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting...';
        }
    },
    
    updateTimer: function() {
        GameState.updateTimerDisplay();
    },
    
    // Confirmed Screen
    showConfirmedScreen: function() {
        this.showScreen('confirmed-screen');
    },
    
    // Feedback Screen
    showFeedbackScreen: function(feedback) {
        const iconEl = document.getElementById('feedback-icon');
        const titleEl = document.getElementById('feedback-title');
        const messageEl = document.getElementById('feedback-message');
        const pointsEl = document.getElementById('points-earned');
        const totalEl = document.getElementById('total-score');
        const correctEl = document.getElementById('correct-answer-display');
        
        if (iconEl) {
            iconEl.textContent = feedback.isCorrect ? '✅' : '❌';
        }
        
        if (titleEl) {
            titleEl.textContent = feedback.isCorrect ? 'Correct!' : 'Incorrect';
            titleEl.className = feedback.isCorrect ? 'text-green-600' : 'text-red-600';
        }
        
        if (messageEl) {
            messageEl.textContent = feedback.isCorrect 
                ? `You earned ${feedback.points} points!`
                : 'Better luck next time!';
        }
        
        if (pointsEl) {
            pointsEl.textContent = `+${feedback.points}`;
            pointsEl.className = feedback.isCorrect ? 'points-earned' : 'points-earned text-gray-500';
        }
        
        if (totalEl) {
            totalEl.textContent = feedback.totalScore.toLocaleString();
        }
        
        if (correctEl && !feedback.isCorrect) {
            correctEl.innerHTML = `
                <strong>Correct answer:</strong> ${this.formatCorrectAnswer(feedback.correctAnswer)}
            `;
            correctEl.style.display = 'block';
        } else if (correctEl) {
            correctEl.style.display = 'none';
        }
        
        this.showScreen('feedback-screen');
        
        // Auto-advance after 3 seconds
        setTimeout(() => {
            if (GameState.status === 'feedback') {
                this.showWaitingScreen();
            }
        }, 3000);
    },
    
    formatCorrectAnswer: function(answer) {
        const question = GameState.currentQuestion;
        if (!question) return answer;
        
        if (question.type === 'multiple-choice' || question.type === 'true-false') {
            const option = question.options[answer];
            return `${String.fromCharCode(65 + answer)}) ${option}`;
        }
        
        return answer;
    },
    
    // Rank Screen
    showRankScreen: function(rankData) {
        const rankNumberEl = document.getElementById('rank-number');
        const rankNicknameEl = document.getElementById('rank-nickname');
        const rankScoreEl = document.getElementById('rank-score');
        const rankMessageEl = document.getElementById('rank-message');
        
        if (rankNumberEl) rankNumberEl.textContent = `#${rankData.rank}`;
        if (rankNicknameEl) rankNicknameEl.textContent = rankData.nickname;
        if (rankScoreEl) rankScoreEl.textContent = rankData.score.toLocaleString();
        
        if (rankMessageEl) {
            let message = '';
            switch (rankData.rank) {
                case 1:
                    message = "🏆 You're in the lead! Keep it up!";
                    break;
                case 2:
                    message = "🥈 So close to first place!";
                    break;
                case 3:
                    message = "🥉 Great job! You're on the podium!";
                    break;
                default:
                    message = `You're in ${rankData.rank}${this.getOrdinalSuffix(rankData.rank)} place. Keep trying!`;
            }
            rankMessageEl.textContent = message;
        }
        
        this.showScreen('rank-screen');
        
        // Auto-advance after 4 seconds
        setTimeout(() => {
            if (GameState.status === 'rank') {
                this.showWaitingScreen();
            }
        }, 4000);
    },
    
    getOrdinalSuffix: function(num) {
        const remainder = num % 100;
        if (remainder >= 11 && remainder <= 13) {
            return 'th';
        }
        switch (num % 10) {
            case 1: return 'st';
            case 2: return 'nd';
            case 3: return 'rd';
            default: return 'th';
        }
    },
    
    // Game Ended Screen
    showEndedScreen: function(gameData) {
        const rankBadgeEl = document.getElementById('final-rank-badge');
        const nicknameEl = document.getElementById('final-nickname');
        const scoreEl = document.getElementById('final-score');
        
        const playerRank = GameState.currentRank;
        
        if (rankBadgeEl && playerRank) {
            rankBadgeEl.textContent = `#${playerRank.rank}`;
        }
        
        if (nicknameEl) {
            nicknameEl.textContent = GameState.nickname;
        }
        
        if (scoreEl) {
            scoreEl.textContent = GameState.score.toLocaleString();
        }
        
        this.showScreen('ended-screen');
    },
    
    // Error handling
    showError: function(message) {
        const errorEl = document.getElementById('join-error');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.classList.add('show');
            
            setTimeout(() => {
                errorEl.classList.remove('show');
            }, 5000);
        }
        
        // Also show in console
        console.error('UI Error:', message);
    },
    
    clearError: function() {
        const errorEl = document.getElementById('join-error');
        if (errorEl) {
            errorEl.classList.remove('show');
        }
    },
    
    // Connection status
    updateConnectionStatus: function(connected) {
        const statusEl = document.getElementById('connection-status');
        const indicatorEl = statusEl?.querySelector('.status-indicator');
        const textEl = statusEl?.querySelector('.status-text');
        
        if (indicatorEl) {
            indicatorEl.className = `status-indicator ${connected ? 'connected' : ''}`;
        }
        
        if (textEl) {
            textEl.textContent = connected ? 'Connected' : 'Connecting...';
        }
    },
    
    // Form handling
    setupEventListeners: function() {
        // Join form
        const joinForm = document.getElementById('join-form');
        if (joinForm) {
            joinForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleJoinSubmit();
            });
        }
        
        // Submit button
        const submitBtn = document.getElementById('submit-btn');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => {
                this.submitAnswer();
            });
        }
        
        // Play again button
        const playAgainBtn = document.getElementById('play-again-btn');
        if (playAgainBtn) {
            playAgainBtn.addEventListener('click', () => {
                SocketManager.reset();
            });
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
        
        // PIN input formatting
        const pinInput = document.getElementById('pin-input');
        if (pinInput) {
            pinInput.addEventListener('input', (e) => {
                // Only allow numbers
                e.target.value = e.target.value.replace(/[^0-9]/g, '');
            });
        }
    },
    
    handleJoinSubmit: function() {
        const pinInput = document.getElementById('pin-input');
        const nicknameInput = document.getElementById('nickname-input');
        
        const pin = pinInput?.value.trim();
        const nickname = nicknameInput?.value.trim();
        
        if (!pin || pin.length !== 6) {
            this.showError('Please enter a valid 6-digit PIN');
            return;
        }
        
        if (!nickname || nickname.length < 1) {
            this.showError('Please enter a nickname');
            return;
        }
        
        this.clearError();
        SocketManager.joinGame(pin, nickname);
    },
    
    handleKeyboardShortcuts: function(e) {
        // Number keys for multiple choice
        if (GameState.status === 'question' && GameState.currentQuestion) {
            const question = GameState.currentQuestion;
            if (question.type === 'multiple-choice' || question.type === 'true-false') {
                const num = parseInt(e.key);
                if (num >= 1 && num <= question.options.length) {
                    this.selectAnswer(num - 1);
                }
            }
        }
        
        // Enter to submit
        if (e.key === 'Enter' && this.currentScreen === 'question-screen') {
            if (GameState.selectedAnswer !== null) {
                this.submitAnswer();
            }
        }
    }
};