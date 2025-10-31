
import React from 'react';

interface TimerProps {
  seconds: number;
}

const formatTime = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
  const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

const Timer: React.FC<TimerProps> = ({ seconds }) => {
  return (
    <div className="font-mono text-4xl md:text-5xl lg:text-6xl text-cyan-300">
      {formatTime(seconds)}
    </div>
  );
};

export default Timer;
