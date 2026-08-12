import { MicrosecondDelaySettings, Spatial3DSettings, EQSettings } from '../types';

const EQ_FREQUENCIES = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

export class AudioEngine {
  private audioContext: AudioContext | null = null;

  // Dual audio elements for seamless crossfading
  private audioElementA: HTMLAudioElement;
  private audioElementB: HTMLAudioElement;
  private sourceNodeA: MediaElementAudioSourceNode | null = null;
  private sourceNodeB: MediaElementAudioSourceNode | null = null;
  private gainNodeA: GainNode | null = null;
  private gainNodeB: GainNode | null = null;
  private activeElementKey: 'A' | 'B' = 'A';

  // Pitch Shift (-12 to +12 semitones) & Playback Speed
  private pitchSemi: number = 0;
  private playbackRate: number = 1.0;

  // Crossfade duration in seconds (0 to 10s)
  private crossfadeDuration: number = 3;
  private hasCrossfadeTriggered: boolean = false;
  private fadeTimeout: number | null = null;

  // EQ Biquad filters
  private eqFilters: BiquadFilterNode[] = [];
  private bassFilter: BiquadFilterNode | null = null;
  private trebleFilter: BiquadFilterNode | null = null;

  // L/R Channel Splitter, Delay & Mute Gain Nodes
  private splitterNode: ChannelSplitterNode | null = null;
  private leftDelayNode: DelayNode | null = null;
  private rightDelayNode: DelayNode | null = null;
  private leftMuteNode: GainNode | null = null;
  private rightMuteNode: GainNode | null = null;
  private mergerNode: ChannelMergerNode | null = null;

  // L+R Central Sound Lock (Center Vocal Preservation) Node
  private centerLockGainNode: GainNode | null = null;

  // 3D Spatial Panner Node
  private pannerNode: PannerNode | null = null;

  // Dynamics Limiter
  private compressorNode: DynamicsCompressorNode | null = null;

  // Global Volume Normalizer
  private normalizerGainNode: GainNode | null = null;
  private isNormalizerEnabled: boolean = false;
  private normalizerInterval: number | null = null;

  // Master Volume Gain & Analyser
  private masterGainNode: GainNode | null = null;
  private analyserNode: AnalyserNode | null = null;

  // 8D Orbit Animation state
  private orbitAngle = 0;
  private orbitAnimFrame: number | null = null;
  private isOrbiting = false;
  private orbitSpeed = 1.0;

  // Current settings cache
  private microDelaySettings: MicrosecondDelaySettings = {
    leftDelayUs: 0,
    rightDelayUs: 0,
    enabled: true,
    autoOrbit8D: false,
    orbitSpeed: 1.0,
    centerLockEnabled: true,
    maxDelayRangeUs: 5000,
  };

  private spatialSettings: Spatial3DSettings = {
    x: 0,
    y: 0,
    z: -1,
    panningModel: 'HRTF',
    distanceModel: 'inverse',
    enabled: false,
  };

  private listeners: {
    onEnded?: () => void;
    onTimeUpdate?: (currentTime: number, duration: number) => void;
    onSpatialChange?: (x: number, z: number, leftDelayUs: number, rightDelayUs: number) => void;
  } = {};

  constructor() {
    this.audioElementA = new Audio();
    this.audioElementA.crossOrigin = 'anonymous';

    this.audioElementB = new Audio();
    this.audioElementB.crossOrigin = 'anonymous';

    this.attachEvents(this.audioElementA);
    this.attachEvents(this.audioElementB);
  }

  private attachEvents(elem: HTMLAudioElement) {
    elem.addEventListener('ended', () => {
      if (elem === this.activeElement && !this.hasCrossfadeTriggered) {
        this.hasCrossfadeTriggered = true;
        if (this.listeners.onEnded) this.listeners.onEnded();
      }
    });

    elem.addEventListener('timeupdate', () => {
      if (elem !== this.activeElement) return;

      const current = elem.currentTime;
      const duration = elem.duration || 0;

      if (this.listeners.onTimeUpdate) {
        this.listeners.onTimeUpdate(current, duration);
      }

      // Check for auto-crossfade trigger near track end
      if (
        this.crossfadeDuration > 0 &&
        duration > 0 &&
        duration - current <= this.crossfadeDuration &&
        !this.hasCrossfadeTriggered &&
        !elem.paused
      ) {
        this.hasCrossfadeTriggered = true;
        if (this.listeners.onEnded) {
          this.listeners.onEnded();
        }
      }
    });
  }

