import React from 'react';
import { SkipForward, Users, CheckCircle, XCircle } from 'lucide-react';
import useGameStore from '../state/store';

const Reveal = () => {
  const { 
    currentQuestion, 
    questionResults, 
    nextQuestion,
    currentQuestionIndex,
    totalQuestions
  } = useGameStore();

  if (!currentQuestion || !questionResults) {
    return (
      <div className="text-center">
        <p className="text-gray-600">Loading results...</p>
      </div>
    );
  }

  const handleContinue = () => {
    nextQuestion();
  };

  const isMultipleChoice = currentQuestion.type === 'multiple-choice' || currentQuestion.type === 'true-false';
  const isShortText = currentQuestion.type === 'short-text';

  const getOptionPercentage = (optionIndex) => {
    const count = questionResults.optionCounts[optionIndex] || 0;
    return questionResults.totalAnswers > 0 
      ? Math.round((count / questionResults.totalAnswers) * 100)
      : 0;
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Question {currentQuestionIndex + 1} Results
        </h1>
        <p className="text-lg text-gray-600">
          {questionResults.totalAnswers} player{questionResults.totalAnswers !== 1 ? 's' : ''} answered
        </p>
      </div>

      {/* Question Display */}
      <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
        {/* Question Image */}
        {currentQuestion.imageUrl && (
          <div className="mb-6 text-center">
            <img
              src={currentQuestion.imageUrl}
              alt="Question illustration"
              className="w-full max-w-md mx-auto rounded-lg shadow-md"
            />
          </div>
        )}

        {/* Question Text */}
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            {currentQuestion.text}
          </h2>
        </div>

        {/* Multiple Choice Results */}
        {isMultipleChoice && (
          <div className="space-y-4">
            {currentQuestion.options.map((option, index) => {
              const count = questionResults.optionCounts[index] || 0;
              const percentage = getOptionPercentage(index);
              const isCorrect = index === currentQuestion.correctIndex;

              return (
                <div 
                  key={index}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    isCorrect 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        isCorrect ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-700'
                      }`}>
                        {String.fromCharCode(65 + index)}
                      </div>
                      <span className="font-medium text-gray-900">{option}</span>
                      {isCorrect && <CheckCircle className="w-5 h-5 text-green-500" />}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-600">
                        {count} ({percentage}%)
                      </span>
                      <Users className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-1000 ${
                        isCorrect ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Short Text Results */}
        {isShortText && (
          <div className="text-center">
            <div className="inline-block bg-green-50 rounded-lg p-6 border-2 border-green-200">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-3" />
              <p className="text-gray-600 mb-2">Correct Answer:</p>
              <p className="text-2xl font-bold text-green-800">
                {currentQuestion.correctText}
              </p>
            </div>
            
            <div className="mt-6 flex items-center justify-center space-x-6 text-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {/* In a real app, we'd track correct/incorrect for text answers */}
                  {Math.round(questionResults.totalAnswers * 0.7)}
                </div>
                <div className="text-sm text-gray-600">Correct</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {questionResults.totalAnswers - Math.round(questionResults.totalAnswers * 0.7)}
                </div>
                <div className="text-sm text-gray-600">Incorrect</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Continue Button */}
      <div className="text-center">
        <button
          onClick={handleContinue}
          className="btn-primary px-8 py-3 text-lg font-semibold inline-flex items-center space-x-2 hover:scale-105 transform transition-transform"
        >
          <SkipForward className="w-5 h-5" />
          <span>
            {currentQuestionIndex >= totalQuestions - 1 ? 'Show Final Results' : 'Next Question'}
          </span>
        </button>
      </div>

      {/* Stats Summary */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Question Stats</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">{questionResults.totalAnswers}</div>
            <div className="text-sm text-gray-600">Total Answers</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {isMultipleChoice 
                ? questionResults.optionCounts[currentQuestion.correctIndex] || 0
                : Math.round(questionResults.totalAnswers * 0.7)
              }
            </div>
            <div className="text-sm text-gray-600">Correct</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary-600">
              {Math.round(((questionResults.optionCounts[currentQuestion.correctIndex] || Math.round(questionResults.totalAnswers * 0.7)) / questionResults.totalAnswers) * 100)}%
            </div>
            <div className="text-sm text-gray-600">Accuracy</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{currentQuestion.timeLimitSec}s</div>
            <div className="text-sm text-gray-600">Time Limit</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reveal;