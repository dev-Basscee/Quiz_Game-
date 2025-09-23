import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import useGameStore from './state/store';
import TopBar from './components/TopBar';
import ErrorBoundary from './components/ErrorBoundary';
import CreateGame from './pages/CreateGame';
import Lobby from './pages/Lobby';
import Question from './pages/Question';
import Reveal from './pages/Reveal';
import Leaderboard from './pages/Leaderboard';
import GameEnded from './pages/GameEnded';

function App() {
  const { 
    status, 
    connected, 
    error, 
    connectSocket, 
    disconnectSocket,
    clearError 
  } = useGameStore();

  useEffect(() => {
    connectSocket();
    
    return () => {
      disconnectSocket();
    };
  }, [connectSocket, disconnectSocket]);

  const renderGameContent = () => {
    switch (status) {
      case 'idle':
        return <CreateGame />;
      case 'lobby':
        return <Lobby />;
      case 'question':
        return <Question />;
      case 'reveal':
        return <Reveal />;
      case 'leaderboard':
        return <Leaderboard />;
      case 'ended':
        return <GameEnded />;
      default:
        return <CreateGame />;
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <TopBar />
        
        {/* Connection Status */}
        {!connected && (
          <div className="bg-red-500 text-white px-4 py-2 text-center">
            <span>⚠️ Disconnected from server. Trying to reconnect...</span>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 relative mx-4 mt-4 rounded">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
            <button
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
              onClick={clearError}
            >
              <span className="sr-only">Dismiss</span>
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          {renderGameContent()}
        </main>
      </div>
    </ErrorBoundary>
  );
}

export default App;