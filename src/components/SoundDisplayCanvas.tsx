import React, { useEffect, useRef, useState } from 'react';
import { Activity, Radio, Disc, Sparkles, Zap, Layers } from 'lucide-react';
import { Language } from '../types';
import { audioEngine } from '../audio/AudioEngine';

export type SoundEffectDisplayMode = 'spectrum' | 'circular' | 'waveform' | 'particles' | 'neon';

interface SoundDisplayCanvasProps {
  isPlaying: boolean;
  effectMode: SoundEffectDisplayMode;
  onEffectModeChange: (mode: SoundEffectDisplayMode) => void;
  coverUrl?: string;
  trackTitle?: string;
  trackArtist?: string;
  language: Language;
}

export const SoundDisplayCanvas: React.FC<SoundDisplayCanvasProps> = ({
  isPlaying,
  effectMode,
  onEffectModeChange,
  coverUrl = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500',
  trackTitle,
  trackArtist,
  language,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  const modeLabels: Record<SoundEffectDisplayMode, { gu: string; en: string; icon: React.ReactNode }> = {
    spectrum: {
      gu: 'સ્પેક્ટ્રમ બાર્સ',
      en: 'Spectrum Bars',
      icon: <Activity className="w-3.5 h-3.5 text-cyan-400" />,
    },
    circular: {
      gu: 'સર્ક્યુલર રિંગ',
      en: 'Circular Ring',
      icon: <Disc className="w-3.5 h-3.5 text-emerald-400" />,
    },
    waveform: {
      gu: 'સિનોસોઇડલ વેવ',
      en: 'Sine Wave',
      icon: <Radio className="w-3.5 h-3.5 text-indigo-400" />,
    },
    particles: {
      gu: '3D પાર્ટિકલ્સ',
      en: '3D Galaxy',
      icon: <Sparkles className="w-3.5 h-3.5 text-amber-400" />,
    },
    neon: {
      gu: 'સાયબર નિયોન',
      en: 'Cyber Neon',
      icon: <Zap className="w-3.5 h-3.5 text-rose-400" />,
    },
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;
    const particlesList = Array.from({ length: 45 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 3 + 1,
      vx: (Math.random() - 0.5) * 1.5,
      vy: (Math.random() - 0.5) * 1.5,
      hue: Math.random() * 360,
    }));

    const render = () => {
      const width = (canvas.width = canvas.parentElement?.clientWidth || 280);
      const height = (canvas.height = canvas.parentElement?.clientHeight || 280);

      // Clear dark canvas background
      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, width, height);

      // Get real audio frequency data or fallback simulation
      const freqData = audioEngine.getFrequencyData();
      const hasAudio = freqData && freqData.length > 0 && freqData.some((v) => v > 0);

      phase += 0.05;

      if (effectMode === 'spectrum') {
        // Mode 1: Equalizer Frequency Spectrum Bars
        const numBars = 28;
        const barWidth = (width - 20) / numBars;
        const centerX = width / 2;
        const centerY = height / 2;

        for (let i = 0; i < numBars; i++) {
          let val = 0;
          if (isPlaying) {
            if (hasAudio) {
              const dataIdx = Math.floor((i / numBars) * (freqData.length / 2));
              val = freqData[dataIdx] / 255;
            } else {
              val = 0.2 + 0.7 * Math.abs(Math.sin(phase + i * 0.25));
            }
          } else {
            val = 0.08;
          }

          const barHeight = val * (height * 0.75);
          const x = 10 + i * barWidth;
          const y = height - barHeight - 10;

          const gradient = ctx.createLinearGradient(0, height, 0, 0);
          gradient.addColorStop(0, '#06b6d4');
          gradient.addColorStop(0.5, '#10b981');
          gradient.addColorStop(1, '#a855f7');

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth - 2, barHeight, [4, 4, 0, 0]);
          ctx.fill();

          // Reflective glow on top
          if (isPlaying && val > 0.4) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(x, y - 2, barWidth - 2, 2);
          }
        }
      } else if (effectMode === 'circular') {
        // Mode 2: Circular Audio Pulse Ring
        const centerX = width / 2;
        const centerY = height / 2;
        const baseRadius = Math.min(width, height) * 0.28;

        const bassVal = isPlaying
          ? hasAudio
            ? freqData[2] / 255
            : 0.3 + 0.5 * Math.abs(Math.sin(phase))
          : 0.1;

        // Concentric Pulsing Audio Rings
        for (let r = 1; r <= 3; r++) {
          const ringRadius = baseRadius + r * 18 * (1 + bassVal * 0.8);
          ctx.beginPath();
          ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(6, 182, 212, ${0.8 - r * 0.22})`;
          ctx.lineWidth = 2.5;
          ctx.setLineDash([8, 6]);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Center Artwork Disc
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
        ctx.clip();
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, width, height);

        // Circular Ring Audio spikes
        ctx.restore();
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius + 4, 0, Math.PI * 2);
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 3;
        ctx.stroke();
      } else if (effectMode === 'waveform') {
        // Mode 3: Fluid Sinusoidal Waveform
        const centerY = height / 2;
        ctx.lineWidth = 3;

        for (let w = 0; w < 3; w++) {
          ctx.beginPath();
          const color = w === 0 ? '#06b6d4' : w === 1 ? '#a855f7' : '#10b981';
          ctx.strokeStyle = color;

          for (let x = 0; x < width; x += 3) {
            const amp = isPlaying ? 25 + w * 12 : 5;
            const freq = 0.02 + w * 0.01;
            const y = centerY + Math.sin(x * freq + phase + w) * amp * (isPlaying ? 1 : 0.2);
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      } else if (effectMode === 'particles') {
        // Mode 4: 3D Galaxy Particles
        const centerX = width / 2;
        const centerY = height / 2;

        particlesList.forEach((p) => {
          if (isPlaying) {
            p.x += p.vx * 1.5;
            p.y += p.vy * 1.5;
            if (p.x < 0 || p.x > width) p.vx *= -1;
            if (p.y < 0 || p.y > height) p.vy *= -1;
          }

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * (isPlaying ? 1.5 : 1), 0, Math.PI * 2);
          ctx.fillStyle = `hsl(${p.hue}, 90%, 60%)`;
          ctx.fill();

          // Connect nearby particles with glow lines
          particlesList.forEach((p2) => {
            const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
            if (dist < 45) {
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.strokeStyle = `rgba(6, 182, 212, ${1 - dist / 45})`;
              ctx.lineWidth = 0.6;
              ctx.stroke();
            }
          });
        });
      } else if (effectMode === 'neon') {
        // Mode 5: Cyber Neon Matrix Pulse
        const rows = 8;
        const cols = 12;
        const cellW = width / cols;
        const cellH = height / rows;

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const active =
              isPlaying && Math.abs(Math.sin(phase + r * 0.4 + c * 0.3)) > 0.4;
            ctx.fillStyle = active
              ? `hsl(${(r * 30 + phase * 50) % 360}, 100%, 50%)`
              : 'rgba(15, 23, 42, 0.4)';
            ctx.fillRect(c * cellW + 2, r * cellH + 2, cellW - 4, cellH - 4);
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, effectMode]);

  return (
    <div className="relative w-full aspect-square max-w-[270px] mx-auto rounded-3xl overflow-hidden border border-cyan-500/40 shadow-2xl bg-slate-950 flex flex-col justify-between p-3 group">
      {/* Dynamic Sound Effect Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full rounded-3xl" />

      {/* Overlay Badge Header */}
      <div className="relative z-10 flex items-center justify-between text-[10px] font-mono font-bold text-cyan-300 bg-slate-950/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-cyan-800/60">
        <span className="flex items-center gap-1">
          {modeLabels[effectMode].icon}
          <span>{language === 'gu' ? 'સાઉન્ડ ઇફેક્ટ ડિસ્પ્લે' : 'Sound Effect Display'}</span>
        </span>
        <span className="text-emerald-400 animate-pulse uppercase">
          {isPlaying ? (language === 'gu' ? '● લાઇવ ઇફેક્ટ' : '● LIVE EFFECT') : 'OFFLINE'}
        </span>
      </div>

      {/* Track Overlay Tag */}
      {trackTitle && (
        <div className="relative z-10 text-center bg-slate-950/80 backdrop-blur-md p-2 rounded-2xl border border-slate-800">
          <p className="font-extrabold text-xs text-slate-100 truncate">{trackTitle}</p>
          <p className="text-[10px] text-cyan-400 truncate">{trackArtist}</p>
        </div>
      )}

      {/* 🎛️ 5-Effect Mode Switcher Bar (ચાર-પાંચ જાતની ઇફેક્ટ સ્વિચર) */}
      <div className="relative z-10 flex items-center justify-center gap-1 bg-slate-950/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-800">
        {(['spectrum', 'circular', 'waveform', 'particles', 'neon'] as SoundEffectDisplayMode[]).map((m) => {
          const isActive = effectMode === m;
          return (
            <button
              key={m}
              onClick={() => onEffectModeChange(m)}
              className={`p-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1 transition-all ${
                isActive
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30 scale-105'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
              }`}
              title={language === 'gu' ? modeLabels[m].gu : modeLabels[m].en}
            >
              {modeLabels[m].icon}
            </button>
          );
        })}
      </div>
    </div>
  );
};
