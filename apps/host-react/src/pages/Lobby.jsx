import React from 'react';
import { Play, Users, Wifi, WifiOff } from 'lucide-react';
import useGameStore from '../state/store';
import PinDisplay from '../components/PinDisplay';

const PlayerList = ({ players }) => {
  if (players.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500">Waiting for players to join...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {players.map((player) => (
        <div
          key={player.id}
          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-semibold">
                {player.nickname.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="font-medium text-gray-900">
              {player.nickname}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {player.score} pts
            </span>
            {player.connected ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-500" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

const Lobby = () => {
  const { 
    pin, 
    quiz, 
    players, 
    playerCount, 
    startGame 
  } = useGameStore();

  const handleStartGame = () => {
    if (playerCount > 0) {
      startGame();
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {quiz?.title}
        </h1>
        <p className="text-gray-600">
          {quiz?.description}
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* PIN Display */}
        <div className="lg:col-span-1">
          <PinDisplay pin={pin} />
          
          <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Game Info
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Questions:</span>
                <span className="font-medium">{quiz?.questionCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Players:</span>
                <span className="font-medium">{playerCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium text-green-600">Waiting</span>
              </div>
            </div>
          </div>

          {/* Start Game Button */}
          <div className="mt-6">
            <button
              onClick={handleStartGame}
              disabled={playerCount === 0}
              className={`w-full btn-success py-3 text-lg font-semibold inline-flex items-center justify-center space-x-2 ${
                playerCount === 0 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:scale-105 transform transition-transform'
              }`}
            >
              <Play className="w-5 h-5" />
              <span>Start Game</span>
            </button>
            
            {playerCount === 0 && (
              <p className="mt-2 text-sm text-gray-500 text-center">
                Need at least 1 player to start
              </p>
            )}
          </div>
        </div>

        {/* Player List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">
                Players ({playerCount})
              </h3>
            </div>
            <div className="card-body">
              <PlayerList players={players} />
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-6 bg-blue-50 rounded-lg p-6">
            <h4 className="font-semibold text-blue-900 mb-2">
              Instructions for Players
            </h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• Go to the player app and enter the PIN: <strong>{pin}</strong></p>
              <p>• Choose a unique nickname</p>
              <p>• Wait here in the lobby until the host starts the game</p>
              <p>• Answer questions quickly for bonus points!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Lobby;