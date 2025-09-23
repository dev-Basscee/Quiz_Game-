import React from 'react';
import { Copy, Check } from 'lucide-react';

const PinDisplay = ({ pin, className = '' }) => {
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(pin);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy PIN:', err);
    }
  };

  if (!pin) return null;

  return (
    <div className={`text-center ${className}`}>
      <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-primary-200">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Game PIN</h3>
        <div className="flex items-center justify-center space-x-2">
          <div className="text-4xl md:text-6xl font-bold text-primary-600 font-mono tracking-wider">
            {pin}
          </div>
          <button
            onClick={copyToClipboard}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Copy PIN"
          >
            {copied ? (
              <Check className="w-6 h-6 text-green-600" />
            ) : (
              <Copy className="w-6 h-6 text-gray-600" />
            )}
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Players can join at your game URL with this PIN
        </p>
      </div>
    </div>
  );
};

export default PinDisplay;