/**
 * Quiz model
 */
class Quiz {
  constructor({ id, title, description, questions }) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.questions = questions.map(q => new Question(q));
  }
}

/**
 * Question model
 */
class Question {
  constructor({ 
    id, 
    type, 
    text, 
    imageUrl = null, 
    options = [], 
    correctIndex = null, 
    correctText = null, 
    timeLimitSec = 30 
  }) {
    this.id = id;
    this.type = type; // 'multiple-choice', 'true-false', 'short-text'
    this.text = text;
    this.imageUrl = imageUrl;
    this.options = options;
    this.correctIndex = correctIndex;
    this.correctText = correctText;
    this.timeLimitSec = timeLimitSec;
  }

  isCorrectAnswer(answer) {
    switch (this.type) {
      case 'multiple-choice':
      case 'true-false':
        return this.correctIndex === answer;
      case 'short-text':
        return this.correctText && 
               this.correctText.toLowerCase().trim() === 
               String(answer).toLowerCase().trim();
      default:
        return false;
    }
  }
}

module.exports = { Quiz, Question };