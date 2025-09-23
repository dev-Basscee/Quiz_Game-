import React from 'react';
import { SkipForward, Clock } from 'lucide-react';
import useGameStore from '../state/store';
import TimerCircle from '../components/TimerCircle';

const OptionCard = ({ option, index, isCorrect, className = '' }) => {
  const colors = [
    'bg-red-100 border-red-200 text-red-800',
    'bg-blue-100 border-blue-200 text-blue-800', 
    'bg-green-100 border-green-200 text-green-800',
    'bg-yellow-100 border-yellow-200 text-yellow-800',
    'bg-purple-100 border-purple-200 text-purple-800',
    'bg-pink-100 border-pink-200 text-pink-800'
  ];

  const colorClass = colors[index % colors.length];
  const correctClass = isCorrect ? 'ring-2 ring-green-500 bg-green-50' : '';

  return (
    <div className={`p-4 rounded-lg border-2 transition-all ${colorClass} ${correctClass} ${className}`}>
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center font-bold text-sm">
          {String.fromCharCode(65 + index)}
        </div>
        <span className="font-medium">{option}</span>
      </div>
    </div>
  );
};

const Question = () => {
  const { 
    currentQuestion, 
    timeRemaining, 
    nextQuestion,
    currentQuestionIndex,
    totalQuestions
  } = useGameStore();

  if (!currentQuestion) {
    return (
      <div className="text-center">
        <p className="text-gray-600">Loading question...</p>
      </div>
    );
  }

  const handleSkipQuestion = () => {
    nextQuestion();
  };

  const isMultipleChoice = currentQuestion.type === 'multiple-choice' || currentQuestion.type === 'true-false';
  const isShortText = currentQuestion.type === 'short-text';

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </span>
          <span className="text-sm font-medium text-gray-600">
            {Math.round((currentQuestionIndex + 1) / totalQuestions * 100)}% Complete
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentQuestionIndex + 1) / totalQuestions * 100}%` }}
          />
        </div>
      </div>

      {/* Timer and Controls */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <TimerCircle 
            timeRemaining={timeRemaining} 
            totalTime={currentQuestion.timeLimitSec}
            size={80}
          />
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {timeRemaining}s
            </div>
            <div className="text-sm text-gray-600">
              Time remaining
            </div>
          </div>
        </div>

        <button
          onClick={handleSkipQuestion}
          className="btn-secondary inline-flex items-center space-x-2"
        >
          <SkipForward className="w-4 h-4" />
          <span>Skip Question</span>
        </button>
      </div>

      {/* Question Display */}
      <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
        {/* Question Image */}
        {currentQuestion.imageUrl && (
          <div className="mb-6">
            <img
              src={currentQuestion.imageUrl}
              alt="Question illustration"
              className="w-full max-w-md mx-auto rounded-lg shadow-md"
            />
          </div>
        )}

        {/* Question Text */}
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            {currentQuestion.text}
          </h2>
          
          {isShortText && (
            <p className="text-lg text-gray-600">
              Players will type their answer
            </p>
          )}
        </div>

        {/* Answer Options (for multiple choice) */}
        {isMultipleChoice && (
          <div className="grid md:grid-cols-2 gap-4">
            {currentQuestion.options.map((option, index) => (
              <OptionCard
                key={index}
                option={option}
                index={index}
                isCorrect={index === currentQuestion.correctIndex}
              />
            ))}
          </div>
        )}

        {/* Short Text Answer Display */}
        {isShortText && (
          <div className="text-center">
            <div className="inline-block bg-gray-100 rounded-lg p-4 border-2 border-dashed border-gray-300">
              <p className="text-gray-600 mb-2">Correct Answer:</p>
              <p className="text-xl font-semibold text-gray-900">
                {currentQuestion.correctText}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Question Info */}
      <div className="text-center text-sm text-gray-500">
        <p>Players are answering this question on their devices</p>
        <p className="mt-1">
          Points: {1000} base • Speed bonus up to {500} pts • 
          {currentQuestion.type === 'multiple-choice' && ' Multiple choice'}
          {currentQuestion.type === 'true-false' && ' True/False'}
          {currentQuestion.type === 'short-text' && ' Short answer'}
        </p>
      </div>
    </div>
  );
};

export default Question;