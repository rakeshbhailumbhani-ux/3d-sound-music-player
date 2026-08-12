import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Volume2,
  VolumeX,
  Clock,
  Compass,
  SlidersHorizontal,
  Music,
  Headphones,
  Sparkles,
  Wifi,
  Battery,
  Signal,
  Bell,
  Sliders,
  ChevronDown,
  RotateCw,
  Heart,
  Smartphone,
  Share2,
  MoreVertical,
  Plus,
  Trash2,
  ListMusic,
  DownloadCloud,
  Download,
  Music2,
  Layers,
  Shield,
  Gauge,
  Activity,
  BarChart2,
  Disc,
  Zap,
  Radio,
  Image as ImageIcon,
  FolderDown,
} from 'lucide-react';
import { AudioConverterPanel } from './AudioConverterPanel';
import { SoundDisplayCanvas, SoundEffectDisplayMode } from './SoundDisplayCanvas';
import {
  Track,
  MicrosecondDelaySettings,
  Spatial3DSettings,
  EQSettings,
  PlayerState,
  RepeatMode,
  Language,
} from '../types';
import { translations } from '../utils/i18n';
import { audioEngine } from '../audio/AudioEngine';

interface AndroidMobilePlayerProps {
  tracks: Track[];
  currentTrack: Track | null;
  currentTrackIndex: number;
  playerState: PlayerState;
  microDelaySettings: MicrosecondDelaySettings;
  spatialSettings: Spatial3DSettings;
  eqSettings: EQSettings;
  language: Language;
  onPlayPause: () => void;
  onStop?: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onSeek: (seconds: number) => void;
  onVolumeChange: (vol: number) => void;
  onMuteToggle: () => void;
  onShuffleToggle: () => void;
  onRepeatToggle: () => void;
  onSelectTrack: (track: Track) => void;
  onMicroDelayChange: (updated: Partial<MicrosecondDelaySettings>) => void;
  onSpatialChange: (updated: Partial<Spatial3DSettings>) => void;
  onEQChange: (updated: Partial<EQSettings>) => void;
  onAddCustomTrack: (file: File) => void;
  onRemoveTrack: (id: string) => void;
  onToggleAuto20ms?: () => void;
  onSaveNewCopy?: (format?: 'mp3' | 'wav') => void;
  isSavingCopy?: boolean;
  onCrossfadeChange?: (sec: number) => void;
  onToggleVolumeNormalization?: () => void;
  onPitchChange?: (pitchSemi: number) => void;
  onOpenSyncPreset?: () => void;
  onOpenInstallModal?: () => void;
}