  public get activeElement(): HTMLAudioElement {
    return this.activeElementKey === 'A' ? this.audioElementA : this.audioElementB;
  }

  public get activeGainNode(): GainNode | null {
    return this.activeElementKey === 'A' ? this.gainNodeA : this.gainNodeB;
  }

  public get inactiveElement(): HTMLAudioElement {
    return this.activeElementKey === 'A' ? this.audioElementB : this.audioElementA;
  }

  public get inactiveGainNode(): GainNode | null {
    return this.activeElementKey === 'A' ? this.gainNodeB : this.gainNodeA;
  }

  public setCrossfadeDuration(seconds: number) {
    this.crossfadeDuration = Math.max(0, Math.min(10, seconds));
  }

  public getCrossfadeDuration(): number {
    return this.crossfadeDuration;
  }

  public setListeners(listeners: typeof this.listeners) {
    this.listeners = { ...this.listeners, ...listeners };
  }

  public initContext() {
    if (this.audioContext) return;

    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.audioContext = new AudioCtx();

    // 1. Create Source & Gain Nodes for both elements
    this.sourceNodeA = this.audioContext.createMediaElementSource(this.audioElementA);
    this.sourceNodeB = this.audioContext.createMediaElementSource(this.audioElementB);

    this.gainNodeA = this.audioContext.createGain();
    this.gainNodeB = this.audioContext.createGain();

    this.gainNodeA.gain.value = 1;
    this.gainNodeB.gain.value = 0;

    this.sourceNodeA.connect(this.gainNodeA);
    this.sourceNodeB.connect(this.gainNodeB);

    // 2. Create 10-Band EQ Filters
    this.eqFilters = EQ_FREQUENCIES.map((freq) => {
      const filter = this.audioContext!.createBiquadFilter();
      filter.type = freq <= 125 ? 'lowshelf' : freq >= 8000 ? 'highshelf' : 'peaking';
      filter.frequency.value = freq;
      filter.gain.value = 0;
      filter.Q.value = 1.4;
      return filter;
    });

    // Connect dual gains to first EQ filter
    const firstEq = this.eqFilters[0];
    this.gainNodeA.connect(firstEq);
    this.gainNodeB.connect(firstEq);

    // 3. Bass & Treble Filters
    this.bassFilter = this.audioContext.createBiquadFilter();
    this.bassFilter.type = 'lowshelf';
    this.bassFilter.frequency.value = 150;
    this.bassFilter.gain.value = 0;

    this.trebleFilter = this.audioContext.createBiquadFilter();
    this.trebleFilter.type = 'highshelf';
    this.trebleFilter.frequency.value = 6000;
    this.trebleFilter.gain.value = 0;

    // 4. Create Splitter, Center Lock Gain & Microsecond Delay Nodes
    this.splitterNode = this.audioContext.createChannelSplitter(2);
    this.leftDelayNode = this.audioContext.createDelay(5.0);
    this.rightDelayNode = this.audioContext.createDelay(5.0);
    this.leftDelayNode.delayTime.value = 0;
    this.rightDelayNode.delayTime.value = 0;

    this.centerLockGainNode = this.audioContext.createGain();
    this.centerLockGainNode.gain.value = 0.35;

    this.mergerNode = this.audioContext.createChannelMerger(2);

    // 5. Create 3D Spatial Panner Node
    this.pannerNode = this.audioContext.createPanner();
    this.pannerNode.panningModel = 'HRTF';
    this.pannerNode.distanceModel = 'inverse';
    this.pannerNode.refDistance = 1;
    this.pannerNode.maxDistance = 10000;
    this.pannerNode.rolloffFactor = 1;
    this.pannerNode.coneInnerAngle = 360;

    if (this.pannerNode.positionX) {
      this.pannerNode.positionX.value = 0;
      this.pannerNode.positionY.value = 0;
      this.pannerNode.positionZ.value = -1;
    } else {
      this.pannerNode.setPosition(0, 0, -1);
    }

    // 6. Compressor / Limiter & Global Normalizer Gain Node
    this.compressorNode = this.audioContext.createDynamicsCompressor();
    this.compressorNode.threshold.value = -12;
    this.compressorNode.knee.value = 30;
    this.compressorNode.ratio.value = 12;
    this.compressorNode.attack.value = 0.003;
    this.compressorNode.release.value = 0.25;

    this.normalizerGainNode = this.audioContext.createGain();
    this.normalizerGainNode.gain.value = 1.0;

    // 7. Master Gain & Analyser
    this.masterGainNode = this.audioContext.createGain();
    this.analyserNode = this.audioContext.createAnalyser();
    this.analyserNode.fftSize = 512;
    this.analyserNode.smoothingTimeConstant = 0.8;

    // Connect Node Chain
    let currentNode: AudioNode = firstEq;

    for (let i = 1; i < this.eqFilters.length; i++) {
      currentNode.connect(this.eqFilters[i]);
      currentNode = this.eqFilters[i];
    }

    currentNode.connect(this.bassFilter);
    currentNode = this.bassFilter;

    currentNode.connect(this.trebleFilter);
    currentNode = this.trebleFilter;

    currentNode.connect(this.splitterNode);

    // Pure independent-channel delay connection with independent L/R channel mute nodes:
    // Input L (Splitter 0) -> Left Delay Node -> Left Mute Gain -> Output L (Merger 0)
    // Input R (Splitter 1) -> Right Delay Node -> Right Mute Gain -> Output R (Merger 1)
    this.leftMuteNode = this.audioContext.createGain();
    this.rightMuteNode = this.audioContext.createGain();
    this.leftMuteNode.gain.value = this.microDelaySettings.leftMuted ? 0.0 : 1.0;
    this.rightMuteNode.gain.value = this.microDelaySettings.rightMuted ? 0.0 : 1.0;

    this.splitterNode.connect(this.leftDelayNode, 0);
    this.leftDelayNode.connect(this.leftMuteNode);
    this.leftMuteNode.connect(this.mergerNode, 0, 0);

    this.splitterNode.connect(this.rightDelayNode, 1);
    this.rightDelayNode.connect(this.rightMuteNode);
    this.rightMuteNode.connect(this.mergerNode, 0, 1);

    this.mergerNode.connect(this.pannerNode);
    this.pannerNode.connect(this.compressorNode);
    this.compressorNode.connect(this.normalizerGainNode);
    this.normalizerGainNode.connect(this.masterGainNode);
    this.masterGainNode.connect(this.analyserNode);
    this.analyserNode.connect(this.audioContext.destination);
  }

