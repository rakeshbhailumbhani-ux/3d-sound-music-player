import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  Compass,
  SlidersHorizontal,
  Music,
  Eye,
  Sparkles,
  Headphones,
  DownloadCloud,
} from 'lucide-react';
import {
  Track,
  MicrosecondDelaySettings,
  Spatial3DSettings,
  EQSettings,
  PlayerState,
  RepeatMode,
  VisualizerMode,
  Language,
  Theme,
  SleepTimerState,
  AudioPreset,
} from './types';
import { DEMO_TRACKS } from './data/demoTracks';
import { translations } from './utils/i18n';
import { audioEngine } from './audio/AudioEngine';
import { convertAndExport3DAudio } from './audio/AudioConverter';

import { Navbar } from './components/Navbar';
import { MicrosecondDelayPanel } from './components/MicrosecondDelayPanel';
import { Spatial3DPanner } from './components/Spatial3DPanner';
import { EqualizerPanel } from './components/EqualizerPanel';
import { Visualizer3D } from './components/Visualizer3D';
import { AudioPlayerControls } from './components/AudioPlayerControls';
import { PlaylistManager } from './components/PlaylistManager';
import { AndroidMobilePlayer } from './components/AndroidMobilePlayer';
import { AudioConverterPanel } from './components/AudioConverterPanel';
import { SleepTimerModal } from './components/SleepTimerModal';
import { InfoModal } from './components/InfoModal';
import { SyncPresetModal } from './components/SyncPresetModal';
import { InstallPwaModal } from './components/InstallPwaModal';

