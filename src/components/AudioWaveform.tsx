import React, { useEffect, useRef, useState } from 'react';
import { Volume2, Play, RotateCcw, Sparkles } from 'lucide-react';
import { ACCENTS, Accent, speechService } from '../utils/speech';

interface AudioWaveformProps {
  textToSpeak: string;
  defaultAccent?: Accent;
  autoPlay?: boolean;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  textToSpeak,
  defaultAccent = 'US',
  autoPlay = true,
}) => {
  const [selectedAccent, setSelectedAccent] = useState<Accent>(defaultAccent);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const phaseRef = useRef<number>(0);

  const handlePlayAudio = () => {
    setIsPlaying(true);
    speechService.speak(
      textToSpeak,
      selectedAccent,
      playbackRate,
      () => {
        setIsPlaying(true);
      },
      () => {
        setIsPlaying(false);
      }
    );
  };

  useEffect(() => {
    if (autoPlay && textToSpeak) {
      const timer = setTimeout(() => {
        handlePlayAudio();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [textToSpeak, selectedAccent, playbackRate]);

  // Animated Audio Visualizer on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;

    const render = () => {
      if (!running) return;
      phaseRef.current += isPlaying ? 0.15 : 0.03;
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      const numBars = 32;
      const barWidth = (width / numBars) * 0.65;
      const spacing = (width / numBars) * 0.35;

      for (let i = 0; i < numBars; i++) {
        const x = i * (barWidth + spacing) + spacing / 2;
        // Harmonic waves
        const wave =
          Math.sin(phaseRef.current + i * 0.35) *
          Math.cos(phaseRef.current * 0.7 + i * 0.2);

        let barHeight = isPlaying
          ? Math.max(10, Math.abs(wave) * (height * 0.78) + Math.random() * 12)
          : Math.max(6, Math.abs(wave) * 14 + 6);

        // Center vertically
        const y = (height - barHeight) / 2;

        // Gradient: cyan to purple neon
        const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
        if (isPlaying) {
          grad.addColorStop(0, '#38bdf8'); // sky/cyan
          grad.addColorStop(0.5, '#818cf8'); // indigo
          grad.addColorStop(1, '#ec4899'); // pink/magenta
        } else {
          grad.addColorStop(0, '#475569');
          grad.addColorStop(1, '#334155');
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 4);
        ctx.fill();

        // Neon glow if playing
        if (isPlaying && i % 4 === 0) {
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 10;
        } else {
          ctx.shadowBlur = 0;
        }
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      running = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying]);

  return (
    <div className="w-full bg-[#13172e]/90 border border-indigo-500/30 rounded-2xl p-5 shadow-2xl backdrop-blur-md relative overflow-hidden">
      {/* Background ambient light */}
      <div className="absolute -top-16 -right-16 w-36 h-36 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header controls: Accent selector & speed */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500/20 text-cyan-300 border border-indigo-500/40">
            <Volume2 className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
              Audio Challenge · Dynamic Listening
            </span>
            <p className="text-xs text-slate-400">Transcribe what you hear</p>
          </div>
        </div>

        {/* Accent Selector Tabs */}
        <div className="flex items-center bg-[#0d1022] p-1 rounded-xl border border-slate-800">
          {(Object.keys(ACCENTS) as Accent[]).map((acc) => {
            const item = ACCENTS[acc];
            const isSelected = selectedAccent === acc;
            return (
              <button
                key={acc}
                type="button"
                onClick={() => {
                  setSelectedAccent(acc);
                  speechService.stop();
                  setIsPlaying(false);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  isSelected
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/30 scale-105'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{item.flag}</span>
                <span>{item.code}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Animated Waveform Canvas */}
      <div className="relative w-full h-24 bg-[#090c1a] rounded-xl border border-slate-800/80 flex items-center justify-center px-4 py-2 overflow-hidden shadow-inner">
        <canvas
          ref={canvasRef}
          width={560}
          height={96}
          className="w-full h-full block"
        />

        {isPlaying && (
          <div className="absolute top-2 right-3 flex items-center gap-1 text-[10px] font-bold tracking-wider text-cyan-400 uppercase bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-500/40 animate-pulse">
            <Sparkles className="w-3 h-3" />
            Playing ({selectedAccent})
          </div>
        )}
      </div>

      {/* Controls Bar: Play, Repeat, Slow speed toggle */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePlayAudio}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              isPlaying
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-lg shadow-cyan-500/20'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 shadow-md shadow-cyan-500/30 active:scale-95'
            }`}
          >
            {isPlaying ? (
              <>
                <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                Listening...
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                Play Audio
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => handlePlayAudio()}
            title="Replay Audio"
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Speed toggle: 0.8x / 1.0x */}
        <div className="flex items-center gap-1 bg-[#0b0e20] p-1 rounded-lg border border-slate-800 text-[11px] font-semibold">
          <button
            type="button"
            onClick={() => setPlaybackRate(0.8)}
            className={`px-2.5 py-1 rounded transition-all ${
              playbackRate === 0.8
                ? 'bg-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            0.8x Slow
          </button>
          <button
            type="button"
            onClick={() => setPlaybackRate(1.0)}
            className={`px-2.5 py-1 rounded transition-all ${
              playbackRate === 1.0
                ? 'bg-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            1.0x Normal
          </button>
        </div>
      </div>
    </div>
  );
};