  public async resumeContext() {
    if (!this.audioContext) {
      this.initContext();
    }
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  public async loadTrack(url: string) {
    await this.resumeContext();

    const oldElem = this.activeElement;
    const oldGain = this.activeGainNode;
    const isPlaying = oldElem && !oldElem.paused && oldElem.currentTime > 0;

    if (this.crossfadeDuration > 0 && isPlaying && this.audioContext) {
      // Crossfade transition to the other element
      this.activeElementKey = this.activeElementKey === 'A' ? 'B' : 'A';
      const newElem = this.activeElement;
      const newGain = this.activeGainNode;

      newElem.src = url;
      newElem.load();
      this.updatePlaybackAndPitch();
      this.hasCrossfadeTriggered = false;

      const now = this.audioContext.currentTime;
      const actualFade = Math.min(this.crossfadeDuration, Math.max(0.5, (oldElem.duration || 10) / 2));

      if (oldGain && newGain) {
        oldGain.gain.cancelScheduledValues(now);
        oldGain.gain.setValueAtTime(oldGain.gain.value, now);
        oldGain.gain.linearRampToValueAtTime(0, now + actualFade);

        newGain.gain.cancelScheduledValues(now);
        newGain.gain.setValueAtTime(0, now);
        newGain.gain.linearRampToValueAtTime(1, now + actualFade);
      }

      try {
        await newElem.play();
      } catch (err) {
        console.warn('Crossfade playback prevented:', err);
      }

      if (this.fadeTimeout !== null) {
        clearTimeout(this.fadeTimeout);
      }
      this.fadeTimeout = window.setTimeout(() => {
        oldElem.pause();
        oldElem.currentTime = 0;
        this.fadeTimeout = null;
      }, actualFade * 1000 + 100);
    } else {
      // Direct load without crossfade
      this.hasCrossfadeTriggered = false;
      const elem = this.activeElement;
      elem.src = url;
      elem.load();
      this.updatePlaybackAndPitch();

      if (this.audioContext && this.activeGainNode && this.inactiveGainNode) {
        const now = this.audioContext.currentTime;
        this.activeGainNode.gain.cancelScheduledValues(now);
        this.activeGainNode.gain.setValueAtTime(1, now);
        this.inactiveGainNode.gain.cancelScheduledValues(now);
        this.inactiveGainNode.gain.setValueAtTime(0, now);
      }
      this.inactiveElement.pause();
      this.inactiveElement.currentTime = 0;
    }
  }

  public async play() {
    await this.resumeContext();
    const elem = this.activeElement;
    if (elem) {
      try {
        await elem.play();
      } catch (err) {
        console.warn('Playback interrupted or blocked:', err);
      }
    }
  }

  public pause() {
    this.audioElementA.pause();
    this.audioElementB.pause();
  }

  public stop() {
    this.audioElementA.pause();
    this.audioElementA.currentTime = 0;
    this.audioElementB.pause();
    this.audioElementB.currentTime = 0;
    this.hasCrossfadeTriggered = false;

    if (this.audioContext && this.gainNodeA && this.gainNodeB) {
      const now = this.audioContext.currentTime;
      this.gainNodeA.gain.cancelScheduledValues(now);
      this.gainNodeA.gain.setValueAtTime(1, now);
      this.gainNodeB.gain.cancelScheduledValues(now);
      this.gainNodeB.gain.setValueAtTime(0, now);
    }
    this.activeElementKey = 'A';
  }

  public seek(seconds: number) {
    const elem = this.activeElement;
    if (elem && isFinite(seconds)) {
      this.hasCrossfadeTriggered = false;
      elem.currentTime = Math.max(0, Math.min(seconds, elem.duration || 0));
    }
  }

  public setVolume(volume: number) {
    const clamped = Math.max(0, Math.min(1, volume));
    if (this.masterGainNode && this.audioContext) {
      this.masterGainNode.gain.setTargetAtTime(clamped, this.audioContext.currentTime, 0.01);
    }
    this.audioElementA.volume = clamped;
    this.audioElementB.volume = clamped;
  }

  public setPlaybackRate(rate: number) {
    this.playbackRate = rate;
    this.updatePlaybackAndPitch();
  }

  public setPitchSemi(semitones: number) {
    this.pitchSemi = Math.max(-12, Math.min(12, semitones));
    this.updatePlaybackAndPitch();
  }

  public getPitchSemi(): number {
    return this.pitchSemi;
  }

  private updatePlaybackAndPitch() {
    const pitchFactor = Math.pow(2, this.pitchSemi / 12.0);
    const effectiveRate = Math.max(0.25, Math.min(4.0, this.playbackRate * pitchFactor));

    const applyToElem = (elem: HTMLAudioElement) => {
      const isPitchShifted = this.pitchSemi !== 0;
      if ('preservesPitch' in elem) {
        (elem as any).preservesPitch = !isPitchShifted;
      }
      if ('webkitPreservesPitch' in elem) {
        (elem as any).webkitPreservesPitch = !isPitchShifted;
      }
      if ('mozPreservesPitch' in elem) {
        (elem as any).mozPreservesPitch = !isPitchShifted;
      }
      elem.playbackRate = effectiveRate;
    };

    applyToElem(this.audioElementA);
    applyToElem(this.audioElementB);
  }

  // Set Channel Mute (L Mute / R Mute)
  public setChannelMute(leftMuted: boolean, rightMuted: boolean) {
    this.microDelaySettings.leftMuted = leftMuted;
    this.microDelaySettings.rightMuted = rightMuted;

    if (!this.audioContext) return;
    const now = this.audioContext.currentTime;

    if (this.leftMuteNode) {
      const leftGain = leftMuted ? 0.0 : 1.0;
      this.leftMuteNode.gain.setTargetAtTime(leftGain, now, 0.005);
    }
    if (this.rightMuteNode) {
      const rightGain = rightMuted ? 0.0 : 1.0;
      this.rightMuteNode.gain.setTargetAtTime(rightGain, now, 0.005);
    }
  }

  // Set Millisecond Delay (0 to 300 ms, up to 2000 ms)
  public setMicrosecondDelay(
    leftMs: number,
    rightMs: number,
    enabled = true,
    centerLockEnabled = true,
    maxDelayRangeMs = 2000,
    leftMuted = this.microDelaySettings.leftMuted ?? false,
    rightMuted = this.microDelaySettings.rightMuted ?? false
  ) {
    const maxVal = maxDelayRangeMs || 2000;
    this.microDelaySettings.leftDelayUs = Math.max(0, Math.min(maxVal, leftMs));
    this.microDelaySettings.rightDelayUs = Math.max(0, Math.min(maxVal, rightMs));
    this.microDelaySettings.leftDelayMs = this.microDelaySettings.leftDelayUs;
    this.microDelaySettings.rightDelayMs = this.microDelaySettings.rightDelayUs;
    this.microDelaySettings.enabled = enabled;
    this.microDelaySettings.centerLockEnabled = centerLockEnabled;
    this.microDelaySettings.maxDelayRangeUs = maxVal;
    this.microDelaySettings.maxDelayRangeMs = maxVal;

    this.setChannelMute(leftMuted, rightMuted);

    if (!this.audioContext || !this.leftDelayNode || !this.rightDelayNode) return;

    const now = this.audioContext.currentTime;

    if (this.centerLockGainNode) {
      const centerGain = enabled && centerLockEnabled ? 0.35 : 0.0;
      this.centerLockGainNode.gain.setTargetAtTime(centerGain, now, 0.01);
    }

    if (enabled) {
      // Milliseconds to seconds conversion (e.g. 300 ms = 0.3 sec)
      const leftSec = (this.microDelaySettings.leftDelayUs / 1000.0);
      const rightSec = (this.microDelaySettings.rightDelayUs / 1000.0);

      this.leftDelayNode.delayTime.setTargetAtTime(leftSec, now, 0.002);
      this.rightDelayNode.delayTime.setTargetAtTime(rightSec, now, 0.002);
    } else {
      this.leftDelayNode.delayTime.setTargetAtTime(0, now, 0.002);
      this.rightDelayNode.delayTime.setTargetAtTime(0, now, 0.002);
    }
  }

  // Set 8D Auto-Orbit mode
  public setAutoOrbit8D(enabled: boolean, speed = 1.0) {
    this.microDelaySettings.autoOrbit8D = enabled;
    this.microDelaySettings.orbitSpeed = speed;
    this.orbitSpeed = speed;

    if (enabled) {
      this.start8DOrbit();
    } else {
      this.stop8DOrbit();
    }
  }

  private start8DOrbit() {
    if (this.isOrbiting) return;
    this.isOrbiting = true;

    const animateOrbit = () => {
      if (!this.isOrbiting) return;

      this.orbitAngle += 0.015 * this.orbitSpeed;
      if (this.orbitAngle > Math.PI * 2) {
        this.orbitAngle -= Math.PI * 2;
      }

      const radius = 3.5;
      const x = Math.sin(this.orbitAngle) * radius;
      const z = -Math.cos(this.orbitAngle) * radius;
      const y = Math.sin(this.orbitAngle * 2) * 0.5;

      this.setSpatial3DPosition(x, y, z);

      const delayScale = (Math.sin(this.orbitAngle) + 1) / 2;
      const leftMs = Math.round((1 - delayScale) * 20);
      const rightMs = Math.round(delayScale * 20);

      this.setMicrosecondDelay(leftMs, rightMs, true);

      if (this.listeners.onSpatialChange) {
        this.listeners.onSpatialChange(x, z, leftMs, rightMs);
      }

      this.orbitAnimFrame = requestAnimationFrame(animateOrbit);
    };

    this.orbitAnimFrame = requestAnimationFrame(animateOrbit);
  }

  private stop8DOrbit() {
    this.isOrbiting = false;
    if (this.orbitAnimFrame !== null) {
      cancelAnimationFrame(this.orbitAnimFrame);
      this.orbitAnimFrame = null;
    }
    this.setSpatial3DPosition(this.spatialSettings.x, this.spatialSettings.y, this.spatialSettings.z);
  }

  // Set 3D Spatial Position coordinates and ON/OFF toggle
  public setSpatial3DPosition(x: number, y: number, z: number, enabled = true) {
    this.spatialSettings.x = x;
    this.spatialSettings.y = y;
    this.spatialSettings.z = z;
    this.spatialSettings.enabled = enabled;

    if (!this.pannerNode || !this.audioContext) return;

    if (!enabled) {
      this.pannerNode.panningModel = 'equalpower';
      if (this.pannerNode.positionX) {
        this.pannerNode.positionX.setTargetAtTime(0, this.audioContext.currentTime, 0.01);
        this.pannerNode.positionY.setTargetAtTime(0, this.audioContext.currentTime, 0.01);
        this.pannerNode.positionZ.setTargetAtTime(-1, this.audioContext.currentTime, 0.01);
      } else {
        this.pannerNode.setPosition(0, 0, -1);
      }
      return;
    }

    this.pannerNode.panningModel = this.spatialSettings.panningModel || 'HRTF';
    if (this.pannerNode.positionX) {
      this.pannerNode.positionX.setTargetAtTime(x, this.audioContext.currentTime, 0.01);
      this.pannerNode.positionY.setTargetAtTime(y, this.audioContext.currentTime, 0.01);
      this.pannerNode.positionZ.setTargetAtTime(z, this.audioContext.currentTime, 0.01);
    } else {
      this.pannerNode.setPosition(x, y, z);
    }
  }

  public setSpatial3DEnabled(enabled: boolean) {
    this.setSpatial3DPosition(this.spatialSettings.x, this.spatialSettings.y, this.spatialSettings.z, enabled);
  }

  public setPanningModel(model: 'HRTF' | 'equalpower') {
    this.spatialSettings.panningModel = model;
    if (this.pannerNode) {
      this.pannerNode.panningModel = model;
    }
  }

  // Set 10-Band EQ gains
  public setEQBand(bandIndex: number, gainDb: number) {
    if (bandIndex >= 0 && bandIndex < this.eqFilters.length && this.audioContext) {
      this.eqFilters[bandIndex].gain.setTargetAtTime(
        Math.max(-12, Math.min(12, gainDb)),
        this.audioContext.currentTime,
        0.01
      );
    }
  }

  public setEQBands(gains: number[]) {
    gains.forEach((gain, idx) => {
      this.setEQBand(idx, gain);
    });
  }

  public setBassBoost(levelPercent: number) {
    if (this.bassFilter && this.audioContext) {
      const gainDb = (levelPercent / 100.0) * 12;
      this.bassFilter.gain.setTargetAtTime(gainDb, this.audioContext.currentTime, 0.01);
    }
  }

  public setTrebleBoost(levelPercent: number) {
    if (this.trebleFilter && this.audioContext) {
      const gainDb = (levelPercent / 100.0) * 10;
      this.trebleFilter.gain.setTargetAtTime(gainDb, this.audioContext.currentTime, 0.01);
    }
  }

  // Set Auto-Limiter & Compression Threshold (-60dB to 0dB) to prevent audio distortion/clipping
  public setAutoLimiter(enabled: boolean, thresholdDb = -24) {
    if (!this.audioContext || !this.compressorNode) return;

    const now = this.audioContext.currentTime;
    const clampedThresh = Math.max(-60, Math.min(0, thresholdDb));

    if (enabled) {
      // Brickwall compression settings to prevent audio distortion/clipping on heavy EQ boost
      this.compressorNode.threshold.setTargetAtTime(clampedThresh, now, 0.01);
      this.compressorNode.knee.setTargetAtTime(6, now, 0.01);
      this.compressorNode.ratio.setTargetAtTime(20, now, 0.01);
      this.compressorNode.attack.setTargetAtTime(0.003, now, 0.01);
      this.compressorNode.release.setTargetAtTime(0.15, now, 0.01);
    } else {
      // Disabling Auto-Limiter: set 1:1 ratio so audio passes transparently without compression
      this.compressorNode.threshold.setTargetAtTime(0, now, 0.01);
      this.compressorNode.ratio.setTargetAtTime(1.0, now, 0.01);
    }
  }

  // Get Frequency Spectrum for visualizer
  public getFrequencyData(): Uint8Array {
    if (!this.analyserNode) return new Uint8Array(0);
    const dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.analyserNode.getByteFrequencyData(dataArray);
    return dataArray;
  }

  // Get Waveform Time Domain data for visualizer
  public getWaveformData(): Uint8Array {
    if (!this.analyserNode) return new Uint8Array(0);
    const dataArray = new Uint8Array(this.analyserNode.fftSize);
    this.analyserNode.getByteTimeDomainData(dataArray);
    return dataArray;
  }

  public isPlaying(): boolean {
    const elem = this.activeElement;
    return !!(elem && !elem.paused);
  }

  public getCurrentTime(): number {
    return this.activeElement ? this.activeElement.currentTime : 0;
  }

  public getDuration(): number {
    const elem = this.activeElement;
    return elem && !isNaN(elem.duration) ? elem.duration : 0;
  }

  // Global Volume Normalizer Control
  public setVolumeNormalizerEnabled(enabled: boolean) {
    this.isNormalizerEnabled = enabled;

    if (!this.audioContext || !this.compressorNode || !this.normalizerGainNode) return;

    const now = this.audioContext.currentTime;

    if (enabled) {
      // Configure compressor for transparent automatic loudness normalization
      this.compressorNode.threshold.setTargetAtTime(-20, now, 0.01);
      this.compressorNode.knee.setTargetAtTime(12, now, 0.01);
      this.compressorNode.ratio.setTargetAtTime(6, now, 0.01);
      this.compressorNode.attack.setTargetAtTime(0.005, now, 0.01);
      this.compressorNode.release.setTargetAtTime(0.1, now, 0.01);

      this.startNormalizerLoop();
    } else {
      // Reset back to standard peak limiter
      this.compressorNode.threshold.setTargetAtTime(-12, now, 0.01);
      this.compressorNode.knee.setTargetAtTime(30, now, 0.01);
      this.compressorNode.ratio.setTargetAtTime(12, now, 0.01);

      this.normalizerGainNode.gain.setTargetAtTime(1.0, now, 0.05);
      this.stopNormalizerLoop();
    }
  }

  public getVolumeNormalizerEnabled(): boolean {
    return this.isNormalizerEnabled;
  }

  private startNormalizerLoop() {
    if (this.normalizerInterval !== null) return;

    this.normalizerInterval = window.setInterval(() => {
      if (!this.isNormalizerEnabled || !this.audioContext || !this.normalizerGainNode) return;
      if (!this.isPlaying()) return;

      const wave = this.getWaveformData();
      if (!wave || wave.length === 0) return;

      let sumSq = 0;
      for (let i = 0; i < wave.length; i++) {
        const norm = (wave[i] - 128) / 128.0;
        sumSq += norm * norm;
      }

      const rms = Math.sqrt(sumSq / wave.length);

      // Target RMS level = 0.22 (approx -13 LUFS / comfortable level)
      if (rms > 0.01) {
        const targetGain = Math.max(0.4, Math.min(2.5, 0.22 / rms));
        this.normalizerGainNode.gain.setTargetAtTime(targetGain, this.audioContext.currentTime, 0.15);
      }
    }, 150);
  }

  private stopNormalizerLoop() {
    if (this.normalizerInterval !== null) {
      clearInterval(this.normalizerInterval);
      this.normalizerInterval = null;
    }
  }

  public destroy() {
    this.stop8DOrbit();
    this.stopNormalizerLoop();
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}

// Global Singleton
export const audioEngine = new AudioEngine();
