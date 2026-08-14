    this.audioElement.curre      this.audioContext.createGain();

    this.gainNode.gain.value = this.volume;

    this.analyserNode =
      this.audioContext.createAnalyser();

    this.analyserNode.fftSize = 512;
    this.analyserNode.smoothingTimeConstant = 0.8;

    /*
     * 3D Panner
     */
    this.pannerNode =
      this.audioContext.createPanner();

    this.pannerNode.panningModel = 'HRTF';
    this.pannerNode.distanceModel = 'inverse';
    this.pannerNode.refDistance = 1;
    this.pannerNode.maxDistance = 10000;
    this.pannerNode.rolloffFactor = 1;

    if ('positionX' in this.pannerNode) {
      this.pannerNode.positionX.value = 0;
      this.pannerNode.positionY.value = 0;
      this.pannerNode.positionZ.value = -1;
    } else {
      this.pannerNode.setPosition(0, 0, -1);
    }

    /*
     * Compressor / limiter
     */
    this.compressorNode =
      this.audioContext.createDynamicsCompressor();

    this.compressorNode.threshold.value = -12;
    this.compressorNode.knee.value = 30;
    this.compressorNode.ratio.value = 12;
    this.compressorNode.attack.value = 0.003;
    this.compressorNode.release.value = 0.25;

    /*
     * Audio chain
     *
     * Audio Element
     *      ↓
     * Source
     *      ↓
     * Gain
     *      ↓

    try {
      await this.audioElement.play();

      console.log('Audio playing');
    } catch (error) {
      console.error(
        'Audio playback failed:',
        error
      );

      throw error;
    }
  }

  /**
   * Pause
   */
  public pause() {
    this.audioElement.pause();
  }

  /**
   * Stop
   */
  public stop() {
    this.audioElement.pause();

    try {
      this.audioElement.currentTime = 0;
    } catch {
      // Ignore
    }
  }

  /**
   * Seek
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
        Math.min(seconds, duration)
      );
  }

  /**
   * Volume
   */
  public setVolume(volume: number) {
    this.volume = Math.max(
      0,
      Math.min(1, volume)
    );

    this.audioElement.volume =
      this.volume;

    if (this.gainNode && this.audioContext) {
      this.gainNode.gain.setTargetAtTime(
        this.volume,
        this.audioContext.currentTime,
        0.01
      );
    }
  }

  /**
   * Playback speed
   */
  public setPlaybackRate(rate: number) {
    this.playbackRate = Math.max(
      0.25,
      Math.min(4, rate)
    );

    this.audioElement.playbackRate =
      this.playbackRate;
  }

  /**
   * Pitch
   *
   * Browser HTMLAudio pitch is handled
   * through playback rate.
   */
  public setPitchSemi(semitones: number) {
    const pitch = Math.max(
      -12,
      Math.min(12, semitones)
    );

    const factor = Math.pow(
      2,
      pitch / 12
    );

    this.audioElement.playbackRate =
      Math.max(
        0.25,
        Math.min(
          4,
          this.playbackRate * factor
        )
      );
  }

  public getPitchSemi(): number {
    return 0;
  }

  /**
   * 3D position
   */
  public setSpatial3DPosition(
    x: number,
    y: number,
    z: number,
    enabled = true
  ) {
    if (
      !this.pannerNode ||
      !this.audioContext
    ) {
      return;
    }

    if (!enabled) {
      x = 0;
      y = 0;
      z = -1;
    }

    if ('positionX' in this.pannerNode) {
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

      (
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

  public setSpatial3DEnabled(
    enabled: boolean
  ) {
    this.setSpatial3DPosition(
      0,
      0,
      -1,
      enabled
    );
  }

  public setPanningModel(
    model: 'HRTF' | 'equalpower'
  ) {
    if (this.pannerNode) {
      this.pannerNode.panningModel =
        model;
    }
  }

  /**
   * Simple delay control
   *
   * Kept for compatibility with player UI.
   */
  public setMicrosecondDelay(
    leftMs: number,
    rightMs: number,
    enabled = true
  ) {
    this.listeners.onSpatialChange?.(
      0,
      -1,
      enabled ? leftMs : 0,
      enabled ? rightMs : 0
    );
  }

  public setChannelMute(
    leftMuted: boolean,
    rightMuted: boolean
  ) {
    // Compatibility method.
    // Real L/R channel processing can be added later.
    console.log(
      'Channel mute:',
      leftMuted,
      rightMuted
    );
  }

  /**
   * 8D compatibility
   */
  private orbitTimer: number | null = null;

  public setAutoOrbit8D(
    enabled: boolean,
    speed = 1
  ) {
    if (!enabled) {
      if (this.orbitTimer !== null) {
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
        Math.sin(angle) * radius;

      const z =
        -Math.cos(angle) * radius;

      this.setSpatial3DPosition(
        x,
        0,
        z,
        true
      );

      this.listeners.onSpatialChange?.(
        x,
        z,
        0,
        0
      );

      this.orbitTimer =
        requestAnimationFrame(
          orbit
        );
    };

    orbit();
  }

  /**
   * EQ compatibility
   */
  public setEQBand(
    bandIndex: number,
    gainDb: number
  ) {
    console.log(
      'EQ band:',
      bandIndex,
      gainDb
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

  public setBassBoost(
    levelPercent: number
  ) {
    console.log(
      'Bass boost:',
      levelPercent
    );
  }

  public setTrebleBoost(
    levelPercent: number
  ) {
    console.log(
      'Treble boost:',
      levelPercent
    );
  }

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

  /**
   * Visualizer
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

  public isPlaying(): boolean {
    return !this.audioElement.paused;
  }

  public getCurrentTime(): number {
    return this.audioElement.currentTime || 0;
  }

  public getDuration(): number {
    return isFinite(
      this.audioElement.duration
    )
      ? this.audioElement.duration
      : 0;
  }

  public setCrossfadeDuration(
    seconds: number
  ) {
    // Compatibility method
    console.log(
      'Crossfade:',
      seconds
    );
  }

  public getCrossfadeDuration(): number {
    return 0;
  }

  public setVolumeNormalizerEnabled(
    enabled: boolean
  ) {
    console.log(
      'Volume normalizer:',
      enabled
    );
  }

  public getVolumeNormalizerEnabled(): boolean {
    return false;
  }

  public destroy() {
    if (this.orbitTimer !== null) {
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
  }
}

export const audioEngine =
  new AudioEngine();
