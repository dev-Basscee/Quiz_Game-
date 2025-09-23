import React from 'react';

const TimerCircle = ({ timeRemaining, totalTime, size = 64 }) => {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = timeRemaining / totalTime;
  const strokeDashoffset = circumference * (1 - progress);

  const getColorClass = () => {
    if (progress > 0.5) return 'stroke-green-500';
    if (progress > 0.25) return 'stroke-yellow-500';
    return 'stroke-red-500';
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="4"
          fill="transparent"
          className="text-gray-200"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="4"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`transition-all duration-1000 ease-linear ${getColorClass()}`}
        />
      </svg>
      
      {/* Timer text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-gray-700">
          {timeRemaining}
        </span>
      </div>
    </div>
  );
};

export default TimerCircle;