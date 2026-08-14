export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;

  private inputGain: GainNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private pannerNode: PannerNode | null = null;
  private compressorNode: DynamicsCompressorNode | null = null;

  // Stereo channel processing
  private splitterNode: ChannelSplitterNode | null = null;
  private mergerNode: ChannelMergerNode | null = null;

  private leftGainNode: GainNode | null = null;
  private rightGainNode: GainNode | null = null;

  private leftDelayNode: DelayNode | null = null;
  private rightDelayNode: DelayNode | null = null;

  // EQ
  private eqFilters: BiquadFilterNode[] = [];

  // Bass / Treble
  private bassFilter: BiquadFilterNode | null = null;
  private trebleFilter: BiquadFilterNode | null = null;

  private audioElement: HTMLAudioElement;

  private volume = 1;
  private playbackRate = 1;
  private pitchSemi = 0;

  private leftMuted = false;
  private rightMuted = false;

  private leftDelayMs = 0;
  private rightDelayMs = 0;

  private bassLevel = 0;
  private trebleLevel = 0;

  private volumeNormalizerEnabled = false;
  private crossfadeDuration = 3;

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

  private orbitTimer: number | null = null;

  private currentEQ: number[] = [
    0, 0, 0, 0, 0,
    0, 0, 0, 0, 0
  ];

  constructor() {
    this.audioElement = new Audio();

    this.audioElement.preload = 'auto';

    /*
     * Important for local / same-origin files.
     */
    this.audioElement.crossOrigin = 'anonymous';

    this.audioElement.addEventListener(
      'ended',
      () => {
        this.listeners.onEnded?.();
      }
    );

    this.audioElement.addEventListener(
      'timeupdate',
      () => {
        this.listeners.onTimeUpdate?.(
          this.audioElement.currentTime,
          this.audioElement.duration || 0
        );
      }
    );

    this.audioElement.addEventListener(
      'error',
      () => {
        console.error(
          'Audio error:',
          this.audioElement.error
        );
      }
    );

    this.audioElement.addEventListener(
      'loadedmetadata',
      () => {
        console.log(
          'Audio duration:',
          this.audioElement.duration
        );
      }
    );
  }

  public get activeElement(): HTMLAudioElement {
    return this.audioElement;
  }

  public get inactiveElement(): HTMLAudioElement {
    return this.audioElement;
  }

  public get activeGainNode(): GainNode | null {
    return this.inputGain;
  }

  public get inactiveGainNode(): GainNode | null {
    return this.inputGain;
  }

  public setListeners(
    listeners: typeof this.listeners
  ) {
    this.listeners = {
      ...this.listeners,
      ...listeners,
    };
  }

  /*
   * ============================================================
   * AUDIO CONTEXT INITIALIZATION
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
     * ----------------------------------------------------------
     * Media Element Source
     * ----------------------------------------------------------
     */

    this.sourceNode =
      this.audioContext.createMediaElementSource(
        this.audioElement
      );

    /*
     * ----------------------------------------------------------
     * Input Gain
     * ----------------------------------------------------------
     */

    this.inputGain =
      this.audioContext.createGain();

    this.inputGain.gain.value =
      this.volume;

    /*
     * ----------------------------------------------------------
     * Stereo Splitter
     * ----------------------------------------------------------
     */

    this.splitterNode =
      this.audioContext.createChannelSplitter(
        2
      );

    /*
     * ----------------------------------------------------------
     * Stereo Merger
     * ----------------------------------------------------------
     */

    this.mergerNode =
      this.audioContext.createChannelMerger(
        2
      );

    /*
     * ----------------------------------------------------------
     * L/R Gain
     * ----------------------------------------------------------
     */

    this.leftGainNode =
      this.audioContext.createGain();

    this.rightGainNode =
      this.audioContext.createGain();

    this.leftGainNode.gain.value =
      this.leftMuted ? 0 : 1;

    this.rightGainNode.gain.value =
      this.rightMuted ? 0 : 1;

    /*
     * ----------------------------------------------------------
     * L/R Delay
     * ----------------------------------------------------------
     */

    this.leftDelayNode =
      this.audioContext.createDelay(1.0);

    this.rightDelayNode =
      this.audioContext.createDelay(1.0);

    this.leftDelayNode.delayTime.value =
      this.leftDelayMs / 1000;

    this.rightDelayNode.delayTime.value =
      this.rightDelayMs / 1000;

    /*
     * ----------------------------------------------------------
     * EQ
     * ----------------------------------------------------------
     */

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
      16000,
    ];

    this.eqFilters = frequencies.map(
      (frequency, index) => {
        const filter =
          this.audioContext!.createBiquadFilter();

        filter.type =
          index === 0
            ? 'lowshelf'
            : index === frequencies.length - 1
            ? 'highshelf'
            : 'peaking';

        filter.frequency.value =
          frequency;

        filter.Q.value =
          index === 0 ||
          index === frequencies.length - 1
            ? 0.7
            : 1.0;

        filter.gain.value =
          this.currentEQ[index] || 0;

        return filter;
      }
    );

    /*
     * ----------------------------------------------------------
     * Bass Filter
     * ----------------------------------------------------------
     */

    this.bassFilter =
      this.audioContext.createBiquadFilter();

    this.bassFilter.type =
      'lowshelf';

    this.bassFilter.frequency.value =
      120;

    this.bassFilter.gain.value =
      this.bassLevel;

    /*
     * ----------------------------------------------------------
     * Treble Filter
     * ----------------------------------------------------------
     */

    this.trebleFilter =
      this.audioContext.createBiquadFilter();

    this.trebleFilter.type =
      'highshelf';

    this.trebleFilter.frequency.value =
      8000;

    this.trebleFilter.gain.value =
      this.trebleLevel;

    /*
     * ----------------------------------------------------------
     * 3D Panner
     * ----------------------------------------------------------
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

    this.pannerNode.rolloffFactor =
      0.5;

    this.pannerNode.coneInnerAngle =
      360;

    this.pannerNode.coneOuterAngle =
      360;

    if (
      'positionX' in
      this.pannerNode
    ) {
      this.pannerNode.positionX.value =
        0;

      this.pannerNode.positionY.value =
        0;

      this.pannerNode.positionZ.value =
        -1;
    } else {
      this.pannerNode.setPosition(
        0,
        0,
        -1
      );
    }

    /*
     * ----------------------------------------------------------
     * Compressor / Limiter
     * ----------------------------------------------------------
     */

    this.compressorNode =
      this.audioContext.createDynamicsCompressor();

    this.compressorNode.threshold.value =
      -12;

    this.compressorNode.knee.value =
      24;

    this.compressorNode.ratio.value =
      8;

    this.compressorNode.attack.value =
      0.003;

    this.compressorNode.release.value =
      0.25;

    /*
     * ----------------------------------------------------------
     * Analyser
     * ----------------------------------------------------------
     */

    this.analyserNode =
      this.audioContext.createAnalyser();

    this.analyserNode.fftSize =
      2048;

    this.analyserNode.smoothingTimeConstant =
      0.75;

    /*
     * ==========================================================
     * AUDIO CONNECTION
     * ==========================================================
     *
     * Audio
     *   ↓
     * Input Gain
     *   ↓
     * Splitter
     *   ↓
     *
     * L → Gain → Delay ─┐
     *                   ├→ Merger
     * R → Gain → Delay ─┘
     *
     *   ↓
     * 10 Band EQ
     *   ↓
     * Bass
    
