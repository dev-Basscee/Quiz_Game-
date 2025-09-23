import React from 'react';
import { RotateCcw, Download, Share2 } from 'lucide-react';
import useGameStore from '../state/store';

const GameEnded = () => {
  const { 
    leaderboard, 
    quiz,
    resetGame,
    pin
  } = useGameStore();

  const handlePlayAgain = () => {
    resetGame();
  };

  const handleDownloadResults = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Rank,Player,Score\n"
      + leaderboard.map(player => `${player.rank},${player.nickname},${player.score}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `quiz-results-${pin}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    const shareData = {
      title: `Quiz Results - ${quiz?.title}`,
      text: `I just hosted a quiz! Winner: ${leaderboard[0]?.nickname} with ${leaderboard[0]?.score} points!`,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        alert('Results copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const winner = leaderboard[0];
  const totalPlayers = leaderboard.length;

  return (
    <div className="max-w-4xl mx-auto text-center">
      {/* Confetti Animation */}
      <div className="relative mb-8">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Game Complete!
        </h1>
        <p className="text-xl text-gray-600">
          Thanks for playing {quiz?.title}
        </p>
      </div>

      {/* Winner Announcement */}
      {winner && (
        <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-2 border-yellow-200 rounded-xl p-8 mb-8">
          <div className="text-6xl mb-4">🏆</div>
          <h2 className="text-3xl font-bold text-yellow-800 mb-2">
            Congratulations {winner.nickname}!
          </h2>
          <p className="text-lg text-yellow-700">
            Winner with {winner.score.toLocaleString()} points
          </p>
        </div>
      )}

      {/* Final Stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="text-3xl font-bold text-primary-600 mb-2">
            {totalPlayers}
          </div>
          <div className="text-gray-600">Total Players</div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="text-3xl font-bold text-green-600 mb-2">
            {quiz?.questionCount || 0}
          </div>
          <div className="text-gray-600">Questions Played</div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="text-3xl font-bold text-yellow-600 mb-2">
            {winner?.score.toLocaleString() || 0}
          </div>
          <div className="text-gray-600">Highest Score</div>
        </div>
      </div>

      {/* Top 3 Players */}
      {leaderboard.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Final Rankings</h3>
          
          <div className="space-y-4">
            {leaderboard.slice(0, 5).map((player, index) => (
              <div 
                key={player.id}
                className={`flex items-center justify-between p-4 rounded-lg ${
                  index === 0 ? 'bg-yellow-50 border border-yellow-200' :
                  index === 1 ? 'bg-gray-50 border border-gray-200' :
                  index === 2 ? 'bg-orange-50 border border-orange-200' :
                  'bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    index === 0 ? 'bg-yellow-500 text-white' :
                    index === 1 ? 'bg-gray-400 text-white' :
                    index === 2 ? 'bg-orange-500 text-white' :
                    'bg-gray-300 text-gray-700'
                  }`}>
                    {index + 1}
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {player.nickname.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="font-semibold text-gray-900">{player.nickname}</span>
                  </div>
                </div>
                
                <div className="text-lg font-bold text-gray-900">
                  {player.score.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <button
          onClick={handlePlayAgain}
          className="btn-primary px-8 py-3 text-lg font-semibold inline-flex items-center space-x-2 hover:scale-105 transform transition-transform"
        >
          <RotateCcw className="w-5 h-5" />
          <span>Host Another Game</span>
        </button>
        
        <button
          onClick={handleDownloadResults}
          className="btn-secondary px-6 py-3 inline-flex items-center space-x-2"
        >
          <Download className="w-4 h-4" />
          <span>Download Results</span>
        </button>
        
        <button
          onClick={handleShare}
          className="btn-secondary px-6 py-3 inline-flex items-center space-x-2"
        >
          <Share2 className="w-4 h-4" />
          <span>Share Results</span>
        </button>
      </div>

      {/* Thank You Message */}
      <div className="mt-12 bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          Thank you for hosting!
        </h3>
        <p className="text-blue-800">
          We hope you and your players had a great time. Create another game anytime to keep the fun going!
        </p>
      </div>
    </div>
  );
};

export default GameEnded;