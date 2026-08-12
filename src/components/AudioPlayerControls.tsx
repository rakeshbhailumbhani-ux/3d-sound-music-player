import React from 'react';
import {
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Shuffle,
  Repeat,
  Repeat1,
  Gauge,
  Clock,
  Zap,
  Download,
  Sparkles,
  Music2,
} from 'lucide-react';
import {
  Track,
  PlayerState,
  RepeatMode,
  Language,
  MicrosecondDelaySettings,
  Spatial3DSettings,
} from '../types';
import { translations } from '../utils/i18n';

interface AudioPlayerControlsProps {
  currentTrack: Track | null;
  playerState: PlayerState;
  microDelaySettings: MicrosecondDelaySettings;
  spatialSettings?: Spatial3DSettings;
  onPlayPause: () => void;
  onStop: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onSeek: (seconds: number) => void;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
  onShuffleToggle: () => void;
  onRepeatToggle: () => void;
  onSpeedChange: (speed: number) => void;
  onPitchChange?: (pitchSemi: number) => void;
  onCrossfadeChange?: (sec: number) => void;
  onToggleVolumeNormalization?: () => void;
  language: Language;
  onToggleAuto20ms?: () => void;
  onSaveNewCopy?: (format?: 'mp3' | 'wav') => void;
  isSavingCopy?: boolean;
  onMicroDelayChange?: (updated: Partial<MicrosecondDelaySettings>) => void;
  onSpatialChange?: (updated: Partial<Spatial3DSettings>) => void;
}

