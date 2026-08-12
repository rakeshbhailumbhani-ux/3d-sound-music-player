export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  url: string;
  cover: string;
  isCustom?: boolean;
  genre?: string;
  file?: File;
}

export interface MicrosecondDelaySettings {
  leftDelayUs: number; // Left channel delay in milliseconds (ms) (0 to 300 ms, up to 2000 ms)
  rightDelayUs: number; // Right channel delay in milliseconds (ms) (0 to 300 ms, up to 2000 ms)
  leftDelayMs?: number; // Alias for leftDelayUs in ms
  rightDelayMs?: number; // Alias for rightDelayUs in ms
  leftMuted?: boolean; // L Channel Mute ON / OFF
  rightMuted?: boolean; // R Channel Mute ON / OFF
  enabled: boolean; // ON / OFF toggle for L+R delay effect
  autoOrbit8D: boolean;
  orbitSpeed: number; // 0.2 to 3.0
  centerLockEnabled?: boolean; // Keeps L+R central vocal sound solid and unshifted
  maxDelayRangeUs?: number; // Max delay limit in milliseconds (e.g., 300 ms main range, up to 2000 ms max)
  maxDelayRangeMs?: number;
}

export interface Spatial3DSettings {
  x: number; // -10 to 10
  y: number; // -10 to 10
  z: number; // -10 to 10
  panningModel: 'HRTF' | 'equalpower';
  distanceModel: 'linear' | 'inverse' | 'exponential';
  enabled: boolean; // ON / OFF toggle for 3D spatial effect (Flat sound when OFF)
}

export interface EQSettings {
  bands: number[]; // 10 values (-12dB to +12dB)
  presetName: string;
  bassBoost: number; // 0 to 100%
  trebleBoost: number; // 0 to 100%
  reverbLevel: number; // 0 to 100%
  compressorEnabled: boolean;
  compressorThreshold?: number; // -60 to 0 dB
  autoLimiterEnabled?: boolean; // Anti-clipping Auto-Limiter toggle
}

export type RepeatMode = 'off' | 'one' | 'all';

export type VisualizerMode = '3d-bars' | '3d-orbit' | '3d-spectrogram' | '3d-tunnel' | '2d-spectrum' | '2d-waveform';

export type Language = 'gu' | 'en';

export type Theme = 'dark' | 'cyberpunk' | 'light';

export interface AudioPreset {
  id: string;
  name: string;
  createdAt: number;
  eq: EQSettings;
  spatial: Spatial3DSettings;
  delay: MicrosecondDelaySettings;
  pitchSemi?: number;
}

export interface SleepTimerState {
  active: boolean;
  remainingSeconds: number;
  initialMinutes: number;
}

export interface PlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  pitchSemi: number; // -12 to +12 semitones (+/- 1 octave)
  shuffle: boolean;
  repeat: RepeatMode;
  crossfadeDuration: number; // 0 to 10 seconds
  volumeNormalizationEnabled: boolean;
}