export default function App() {
  const [language, setLanguage] = useState<Language>('gu');
  const [theme, setTheme] = useState<Theme>('cyberpunk');
  const [isMobileView, setIsMobileView] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'delay' | 'spatial' | 'eq' | 'playlist' | 'convert'>('delay');

  // Playlist State
  const [tracks, setTracks] = useState<Track[]>(DEMO_TRACKS);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);

  // Microsecond & Real Track Delay Settings (Main delay unit is ms: 0-300ms)
  const [microDelaySettings, setMicroDelaySettings] = useState<MicrosecondDelaySettings>({leftDelayUs: 300,
    rightDelayUs: 0,
    enabled: true,

    leftMuted: false,
    rightMuted: false,

    autoOrbit8D: false,
    orbitSpeed: 1.0,
    centerLockEnabled: true,
    maxDelayRangeUs: 300,
    leftDelayUs: 300, // 300 ms main 3D delay
    rightDelayUs: 0,
    enabled: true,
    autoOrbit8D: false,
    orbitSpeed: 1.0,
    centerLockEnabled: true,
    maxDelayRangeUs: 300, // 300 ms limit
  });

  // 3D Spatial Panner Settings
  const [spatialSettings, setSpatialSettings] = useState<Spatial3DSettings>({
    x: 0,
    y: 0,
    z: -1,
    panningModel: 'HRTF',
    distanceModel: 'inverse',
    enabled: false,
  });

  // EQ Settings
  const [eqSettings, setEqSettings] = useState<EQSettings>({
    bands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    presetName: 'flat',
    bassBoost: 0,
    trebleBoost: 0,
    reverbLevel: 0,
    compressorEnabled: true,
    compressorThreshold: -24,
    autoLimiterEnabled: true,
  });

  // Player State
  const [playerState, setPlayerState] = useState<PlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.85,
    isMuted: false,
    playbackRate: 1.0,
    pitchSemi: 0,
    shuffle: false,
    repeat: 'off',
    crossfadeDuration: 3,
    volumeNormalizationEnabled: false,
  });

  // Visualizer Mode
  const [visualizerMode, setVisualizerMode] = useState<VisualizerMode>('3d-bars');

  // Modals
  const [isSleepTimerOpen, setIsSleepTimerOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isSyncPresetOpen, setIsSyncPresetOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  // Sleep Timer
  const [sleepTimer, setSleepTimer] = useState<SleepTimerState>({
    active: false,
    remainingSeconds: 0,
    initialMinutes: 0,
  });

  // Export / Toast Status
  const [isSavingCopy, setIsSavingCopy] = useState(false);
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  const currentTrack = tracks[currentTrackIndex] || null;

  // Auto detect mobile screen width
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsMobileView(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize AudioEngine Listeners
  useEffect(() => {
    audioEngine.setListeners({
      onEnded: handleTrackEnded,
      onTimeUpdate: (currentTime, duration) => {
        setPlayerState((prev) => ({
          ...prev,
          currentTime,
          duration: duration || prev.duration,
        }));
      },
      onSpatialChange: (x, z, leftUs, rightUs) => {
        setSpatialSettings((prev) => ({ ...prev, x, z }));
        setMicroDelaySettings((prev) => ({
          ...prev,
          leftDelayUs: leftUs,
          rightDelayUs: rightUs,
        }));
      },
    });
  }, [currentTrackIndex, tracks, playerState.repeat, playerState.shuffle]);

  // Load Track when currentTrack changes
  useEffect(() => {
    if (currentTrack) {
      audioEngine.loadTrack(currentTrack.url).then(() => {
        if (playerState.isPlaying) {
          audioEngine.play();
        }
      });
    }
  }, [currentTrackIndex]);

  // Handle Track Termination
  const handleTrackEnded = () => {
    if (playerState.repeat === 'one') {
      audioEngine.seek(0);
      audioEngine.play();
    } else if (playerState.repeat === 'all' || currentTrackIndex < tracks.length - 1) {
      handleNextTrack();
    } else {
      setPlayerState((prev) => ({ ...prev, isPlaying: false }));
    }
  };

  // Play / Pause Toggle
  const handlePlayPause = async () => {
    if (playerState.isPlaying) {
      audioEngine.pause();
      setPlayerState((prev) => ({ ...prev, isPlaying: false }));
    } else {
      await audioEngine.play();
      setPlayerState((prev) => ({ ...prev, isPlaying: true }));
    }
  };

  // Stop Playback
  const handleStop = () => {
    audioEngine.stop();
    setPlayerState((prev) => ({ ...prev, isPlaying: false, currentTime: 0 }));
  };

  // Next Track
  const handleNextTrack = () => {
    if (playerState.shuffle) {
      const randomIndex = Math.floor(Math.random() * tracks.length);
      setCurrentTrackIndex(randomIndex);
    } else {
      setCurrentTrackIndex((prev) => (prev + 1) % tracks.length);
    }
    setPlayerState((prev) => ({ ...prev, isPlaying: true }));
  };

  // Previous Track
  const handlePreviousTrack = () => {
    if (playerState.currentTime > 3) {
      audioEngine.seek(0);
    } else {
      setCurrentTrackIndex((prev) => (prev - 1 + tracks.length) % tracks.length);
    }
    setPlayerState((prev) => ({ ...prev, isPlaying: true }));
  };

  // Seek
  const handleSeek = (seconds: number) => {
    audioEngine.seek(seconds);
    setPlayerState((prev) => ({ ...prev, currentTime: seconds }));
  };

  // Volume & Mute
  const handleVolumeChange = (volume: number) => {
    audioEngine.setVolume(volume);
    setPlayerState((prev) => ({ ...prev, volume, isMuted: volume === 0 }));
  };

  const handleMuteToggle = () => {
    const newMuted = !playerState.isMuted;
    audioEngine.setVolume(newMuted ? 0 : playerState.volume);
    setPlayerState((prev) => ({ ...prev, isMuted: newMuted }));
  };

  // Microsecond Delay Handler
  const handleMicroDelayChange = (
  updated: Partial<MicrosecondDelaySettings>
) => {
  const newSettings = {
    ...microDelaySettings,
    ...updated,
  };

  setMicroDelaySettings(newSettings);

  // -----------------------------------------
  // L/R DELAY
  // -----------------------------------------
  audioEngine.setMicrosecondDelay(
    newSettings.leftDelayUs,
    newSettings.rightDelayUs,
    newSettings.enabled
  );

  // -----------------------------------------
  // L/R MUTE
  // -----------------------------------------
  audioEngine.setChannelMute(
    newSettings.leftMuted ?? false,
    newSettings.rightMuted ?? false
  );

  // -----------------------------------------
  // 8D AUTO ORBIT
  // -----------------------------------------
  if (
    updated.autoOrbit8D !== undefined ||
    updated.orbitSpeed !== undefined
  ) {
    audioEngine.setAutoOrbit8D(
      newSettings.autoOrbit8D ?? false,
      newSettings.orbitSpeed ?? 1
    );
  }

  // -----------------------------------------
  // 3D POSITION
  // -----------------------------------------
  if (
    updated.x !== undefined ||
    updated.y !== undefined ||
    updated.z !== undefined
  ) {
    // અહીં જરૂર નથી જો Spatial panel અલગ handler વાપરે છે
  }
};
  // 3D Spatial Panner Handler
  const handleSpatialChange = (updated: Partial<Spatial3DSettings>) => {
    const newSettings = { ...spatialSettings, ...updated };
    setSpatialSettings(newSettings);

    audioEngine.setSpatial3DPosition(newSettings.x, newSettings.y, newSettings.z, newSettings.enabled);
    if (updated.panningModel) {
      audioEngine.setPanningModel(updated.panningModel);
    }
  };

  // EQ Handler
  const handleEQChange = (updated: Partial<EQSettings>) => {
    const newSettings = { ...eqSettings, ...updated };
    setEqSettings(newSettings);

    if (updated.bands) {
      audioEngine.setEQBands(newSettings.bands);
    }
    if (updated.bassBoost !== undefined) {
      audioEngine.setBassBoost(newSettings.bassBoost);
    }
    if (updated.trebleBoost !== undefined) {
      audioEngine.setTrebleBoost(newSettings.trebleBoost);
    }
    if (
      updated.compressorEnabled !== undefined ||
      updated.autoLimiterEnabled !== undefined ||
      updated.compressorThreshold !== undefined
    ) {
      const isEnabled = newSettings.autoLimiterEnabled ?? newSettings.compressorEnabled ?? true;
      const thresh = newSettings.compressorThreshold ?? -24;
      audioEngine.setAutoLimiter(isEnabled, thresh);
    }
  };

  // Pitch Change Handler (-12 to +12 semitones)
  const handlePitchChange = (semitones: number) => {
    const clamped = Math.max(-12, Math.min(12, semitones));
    audioEngine.setPitchSemi(clamped);
    setPlayerState((prev) => ({ ...prev, pitchSemi: clamped }));
  };

  // Crossfade Duration Handler (0 - 10s)
  const handleCrossfadeChange = (sec: number) => {
    const clamped = Math.max(0, Math.min(10, sec));
    audioEngine.setCrossfadeDuration(clamped);
    setPlayerState((prev) => ({ ...prev, crossfadeDuration: clamped }));
  };

  // Global Volume Normalizer Handler
  const handleToggleVolumeNormalization = () => {
    const nextVal = !playerState.volumeNormalizationEnabled;
    audioEngine.setVolumeNormalizerEnabled(nextVal);
    setPlayerState((prev) => ({ ...prev, volumeNormalizationEnabled: nextVal }));
  };

  // Apply Synced Preset (EQ + Spatial 3D + Microsecond Delay + Pitch)
  const handleApplyPreset = (preset: AudioPreset) => {
    // 1. EQ
    setEqSettings(preset.eq);
    audioEngine.setEQBands(preset.eq.bands);
    audioEngine.setBassBoost(preset.eq.bassBoost);
    audioEngine.setTrebleBoost(preset.eq.trebleBoost);

    // 2. Spatial
    setSpatialSettings(preset.spatial);
    audioEngine.setSpatial3DPosition(preset.spatial.x, preset.spatial.y, preset.spatial.z, preset.spatial.enabled);

    // 3. Delay
    setMicroDelaySettings(preset.delay);
    audioEngine.setMicrosecondDelay(
      preset.delay.leftDelayUs,
      preset.delay.rightDelayUs,
      preset.delay.enabled,
      preset.delay.centerLockEnabled ?? true,
      preset.delay.maxDelayRangeUs ?? 300
    );
    audioEngine.setAutoOrbit8D(preset.delay.autoOrbit8D, preset.delay.orbitSpeed);

    // 4. Pitch
    if (preset.pitchSemi !== undefined) {
      handlePitchChange(preset.pitchSemi);
    }
  };

  // Auto 20ms L+R Delay Tool Toggle (Haas Effect)
  const handleToggleAuto20ms = () => {
    const is20msActive =
      microDelaySettings.enabled &&
      (microDelaySettings.leftDelayUs === 20 || microDelaySettings.rightDelayUs === 20);

    if (is20msActive) {
      handleMicroDelayChange({
        leftDelayUs: 0,
        rightDelayUs: 0,
        enabled: false,
      });
      setToastNotice(language === 'gu' ? 'ફ્લેટ સાઉન્ડ મોડ ચાલુ (0ms)' : 'Flat Sound Mode Activated');
    } else {
      handleMicroDelayChange({
        leftDelayUs: 20, // 20 ms
        rightDelayUs: 0,
        enabled: true,
        centerLockEnabled: true,
        maxDelayRangeUs: Math.max(microDelaySettings.maxDelayRangeUs || 0, 300),
      });
      setToastNotice(
        language === 'gu'
          ? '⚡ ૨૦ms ઓટો L+R ડીલે ચાલુ થઈ ગયું! (ઓરિજિનલ અકબંધ)'
          : '⚡ 20ms Auto L+R Delay Enabled! (Original Safe)'
      );
    }
    setTimeout(() => setToastNotice(null), 4000);
  };

  // Save New Track Copy (Original Untouched)
  const handleSaveNewCopy = async (format: 'mp3' | 'wav' = 'mp3') => {
    if (!currentTrack) return;

    setIsSavingCopy(true);
    setToastNotice(
      language === 'gu'
        ? 'ઈફેક્ટ સાથે નવી કોપી સેવ થઈ રહી છે... (ઓરિજિનલ ગીત અકબંધ રહેશે)'
        : 'Rendering new track copy... (Original song untouched)'
    );

    try {
      const result = await convertAndExport3DAudio(
        currentTrack.url,
        microDelaySettings,
        spatialSettings,
        eqSettings,
        format
      );

      const effectLabel = microDelaySettings.enabled
        ? `${(microDelaySettings.leftDelayUs / 1000).toFixed(0)}ms Delay`
        : 'Flat 3D';

      const newCopyTrack: Track = {
        id: `copy-${Date.now()}`,
        title: `${currentTrack.title} [${effectLabel} Copy]`,
        artist: `${currentTrack.artist} (Modified Copy)`,
        album: '3D Saved Copies',
        duration: currentTrack.duration,
        url: result.url,
        cover: currentTrack.cover || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300',
        isCustom: true,
        genre: '3D Saved Copy',
      };

      setTracks((prev) => [newCopyTrack, ...prev]);

      // Direct download file to device
      const a = document.createElement('a');
      a.href = result.url;
      a.download = `${currentTrack.title.replace(/[/\\?%*:|"<>]/g, '_')}_3D_Copy.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setToastNotice(
        language === 'gu'
          ? '🎉 નવી ગીત કોપી સેવ થઈ પ્લેલિસ્ટમાં ઉમેરાઈ ગઈ છે! ઓરિજિનલ ગીત 100% અકબંધ છે.'
          : '🎉 New track copy saved & added to playlist! Original track remains 100% untouched.'
      );
    } catch (err) {
      console.error('Save copy failed:', err);
      setToastNotice(
        language === 'gu'
          ? 'નવી કોપી સેવ કરવામાં ભૂલ થઈ. કૃપા કરીને ફરી પ્રયાસ કરો.'
          : 'Failed to save copy. Please try again.'
      );
    } finally {
      setIsSavingCopy(false);
      setTimeout(() => setToastNotice(null), 5000);
    }
  };

  // Add Converted 3D Audio Track
  const handleAddConvertedTrack = (convertedTrack: Track) => {
    setTracks((prev) => [convertedTrack, ...prev]);
    setCurrentTrackIndex(0);
    setPlayerState((prev) => ({ ...prev, isPlaying: true }));
    setToastNotice(
      language === 'gu'
        ? `🎉 "${convertedTrack.title}" પ્લેલિસ્ટમાં ઉમેરાઈ ગયું અને ડાઉનલોડ શરૂ થઈ ગયું!`
        : `🎉 "${convertedTrack.title}" added to playlist and download started!`
    );
    setTimeout(() => setToastNotice(null), 4000);
  };

  // Add Custom Audio File
  const handleAddCustomTrack = (file: File) => {
    const blobUrl = URL.createObjectURL(file);
    const newTrack: Track = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: file.name.replace(/\.[^/.]+$/, ''),
      artist: 'Custom Local File',
      album: 'User Music Uploads',
      duration: 200,
      url: blobUrl,
      cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300',
      isCustom: true,
      genre: 'User Audio',
      file,
    };

    setTracks((prev) => [newTrack, ...prev]);
    setCurrentTrackIndex(0);
    setPlayerState((prev) => ({ ...prev, isPlaying: true }));
  };

  // Remove Custom Track
  const handleRemoveTrack = (trackId: string) => {
    setTracks((prev) => prev.filter((tr) => tr.id !== trackId));
  };

  // Sleep Timer Countdown Ticker
  useEffect(() => {
    if (!sleepTimer.active) return;

    const interval = setInterval(() => {
      setSleepTimer((prev) => {
        if (prev.remainingSeconds <= 1) {
          audioEngine.pause();
          setPlayerState((p) => ({ ...p, isPlaying: false }));
          return { active: false, remainingSeconds: 0, initialMinutes: 0 };
        }
        return { ...prev, remainingSeconds: prev.remainingSeconds - 1 };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sleepTimer.active]);

  const handleSetSleepTimer = (minutes: number) => {
    setSleepTimer({
      active: true,
      remainingSeconds: minutes * 60,
      initialMinutes: minutes,
    });
  };

  const handleCancelSleepTimer = () => {
    setSleepTimer({ active: false, remainingSeconds: 0, initialMinutes: 0 });
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        handlePlayPause();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleSeek(playerState.currentTime + 5);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handleSeek(playerState.currentTime - 5);
      } else if (e.code === 'KeyM') {
        handleMuteToggle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playerState.isPlaying, playerState.currentTime, playerState.isMuted]);

  const t = translations[language];

  return (
    <div
      className={`min-h-screen text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950 transition-colors duration-500 ${
        theme === 'cyberpunk'
          ? 'bg-slate-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(6,182,212,0.15),rgba(255,255,255,0))]'
          : theme === 'light'
          ? 'bg-slate-100 text-slate-900'
          : 'bg-slate-950'
      }`}
    >
      {/* Floating Toast Notice Banner */}
      {toastNotice && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-slate-900/95 border-2 border-cyan-400 p-4 rounded-2xl shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-cyan-400 shrink-0 animate-pulse" />
            <div>
              <p className="text-xs font-bold text-slate-100">{toastNotice}</p>
              <p className="text-[10px] text-cyan-300/80 mt-0.5 font-mono">
                {language === 'gu' ? '✓ ઓરિજિનલ ઓડિયો ફાઇલ સુરક્ષિત અકબંધ છે' : '✓ Original track preserved & untouched'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <Navbar
        language={language}
        onLanguageChange={setLanguage}
        theme={theme}
        onThemeChange={setTheme}
        isMobileView={isMobileView}
        onToggleMobileView={() => setIsMobileView(!isMobileView)}
        sleepTimer={sleepTimer}
        onOpenSleepTimer={() => setIsSleepTimerOpen(true)}
        onOpenInfoModal={() => setIsInfoModalOpen(true)}
        onOpenSyncPreset={() => setIsSyncPresetOpen(true)}
        onOpenInstallModal={() => setIsInstallModalOpen(true)}
        onOpenAudioFile={handleAddCustomTrack}
        onOpenConverterTab={() => {
          setActiveTab('convert');
          if (isMobileView) setIsMobileView(false);
        }}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {isMobileView ? (
          /* Android Mobile App Frame View */
          <div className="flex flex-col items-center justify-center py-2">
            <AndroidMobilePlayer
              tracks={tracks}
              currentTrack={currentTrack}
              currentTrackIndex={currentTrackIndex}
              playerState={playerState}
              microDelaySettings={microDelaySettings}
              spatialSettings={spatialSettings}
              eqSettings={eqSettings}
              language={language}
              onPlayPause={handlePlayPause}
              onStop={handleStop}
              onPrevious={handlePreviousTrack}
              onNext={handleNextTrack}
              onSeek={handleSeek}
              onVolumeChange={handleVolumeChange}
              onMuteToggle={handleMuteToggle}
              onShuffleToggle={() => setPlayerState((p) => ({ ...p, shuffle: !p.shuffle }))}
              onRepeatToggle={() => {
                const modes: RepeatMode[] = ['off', 'one', 'all'];
                const nextIdx = (modes.indexOf(playerState.repeat) + 1) % modes.length;
                setPlayerState((p) => ({ ...p, repeat: modes[nextIdx] }));
              }}
              onSelectTrack={(tr) => {
                const idx = tracks.findIndex((t) => t.id === tr.id);
                if (idx !== -1) {
                  setCurrentTrackIndex(idx);
                  setPlayerState((p) => ({ ...p, isPlaying: true }));
                }
              }}
              onMicroDelayChange={handleMicroDelayChange}
              onSpatialChange={handleSpatialChange}
              onEQChange={handleEQChange}
              onAddCustomTrack={handleAddCustomTrack}
              onRemoveTrack={handleRemoveTrack}
              onToggleAuto20ms={handleToggleAuto20ms}
              onSaveNewCopy={handleSaveNewCopy}
              isSavingCopy={isSavingCopy}
              onCrossfadeChange={handleCrossfadeChange}
              onToggleVolumeNormalization={handleToggleVolumeNormalization}
              onPitchChange={handlePitchChange}
              onOpenInstallModal={() => setIsInstallModalOpen(true)}
            />
          </div>
        ) : (
          /* Desktop Dashboard View */
          <>
            {/* Top Section: Visualizer & Audio Player Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              <div className="lg:col-span-7">
                <Visualizer3D
                  mode={visualizerMode}
                  onModeChange={setVisualizerMode}
                  language={language}
                />
              </div>

              <div className="lg:col-span-5 flex flex-col justify-between">
                <AudioPlayerControls
                  currentTrack={currentTrack}
                  playerState={playerState}
                  microDelaySettings={microDelaySettings}
                  spatialSettings={spatialSettings}
                  onPlayPause={handlePlayPause}
                  onStop={handleStop}
                  onPrevious={handlePreviousTrack}
                  onNext={handleNextTrack}
                  onSeek={handleSeek}
                  onVolumeChange={handleVolumeChange}
                  onMuteToggle={handleMuteToggle}
                  onShuffleToggle={() => setPlayerState((p) => ({ ...p, shuffle: !p.shuffle }))}
                  onRepeatToggle={() => {
                    const modes: RepeatMode[] = ['off', 'one', 'all'];
                    const nextIdx = (modes.indexOf(playerState.repeat) + 1) % modes.length;
                    setPlayerState((p) => ({ ...p, repeat: modes[nextIdx] }));
                  }}
                  onSpeedChange={(speed) => {
                    audioEngine.setPlaybackRate(speed);
                    setPlayerState((p) => ({ ...p, playbackRate: speed }));
                  }}
                  language={language}
                  onToggleAuto20ms={handleToggleAuto20ms}
                  onSaveNewCopy={handleSaveNewCopy}
                  isSavingCopy={isSavingCopy}
                  onCrossfadeChange={handleCrossfadeChange}
                  onToggleVolumeNormalization={handleToggleVolumeNormalization}
                  onPitchChange={handlePitchChange}
                  onMicroDelayChange={handleMicroDelayChange}
                  onSpatialChange={handleSpatialChange}
                  onOpenSyncPreset={() => setIsSyncPresetOpen(true)}
                />
              </div>
            </div>

            {/* Feature Navigation Tabs */}
            <div className="flex items-center justify-center sm:justify-start gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
              <button
                onClick={() => setActiveTab('delay')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
                  activeTab === 'delay'
                    ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30'
                    : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>3D Millisecond Delay (0-300ms)</span>
              </button>

              <button
                onClick={() => setActiveTab('spatial')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
                  activeTab === 'spatial'
                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                    : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                <Compass className="w-4 h-4" />
                <span>3D Spatial Stage</span>
              </button>

              <button
                onClick={() => setActiveTab('eq')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
                  activeTab === 'eq'
                    ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                    : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>10-Band EQ & FX</span>
              </button>

              <button
                onClick={() => setActiveTab('playlist')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
                  activeTab === 'playlist'
                    ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30'
                    : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                <Music className="w-4 h-4" />
                <span>Playlist & Upload</span>
              </button>

              <button
                onClick={() => setActiveTab('convert')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
                  activeTab === 'convert'
                    ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30 font-bold'
                    : 'bg-slate-900/80 hover:bg-slate-800 text-cyan-300 border border-cyan-800/60'
                }`}
              >
                <DownloadCloud className="w-4 h-4 text-cyan-400" />
                <span>3D Audio Converter & WAV Save</span>
              </button>
            </div>

            {/* Tab View Panels */}
            {activeTab === 'delay' && (
              <MicrosecondDelayPanel
                settings={microDelaySettings}
                onChange={handleMicroDelayChange}
                language={language}
                onToggleAuto20ms={handleToggleAuto20ms}
                onSaveNewCopy={handleSaveNewCopy}
                isSavingCopy={isSavingCopy}
                onOpenSyncPreset={() => setIsSyncPresetOpen(true)}
              />
            )}

            {activeTab === 'spatial' && (
              <Spatial3DPanner
                settings={spatialSettings}
                onChange={handleSpatialChange}
                language={language}
              />
            )}

            {activeTab === 'eq' && (
              <EqualizerPanel
                settings={eqSettings}
                onChange={handleEQChange}
                language={language}
              />
            )}

            {activeTab === 'playlist' && (
              <PlaylistManager
                tracks={tracks}
                currentTrackId={currentTrack?.id || null}
                isPlaying={playerState.isPlaying}
                onSelectTrack={(tr) => {
                  const idx = tracks.findIndex((t) => t.id === tr.id);
                  if (idx !== -1) {
                    setCurrentTrackIndex(idx);
                    setPlayerState((p) => ({ ...p, isPlaying: true }));
                  }
                }}
                onAddCustomTrack={handleAddCustomTrack}
                onRemoveTrack={handleRemoveTrack}
                language={language}
              />
            )}

            {activeTab === 'convert' && (
              <AudioConverterPanel
                tracks={tracks}
                currentTrack={currentTrack}
                microDelaySettings={microDelaySettings}
                spatialSettings={spatialSettings}
                eqSettings={eqSettings}
                language={language}
                onAddCustomTrack={handleAddCustomTrack}
                onSelectTrack={(tr) => {
                  const idx = tracks.findIndex((t) => t.id === tr.id);
                  if (idx !== -1) {
                    setCurrentTrackIndex(idx);
                    setPlayerState((p) => ({ ...p, isPlaying: true }));
                  }
                }}
                onAddConvertedTrack={handleAddConvertedTrack}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 border-t border-slate-900 text-center text-xs text-slate-500">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Headphones className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-slate-300">3D Sound Music Player</span>
        </div>
        <p>0 to 300 Millisecond (ms) L+R Delay Setting & 3D Spatial Audio Controller</p>
      </footer>

      {/* Modals */}
      <SleepTimerModal
        isOpen={isSleepTimerOpen}
        onClose={() => setIsSleepTimerOpen(false)}
        sleepTimer={sleepTimer}
        onSetTimer={handleSetSleepTimer}
        onCancelTimer={handleCancelSleepTimer}
        language={language}
      />

      <InfoModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        language={language}
      />

      <SyncPresetModal
        isOpen={isSyncPresetOpen}
        onClose={() => setIsSyncPresetOpen(false)}
        language={language}
        eqSettings={eqSettings}
        spatialSettings={spatialSettings}
        microDelaySettings={microDelaySettings}
        pitchSemi={playerState.pitchSemi}
        onApplyPreset={handleApplyPreset}
        onShowNotice={(msg) => {
          setToastNotice(msg);
          setTimeout(() => setToastNotice(null), 3500);
        }}
      />

      {isInstallModalOpen && (
        <InstallPwaModal
          language={language}
          onClose={() => setIsInstallModalOpen(false)}
        />
      )}
    </div>
  );
}
