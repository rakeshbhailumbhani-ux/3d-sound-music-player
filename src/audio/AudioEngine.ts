export class AudioEngine {
  private audioContext: AudioContext | null = null;

  private audioElement: HTMLAudioElement;

  private sourceNode: MediaElementAudioSourceNode | null = null;

  private masterGain: GainNode | null = null;

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

  private bassFilter: BiquadFilterNode | null = null;
  private trebleFilter: BiquadFilterNode | null = null;

  private volume = 1;

  private playbackRate = 1;

  private pitchSemi = 0;

  private leftMuted = false;
  private rightMuted = false;

  private leftDelayMs = 0;
  private rightDelayMs = 0;

  private spatialEnabled = true;

  private crossfadeDuration = 3;

  private volumeNormalizerEnabled = false;

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

    this.audioElement.preload = "auto";

    /*
     * Important:
     * Do NOT set audioElement.volume for Web Audio processing.
     */
    this.audioElement.volume = 1;

    this.audioElement.addEventListener("ended", () => {
      this.listeners.onEnded?.();
    });

    this.audioElement.addEventListener("timeupdate", () => {
      this.listeners.onTimeUpdate?.(
        this.audioElement.currentTime,
        this.audioElement.duration || 0
      );
    });

    this.audioElement.addEventListener("loadedmetadata", () => {
      console.log(
        "Audio metadata loaded:",
        this.audioElement.duration
      );
    });

    this.audioElement.addEventListener("canplay", () => {
      console.log("Audio can play:", this.audioElement.src);
    });

    this.audioElement.addEventListener("error", () => {
      console.error(
        "Audio error:",
        this.audioElement.error
      );
    });
  }

  /*
   * ---------------------------------------------------------
   * PUBLIC GETTERS
   * ---------------------------------------------------------
   */

  public get activeElement(): HTMLAudioElement {
    return this.audioElement;
  }

  public get inactiveElement(): HTMLAudioElement {
    return this.audioElement;
  }

  public get activeGainNode(): GainNode | null {
    return this.masterGain;
  }

  public get inactiveGainNode(): GainNode | null {
    return this.masterGain;
  }

  /*
   * ---------------------------------------------------------
   * LISTENERS
   * ---------------------------------------------------------
   */

  public setListeners(
    listeners: typeof this.listeners
  ) {
    this.listeners = {
      ...this.listeners,
      ...listeners
    };
  }

  /*
   * ---------------------------------------------------------
   * AUDIO CONTEXT
   * ---------------------------------------------------------
   */

  public initContext() {
    if (this.audioContext) {
      return;
    }

    const AudioContextClass =
      window.AudioContext ||
      (window as any).webkitAudioContext;

    if (!AudioContextClass) {
      console.error(
        "Web Audio API is not supported."
      );
      return;
    }

    this.audioContext =
      new AudioContextClass();

    /*
     * -------------------------------------------------------
     * SOURCE
     * -------------------------------------------------------
     */

    this.sourceNode =
      this.audioContext.createMediaElementSource(
        this.audioElement
      );

    /*
     * -------------------------------------------------------
     * MASTER GAIN
     * -------------------------------------------------------
     */

    this.masterGain =
      this.audioContext.createGain();

    this.masterGain.gain.value =
      this.volume;

    /*
     * -------------------------------------------------------
     * ANALYSER
     * -------------------------------------------------------
     */

    this.analyserNode =
      this.audioContext.createAnalyser();

    this.analyserNode.fftSize = 1024;

    this.analyserNode.smoothingTimeConstant =
      0.75;

    /*
     * -------------------------------------------------------
     * 3D PANNER
     * -------------------------------------------------------
     */

    this.pannerNode =
      this.audioContext.createPanner();

    this.pannerNode.panningModel =
      "HRTF";

    this.pannerNode.distanceModel =
      "inverse";

    this.pannerNode.refDistance = 1;

    this.pannerNode.maxDistance = 10000;

    this.pannerNode.rolloffFactor = 0;

    this.setPannerPosition(
      0,
      0,
      -1
    );

    /*
     * -------------------------------------------------------
     * CHANNEL SPLITTER
     * -------------------------------------------------------
     *
     * Stereo
     *
     *       L ----> Left Gain ----> Left Delay
     *
     * Source
     *
     *       R ----> Right Gain ---> Right Delay
     *
     */

    this.splitterNode =
      this.audioContext.createChannelSplitter(
        2
      );

    this.mergerNode =
      this.audioContext.createChannelMerger(
        2
      );

    /*
     * LEFT CHANNEL
     */

    this.leftGainNode =
      this.audioContext.createGain();

    this.leftGainNode.gain.value = 1;

    this.leftDelayNode =
      this.audioContext.createDelay(
        1.0
      );

    this.leftDelayNode.delayTime.value =
      0;

    /*
     * RIGHT CHANNEL
     */

    this.rightGainNode =
      this.audioContext.createGain();

    this.rightGainNode.gain.value = 1;

    this.rightDelayNode =
      this.audioContext.createDelay(
        1.0
      );

    this.rightDelayNode.delayTime.value =
      0;

    /*
     * -------------------------------------------------------
     * EQ
     * -------------------------------------------------------
     */

    this.createEQ();

    /*
     * -------------------------------------------------------
     * BASS / TREBLE
     * -------------------------------------------------------
     */

    this.bassFilter =
      this.audioContext.createBiquadFilter();

    this.bassFilter.type =
      "lowshelf";

    this.bassFilter.frequency.value =
      120;

    this.bassFilter.gain.value = 0;

    this.trebleFilter =
      this.audioContext.createBiquadFilter();

    this.trebleFilter.type =
      "highshelf";

    this.trebleFilter.frequency.value =
      8000;

    this.trebleFilter.gain.value = 0;

    /*
     * -------------------------------------------------------
     * COMPRESSOR
     * -------------------------------------------------------
     */

    this.compressorNode =
      this.audioContext.createDynamicsCompressor();

    this.compressorNode.threshold.value =
      -12;

    this.compressorNode.knee.value =
      30;

    this.compressorNode.ratio.value =
      8;

    this.compressorNode.attack.value =
      0.003;

    this.compressorNode.release.value =
      0.25;

    /*
     * -------------------------------------------------------
     * AUDIO CHAIN
     * -------------------------------------------------------
     *
     * Source
     *   ↓
     * Master Gain
     *   ↓
     * EQ
     *   ↓
     * 3D Panner
     *   ↓
     * Splitter
     *   ↓
     * L/R processing
     *   ↓
     * Merger
     *   ↓
     * Compressor
     *   ↓
     * Analyser
     *   ↓
     * Speaker
     */

    this.sourceNode.connect(
      this.masterGain
    );

    let eqInput: AudioNode =
      this.masterGain;

    /*
     * Connect EQ chain
     */

    for (const filter of this.eqFilters) {
      eqInput.connect(filter);
      eqInput = filter;
    }

    /*
     * Bass
     */

    eqInput.connect(
      this.bassFilter
    );

    /*
     * Treble
     */

    this.bassFilter.connect(
      this.trebleFilter
    );

    /*
     * 3D
     */

    this.trebleFilter.connect(
      this.pannerNode
    );

    /*
     * Stereo split
     */

    this.pannerNode.connect(
      this.splitterNode
    );

    /*
     * Left
     */

    this.splitterNode.connect(
      this.leftGainNode,
      0
    );

    this.leftGainNode.connect(
      this.leftDelayNode
    );

    /*
     * Right
     */

    this.splitterNode.connect(
      this.rightGainNode,
      1
    );

    this.rightGainNode.connect(
      this.rightDelayNode
    );

    /*
     * Merge
     */

    this.leftDelayNode.connect(
      this.mergerNode,
      0,
      0
    );

    this.rightDelayNode.connect(
      this.mergerNode,
      0,
      1
    );

    /*
     * Compressor
     */

    this.mergerNode.connect(
      this.compressorNode
    );

    /*
     * Analyser
     */

    this.compressorNode.connect(
      this.analyserNode
    );

    /*
     * Speaker
     */

    this.analyserNode.connect(
      this.audioContext.destination
    );

    /*
     * Apply initial channel states
     */

    this.updateChannelMute();

    console.log(
      "AudioEngine initialized successfully"
    );
  }

  /*
   * ---------------------------------------------------------
   * EQ CREATION
   * ---------------------------------------------------------
   */

  private createEQ() {
    if (!this.audioContext) {
      return;
    }

    const frequencies = [
      60,
      120,
      250,
      500,
      1000,
      2000,
      4000,
      8000,
      12000,
      16000
    ];

    this.eqFilters = [];

    frequencies.forEach(
      (frequency, index) => {
        const filter =
          this.audioContext!.createBiquadFilter();

        if (index === 0) {
          filter.type = "lowshelf";
        } else if (
          index === frequencies.length - 1
        ) {
          filter.type = "highshelf";
        } else {
          filter.type = "peaking";
        }

        filter.frequency.value =
          frequency;

        filter.Q.value = 1;

        filter.gain.value = 0;

        this.eqFilters.push(
          filter
        );
      }
    );
  }

  /*
   * ---------------------------------------------------------
   * RESUME
   * ---------------------------------------------------------
   */

  public async resumeContext() {
    if (!this.audioContext) {
      this.initContext();
    }

    if (!this.audioContext) {
      return;
    }

    if (
      this.audioContext.state ===
      "suspended"
    ) {
      await this.audioContext.resume();
    }
  }

  /*
   * ---------------------------------------------------------
   * LOAD TRACK
   * ---------------------------------------------------------
   */

  public async loadTrack(
    url: string
  ) {
    await this.resumeContext();

    this.audioElement.pause();

    try {
      this.audioElement.currentTime = 0;
    } catch {}

    /*
     * Make sure relative public path works.
     *
     * Example:
     * /audio/song1.mp3
     */

    this.audioElement.src = url;

    this.audioElement.load();

    console.log(
      "Loading audio:",
      url
    );
  }

  /*
   * ---------------------------------------------------------
   * PLAY
   * ---------------------------------------------------------
   */

  public async play() {
    await this.resumeContext();

    if (!this.audioElement.src) {
      throw new Error(
        "No audio track loaded"
      );
    }

    try {
      await this.audioElement.play();

      console.log(
        "Audio PLAYING:",
        this.audioElement.src
      );
    } catch (error) {
      console.error(
        "Audio playback failed:",
        error
      );

      throw error;
    }
  }

  /*
   * ---------------------------------------------------------
   * PAUSE
   * ---------------------------------------------------------
   */

  public pause() {
    this.audioElement.pause();
  }

  /*
   * ---------------------------------------------------------
   * STOP
   * ---------------------------------------------------------
   */

  public stop() {
    this.audioElement.pause();

    try {
      this.audioElement.currentTime = 0;
    } catch {}
  }

  /*
   * ---------------------------------------------------------
   * SEEK
   * ---------------------------------------------------------
   */

  public seek(
    seconds: number
  ) {
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
   * ---------------------------------------------------------
   * VOLUME
   * ---------------------------------------------------------
   */

  public setVolume(
    volume: number
  ) {
    this.volume =
      Math.max(
        0,
        Math.min(1, volume)
      );

    /*
     * IMPORTANT:
     * AudioElement volume always stays 1.
     */

    this.audioElement.volume = 1;

    if (
      this.masterGain &&
      this.audioContext
    ) {
      this.masterGain.gain.setTargetAtTime(
        this.volume,
        this.audioContext.currentTime,
        0.01
      );
    }
  }

  /*
   * ---------------------------------------------------------
   * PLAYBACK RATE
   * ---------------------------------------------------------
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

  private updatePlaybackRate() {
    const pitchFactor =
      Math.pow(
        2,
        this.pitchSemi / 12
      );

    this.audioElement.playbackRate =
      Math.max(
        0.25,
        Math.min(
          4,
          this.playbackRate *
            pitchFactor
        )
      );
  }

  /*
   * ---------------------------------------------------------
   * PITCH
   * ---------------------------------------------------------
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

  public getPitchSemi(): number {
    return this.pitchSemi;
  }

  /*
   * ---------------------------------------------------------
   * 3D POSITION
   * ---------------------------------------------------------
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

    if (
      "positionX" in this.pannerNode
    ) {
      this.pannerNode.positionX.setTargetAtTime(
        x,
        this.audioContext.currentTime,
        0.01
      );

      this.pannerNode.positionY.setTargetAtTime(
        y,
        this.audioContext.currentTime,
        0.01
      );

      this.pannerNode.positionZ.setTargetAtTime(
        z,
        this.audioContext.currentTime,
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

    this.listeners.onSpatialChange?.(
      x,
      z,
      this.leftDelayMs,
      this.rightDelayMs
    );
  }

  public setSpatial3DEnabled(
    enabled: boolean
  ) {
    this.spatialEnabled =
      enabled;

    this.setSpatial3DPosition(
      0,
      0,
      -1,
      enabled
    );
  }

  public setPanningModel(
    model:
      | "HRTF"
      | "equalpower"
  ) {
    if (this.pannerNode) {
      this.pannerNode.panningModel =
        model;
    }
  }

  /*
   * ---------------------------------------------------------
   * 20ms / L-R DELAY
   * ---------------------------------------------------------
   */

  public setMicrosecondDelay(
  leftMs: number,
  rightMs: number,
  enabled = true
) {
  this.leftDelayMs = Math.max(
    0,
    Math.min(300, leftMs)
  );

  this.rightDelayMs = Math.max(
    0,
    Math.min(300, rightMs)
  );

  if (
    !this.audioContext ||
    !this.leftDelayNode ||
    !this.rightDelayNode
  ) {
    console.warn(
      "Delay nodes not initialized yet"
    );
    return;
  }

  const now =
    this.audioContext.currentTime;

  const leftDelay =
    enabled
      ? this.leftDelayMs / 1000
      : 0;

  const rightDelay =
    enabled
      ? this.rightDelayMs / 1000
      : 0;

  this.leftDelayNode.delayTime.cancelScheduledValues(now);
  this.rightDelayNode.delayTime.cancelScheduledValues(now);

  this.leftDelayNode.delayTime.setTargetAtTime(
    leftDelay,
    now,
    0.01
  );

  this.rightDelayNode.delayTime.setTargetAtTime(
    rightDelay,
    now,
    0.01
  );

  console.log(
    `3D DELAY → L=${this.leftDelayMs}ms R=${this.rightDelayMs}ms`
  );

  this.listeners.onSpatialChange?.(
    0,
    -1,
    enabled ? this.leftDelayMs : 0,
    enabled ? this.rightDelayMs : 0
  );
  }
  /*
   * ---------------------------------------------------------
   * CHANNEL MUTE
   * ---------------------------------------------------------
   */

  public setChannelMute(
    leftMuted: boolean,
    rightMuted: boolean
  ) {
    this.leftMuted =
      leftMuted;

    this.rightMuted =
      rightMuted;

    this.updateChannelMute();

    console.log(
      "Channel mute:",
      {
        leftMuted,
        rightMuted
      }
    );
  }

  private updateChannelMute() {
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
      0.01
    );

    this.rightGainNode.gain.setTargetAtTime(
      this.rightMuted ? 0 : 1,
      now,
      0.01
    );
  }

  /*
   * ---------------------------------------------------------
   * 8D AUTO ORBIT
   * ---------------------------------------------------------
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
   * ---------------------------------------------------------
   * EQ
   * ---------------------------------------------------------
   */

  public setEQBand(
    bandIndex: number,
    gainDb: number
  ) {
    if (
      !this.eqFilters[
        bandIndex
      ]
    ) {
      return;
    }

    const gain =
      Math.max(
        -12,
        Math.min(12, gainDb)
      );

    this.eqFilters[
      bandIndex
    ].gain.setTargetAtTime(
      gain,
      this.audioContext
        ? this.audioContext.currentTime
        : 0,
      0.01
    );

    console.log(
      `EQ ${bandIndex}: ${gain} dB`
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
   * ---------------------------------------------------------
   * BASS BOOST
   * ---------------------------------------------------------
   */

  public setBassBoost(
    levelPercent: number
  ) {
    if (!this.bassFilter) {
      return;
    }

    const db =
      Math.max(
        0,
        Math.min(
          100,
          levelPercent
        )
      ) *
      0.12;

    this.bassFilter.gain.setTargetAtTime(
      db,
      this.audioContext
        ? this.audioContext.currentTime
        : 0,
      0.01
    );
  }

  /*
   * ---------------------------------------------------------
   * TREBLE BOOST
   * ---------------------------------------------------------
   */

  public setTrebleBoost(
    levelPercent: number
  ) {
    if (!this.trebleFilter) {
      return;
    }

    const db =
      Math.max(
        0,
        Math.min(
          100,
          levelPercent
        )
      ) *
      0.12;

    this.trebleFilter.gain.setTargetAtTime(
      db,
      this.audioContext
        ? this.audioContext.currentTime
        : 0,
      0.01
    );
  }

  /*
   * ---------------------------------------------------------
   * LIMITER
   * ---------------------------------------------------------
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
        8,
        now,
        0.01
      );
    }
  }

  /*
   * ---------------------------------------------------------
   * VISUALIZER
   * ---------------------------------------------------------
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
   * ---------------------------------------------------------
   * STATUS
   * ---------------------------------------------------------
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
   * ---------------------------------------------------------
   * CROSSFADE
   * ---------------------------------------------------------
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
   * ---------------------------------------------------------
   * VOLUME NORMALIZER
   * ---------------------------------------------------------
   */

  public setVolumeNormalizerEnabled(
    enabled: boolean
  ) {
    this.volumeNormalizerEnabled =
      enabled;
  }

  public getVolumeNormalizerEnabled(): boolean {
    return this.volumeNormalizerEnabled;
  }

  /*
   * ---------------------------------------------------------
   * DESTROY
   * ---------------------------------------------------------
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

    this.audioElement.removeAttribute(
      "src"
    );

    this.audioElement.load();

    if (this.audioContext) {
      this.audioContext.close();

      this.audioContext = null;
    }

    this.sourceNode = null;
    this.masterGain = null;
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
    this.bassFilter = null;
    this.trebleFilter = null;
  }
}

export const audioEngine =
  new AudioEngine();
