export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;

  private gainNode: GainNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private pannerNode: PannerNode | null = null;
  private compressorNode: DynamicsCompressorNode | null = null;

  private splitterNode: ChannelSplitterNode | null = null;
  private mergerNode: ChannelMergerNode | null = null;

  private leftGainNode: GainNode | null = null;
  private rightGainNode: GainNode | null = null;

  private leftDelayNode: DelayNode | null = null;
  private rightDelayNode: DelayNode | null = null;

  private eqFilters: BiquadFilterNode[] = [];

  private audioElement: HTMLAudioElement;

  private volume = 1;
  private playbackRate = 1;
  private pitchSemi = 0;

  private leftMuted = false;
  private rightMuted = false;

  private leftDelayMs = 0;
  private rightDelayMs = 0;

  private spatialEnabled = true;

  private bassBoost = 0;
  private trebleBoost = 0;

  private crossfadeDuration = 3;
  private volumeNormalizationEnabled = false;

  private orbitTimer: number | null = null;

  private listeners: {
    onEnded?: () => void;
    onTimeUpdate?: (
      currentTime: number,
      duration: number
    ) => void;

    onSpatialChange?: (
      x: number,
      z: number,
      leftDelayMs: number,
      rightDelayMs: number
    ) => void;
  } = {};

  constructor() {
    this.audioElement = new Audio();

    this.audioElement.preload = 'auto';

    /*
     * Important for Web Audio.
     * The AudioContext will receive audio from this element.
     */
    this.audioElement.crossOrigin = 'anonymous';

    this.audioElement.addEventListener('ended', () => {
      this.listeners.onEnded?.();
    });

    this.audioElement.addEventListener('timeupdate', () => {
      this.listeners.onTimeUpdate?.(
        this.audioElement.currentTime,
        this.audioElement.duration || 0
      );
    });

    this.audioElement.addEventListener('loadedmetadata', () => {
      console.log(
        'Audio metadata loaded:',
        this.audioElement.duration
      );
    });

    this.audioElement.addEventListener('canplay', () => {
      console.log('Audio can play');
    });

    this.audioElement.addEventListener('error', () => {
      console.error(
        'Audio error:',
        this.audioElement.error
      );
    });
  }

  /*
   * ============================================================
   * PUBLIC AUDIO ELEMENT
   * ============================================================
   */

  public get activeElement(): HTMLAudioElement {
    return this.audioElement;
  }

  public get inactiveElement(): HTMLAudioElement {
    return this.audioElement;
  }

  public get activeGainNode(): GainNode | null {
    return this.gainNode;
  }

  public get inactiveGainNode(): GainNode | null {
    return this.gainNode;
  }

  public setListeners(listeners: typeof this.listeners) {
    this.listeners = {
      ...this.listeners,
      ...listeners,
    };
  }

  /*
   * ============================================================
   * INITIALIZE WEB AUDIO
   * ============================================================
   */

  public initContext() {
    if (this.audioContext) {
      return;
    }

    const AudioContextClass =
      window.AudioContext ||
      (window as any).webkitAudioContext;

    if (!AudioContextClass) {
      console.warn(
        'Web Audio API is not supported.'
      );
      return;
    }

    this.audioContext =
      new AudioContextClass();

    /*
     * Source
     */
    this.sourceNode =
      this.audioContext.createMediaElementSource(
        this.audioElement
      );

    /*
     * Master Gain
     */
    this.gainNode =
      this.audioContext.createGain();

    this.gainNode.gain.value =
      this.volume;

    /*
     * ============================================================
     * 10 BAND EQ
     * ============================================================
     */

    const frequencies = [
      31,
      62,
      125,
      250,
      500,
      1000,
      2000,
      4000,
      8000,
      16000,
    ];

    this.eqFilters = frequencies.map(
      (frequency) => {
        const filter =
          this.audioContext!.createBiquadFilter();

        filter.type = 'peaking';
        filter.frequency.value =
          frequency;

        filter.Q.value = 1;

        filter.gain.value = 0;

        return filter;
      }
    );

    /*
     * Connect EQ in series
     */
    for (
      let i = 0;
      i < this.eqFilters.length - 1;
      i++
    ) {
      this.eqFilters[i].connect(
        this.eqFilters[i + 1]
      );
    }

    /*
     * ============================================================
     * 3D HRTF PANNER
     * ============================================================
     */

    this.pannerNode =
      this.audioContext.createPanner();

    this.pannerNode.panningModel =
      'HRTF';

    this.pannerNode.distanceModel =
      'inverse';

    this.pannerNode.refDistance = 1;

    this.pannerNode.maxDistance =
      10000;

    this.pannerNode.rolloffFactor = 1;

    this.pannerNode.coneInnerAngle = 360;
    this.pannerNode.coneOuterAngle = 360;
    this.pannerNode.coneOuterGain = 0;

    /*
     * Initial position
     */
    this.setPannerPosition(
      0,
      0,
      -1
    );

    /*
     * ============================================================
     * CHANNEL SPLITTER
     * ============================================================
     */

    this.splitterNode =
      this.audioContext.createChannelSplitter(
        2
      );

    /*
     * ============================================================
     * LEFT / RIGHT DELAY
     * ============================================================
     */

    this.leftDelayNode =
      this.audioContext.createDelay(
        1.0
      );

    this.rightDelayNode =
      this.audioContext.createDelay(
        1.0
      );

    /*
     * ============================================================
     * LEFT / RIGHT GAIN
     * ============================================================
     */

    this.leftGainNode =
      this.audioContext.createGain();

    this.rightGainNode =
      this.audioContext.createGain();

    this.leftGainNode.gain.value =
      1;

    this.rightGainNode.gain.value =
      1;

    /*
     * ============================================================
     * CHANNEL MERGER
     * ============================================================
     */

    this.mergerNode =
      this.audioContext.createChannelMerger(
        2
      );

    /*
     * ============================================================
     * COMPRESSOR
     * ============================================================
     */

    this.compressorNode =
      this.audioContext.createDynamicsCompressor();

    this.compressorNode.threshold.value =
      -12;

    this.compressorNode.knee.value =
      30;

    this.compressorNode.ratio.value =
      12;

    this.compressorNode.attack.value =
      0.003;

    this.compressorNode.release.value =
      0.25;

    /*
     * ============================================================
     * ANALYSER
     * ============================================================
     */

    this.analyserNode =
      this.audioContext.createAnalyser();

    this.analyserNode.fftSize =
      512;

    this.analyserNode.smoothingTimeConstant =
      0.8;

    /*
     * ============================================================
     * AUDIO CHAIN
     *
     * Audio Element
     *       ↓
     * Media Source
     *       ↓
     * Master Gain
     *       ↓
     * 10 Band EQ
     *       ↓
     * 3D HRTF Panner
     *       ↓
     * Channel Splitter
     *      ↙       ↘
     * L Delay    R Delay
     *      ↓       ↓
     * L Gain     R Gain
     *      ↘       ↙
     * Channel Merger
     *       ↓
     * Compressor
     *       ↓
     * Analyser
     *       ↓
     * Speakers
     * ============================================================
     */

    this.sourceNode.connect(
      this.gainNode
    );

    /*
     * Master Gain → EQ
     */

    this.gainNode.connect(
      this.eqFilters[0]
    );

    /*
     * EQ → 3D Panner
     */

    this.eqFilters[
      this.eqFilters.length - 1
    ].connect(
      this.pannerNode
    );

    /*
     * Panner → Splitter
     */

    this.pannerNode.connect(
      this.splitterNode
    );

    /*
     * LEFT CHANNEL
     */

    this.splitterNode.connect(
      this.leftDelayNode,
      0
    );

    this.leftDelayNode.connect(
      this.leftGainNode
    );

    /*
     * RIGHT CHANNEL
     */

    this.splitterNode.connect(
      this.rightDelayNode,
      1
    );

    this.rightDelayNode.connect(
      this.rightGainNode
    );

    /*
     * LEFT → MERGER CHANNEL 0
     */

    this.leftGainNode.connect(
      this.mergerNode,
      0,
      0
    );

    /*
     * RIGHT → MERGER CHANNEL 1
     */

    this.rightGainNode.connect(
      this.mergerNode,
      0,
      1
    );

    /*
     * Merger → Compressor
     */

    this.mergerNode.connect(
      this.compressorNode
    );

    /*
     * Compressor → Analyser
     */

    this.compressorNode.connect(
      this.analyserNode
    );

    /*
     * Analyser → Speakers
     */

    this.analyserNode.connect(
      this.audioContext.destination
    );

    /*
     * HTML audio volume must stay at 1.
     * Master volume is controlled by GainNode.
     */

    this.audioElement.volume = 1;

    /*
     * Apply current settings
     */

    this.updateChannelGains();

    this.updateDelays();

    console.log(
      'AudioEngine initialized successfully'
    );
  }

  /*
   * ============================================================
   * RESUME AUDIO CONTEXT
   * ============================================================
   */

  public async resumeContext() {
    if (!this.audioContext) {
      this.initContext();
    }

    if (
      this.audioContext &&
      this.audioContext.state ===
        'suspended'
    ) {
      await this.audioContext.resume();
    }
  }

  /*
   * ============================================================
   * LOAD TRACK
   * ============================================================
   */

  public async loadTrack(url: string) {
    await this.resumeContext();

    this.audioElement.pause();

    try {
      this.audioElement.currentTime = 0;
    } catch {
      // ignore
    }

    this.audioElement.src = url;

    this.audioElement.load();

    console.log(
      'Loading audio:',
      url
    );
  }

  /*
   * ============================================================
   * PLAY
   * ============================================================
   */

  public async play() {
    await this.resumeContext();

    try {
      await this.audioElement.play();

      console.log(
        'Audio playing successfully'
      );
    } catch (error) {
      console.error(
        'Audio playback failed:',
        error
      );

      throw error;
    }
  }

  /*
   * ============================================================
   * PAUSE
   * ============================================================
   */

  public pause() {
    this.audioElement.pause();
  }

  /*
   * ============================================================
   * STOP
   * ============================================================
   */

  public stop() {
    this.audioElement.pause();

    try {
      this.audioElement.currentTime = 0;
    } catch {
      // ignore
    }
  }

  /*
   * ============================================================
   * SEEK
   * ============================================================
   */

  public seek(seconds: number) {
    if (!isFinite(seconds)) {
      return;
    }

    const duration =
      this.audioElement.duration || 0;

    this.audioElement.currentTime =
      Math.max(
        0,
        Math.min(
          seconds,
          duration
        )
      );
  }

  /*
   * ============================================================
   * VOLUME
   * ============================================================
   */

  public setVolume(volume: number) {
    this.volume =
      Math.max(
        0,
        Math.min(1, volume)
      );

    if (
      this.gainNode &&
      this.audioContext
    ) {
      this.gainNode.gain.setTargetAtTime(
        this.volume,
        this.audioContext.currentTime,
        0.01
      );
    }
  }

  /*
   * ============================================================
   * PLAYBACK RATE
   * ============================================================
   */

  public setPlaybackRate(
    rate: number
  ) {
    this.playbackRate =
      Math.max(
        0.25,
        Math.min(4, rate)
      );

    this.updatePlaybackRate();
  }

  /*
   * ============================================================
   * PITCH
   *
   * Browser implementation changes playback speed too.
   * True independent pitch requires AudioWorklet.
   * ============================================================
   */

  public setPitchSemi(
    semitones: number
  ) {
    this.pitchSemi =
      Math.max(
        -12,
        Math.min(12, semitones)
      );

    this.updatePlaybackRate();
  }

  private updatePlaybackRate() {
    const pitchFactor =
      Math.pow(
        2,
        this.pitchSemi / 12
      );

    const finalRate =
      this.playbackRate *
      pitchFactor;

    this.audioElement.playbackRate =
      Math.max(
        0.25,
        Math.min(
          4,
          finalRate
        )
      );
  }

  public getPitchSemi(): number {
    return this.pitchSemi;
  }

  /*
   * ============================================================
   * PANNER POSITION
   * ============================================================
   */

  private setPannerPosition(
    x: number,
    y: number,
    z: number
  ) {
    if (
      !this.pannerNode ||
      !this.audioContext
    ) {
      return;
    }

    const now =
      this.audioContext.currentTime;

    if (
      'positionX' in
      this.pannerNode
    ) {
      this.pannerNode.positionX.setTargetAtTime(
        x,
        now,
        0.01
      );

      this.pannerNode.positionY.setTargetAtTime(
        y,
        now,
        0.01
      );

      this.pannerNode.positionZ.setTargetAtTime(
        z,
        now,
        0.01
      );
    } else {
      this.pannerNode.setPosition(
        x,
        y,
        z
      );
    }
  }

  /*
   * ============================================================
   * 3D POSITION
   * ============================================================
   */

  public setSpatial3DPosition(
    x: number,
    y: number,
    z: number,
    enabled = true
  ) {
    this.spatialEnabled =
      enabled;

    if (!enabled) {
      x = 0;
      y = 0;
      z = -1;
    }

    this.setPannerPosition(
      x,
      y,
      z
    );
  }

  /*
   * ============================================================
   * ENABLE / DISABLE 3D
   * ============================================================
   */

  public setSpatial3DEnabled(
    enabled: boolean
  ) {
    this.spatialEnabled =
      enabled;

    if (enabled) {
      this.setPannerPosition(
        0,
        0,
        -1
      );
    } else {
      this.setPannerPosition(
        0,
        0,
        -1
      );
    }
  }

  /*
   * ============================================================
   * PANNING MODEL
   * ============================================================
   */

  public setPanningModel(
    model:
      | 'HRTF'
      | 'equalpower'
  ) {
    if (this.pannerNode) {
      this.pannerNode.panningModel =
        model;
    }
  }

  /*
   * ============================================================
   * LEFT / RIGHT DELAY
   * ============================================================
   */

  public setMicrosecondDelay(
    leftMs: number,
    rightMs: number,
    enabled = true
  ) {
    this.leftDelayMs =
      Math.max(
        0,
        Math.min(
          1000,
          leftMs
        )
      );

    this.rightDelayMs =
      Math.max(
        0,
        Math.min(
          1000,
          rightMs
        )
      );

    if (!enabled) {
      this.leftDelayMs = 0;
      this.rightDelayMs = 0;
    }

    this.updateDelays();

    this.listeners.onSpatialChange?.(
      0,
      -1,
      this.leftDelayMs,
      this.rightDelayMs
    );
  }

  private updateDelays() {
    if (
      !this.audioContext ||
      !this.leftDelayNode ||
      !this.rightDelayNode
    ) {
      return;
    }

    const now =
      this.audioContext.currentTime;

    this.leftDelayNode.delayTime.setTargetAtTime(
      this.leftDelayMs / 1000,
      now,
      0.01
    );

    this.rightDelayNode.delayTime.setTargetAtTime(
      this.rightDelayMs / 1000,
      now,
      0.01
    );
  }

  /*
   * ============================================================
   * LEFT / RIGHT MUTE
   * ============================================================
   */

  public setChannelMute(
    leftMuted: boolean,
    rightMuted: boolean
  ) {
    this.leftMuted =
      leftMuted;

    this.rightMuted =
      rightMuted;

    this.updateChannelGains();

    console.log(
      'Channel mute:',
      leftMuted,
      rightMuted
    );
  }

  private updateChannelGains() {
    if (
      !this.leftGainNode ||
      !this.rightGainNode ||
      !this.audioContext
    ) {
      return;
    }

    const now =
      this.audioContext.currentTime;

    this.leftGainNode.gain.setTargetAtTime(
      this.leftMuted ? 0 : 1,
      now,
      0.005
    );

    this.rightGainNode.gain.setTargetAtTime(
      this.rightMuted ? 0 : 1,
      now,
      0.005
    );
  }

  /*
   * Individual channel controls
   */

  public setLeftMuted(
    muted: boolean
  ) {
    this.leftMuted = muted;

    this.updateChannelGains();
  }

  public setRightMuted(
    muted: boolean
  ) {
    this.rightMuted = muted;

    this.updateChannelGains();
  }

  /*
   * ============================================================
   * 8D AUTO ORBIT
   * ============================================================
   */

  public setAutoOrbit8D(
    enabled: boolean,
    speed = 1
  ) {
    if (!enabled) {
      if (
        this.orbitTimer !== null
      ) {
        cancelAnimationFrame(
          this.orbitTimer
        );

        this.orbitTimer = null;
      }

      this.setSpatial3DPosition(
        0,
        0,
        -1,
        true
      );

      this.listeners.onSpatialChange?.(
        0,
        -1,
        this.leftDelayMs,
        this.rightDelayMs
      );

      return;
    }

    let angle = 0;

    const orbit = () => {
      angle +=
        0.015 * speed;

      const radius = 3;

      const x =
        Math.sin(angle) *
        radius;

      const z =
        -Math.cos(angle) *
        radius;

      this.setSpatial3DPosition(
        x,
        0,
        z,
        true
      );

      this.listeners.onSpatialChange?.(
        x,
        z,
        this.leftDelayMs,
        this.rightDelayMs
      );

      this.orbitTimer =
        requestAnimationFrame(
          orbit
        );
    };

    orbit();
  }

  /*
   * ============================================================
   * EQ
   * ============================================================
   */

  public setEQBand(
    bandIndex: number,
    gainDb: number
  ) {
    if (
      !this.audioContext ||
      !this.eqFilters[
        bandIndex
      ]
    ) {
      return;
    }

    const gain =
      Math.max(
        -12,
        Math.min(
          12,
          gainDb
        )
      );

    this.eqFilters[
      bandIndex
    ].gain.setTargetAtTime(
      gain,
      this.audioContext.currentTime,
      0.01
    );
  }

  public setEQBands(
    gains: number[]
  ) {
    gains.forEach(
      (gain, index) => {
        this.setEQBand(
          index,
          gain
        );
      }
    );
  }

  /*
   * ============================================================
   * BASS BOOST
   * ============================================================
   */

  public setBassBoost(
    levelPercent: number
  ) {
    this.bassBoost =
      Math.max(
        0,
        Math.min(
          100,
          levelPercent
        )
      );

    /*
     * First two EQ bands
     */

    const gain =
      (this.bassBoost / 100) *
      10;

    this.setEQBand(
      0,
      gain
    );

    this.setEQBand(
      1,
      gain * 0.7
    );
  }

  /*
   * ============================================================
   * TREBLE BOOST
   * ============================================================
   */

  public setTrebleBoost(
    levelPercent: number
  ) {
    this.trebleBoost =
      Math.max(
        0,
        Math.min(
          100,
          levelPercent
        )
      );

    const gain =
      (this.trebleBoost / 100) *
      10;

    this.setEQBand(
      8,
      gain * 0.8
    );

    this.setEQBand(
      9,
      gain
    );
  }

  /*
   * ============================================================
   * AUTO LIMITER
   * ============================================================
   */

  public setAutoLimiter(
    enabled: boolean,
    thresholdDb = -24
  ) {
    if (
      !this.compressorNode ||
      !this.audioContext
    ) {
      return;
    }

    const now =
      this.audioContext.currentTime;

    if (enabled) {
      this.compressorNode.threshold.setTargetAtTime(
        thresholdDb,
        now,
        0.01
      );

      this.compressorNode.ratio.setTargetAtTime(
        20,
        now,
        0.01
      );
    } else {
      this.compressorNode.threshold.setTargetAtTime(
        -12,
        now,
        0.01
      );

      this.compressorNode.ratio.setTargetAtTime(
        12,
        now,
        0.01
      );
    }
  }

  /*
   * ============================================================
   * VISUALIZER
   * ============================================================
   */

  public getFrequencyData(): Uint8Array {
    if (!this.analyserNode) {
      return new Uint8Array(0);
    }

    const data =
      new Uint8Array(
        this.analyserNode.frequencyBinCount
      );

    this.analyserNode.getByteFrequencyData(
      data
    );

    return data;
  }

  public getWaveformData(): Uint8Array {
    if (!this.analyserNode) {
      return new Uint8Array(0);
    }

    const data =
      new Uint8Array(
        this.analyserNode.fftSize
      );

    this.analyserNode.getByteTimeDomainData(
      data
    );

    return data;
  }

  /*
   * ============================================================
   * PLAYBACK STATUS
   * ============================================================
   */

  public isPlaying(): boolean {
    return !this.audioElement.paused;
  }

  public getCurrentTime(): number {
    return (
      this.audioElement.currentTime ||
      0
    );
  }

  public getDuration(): number {
    return isFinite(
      this.audioElement.duration
    )
      ? this.audioElement.duration
      : 0;
  }

  /*
   * ============================================================
   * CROSSFADE
   * ============================================================
   */

  public setCrossfadeDuration(
    seconds: number
  ) {
    this.crossfadeDuration =
      Math.max(
        0,
        Math.min(
          10,
          seconds
        )
      );
  }

  public getCrossfadeDuration(): number {
    return this.crossfadeDuration;
  }

  /*
   * ============================================================
   * VOLUME NORMALIZATION
   * ============================================================
   */

  public setVolumeNormalizerEnabled(
    enabled: boolean
  ) {
    this.volumeNormalizationEnabled =
      enabled;

    /*
     * Simple implementation:
     * compressor acts as loudness control.
     */

    this.setAutoLimiter(
      enabled,
      -18
    );
  }

  public getVolumeNormalizerEnabled(): boolean {
    return this.volumeNormalizationEnabled;
  }

  /*
   * ============================================================
   * RESET ALL EFFECTS
   * ============================================================
   */

  public resetEffects() {
    /*
     * EQ
     */

    this.eqFilters.forEach(
      (filter) => {
        if (this.audioContext) {
          filter.gain.setTargetAtTime(
            0,
            this.audioContext.currentTime,
            0.01
          );
        }
      }
    );

    /*
     * Delay
     */

    this.leftDelayMs = 0;
    this.rightDelayMs = 0;

    this.updateDelays();

    /*
     * Channel mute
     */

    this.leftMuted = false;
    this.rightMuted = false;

    this.updateChannelGains();

    /*
     * 3D
     */

    this.setSpatial3DPosition(
      0,
      0,
      -1,
      true
    );
  }

  /*
   * ============================================================
   * DESTROY
   * ============================================================
   */

  public destroy() {
    if (
      this.orbitTimer !== null
    ) {
      cancelAnimationFrame(
        this.orbitTimer
      );

      this.orbitTimer = null;
    }

    this.audioElement.pause();

    if (this.audioContext) {
      this.audioContext.close();

      this.audioContext = null;
    }

    this.sourceNode = null;
    this.gainNode = null;
    this.analyserNode = null;
    this.pannerNode = null;
    this.compressorNode = null;

    this.splitterNode = null;
    this.mergerNode = null;

    this.leftGainNode = null;
    this.rightGainNode = null;

    this.leftDelayNode = null;
    this.rightDelayNode = null;

    this.eqFilters = [];
  }
}

/*
 * ================================================================
 * SINGLE AUDIO ENGINE INSTANCE
 * ================================================================
 */

export const audioEngine =
  new AudioEngine();
