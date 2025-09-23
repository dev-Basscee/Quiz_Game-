import React, { useState } from 'react';
import { Play, BookOpen } from 'lucide-react';
import useGameStore from '../state/store';

// Sample quizzes - in a real app this would come from an API
const sampleQuizzes = [
  {
    id: "general-knowledge-1",
    title: "General Knowledge Quiz",
    description: "Test your general knowledge with these fun questions!",
    questionCount: 10,
    difficulty: "Medium",
    topics: ["Geography", "History", "Science"]
  },
  {
    id: "science-quiz-1", 
    title: "Science & Nature Quiz",
    description: "Explore the wonders of science and nature!",
    questionCount: 10,
    difficulty: "Hard",
    topics: ["Biology", "Chemistry", "Physics", "Nature"]
  }
];

const CreateGame = () => {
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const { createGame, loading } = useGameStore();

  const handleCreateGame = () => {
    if (selectedQuiz) {
      createGame(selectedQuiz.id);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Create a Quiz Game
        </h1>
        <p className="text-lg text-gray-600">
          Select a quiz and start your own game session
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {sampleQuizzes.map((quiz) => (
          <div
            key={quiz.id}
            className={`card cursor-pointer transition-all duration-200 hover:shadow-md ${
              selectedQuiz?.id === quiz.id 
                ? 'ring-2 ring-primary-500 border-primary-200' 
                : 'hover:border-gray-300'
            }`}
            onClick={() => setSelectedQuiz(quiz)}
          >
            <div className="card-body">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {quiz.title}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {quiz.questionCount} questions • {quiz.difficulty}
                    </p>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedQuiz?.id === quiz.id
                    ? 'border-primary-500 bg-primary-500'
                    : 'border-gray-300'
                }`}>
                  {selectedQuiz?.id === quiz.id && (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  )}
                </div>
              </div>
              
              <p className="text-gray-600 mb-4">
                {quiz.description}
              </p>
              
              <div className="flex flex-wrap gap-2">
                {quiz.topics.map((topic) => (
                  <span
                    key={topic}
                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Game Button */}
      <div className="text-center">
        <button
          onClick={handleCreateGame}
          disabled={!selectedQuiz || loading}
          className={`btn-primary px-8 py-3 text-lg font-semibold inline-flex items-center space-x-2 ${
            (!selectedQuiz || loading) 
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:scale-105 transform transition-transform'
          }`}
        >
          <Play className="w-5 h-5" />
          <span>{loading ? 'Creating Game...' : 'Create Game'}</span>
        </button>
        
        {!selectedQuiz && (
          <p className="mt-2 text-sm text-gray-500">
            Please select a quiz to continue
          </p>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-12 bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          How it works
        </h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm text-blue-800">
          <div className="flex items-start space-x-2">
            <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold">1</span>
            </div>
            <div>
              <strong>Create Game:</strong> Select a quiz and generate a unique PIN
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold">2</span>
            </div>
            <div>
              <strong>Players Join:</strong> Share the PIN for players to join
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold">3</span>
            </div>
            <div>
              <strong>Host Game:</strong> Control the pace and see real-time results
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateGame;