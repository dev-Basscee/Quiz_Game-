/**
 * Game model
 */
class Game {
  constructor({ 
    id, 
    pin, 
    quizId, 
    hostId, 
    quiz,
    settings = {} 
  }) {
    this.id = id;
    this.pin = pin;
    this.quizId = quizId;
    this.hostId = hostId;
    this.quiz = quiz;
    this.status = 'lobby'; // lobby, question, reveal, leaderboard, ended
    this.currentQuestionIndex = -1;
    this.settings = {
      pointsBase: 1000,
      speedMultiplier: 0.5,
      allowAnswerChange: false,
      lateJoin: false,
      streakBonus: true,
      ...settings
    };
    this.players = new Map();
    this.answers = new Map(); // questionId -> Map(playerId -> answer)
    this.questionStartTime = null;
    this.createdAt = new Date();
  }

  addPlayer(player) {
    this.players.set(player.id, player);
  }

  removePlayer(playerId) {
    this.players.delete(playerId);
  }

  getPlayer(playerId) {
    return this.players.get(playerId);
  }

  getCurrentQuestion() {
    if (this.currentQuestionIndex >= 0 && 
        this.currentQuestionIndex < this.quiz.questions.length) {
      return this.quiz.questions[this.currentQuestionIndex];
    }
    return null;
  }

  startQuestion() {
    this.currentQuestionIndex++;
    this.status = 'question';
    this.questionStartTime = Date.now();
    
    const question = this.getCurrentQuestion();
    if (!question) {
      this.status = 'ended';
      return null;
    }

    // Initialize answers map for this question
    if (!this.answers.has(question.id)) {
      this.answers.set(question.id, new Map());
    }

    return question;
  }

  submitAnswer(playerId, questionId, answer) {
    const player = this.getPlayer(playerId);
    if (!player || !player.connected) {
      return { success: false, reason: 'Player not found or disconnected' };
    }

    const question = this.getCurrentQuestion();
    if (!question || question.id !== questionId) {
      return { success: false, reason: 'Invalid question' };
    }

    if (this.status !== 'question') {
      return { success: false, reason: 'Question not active' };
    }

    const questionAnswers = this.answers.get(questionId);
    if (!questionAnswers) {
      return { success: false, reason: 'Question not found' };
    }

    // Check if answer already exists and change is not allowed
    if (questionAnswers.has(playerId) && !this.settings.allowAnswerChange) {
      return { success: false, reason: 'Answer already submitted' };
    }

    const timeMs = Date.now() - this.questionStartTime;
    const isCorrect = question.isCorrectAnswer(answer);

    // Check if this is the first correct answer
    let isFirstCorrect = false;
    if (isCorrect) {
      const allAnswers = Array.from(questionAnswers.values());
      const hasAnyCorrect = allAnswers.some(a => {
        return question.isCorrectAnswer(a.answer);
      });
      isFirstCorrect = !hasAnyCorrect;
    }

    const answerData = {
      answer,
      timeMs,
      timestamp: Date.now(),
      isCorrect,
      isFirstCorrect
    };

    questionAnswers.set(playerId, answerData);
    player.lastAnswer = {
      questionId,
      ...answerData
    };

    return { success: true, isCorrect, isFirstCorrect };
  }

  endQuestion() {
    this.status = 'reveal';
    return this.calculateResults();
  }

  calculateResults() {
    const question = this.getCurrentQuestion();
    if (!question) return null;

    const questionAnswers = this.answers.get(question.id) || new Map();
    const { calculateScore } = require('../lib/score');
    
    const results = {
      questionId: question.id,
      totalAnswers: questionAnswers.size,
      optionCounts: {},
      correctAnswer: question.type === 'multiple-choice' || question.type === 'true-false' 
        ? question.correctIndex 
        : question.correctText,
      answers: []
    };

    // Count answers per option
    if (question.type === 'multiple-choice' || question.type === 'true-false') {
      question.options.forEach((_, index) => {
        results.optionCounts[index] = 0;
      });

      questionAnswers.forEach(answerData => {
        const answer = answerData.answer;
        if (typeof answer === 'number' && results.optionCounts.hasOwnProperty(answer)) {
          results.optionCounts[answer]++;
        }
      });
    }

    // Calculate scores for each player's answer
    for (const [playerId, answerData] of questionAnswers.entries()) {
      const player = this.getPlayer(playerId);
      if (!player) continue;

      const isCorrect = answerData.isCorrect;
      const scoreResult = calculateScore({
        isCorrect,
        timeTaken: answerData.timeMs,
        timeLimit: question.timeLimitSec * 1000,
        basePoints: this.settings.pointsBase,
        speedMultiplier: this.settings.speedMultiplier,
        streak: player.streak || 0,
        streakBonus: this.settings.streakBonus,
        isFirstCorrect: answerData.isFirstCorrect
      });

      // Update player stats
      if (isCorrect) {
        player.streak = (player.streak || 0) + 1;
        player.score += scoreResult.points;
      } else {
        player.streak = 0;
      }

      results.answers.push({
        playerId,
        playerName: player.nickname,
        answer: answerData.answer,
        isCorrect,
        isFirstCorrect: answerData.isFirstCorrect,
        timeMs: answerData.timeMs,
        points: scoreResult.points,
        breakdown: scoreResult.breakdown
      });
    }

    return results;
  }

  getLeaderboard() {
    const playerScores = Array.from(this.players.values())
      .map(player => ({
        id: player.id,
        nickname: player.nickname,
        avatar: player.avatar,
        score: player.score,
        streak: player.streak || 0
      }))
      .sort((a, b) => {
        if (a.score !== b.score) {
          return b.score - a.score;
        }
        // Tie-breaker: earliest last answer timestamp
        const aLastAnswer = player => player.lastAnswer?.timestamp || 0;
        const bLastAnswer = player => player.lastAnswer?.timestamp || 0;
        return aLastAnswer - bLastAnswer;
      });

    return playerScores.map((player, index) => ({
      ...player,
      rank: index + 1
    }));
  }

  isGameOver() {
    return this.currentQuestionIndex >= this.quiz.questions.length - 1;
  }
}

module.exports = Game;