export const AndroidMobilePlayer: React.FC<AndroidMobilePlayerProps> = ({
  tracks,
  currentTrack,
  currentTrackIndex,
  playerState,
  microDelaySettings,
  spatialSettings,
  eqSettings,
  language,
  onPlayPause,
  onPrevious,
  onNext,
  onSeek,
  onVolumeChange,
  onMuteToggle,
  onShuffleToggle,
  onRepeatToggle,
  onSelectTrack,
  onMicroDelayChange,
  onSpatialChange,
  onEQChange,
  onAddCustomTrack,
  onRemoveTrack,
  onToggleAuto20ms,
  onSaveNewCopy,
  isSavingCopy = false,
  onCrossfadeChange,
  onToggleVolumeNormalization,
  onPitchChange,
  onOpenSyncPreset,
  onOpenInstallModal,
}) => {
  const [mobileTab, setMobileTab] = useState<'player' | 'delay' | 'spatial' | 'eq' | 'playlist' | 'convert'>('player');
  const [showNotificationShade, setShowNotificationShade] = useState(false);
  const [currentTimeStr, setCurrentTimeStr] = useState('12:45');
  const [isLiked, setIsLiked] = useState(false);
  const [showEffectDisplay, setShowEffectDisplay] = useState(true);
  const [soundDisplayMode, setSoundDisplayMode] = useState<SoundEffectDisplayMode>('spectrum');

  const t = translations[language];

  const handleShareTrack = async () => {
    if (navigator.share && currentTrack) {
      try {
        await navigator.share({
          title: currentTrack.title,
          text: `Listen to 3D Audio: ${currentTrack.title} - ${currentTrack.artist}`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share dismissed', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert(language === 'gu' ? 'લિંક કોપી કરી લીધી છે!' : 'Link copied to clipboard!');
    }
  };

  // Update mobile status bar clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const mins = now.getMinutes().toString().padStart(2, '0');
      setCurrentTimeStr(`${hours}:${mins}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const delayDifferenceUs = Math.abs(
    microDelaySettings.leftDelayUs - microDelaySettings.rightDelayUs
  );

  return (
    <div className="max-w-md mx-auto w-full">
      {/* Android Device Outer Chassis Frame */}
      <div className="relative bg-slate-950 rounded-[44px] p-3 shadow-2xl border-4 border-slate-800 ring-1 ring-cyan-500/20 overflow-hidden">
        
        {/* Android Punch Hole Camera Notch */}
        <div className="absolute top-5 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-black border border-slate-800 z-50 flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
        </div>

        {/* Android Screen Display */}
        <div className="relative bg-slate-900 rounded-[34px] overflow-hidden flex flex-col min-h-[720px] max-h-[800px] border border-slate-800/80">

          {/* 1. Android Native System Status Bar */}
          <div className="flex items-center justify-between px-6 pt-3 pb-2 text-[11px] font-semibold text-slate-300 bg-slate-950/60 backdrop-blur-md z-40">
            <span>{currentTimeStr}</span>
            <div className="flex items-center gap-2">
              <span className="flex items-center text-cyan-400 gap-0.5 text-[10px] font-mono bg-cyan-950/50 px-1.5 py-0.5 rounded border border-cyan-800/50">
                <Headphones className="w-3 h-3 text-cyan-400" />
                3D 300ms
              </span>
              <Wifi className="w-3.5 h-3.5 text-slate-300" />
              <Signal className="w-3.5 h-3.5 text-slate-300" />
              <div className="flex items-center gap-1">
                <span className="text-[10px]">98%</span>
                <Battery className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
              </div>
            </div>
          </div>

          {/* Android Notification Pull-Down Toggle Bar */}
          <div className="px-4 py-1.5 bg-slate-950/80 border-b border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
            <button
              onClick={() => setShowNotificationShade(!showNotificationShade)}
              className="flex items-center gap-1.5 text-cyan-400 font-medium hover:text-cyan-300 transition-colors"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>{t.notificationWidget}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showNotificationShade ? 'rotate-180' : ''}`} />
            </button>

            <span className="text-[10px] text-slate-500 font-mono">
              L:{microDelaySettings.leftDelayUs}ms | R:{microDelaySettings.rightDelayUs}ms
            </span>
          </div>

          {/* Expandable Android Notification Media Shade */}
          {showNotificationShade && (
            <div className="bg-slate-950/95 p-4 border-b border-cyan-500/30 space-y-3 z-30 animate-in slide-in-from-top duration-300 shadow-xl">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1 font-bold text-cyan-400">
                  <Smartphone className="w-3.5 h-3.5" />
                  {t.androidNotificationTitle}
                </span>
                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-full text-slate-300">
                  Android Media Player
                </span>
              </div>

              {/* Notification Media Tile */}
              {currentTrack && (
                <div className="flex items-center gap-3 bg-slate-900 p-3 rounded-2xl border border-slate-800">
                  <img
                    src={currentTrack.cover}
                    alt={currentTrack.title}
                    className="w-12 h-12 rounded-xl object-cover shadow-md border border-slate-700"
                  />
                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-xs text-slate-100 truncate">{currentTrack.title}</h5>
                    <p className="text-[11px] text-slate-400 truncate">{currentTrack.artist}</p>
                    <div className="flex items-center gap-1 text-[10px] text-cyan-400 font-mono mt-0.5">
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                      ITD 3D Delay: {delayDifferenceUs}ms
                    </div>
                  </div>
                  <button
                    onClick={onPlayPause}
                    className="p-2.5 rounded-full bg-cyan-500 text-slate-950 shadow-md hover:scale-105 active:scale-95 transition-all"
                  >
                    {playerState.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-slate-950" />}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Main App Content View Switcher */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            
            {/* VIEW 1: NOW PLAYING MAIN PLAYER SCREEN */}
            {mobileTab === 'player' && (
              <div className="flex flex-col h-full justify-between space-y-4">
                
                {/* Header Action Row with Share & Save Buttons */}
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Music className="w-3.5 h-3.5 text-cyan-400" />
                    {t.nowPlaying}
                  </span>
                  
                  <div className="flex items-center gap-1.5">
                    {/* Display Mode Toggle (Display Effect vs Cover Art) */}
                    <button
                      onClick={() => setShowEffectDisplay(!showEffectDisplay)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all border ${
                        showEffectDisplay
                          ? 'bg-cyan-950 text-cyan-300 border-cyan-700'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                      title={language === 'gu' ? 'ઇફેક્ટ ડિસ્પ્લે / કવર મોડ સ્વિચ કરો' : 'Toggle Effect Display / Cover Art'}
                    >
                      {showEffectDisplay ? <Radio className="w-3 h-3 text-cyan-400" /> : <ImageIcon className="w-3 h-3 text-purple-400" />}
                      <span>{showEffectDisplay ? (language === 'gu' ? 'ઇફેક્ટ' : 'Effect') : (language === 'gu' ? 'કવર' : 'Cover')}</span>
                    </button>

                    {/* Quick Install Mobile App Button */}
                    {onOpenInstallModal && (
                      <button
                        onClick={onOpenInstallModal}
                        className="px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 bg-gradient-to-r from-cyan-500 to-emerald-400 text-slate-950 border border-cyan-300 shadow-sm active:scale-95 transition-all"
                        title={language === 'gu' ? 'મોબાઇલમાં ઇન્સ્ટોલ કરો' : 'Install Mobile App'}
                      >
                        <Download className="w-3 h-3 text-slate-950 animate-bounce" />
                        <span>{language === 'gu' ? 'ઇન્સ્ટોલ' : 'Install'}</span>
                      </button>
                    )}

                    {/* Quick Share Button */}
                    <button
                      onClick={handleShareTrack}
                      className="p-1.5 text-slate-300 hover:text-cyan-300 bg-slate-800/80 rounded-lg transition-colors"
                      title={language === 'gu' ? 'ગીત / લિંક શેર કરો' : 'Share Song'}
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Like Heart Button */}
                    <button
                      onClick={() => setIsLiked(!isLiked)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isLiked ? 'text-rose-500 bg-rose-950/60' : 'text-slate-400 hover:text-slate-200 bg-slate-800/80'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-500' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Main Player Visual Display: Sound Effect Display OR Album Art */}
                {showEffectDisplay ? (
                  <div className="my-1">
                    <SoundDisplayCanvas
                      isPlaying={playerState.isPlaying}
                      effectMode={soundDisplayMode}
                      onEffectModeChange={setSoundDisplayMode}
                      coverUrl={currentTrack?.cover}
                      trackTitle={currentTrack?.title}
                      trackArtist={currentTrack?.artist}
                      language={language}
                    />
                  </div>
                ) : (
                  /* Album Art with Rotating Vinyl Disc Simulation */
                  <div className="relative my-2 aspect-square max-w-[260px] mx-auto w-full group">
                    <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 rounded-3xl blur-xl" />
                    
                    <div className="relative w-full h-full rounded-3xl overflow-hidden border border-slate-700/60 shadow-2xl bg-slate-950 flex items-center justify-center">
                      <img
                        src={currentTrack?.cover || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500'}
                        alt={currentTrack?.title}
                        className={`w-full h-full object-cover transition-transform duration-700 ${
                          playerState.isPlaying ? 'scale-105' : 'scale-100 filter brightness-90'
                        }`}
                      />

                      {/* Vinyl Center Badge */}
                      <div className={`absolute w-12 h-12 rounded-full border-2 border-slate-900 bg-slate-950/80 backdrop-blur-md flex items-center justify-center shadow-lg ${
                        playerState.isPlaying ? 'animate-spin' : ''
                      }`} style={{ animationDuration: '6s' }}>
                        <div className="w-3 h-3 rounded-full bg-cyan-400" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Track Details & 3D Badge */}
                <div className="text-center space-y-1">
                  <h3 className="text-base font-bold text-slate-100 truncate px-2">
                    {currentTrack?.title || '3D Audio Track'}
                  </h3>
                  <p className="text-xs text-slate-400 truncate">
                    {currentTrack?.artist || 'Unknown Artist'} • {currentTrack?.album || '3D Sound'}
                  </p>
                  
                  {/* Quick 3D Delay Millisecond Info Chip */}
                  <div className="inline-flex items-center gap-1.5 mt-1 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/60 text-[11px] text-cyan-300 font-mono shadow-sm">
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    <span>L: {microDelaySettings.leftDelayUs}ms | R: {microDelaySettings.rightDelayUs}ms</span>
                  </div>
                </div>

                {/* Quick 3D Delay Slider on Android Screen */}
                <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-300 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-cyan-400" />
                      3D Left Delay (0-300 ms)
                    </span>
                    <span className="font-mono text-cyan-400 font-bold">{microDelaySettings.leftDelayUs} ms</span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="300"
                    step="5"
                    value={microDelaySettings.leftDelayUs}
                    onChange={(e) => onMicroDelayChange({ leftDelayUs: Number(e.target.value) })}
                    className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  />

                  {/* Millisecond Quick Preset Chips */}
                  <div className="grid grid-cols-5 gap-1 pt-1">
                    {[0, 20, 100, 200, 300].map((ms) => (
                      <button
                        key={ms}
                        onClick={() => onMicroDelayChange({ leftDelayUs: ms, rightDelayUs: 0 })}
                        className={`py-1 text-[10px] font-mono rounded-lg border transition-all ${
                          microDelaySettings.leftDelayUs === ms && microDelaySettings.rightDelayUs === 0
                            ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        {ms}ms
                      </button>
                    ))}
                  </div>
                </div>

                {/* Seek Bar */}
                <div className="space-y-1">
                  <input
                    type="range"
                    min="0"
                    max={playerState.duration || 100}
                    value={playerState.currentTime}
                    onChange={(e) => onSeek(Number(e.target.value))}
                    className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-400 px-0.5">
                    <span>{formatTime(playerState.currentTime)}</span>
                    <span>{formatTime(playerState.duration)}</span>
                  </div>
                </div>

                {/* Main Player Transport Buttons */}
                <div className="flex items-center justify-between px-2 pt-1">
                  <button
                    onClick={onShuffleToggle}
                    className={`p-2 rounded-full transition-colors ${
                      playerState.shuffle ? 'text-cyan-400 bg-cyan-950/60' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <Shuffle className="w-4 h-4" />
                  </button>

                  <button
                    onClick={onPrevious}
                    className="p-3 text-slate-200 hover:text-white active:scale-90 transition-transform"
                  >
                    <SkipBack className="w-6 h-6 fill-slate-200" />
                  </button>

                  <button
                    onClick={onPlayPause}
                    className="p-4 rounded-full bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30 hover:scale-105 active:scale-95 transition-all"
                  >
                    {playerState.isPlaying ? (
                      <Pause className="w-7 h-7 fill-slate-950" />
                    ) : (
                      <Play className="w-7 h-7 fill-slate-950 ml-0.5" />
                    )}
                  </button>

                  <button
                    onClick={onNext}
                    className="p-3 text-slate-200 hover:text-white active:scale-90 transition-transform"
                  >
                    <SkipForward className="w-6 h-6 fill-slate-200" />
                  </button>

                  <button
                    onClick={onRepeatToggle}
                    className={`p-2 rounded-full transition-colors ${
                      playerState.repeat !== 'off' ? 'text-cyan-400 bg-cyan-950/60' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <Repeat className="w-4 h-4" />
                  </button>
                </div>

                {/* Crossfade Duration Control Card */}
                {onCrossfadeChange && (
                  <div className="bg-slate-900/90 p-2.5 rounded-2xl border border-amber-500/30 space-y-1.5 shadow-md">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-amber-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        {t.crossfadeTitle}
                      </span>
                      <span className="font-mono font-extrabold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded-lg border border-amber-500/40">
                        {playerState.crossfadeDuration === 0 ? 'OFF' : `${playerState.crossfadeDuration}s`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={0}
                        max={10}
                        step={0.5}
                        value={playerState.crossfadeDuration ?? 3}
                        onChange={(e) => onCrossfadeChange(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-400">
                      <button
                        onClick={() => onCrossfadeChange(0)}
                        className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                          playerState.crossfadeDuration === 0 ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        0s (OFF)
                      </button>
                      <button
                        onClick={() => onCrossfadeChange(2)}
                        className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                          playerState.crossfadeDuration === 2 ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        2s
                      </button>
                      <button
                        onClick={() => onCrossfadeChange(3)}
                        className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                          playerState.crossfadeDuration === 3 ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        3s Auto
                      </button>
                      <button
                        onClick={() => onCrossfadeChange(5)}
                        className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                          playerState.crossfadeDuration === 5 ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        5s
                      </button>
                      <button
                        onClick={() => onCrossfadeChange(10)}
                        className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                          playerState.crossfadeDuration === 10 ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        10s Max
                      </button>
                    </div>
                  </div>
                )}

                {/* Pitch Control Card */}
                {onPitchChange && (
                  <div className="bg-slate-900/90 p-2.5 rounded-2xl border border-indigo-500/30 space-y-2 shadow-md">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                        <Music2 className="w-3.5 h-3.5 text-indigo-400" />
                        {t.pitchTitle}
                      </span>
                      <button
                        onClick={() => onPitchChange(0)}
                        className="px-2 py-0.5 rounded-lg bg-indigo-950 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono font-bold"
                      >
                        {playerState.pitchSemi > 0 ? `+${playerState.pitchSemi}` : playerState.pitchSemi ?? 0}st (Reset)
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-mono">-12st</span>
                      <input
                        type="range"
                        min={-12}
                        max={12}
                        step={1}
                        value={playerState.pitchSemi ?? 0}
                        onChange={(e) => onPitchChange(parseInt(e.target.value, 10))}
                        className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                      />
                      <span className="text-[10px] text-slate-400 font-mono">+12st</span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      {t.pitchSub}
                    </p>
                  </div>
                )}

                {/* Volume Normalizer Control Card */}
                {onToggleVolumeNormalization && (
                  <div className="bg-slate-900/90 p-2.5 rounded-2xl border border-emerald-500/30 space-y-1.5 shadow-md">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                        <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                        {t.volumeNormTitle}
                      </span>
                      <button
                        onClick={onToggleVolumeNormalization}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all shadow-md ${
                          playerState.volumeNormalizationEnabled
                            ? 'bg-emerald-500 text-slate-950 font-extrabold'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {playerState.volumeNormalizationEnabled ? t.volumeNormOn : t.volumeNormOff}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      {t.volumeNormSub}
                    </p>
                  </div>
                )}

                {/* Sync Preset Manager Card */}
                {onOpenSyncPreset && (
                  <div className="bg-slate-900/90 p-2.5 rounded-2xl border border-indigo-500/30 space-y-2 shadow-md">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-indigo-400" />
                        {t.syncPresetTitle}
                      </span>
                      <button
                        onClick={onOpenSyncPreset}
                        className="px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold transition-all shadow-md flex items-center gap-1"
                      >
                        <Layers className="w-3 h-3" />
                        {t.syncCurrentBtn}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      {t.syncPresetSub}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* VIEW 2: 3D MILLISECOND DELAY TAB */}
            {mobileTab === 'delay' && (() => {
              const mobileMaxRange = microDelaySettings.maxDelayRangeUs || 300;
              const formatMobileDelay = (ms: number) => {
                if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s (${ms}ms)`;
                return `${ms} ms`;
              };

              return (
                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h4 className="font-bold text-slate-200 text-sm flex items-center gap-2">
                      <Clock className="w-4 h-4 text-cyan-400" />
                      {t.delayTitle}
                    </h4>
                    {/* Delay Effect ON/OFF Power Toggle */}
                    <button
                      onClick={() => onMicroDelayChange({ enabled: !microDelaySettings.enabled })}
                      className={`px-3 py-1 rounded-full font-bold text-[11px] transition-all ${
                        microDelaySettings.enabled
                          ? 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/50'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {microDelaySettings.enabled ? 'L+R Delay ON' : 'Delay OFF (Flat)'}
                    </button>
                  </div>

                  <p className="text-slate-400 text-[11px]">{t.delaySubtitle}</p>

                  {/* 20ms Auto Haas Delay Tool & Save Copy Card */}
                  <div className="p-3 bg-gradient-to-r from-amber-950/90 via-slate-950/90 to-cyan-950/90 rounded-2xl border border-amber-500/40 space-y-2.5 shadow-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-amber-300 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        ⚡ 20ms Auto L+R Delay Tool
                      </span>
                      <button
                        onClick={onToggleAuto20ms}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-400 text-slate-950 border border-amber-200 active:scale-95 transition-all shadow-sm"
                      >
                        {microDelaySettings.enabled && (microDelaySettings.leftDelayUs === 20 || microDelaySettings.rightDelayUs === 20) ? '20ms ON' : '20ms ON કરો'}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-300 leading-snug">
                      ફ્લેટ સાઉન્ડમાં ૨૦ms ઓટો ઇફેક્ટ લાગી જશે (ઓરિજિનલ ગીત અકબંધ રહેશે)
                    </p>

                    {onSaveNewCopy && (
                      <button
                        onClick={() => onSaveNewCopy('mp3')}
                        disabled={isSavingCopy}
                        className="w-full py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-slate-950 font-extrabold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                      >
                        <DownloadCloud className="w-4 h-4" />
                        <span>{isSavingCopy ? 'સેવિંગ...' : '💾 સેવ કરો નવી ગીત કોપી (Save Copy)'}</span>
                      </button>
                    )}
                  </div>

                  {/* Delay Limit selector */}
                  <div className="bg-slate-950/80 p-2.5 rounded-xl border border-cyan-500/30 space-y-1.5">
                    <div className="flex justify-between items-center text-[11px] font-bold text-cyan-300">
                      <span>{t.delayRange}</span>
                      <span className="font-mono text-cyan-400">
                        Max {mobileMaxRange >= 1000 ? `${(mobileMaxRange / 1000).toFixed(1)}s` : `${mobileMaxRange}ms`}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 overflow-x-auto pb-1">
                      {[
                        { label: '300ms', val: 300 },
                        { label: '500ms', val: 500 },
                        { label: '1.0s', val: 1000 },
                        { label: '2.0s', val: 2000 },
                      ].map((p) => (
                        <button
                          key={p.val}
                          onClick={() =>
                            onMicroDelayChange({
                              maxDelayRangeUs: p.val,
                              leftDelayUs: Math.min(microDelaySettings.leftDelayUs, p.val),
                              rightDelayUs: Math.min(microDelaySettings.rightDelayUs, p.val),
                            })
                          }
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold whitespace-nowrap ${
                            mobileMaxRange === p.val
                              ? 'bg-cyan-500 text-slate-950'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Left Channel Delay */}
                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center font-semibold text-slate-300">
                      <span className="flex items-center gap-1.5">{t.leftDelay}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onMicroDelayChange({ leftMuted: !microDelaySettings.leftMuted })}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all border flex items-center gap-1 ${
                            microDelaySettings.leftMuted
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 ring-1 ring-rose-500'
                              : 'bg-slate-800 text-cyan-300 border-slate-700 hover:bg-slate-700'
                          }`}
                        >
                          {microDelaySettings.leftMuted ? <VolumeX className="w-3 h-3 text-rose-400" /> : <Volume2 className="w-3 h-3 text-cyan-400" />}
                          <span>{microDelaySettings.leftMuted ? 'L MUTE (ON)' : 'L MUTE'}</span>
                        </button>
                        <span className="font-mono text-cyan-400 font-bold">
                          {formatMobileDelay(microDelaySettings.leftDelayUs)}
                        </span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={mobileMaxRange}
                      step="1"
                      value={microDelaySettings.leftDelayUs}
                      onChange={(e) => onMicroDelayChange({ leftDelayUs: Number(e.target.value) })}
                      className="w-full accent-cyan-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Right Channel Delay */}
                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center font-semibold text-slate-300">
                      <span className="flex items-center gap-1.5">{t.rightDelay}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onMicroDelayChange({ rightMuted: !microDelaySettings.rightMuted })}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all border flex items-center gap-1 ${
                            microDelaySettings.rightMuted
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 ring-1 ring-rose-500'
                              : 'bg-slate-800 text-indigo-300 border-slate-700 hover:bg-slate-700'
                          }`}
                        >
                          {microDelaySettings.rightMuted ? <VolumeX className="w-3 h-3 text-rose-400" /> : <Volume2 className="w-3 h-3 text-indigo-400" />}
                          <span>{microDelaySettings.rightMuted ? 'R MUTE (ON)' : 'R MUTE'}</span>
                        </button>
                        <span className="font-mono text-indigo-400 font-bold">
                          {formatMobileDelay(microDelaySettings.rightDelayUs)}
                        </span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={mobileMaxRange}
                      step="1"
                      value={microDelaySettings.rightDelayUs}
                      onChange={(e) => onMicroDelayChange({ rightDelayUs: Number(e.target.value) })}
                      className="w-full accent-indigo-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {[
                      { label: '0ms (Flat)', left: 0, right: 0 },
                      { label: '⚡ 20ms Auto', left: 20, right: 0 },
                      { label: '50ms', left: 50, right: 0 },
                      { label: '100ms', left: 100, right: 0 },
                      { label: '200ms', left: 200, right: 0 },
                      { label: '300ms Delay', left: 300, right: 0 },
                    ].map((btn) => (
                      <button
                        key={btn.label}
                        onClick={() =>
                          onMicroDelayChange({
                            leftDelayUs: btn.left,
                            rightDelayUs: btn.right,
                            enabled: btn.left > 0 || btn.right > 0,
                            maxDelayRangeUs: Math.max(mobileMaxRange, btn.left),
                          })
                        }
                        className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold whitespace-nowrap border ${
                          btn.left === 20
                            ? 'bg-amber-400 text-slate-950 border-amber-200 shadow-sm'
                            : btn.left === 300
                            ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-sm'
                            : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border-cyan-500/30'
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>

                  {/* 8D Auto Orbit Toggle */}
                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-200 block">{t.orbit8D}</span>
                      <span className="text-[10px] text-slate-400">360° Continuous Spatial Rotation</span>
                    </div>
                    <button
                      onClick={() => onMicroDelayChange({ autoOrbit8D: !microDelaySettings.autoOrbit8D })}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${
                        microDelaySettings.autoOrbit8D
                          ? 'bg-cyan-500 text-slate-950'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {microDelaySettings.autoOrbit8D ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* VIEW 3: 3D SPATIAL STAGE TAB */}
            {mobileTab === 'spatial' && (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="font-bold text-slate-200 text-sm flex items-center gap-2">
                    <Compass className="w-4 h-4 text-indigo-400" />
                    {t.spatialTitle}
                  </h4>
                  {/* 3D Spatial ON/OFF Segmented Buttons */}
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-indigo-500/40">
                    <button
                      onClick={() => onSpatialChange({ enabled: false })}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        !spatialSettings.enabled
                          ? 'bg-slate-800 text-white shadow-md border border-slate-700'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      3D OFF (Flat)
                    </button>
                    <button
                      onClick={() => onSpatialChange({ enabled: true })}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        spatialSettings.enabled
                          ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-slate-950 shadow-md'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      3D ON
                    </button>
                  </div>
                </div>

                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-3 text-[11px]">
                  <div className="flex justify-between text-slate-300 font-semibold">
                    <span>X-Axis (Left / Right)</span>
                    <span className="font-mono text-indigo-400">{spatialSettings.x.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="-10"
                    max="10"
                    step="0.5"
                    value={spatialSettings.x}
                    onChange={(e) => onSpatialChange({ x: Number(e.target.value) })}
                    className="w-full accent-indigo-400 h-2 bg-slate-800 rounded cursor-pointer"
                  />

                  <div className="flex justify-between text-slate-300 font-semibold pt-1">
                    <span>Y-Axis (Height / Elevation)</span>
                    <span className="font-mono text-indigo-400">{spatialSettings.y.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="-10"
                    max="10"
                    step="0.5"
                    value={spatialSettings.y}
                    onChange={(e) => onSpatialChange({ y: Number(e.target.value) })}
                    className="w-full accent-indigo-400 h-2 bg-slate-800 rounded cursor-pointer"
                  />

                  <div className="flex justify-between text-slate-300 font-semibold pt-1">
                    <span>Z-Axis (Distance / Depth)</span>
                    <span className="font-mono text-indigo-400">{spatialSettings.z.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="-10"
                    max="10"
                    step="0.5"
                    value={spatialSettings.z}
                    onChange={(e) => onSpatialChange({ z: Number(e.target.value) })}
                    className="w-full accent-indigo-400 h-2 bg-slate-800 rounded cursor-pointer"
                  />

                  <button
                    onClick={() => onSpatialChange({ x: 0, y: 0, z: -1, enabled: true })}
                    className="w-full mt-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-center border border-slate-700"
                  >
                    Center Reset (Flat Position)
                  </button>
                </div>
              </div>
            )}

            {/* VIEW 4: EQUALIZER TAB */}
            {mobileTab === 'eq' && (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="font-bold text-slate-200 text-sm flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-purple-400" />
                    {t.eqTitle}
                  </h4>
                </div>

                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex justify-between items-center text-slate-300 font-semibold">
                    <span>{t.bassBoost}</span>
                    <span className="font-mono text-purple-400">+{eqSettings.bassBoost} dB</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="12"
                    value={eqSettings.bassBoost}
                    onChange={(e) => onEQChange({ bassBoost: Number(e.target.value) })}
                    className="w-full accent-purple-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
                  />

                  <div className="flex justify-between items-center text-slate-300 font-semibold pt-2">
                    <span>{t.trebleBoost}</span>
                    <span className="font-mono text-purple-400">+{eqSettings.trebleBoost} dB</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="12"
                    value={eqSettings.trebleBoost}
                    onChange={(e) => onEQChange({ trebleBoost: Number(e.target.value) })}
                    className="w-full accent-purple-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Auto-Limiter & Compression Threshold Mobile Card */}
                <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-emerald-500/30 space-y-2.5 shadow-md">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-emerald-400" />
                      {t.autoLimiterTitle}
                    </span>
                    <button
                      onClick={() => {
                        const nextVal = !(eqSettings.autoLimiterEnabled ?? eqSettings.compressorEnabled);
                        onEQChange({ autoLimiterEnabled: nextVal, compressorEnabled: nextVal });
                      }}
                      className={`px-2.5 py-1 rounded-full font-bold text-[10px] transition-all ${
                        (eqSettings.autoLimiterEnabled ?? eqSettings.compressorEnabled)
                          ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {(eqSettings.autoLimiterEnabled ?? eqSettings.compressorEnabled) ? 'LIMITER ON' : 'OFF'}
                    </button>
                  </div>

                  <p className="text-[10px] text-slate-400 leading-snug">
                    {t.autoLimiterSub}
                  </p>

                  <div className="pt-1 border-t border-slate-800 space-y-1.5">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-300 font-semibold flex items-center gap-1">
                        <Gauge className="w-3.5 h-3.5 text-amber-400" />
                        {t.limiterThreshold}
                      </span>
                      <span className="font-mono text-amber-300 font-bold">
                        {eqSettings.compressorThreshold ?? -24} dB
                      </span>
                    </div>

                    <input
                      type="range"
                      min="-60"
                      max="0"
                      step="1"
                      value={eqSettings.compressorThreshold ?? -24}
                      onChange={(e) => onEQChange({ compressorThreshold: Number(e.target.value) })}
                      disabled={!(eqSettings.autoLimiterEnabled ?? eqSettings.compressorEnabled)}
                      className="w-full h-2 bg-slate-800 rounded-lg cursor-pointer accent-emerald-400 disabled:opacity-40"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 5: PLAYLIST TAB WITH GRAPHIC AUDIO DISPLAY */}
            {mobileTab === 'playlist' && (
              <div className="space-y-3.5 text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="font-bold text-slate-200 text-sm flex items-center gap-2">
                    <ListMusic className="w-4 h-4 text-emerald-400" />
                    {t.playlistTitle}
                  </h4>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800/60">
                    {tracks.length} Songs
                  </span>
                </div>

                {/* 🎨 Mobile Graphic Audio Display Hero Card (ગ્રાફિક ડિસ્પ્લે) */}
                {currentTrack && (
                  <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-4 rounded-2xl border border-cyan-500/40 shadow-xl space-y-3">
                    {/* Background ambient lighting glow */}
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
                    <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

                    <div className="flex items-center justify-between gap-3 relative z-10">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Spinning Vinyl Cover Graphic */}
                        <div className="relative shrink-0">
                          <img
                            src={currentTrack.cover}
                            alt={currentTrack.title}
                            className={`w-14 h-14 rounded-xl object-cover shadow-lg border border-cyan-500/30 ${
                              playerState.isPlaying ? 'animate-pulse' : ''
                            }`}
                          />
                          <div
                            className={`absolute inset-0 rounded-xl bg-slate-950/30 flex items-center justify-center backdrop-blur-[1px] ${
                              playerState.isPlaying ? '' : 'opacity-80'
                            }`}
                          >
                            <Disc className={`w-7 h-7 text-cyan-300/80 ${playerState.isPlaying ? 'animate-spin' : ''}`} />
                          </div>
                        </div>

                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-cyan-950 text-cyan-300 border border-cyan-800 rounded">
                              NOW PLAYING
                            </span>
                            {microDelaySettings.enabled && (
                              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-amber-950 text-amber-300 border border-amber-800 rounded flex items-center gap-0.5">
                                <Zap className="w-2.5 h-2.5 text-amber-400" />
                                3D ITD
                              </span>
                            )}
                          </div>
                          <h5 className="font-extrabold text-sm text-slate-100 truncate">{currentTrack.title}</h5>
                          <p className="text-[11px] text-cyan-300/80 truncate font-medium">{currentTrack.artist}</p>
                        </div>
                      </div>

                      {/* Play/Pause Button on Graphic Card */}
                      <button
                        onClick={onPlayPause}
                        className="shrink-0 p-3 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 text-slate-950 shadow-md shadow-cyan-500/30 active:scale-95 transition-all"
                      >
                        {playerState.isPlaying ? <Pause className="w-4 h-4 fill-slate-950" /> : <Play className="w-4 h-4 fill-slate-950 ml-0.5" />}
                      </button>
                    </div>

                    {/* 📊 Animated Real-Time Graphic Audio Equalizer Spectrum Display */}
                    <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span className="flex items-center gap-1 text-cyan-400 font-bold">
                          <Activity className="w-3.5 h-3.5 text-cyan-400" />
                          GRAPHIC SPECTRUM DISPLAY
                        </span>
                        <span>{playerState.isPlaying ? 'REAL-TIME 3D OUTPUT' : 'STANDBY'}</span>
                      </div>

                      <div className="h-10 bg-slate-950/90 rounded-xl p-2 border border-slate-800/80 flex items-end justify-between gap-1">
                        {[45, 80, 60, 95, 30, 75, 90, 50, 85, 40, 70, 100, 65, 55, 85, 35].map((baseHt, i) => {
                          const animDelay = (i * 0.08).toFixed(2);
                          return (
                            <div
                              key={i}
                              className="flex-1 bg-gradient-to-t from-cyan-500 via-emerald-400 to-indigo-500 rounded-t-sm transition-all duration-150"
                              style={{
                                height: playerState.isPlaying ? `${Math.max(15, (baseHt + (i % 3) * 10) % 100)}%` : '15%',
                                transitionDelay: `${animDelay}s`,
                                opacity: playerState.isPlaying ? 0.9 : 0.3,
                              }}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Upload custom track button */}
                <label className="flex items-center justify-center gap-2 p-3 bg-emerald-950/40 border border-emerald-800/60 hover:bg-emerald-900/40 text-emerald-300 rounded-xl cursor-pointer font-semibold transition-colors">
                  <Plus className="w-4 h-4" />
                  <span>{t.addSong}</span>
                  <input
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        onAddCustomTrack(e.target.files[0]);
                      }
                    }}
                  />
                </label>

                {/* Track List */}
                <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
                  {tracks.map((track) => {
                    const isSelected = track.id === currentTrack?.id;
                    return (
                      <div
                        key={track.id}
                        onClick={() => onSelectTrack(track)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-slate-800/90 border-cyan-500/50 text-white shadow-md'
                            : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/40 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="relative shrink-0">
                            <img src={track.cover} alt={track.title} className="w-10 h-10 rounded-lg object-cover" />
                            {isSelected && (
                              <div className="absolute inset-0 bg-cyan-950/70 rounded-lg flex items-center justify-center">
                                {playerState.isPlaying ? (
                                  <BarChart2 className="w-4 h-4 text-cyan-400 animate-pulse" />
                                ) : (
                                  <Play className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" />
                                )}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h5 className={`font-bold text-xs truncate ${isSelected ? 'text-cyan-300' : ''}`}>
                              {track.title}
                            </h5>
                            <p className="text-[10px] text-slate-400 truncate">{track.artist}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isSelected && playerState.isPlaying && (
                            <span className="text-[9px] font-mono text-emerald-400 font-bold bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800">
                              PLAYING
                            </span>
                          )}

                          {track.isCustom && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onRemoveTrack(track.id);
                              }}
                              className="p-1.5 text-slate-500 hover:text-rose-400"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* VIEW 6: 3D AUDIO CONVERTER TAB */}
            {mobileTab === 'convert' && (
              <AudioConverterPanel
                tracks={tracks}
                currentTrack={currentTrack}
                microDelaySettings={microDelaySettings}
                spatialSettings={spatialSettings}
                eqSettings={eqSettings}
                language={language}
              />
            )}

          </div>

          {/* Collapsible Mini-Player pinned above Bottom Navigation Bar if not on player screen */}
          {mobileTab !== 'player' && currentTrack && (
            <div
              onClick={() => setMobileTab('player')}
              className="mx-3 my-1 p-2 bg-slate-950/90 backdrop-blur-md rounded-2xl border border-cyan-500/30 flex items-center justify-between cursor-pointer shadow-lg hover:border-cyan-400 transition-all z-20"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <img src={currentTrack.cover} alt={currentTrack.title} className="w-9 h-9 rounded-xl object-cover" />
                <div className="min-w-0">
                  <h5 className="font-bold text-xs text-slate-100 truncate">{currentTrack.title}</h5>
                  <p className="text-[10px] text-cyan-400 font-mono">3D ITD: {delayDifferenceUs}ms</p>
                </div>
              </div>

              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={onPlayPause}
                  className="p-2 rounded-full bg-cyan-500 text-slate-950 shadow hover:scale-105 active:scale-95"
                >
                  {playerState.isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-slate-950 ml-0.5" />}
                </button>
              </div>
            </div>
          )}

          {/* 5. Android Bottom Material Navigation Bar */}
          <div className="bg-slate-950/95 border-t border-slate-800/80 px-2 py-2 flex items-center justify-around text-[10px] font-semibold text-slate-400 z-30">
            <button
              onClick={() => setMobileTab('player')}
              className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all ${
                mobileTab === 'player' ? 'text-cyan-400 bg-cyan-950/60' : 'hover:text-slate-200'
              }`}
            >
              <Headphones className="w-4 h-4" />
              <span>Player</span>
            </button>

            <button
              onClick={() => setMobileTab('delay')}
              className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all ${
                mobileTab === 'delay' ? 'text-cyan-400 bg-cyan-950/60' : 'hover:text-slate-200'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>3D Delay</span>
            </button>

            <button
              onClick={() => setMobileTab('spatial')}
              className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all ${
                mobileTab === 'spatial' ? 'text-indigo-400 bg-indigo-950/60' : 'hover:text-slate-200'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Spatial 3D</span>
            </button>

            <button
              onClick={() => setMobileTab('eq')}
              className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all ${
                mobileTab === 'eq' ? 'text-purple-400 bg-purple-950/60' : 'hover:text-slate-200'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>EQ & FX</span>
            </button>

            <button
              onClick={() => setMobileTab('playlist')}
              className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all ${
                mobileTab === 'playlist' ? 'text-emerald-400 bg-emerald-950/60' : 'hover:text-slate-200'
              }`}
            >
              <Music className="w-4 h-4" />
              <span>Playlist</span>
            </button>

            <button
              onClick={() => setMobileTab('convert')}
              className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all ${
                mobileTab === 'convert' ? 'text-cyan-300 bg-cyan-950/80 ring-1 ring-cyan-500/50' : 'hover:text-slate-200'
              }`}
            >
              <DownloadCloud className="w-4 h-4 text-cyan-400" />
              <span>Convert</span>
            </button>
          </div>

          {/* Android Home Gesture Pill Indicator Bar */}
          <div className="bg-slate-950 pb-2.5 pt-1 flex justify-center">
            <div className="w-28 h-1 rounded-full bg-slate-600/60" />
          </div>

        </div>
      </div>
    </div>
  );
};
