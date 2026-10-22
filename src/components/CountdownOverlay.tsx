import React, { useEffect, useState } from 'react';
import { soundEngine } from '../utils/soundEngine';
import { Swords } from 'lucide-react';

interface CountdownOverlayProps {
  seconds: number;
  onFinished?: () => void;
  title?: string;
}

export const CountdownOverlay: React.FC<CountdownOverlayProps> = ({
  seconds,
  onFinished,
  title = 'READY FOR COMBAT',
}) => {
  const [displayNumber, setDisplayNumber] = useState<number>(seconds);
  const [isFight, setIsFight] = useState<boolean>(false);

  useEffect(() => {
    let count = seconds;
    setDisplayNumber(count);
    soundEngine.playCountdownTick(440);

    const interval = window.setInterval(() => {
      count--;
      if (count > 0) {
        setDisplayNumber(count);
        soundEngine.playCountdownTick(440 + (3 - count) * 110);
      } else if (count === 0) {
        setIsFight(true);
        soundEngine.playFightSound();
      } else {
        clearInterval(interval);
        if (onFinished) onFinished();
      }
    }, 900);

    return () => clearInterval(interval);
  }, [seconds]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md select-none animate-fade-in">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 text-cyan-400 font-bold uppercase tracking-widest text-sm mb-4 animate-pulse">
          <Swords className="w-5 h-5" />
          <span>{title}</span>
          <Swords className="w-5 h-5" />
        </div>

        {isFight ? (
          <div className="text-6xl sm:text-9xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-rose-500 to-cyan-400 scale-125 transform transition-transform duration-300 drop-shadow-[0_0_40px_rgba(244,63,94,0.9)] animate-pulse">
            FIGHT!
          </div>
        ) : (
          <div className="text-7xl sm:text-9xl font-black font-mono text-cyan-400 drop-shadow-[0_0_35px_rgba(6,182,212,0.9)] transform scale-110 transition-transform">
            {displayNumber}
          </div>
        )}

        <p className="mt-6 text-sm text-slate-300 font-medium">
          First correct answer scores +100 speed bonus!
        </p>
      </div>
    </div>
  );
};