export const AudioPlayerControls: React.FC<AudioPlayerControlsProps> = ({
  currentTrack,
  playerState,
  microDelaySettings,
  spatialSettings,
  onPlayPause,
  onStop,
  onPrevious,
  onNext,
  onSeek,
  onVolumeChange,
  onMuteToggle,
  onShuffleToggle,
  onRepeatToggle,
  onSpeedChange,
  onPitchChange,
  onCrossfadeChange,
  onToggleVolumeNormalization,
  language,
  onToggleAuto20ms,
  onSaveNewCopy,
  isSavingCopy = false,
  onMicroDelayChange,
  onSpatialChange,
}) => {
  const t = translations[language];

  const is20msActive =
    microDelaySettings.enabled &&
    (microDelaySettings.leftDelayUs === 20 || microDelaySettings.rightDelayUs === 20);

  const formatTime = (timeInSec: number) => {
    if (isNaN(timeInSec) || timeInSec < 0) return '0:00';
    const m = Math.floor(timeInSec / 60);
    const s = Math.floor(timeInSec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent =
    playerState.duration > 0 ? (playerState.currentTime / playerState.duration) * 100 : 0;

  return (
    <div className="bg-slate-900/95 border border-cyan-500/30 rounded-2xl p-5 md:p-6 text-white shadow-2xl backdrop-blur-xl relative overflow-hidden">
      {/* Top Track Header Details */}
      <div className="flex flex-col md:flex-row items-center gap-5">
        {/* Album Cover Art with Rotating Disk Effect */}
        <div className="relative group flex-shrink-0">
          <div
            className={`w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-cyan-500/40 shadow-xl shadow-cyan-500/20 relative ${
              playerState.isPlaying ? 'animate-pulse' : ''
            }`}
          >
            <img
              src={currentTrack?.cover || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300'}
              alt={currentTrack?.title || 'Track Cover'}
              className={`w-full h-full object-cover transition-transform duration-700 ${
                playerState.isPlaying ? 'scale-105' : ''
              }`}
            />
            {/* Overlay Disc Center */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-2">
              <span className="text-[10px] font-mono text-cyan-300 bg-slate-900/90 px-1.5 py-0.5 rounded border border-cyan-500/30">
                {currentTrack?.genre || '3D Audio'}
              </span>
            </div>
          </div>

          {/* Active 3D Delay Indicator Badge */}
          {microDelaySettings.enabled && (
            <div className="absolute -top-2 -right-2 bg-gradient-to-r from-cyan-500 to-indigo-600 text-slate-950 font-bold font-mono text-[10px] px-2 py-0.5 rounded-full shadow-lg border border-white/40 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{microDelaySettings.leftDelayUs}ms / {microDelaySettings.rightDelayUs}ms</span>
            </div>
          )}
        </div>

        {/* Title & Artist & Playback Controls */}
        <div className="flex-grow w-full space-y-3 text-center md:text-left">
          <div>
            <h3 className="text-xl font-extrabold text-white line-clamp-1 flex items-center justify-center md:justify-start gap-2">
              {currentTrack?.title || 'No Track Selected'}
            </h3>
            <p className="text-sm text-cyan-300/80 font-medium mt-0.5">
              {currentTrack?.artist || '3D Sound Player'} •{' '}
              <span className="text-slate-400 font-normal">{currentTrack?.album}</span>
            </p>
          </div>

          {/* Quick 20ms Haas Auto-Tool, L/R Mute & Save New Track Copy Actions */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1">
            {/* Independent L / R Channel Mute Buttons */}
            {onMicroDelayChange && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onMicroDelayChange({ leftMuted: !microDelaySettings.leftMuted })}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-md ${
                    microDelaySettings.leftMuted
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 ring-1 ring-rose-500'
                      : 'bg-slate-800/90 hover:bg-slate-700 text-cyan-300 border-cyan-500/40'
                  }`}
                  title="Toggle Left Channel Mute"
                >
                  {microDelaySettings.leftMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
                  <span>{microDelaySettings.leftMuted ? 'L MUTE (ON)' : 'L MUTE'}</span>
                </button>

                <button
                  onClick={() => onMicroDelayChange({ rightMuted: !microDelaySettings.rightMuted })}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-md ${
                    microDelaySettings.rightMuted
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 ring-1 ring-rose-500'
                      : 'bg-slate-800/90 hover:bg-slate-700 text-indigo-300 border-indigo-500/40'
                  }`}
                  title="Toggle Right Channel Mute"
                >
                  {microDelaySettings.rightMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-indigo-400" />}
                  <span>{microDelaySettings.rightMuted ? 'R MUTE (ON)' : 'R MUTE'}</span>
                </button>
              </div>
            )}

            <button
              onClick={onToggleAuto20ms}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-md ${
                is20msActive
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-amber-500/30'
                  : 'bg-slate-800/90 hover:bg-slate-700 text-amber-300 border-amber-500/40'
              }`}
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>⚡ 20ms Auto Delay</span>
            </button>

            {onSaveNewCopy && (
              <button
                onClick={() => onSaveNewCopy('mp3')}
                disabled={isSavingCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs shadow-md shadow-emerald-500/25 transition-all active:scale-95 border border-emerald-300"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isSavingCopy ? 'સેવિંગ...' : '💾 સેવ નવી કોપી'}</span>
              </button>
            )}

            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-1 rounded-md border border-emerald-800/60 flex items-center gap-1">
              <span>✓ ઓરિજિનલ અકબંધ</span>
            </span>
          </div>

          {/* Progress Seekbar */}
          <div className="space-y-1">
            <div className="relative flex items-center">
              <input
                type="range"
                min={0}
                max={playerState.duration || 100}
                value={playerState.currentTime}
                onChange={(e) => onSeek(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>
            <div className="flex justify-between text-xs font-mono text-slate-400">
              <span>{formatTime(playerState.currentTime)}</span>
              <span>{formatTime(playerState.duration)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Playback Buttons Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-slate-800">
        {/* Shuffle & Speed Controls */}
        <div className="flex items-center gap-2">
          {/* Shuffle Toggle */}
          <button
            onClick={onShuffleToggle}
            className={`p-2.5 rounded-xl border transition-all ${
              playerState.shuffle
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
            title={t.shuffle}
          >
            <Shuffle className="w-4 h-4" />
          </button>

          {/* Repeat Toggle */}
          <button
            onClick={onRepeatToggle}
            className={`p-2.5 rounded-xl border transition-all ${
              playerState.repeat !== 'off'
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
            title={
              playerState.repeat === 'one'
                ? t.repeatOne
                : playerState.repeat === 'all'
                ? t.repeatAll
                : t.repeatOff
            }
          >
            {playerState.repeat === 'one' ? (
              <Repeat1 className="w-4 h-4" />
            ) : (
              <Repeat className="w-4 h-4" />
            )}
          </button>

          {/* Speed Selector */}
          <div className="flex items-center gap-1 bg-slate-800 px-2 py-1.5 rounded-xl border border-slate-700 text-xs">
            <Gauge className="w-3.5 h-3.5 text-cyan-400" />
            <select
              value={playerState.playbackRate}
              onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
              className="bg-transparent text-cyan-300 font-mono font-bold focus:outline-none cursor-pointer"
            >
              <option value={0.5} className="bg-slate-900">0.5x</option>
              <option value={0.75} className="bg-slate-900">0.75x</option>
              <option value={1.0} className="bg-slate-900">1.0x</option>
              <option value={1.25} className="bg-slate-900">1.25x</option>
              <option value={1.5} className="bg-slate-900">1.5x</option>
              <option value={2.0} className="bg-slate-900">2.0x</option>
            </select>
          </div>

          {/* Real-time Pitch Control (+/- 1 Octave / 12 semitones) */}
          {onPitchChange && (
            <div className="flex items-center gap-1.5 bg-slate-800/90 px-2.5 py-1.5 rounded-xl border border-indigo-500/40 text-xs">
              <Music2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="text-[11px] font-bold text-indigo-300 hidden sm:inline whitespace-nowrap">
                Pitch
              </span>
              <input
                type="range"
                min={-12}
                max={12}
                step={1}
                value={playerState.pitchSemi ?? 0}
                onChange={(e) => onPitchChange(parseInt(e.target.value, 10))}
                className="w-16 sm:w-20 h-1.5 bg-slate-900 rounded appearance-none cursor-pointer accent-indigo-400"
                title={t.pitchTitle}
              />
              <button
                onClick={() => onPitchChange(0)}
                className="font-mono font-extrabold text-[11px] text-indigo-300 bg-indigo-950/80 px-1.5 py-0.5 rounded border border-indigo-500/30 hover:bg-indigo-900 hover:text-white transition-all min-w-[32px] text-center"
                title={t.pitchReset}
              >
                {playerState.pitchSemi > 0 ? `+${playerState.pitchSemi}` : playerState.pitchSemi ?? 0}st
              </button>
            </div>
          )}

          {/* Crossfade Duration Control (0-10s) */}
          {onCrossfadeChange && (
            <div className="flex items-center gap-1.5 bg-slate-800/90 px-2.5 py-1.5 rounded-xl border border-amber-500/40 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-[11px] font-bold text-amber-300 hidden sm:inline whitespace-nowrap">
                Crossfade
              </span>
              <input
                type="range"
                min={0}
                max={10}
                step={0.5}
                value={playerState.crossfadeDuration ?? 3}
                onChange={(e) => onCrossfadeChange(parseFloat(e.target.value))}
                className="w-16 sm:w-20 h-1.5 bg-slate-900 rounded appearance-none cursor-pointer accent-amber-400"
                title={`Crossfade duration: ${playerState.crossfadeDuration ?? 3}s`}
              />
              <span className="font-mono font-extrabold text-[11px] text-amber-400 min-w-[24px]">
                {playerState.crossfadeDuration === 0 ? 'OFF' : `${playerState.crossfadeDuration}s`}
              </span>
            </div>
          )}

          {/* Volume Normalizer Toggle */}
          {onToggleVolumeNormalization && (
            <button
              onClick={onToggleVolumeNormalization}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-md ${
                playerState.volumeNormalizationEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-emerald-500/10'
                  : 'bg-slate-800/90 text-slate-400 border-slate-700/80 hover:text-slate-200'
              }`}
              title={t.volumeNormTitle}
            >
              <Volume2 className={`w-3.5 h-3.5 ${playerState.volumeNormalizationEnabled ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">
                {playerState.volumeNormalizationEnabled ? t.volumeNormOn : t.volumeNormOff}
              </span>
            </button>
          )}
        </div>

        {/* Core Center Play / Pause / Skip Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={onPrevious}
            className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all hover:scale-105"
            title={t.previous}
          >
            <SkipBack className="w-5 h-5" />
          </button>

          <button
            onClick={onPlayPause}
            className="p-4 rounded-2xl bg-gradient-to-r from-cyan-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-slate-950 font-bold shadow-lg shadow-cyan-500/40 transition-all hover:scale-105 active:scale-95"
            title={playerState.isPlaying ? t.pause : t.play}
          >
            {playerState.isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
          </button>

          <button
            onClick={onStop}
            className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all hover:scale-105"
            title={t.stop}
          >
            <Square className="w-5 h-5 text-red-400" />
          </button>

          <button
            onClick={onNext}
            className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all hover:scale-105"
            title={t.next}
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        {/* Volume & Mute */}
        <div className="flex items-center gap-2">
          <button
            onClick={onMuteToggle}
            className="p-2 text-slate-300 hover:text-cyan-400 transition-all"
            title={playerState.isMuted ? t.unmute : t.mute}
          >
            {playerState.isMuted || playerState.volume === 0 ? (
              <VolumeX className="w-5 h-5 text-red-400" />
            ) : (
              <Volume2 className="w-5 h-5 text-cyan-400" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={playerState.isMuted ? 0 : playerState.volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="w-24 h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
          />
        </div>
      </div>
    </div>
  );
};
