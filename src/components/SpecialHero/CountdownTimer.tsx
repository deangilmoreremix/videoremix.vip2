import React, { useState, useEffect } from 'react';

const CountdownTimer: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState({
    hours: 23,
    minutes: 59,
    seconds: 59
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        const newSeconds = prev.seconds - 1;

        if (newSeconds >= 0) {
          return { ...prev, seconds: newSeconds };
        }

        const newMinutes = prev.minutes - 1;

        if (newMinutes >= 0) {
          return { ...prev, minutes: newMinutes, seconds: 59 };
        }

        const newHours = prev.hours - 1;

        if (newHours >= 0) {
          return { hours: newHours, minutes: 59, seconds: 59 };
        }

        return { hours: 0, minutes: 0, seconds: 0 };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="flex items-center justify-center space-x-2"
      role="timer"
      aria-live="polite"
      aria-label={`Limited time offer: ${timeLeft.hours} hours, ${timeLeft.minutes} minutes, ${timeLeft.seconds} seconds remaining`}
    >
      <div className="bg-white/10 backdrop-blur-sm px-3 py-2 rounded-md">
        <div className="text-2xl font-mono font-bold text-white" aria-hidden="true">
          {String(timeLeft.hours).padStart(2, '0')}
        </div>
        <div className="text-xs text-white/70 text-center" aria-hidden="true">HOURS</div>
      </div>
      <div className="text-2xl font-bold text-white" aria-hidden="true">:</div>
      <div className="bg-white/10 backdrop-blur-sm px-3 py-2 rounded-md">
        <div className="text-2xl font-mono font-bold text-white" aria-hidden="true">
          {String(timeLeft.minutes).padStart(2, '0')}
        </div>
        <div className="text-xs text-white/70 text-center" aria-hidden="true">MINS</div>
      </div>
      <div className="text-2xl font-bold text-white" aria-hidden="true">:</div>
      <div className="bg-white/10 backdrop-blur-sm px-3 py-2 rounded-md">
        <div className="text-2xl font-mono font-bold text-white animate-pulse" aria-hidden="true">
          {String(timeLeft.seconds).padStart(2, '0')}
        </div>
        <div className="text-xs text-white/70 text-center" aria-hidden="true">SECS</div>
      </div>
    </div>
  );
};

export default CountdownTimer;