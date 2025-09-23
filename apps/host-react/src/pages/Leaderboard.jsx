import React from 'react';
import { SkipForward, Trophy, Medal, Award } from 'lucide-react';
import useGameStore from '../state/store';

const LeaderboardEntry = ({ player, index }) => {
  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-orange-500" />;
      default:
        return (
          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600">
            {rank}
          </div>
        );
    }
  };

  const getRankStyle = (rank) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200';
      case 2:
        return 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200';
      case 3:
        return 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200';
      default:
        return 'bg-white border-gray-200';
    }
  };

  return (
    <div className={`p-4 rounded-lg border-2 transition-all duration-500 hover:shadow-md ${getRankStyle(player.rank)}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {getRankIcon(player.rank)}
            <span className="text-lg font-bold text-gray-900">#{player.rank}</span>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold">
                {player.nickname.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <div className="font-semibold text-gray-900">{player.nickname}</div>
              {player.streak > 0 && (
                <div className="text-sm text-orange-600">
                  🔥 {player.streak} streak
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">{player.score.toLocaleString()}</div>
          <div className="text-sm text-gray-600">points</div>
        </div>
      </div>
    </div>
  );
};

const Leaderboard = () => {
  const { 
    leaderboard, 
    nextQuestion,
    currentQuestionIndex,
    totalQuestions
  } = useGameStore();

  const handleContinue = () => {
    nextQuestion();
  };

  const topPlayers = leaderboard.slice(0, 5);
  const isGameEnd = currentQuestionIndex >= totalQuestions - 1;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          {isGameEnd ? '🏆 Final Results' : '📊 Leaderboard'}
        </h1>
        <p className="text-lg text-gray-600">
          {isGameEnd 
            ? 'Congratulations to all players!' 
            : `After Question ${currentQuestionIndex + 1} of ${totalQuestions}`
          }
        </p>
      </div>

      {/* Podium for top 3 (if game ended) */}
      {isGameEnd && topPlayers.length >= 3 && (
        <div className="flex items-end justify-center space-x-4 mb-12">
          {/* 2nd Place */}
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-400 rounded-full flex items-center justify-center mb-3">
              <span className="text-white text-xl font-bold">
                {topPlayers[1]?.nickname.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="bg-gray-100 rounded-lg p-4 w-32">
              <div className="text-lg font-bold text-gray-900">{topPlayers[1]?.nickname}</div>
              <div className="text-2xl font-bold text-gray-600">{topPlayers[1]?.score.toLocaleString()}</div>
              <div className="text-sm text-gray-500">2nd Place</div>
            </div>
          </div>

          {/* 1st Place */}
          <div className="text-center">
            <div className="w-20 h-20 bg-yellow-500 rounded-full flex items-center justify-center mb-3">
              <span className="text-white text-2xl font-bold">
                {topPlayers[0]?.nickname.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 w-36">
              <Trophy className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
              <div className="text-lg font-bold text-gray-900">{topPlayers[0]?.nickname}</div>
              <div className="text-3xl font-bold text-yellow-600">{topPlayers[0]?.score.toLocaleString()}</div>
              <div className="text-sm text-gray-500">Winner!</div>
            </div>
          </div>

          {/* 3rd Place */}
          <div className="text-center">
            <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mb-3">
              <span className="text-white text-xl font-bold">
                {topPlayers[2]?.nickname.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 w-32">
              <div className="text-lg font-bold text-gray-900">{topPlayers[2]?.nickname}</div>
              <div className="text-2xl font-bold text-orange-600">{topPlayers[2]?.score.toLocaleString()}</div>
              <div className="text-sm text-gray-500">3rd Place</div>
            </div>
          </div>
        </div>
      )}

      {/* Full Leaderboard */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
        <div className="card-header">
          <h3 className="text-xl font-semibold text-gray-900">
            Top Players
          </h3>
        </div>
        <div className="card-body space-y-4">
          {topPlayers.map((player, index) => (
            <LeaderboardEntry key={player.id} player={player} index={index} />
          ))}
          
          {leaderboard.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No players to show
            </div>
          )}
        </div>
      </div>

      {/* Continue Button */}
      {!isGameEnd && (
        <div className="text-center">
          <button
            onClick={handleContinue}
            className="btn-primary px-8 py-3 text-lg font-semibold inline-flex items-center space-x-2 hover:scale-105 transform transition-transform"
          >
            <SkipForward className="w-5 h-5" />
            <span>Next Question</span>
          </button>
        </div>
      )}

      {/* Game Stats */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Game Stats</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">{leaderboard.length}</div>
            <div className="text-sm text-gray-600">Total Players</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary-600">
              {currentQuestionIndex + 1}
            </div>
            <div className="text-sm text-gray-600">Questions Answered</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-600">
              {topPlayers[0]?.score.toLocaleString() || 0}
            </div>
            <div className="text-sm text-gray-600">Highest Score</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {leaderboard.length > 0 
                ? Math.round(leaderboard.reduce((sum, p) => sum + p.score, 0) / leaderboard.length)
                : 0
              }
            </div>
            <div className="text-sm text-gray-600">Average Score</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;