import React from 'react';
import { Crown, Settings, Users, Timer } from 'lucide-react';
import useGameStore from '../state/store';

const TopBar = () => {
  const { 
    status, 
    quiz, 
    currentQuestionIndex, 
    totalQuestions, 
    playerCount,
    timeRemaining,
    toggleSettings 
  } = useGameStore();

  const getStatusDisplay = () => {
    switch (status) {
      case 'lobby':
        return 'Waiting for players';
      case 'question':
        return `Question ${currentQuestionIndex + 1} of ${totalQuestions}`;
      case 'reveal':
        return 'Revealing answer';
      case 'leaderboard':
        return 'Leaderboard';
      case 'ended':
        return 'Game ended';
      default:
        return 'Quiz Host';
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Logo and game info */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Crown className="w-6 h-6 text-primary-600" />
              <h1 className="text-xl font-bold text-gray-900">Quiz Host</h1>
            </div>
            
            {quiz && (
              <div className="hidden md:block">
                <span className="text-sm text-gray-500">•</span>
                <span className="ml-2 text-sm font-medium text-gray-700">
                  {quiz.title}
                </span>
              </div>
            )}
          </div>

          {/* Center - Status */}
          <div className="flex-1 flex justify-center">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-600">
                {getStatusDisplay()}
              </span>
              
              {status === 'question' && timeRemaining > 0 && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Timer className="w-4 h-4" />
                  <span className="font-mono">{timeRemaining}s</span>
                </div>
              )}
            </div>
          </div>

          {/* Right side - Player count and settings */}
          <div className="flex items-center space-x-4">
            {(status === 'lobby' || status === 'question' || status === 'reveal' || status === 'leaderboard') && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                <span>{playerCount} player{playerCount !== 1 ? 's' : ''}</span>
              </div>
            )}
            
            <button
              onClick={toggleSettings}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Settings"
            >
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;