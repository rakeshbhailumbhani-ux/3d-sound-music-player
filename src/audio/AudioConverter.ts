import lamejs from '@breezystack/lamejs';
import { MicrosecondDelaySettings, Spatial3DSettings, EQSettings } from '../types';

export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  let interleaveData: Float32Array;
  if (numChannels === 2) {
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    interleaveData = new Float32Array(left.length + right.length);
    for (let i = 0; i < left.length; i++) {
      interleaveData[i * 2] = left[i];
      interleaveData[i * 2 + 1] = right[i];
    }
  } else {
    interleaveData = buffer.getChannelData(0);
  }

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const dataByteLength = interleaveData.length * bytesPerSample;
  const headerByteLength = 44;
  const totalLength = headerByteLength + dataByteLength;

  const arrayBuffer = new ArrayBuffer(totalLength);
  const view = new DataView(arrayBuffer);

  function writeString(v: DataView, offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
      v.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* RIFF chunk length */
  view.setUint32(4, 36 + dataByteLength, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw PCM) */
  view.setUint16(20, format, true);
  /* channel count */
  view.setUint16(22, numChannels, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate */
  view.setUint32(28, sampleRate * blockAlign, true);
  /* block align */
  view.setUint16(32, blockAlign, true);
  /* bits per sample */
  view.setUint16(34, bitDepth, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, dataByteLength, true);

  // Write PCM samples
  let offset = 44;
  for (let i = 0; i < interleaveData.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, interleaveData[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

export function audioBufferToMp3(
  buffer: AudioBuffer,
  onProgress?: (percent: number) => void
): Blob {
  const channels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const kbps = 192; // high quality stereo mp3

  const mp3encoder = new lamejs.Mp3Encoder(channels === 1 ? 1 : 2, sampleRate, kbps);
  const mp3Data: Uint8Array[] = [];

  const leftFloat = buffer.getChannelData(0);
  const rightFloat = channels > 1 ? buffer.getChannelData(1) : leftFloat;

  const sampleCount = leftFloat.length;
  const leftInt16 = new Int16Array(sampleCount);
  const rightInt16 = new Int16Array(sampleCount);

  for (let i = 0; i < sampleCount; i++) {
    const sL = Math.max(-1, Math.min(1, leftFloat[i]));
    leftInt16[i] = sL < 0 ? sL * 0x8000 : sL * 0x7fff;

    const sR = Math.max(-1, Math.min(1, rightFloat[i]));
    rightInt16[i] = sR < 0 ? sR * 0x8000 : sR * 0x7fff;
  }

  const sampleBlockSize = 1152;
  for (let i = 0; i < sampleCount; i += sampleBlockSize) {
    const leftChunk = leftInt16.subarray(i, i + sampleBlockSize);
    const rightChunk = rightInt16.subarray(i, i + sampleBlockSize);

    let mp3buf: Int16Array | Uint8Array;
    if (channels === 1) {
      mp3buf = mp3encoder.encodeBuffer(leftChunk);
    } else {
      mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
    }

    if (mp3buf.length > 0) {
      mp3Data.push(new Uint8Array(mp3buf));
    }

    if (onProgress && i % (sampleBlockSize * 100) === 0) {
      const pct = Math.floor(88 + (i / sampleCount) * 11);
      onProgress(pct);
    }
  }

  const endBuf = mp3encoder.flush();
  if (endBuf.length > 0) {
    mp3Data.push(new Uint8Array(endBuf));
  }

  return new Blob(mp3Data, { type: 'audio/mp3' });
}

export async function convertAndExport3DAudio(
  audioUrl: string,
  microDelay: MicrosecondDelaySettings,
  spatial: Spatial3DSettings,
  eq: EQSettings,
  format: 'mp3' | 'wav' = 'mp3',
  onProgress?: (percent: number, statusText: string) => void
): Promise<{ blob: Blob; url: string; fileName: string }> {
  if (onProgress) onProgress(5, 'અવાજ ડાઉનલોડ થઈ રહ્યો છે (Fetching Audio)...');

  // 1. Fetch raw audio
  const response = await fetch(audioUrl);
  if (!response.ok) {
    throw new Error('Audio file download failed: ' + response.statusText);
  }
  const arrayBuffer = await response.arrayBuffer();

  if (onProgress) onProgress(20, 'ઓડિયો ડીકોડિંગ થઈ રહ્યું છે (Decoding Audio)...');

  // 2. Decode Audio Data in temporary AudioContext
  const tempCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  const decodedBuffer = await tempCtx.decodeAudioData(arrayBuffer);
  tempCtx.close();

  if (onProgress) onProgress(40, '3D ઓડિયો ડીલે અને સ્પાશિયલ પ્રોસેસિંગ... (Offline Processing)...');

  // 3. Setup OfflineAudioContext
  const numberOfChannels = 2; // Stereo
  const sampleRate = decodedBuffer.sampleRate;
  const length = decodedBuffer.length;

  const offlineCtx = new OfflineAudioContext(numberOfChannels, length, sampleRate);

  // Buffer Source Node
  const sourceNode = offlineCtx.createBufferSource();
  sourceNode.buffer = decodedBuffer;

  // 4. Create 10-Band EQ Filters in Offline Context
  const EQ_FREQUENCIES = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
  const eqFilters = EQ_FREQUENCIES.map((freq, idx) => {
    const filter = offlineCtx.createBiquadFilter();
    filter.type = freq <= 125 ? 'lowshelf' : freq >= 8000 ? 'highshelf' : 'peaking';
    filter.frequency.value = freq;
    filter.gain.value = eq.bands[idx] || 0;
    filter.Q.value = 1.4;
    return filter;
  });

  // Bass & Treble Filters
  const bassFilter = offlineCtx.createBiquadFilter();
  bassFilter.type = 'lowshelf';
  bassFilter.frequency.value = 150;
  bassFilter.gain.value = (eq.bassBoost / 100) * 12;

  const trebleFilter = offlineCtx.createBiquadFilter();
  trebleFilter.type = 'highshelf';
  trebleFilter.frequency.value = 6000;
  trebleFilter.gain.value = (eq.trebleBoost / 100) * 10;

  // 5. Create L/R Splitter and Microsecond Delay Nodes
  const splitterNode = offlineCtx.createChannelSplitter(2);
  const leftDelayNode = offlineCtx.createDelay(5.0);
  const rightDelayNode = offlineCtx.createDelay(5.0);

  if (microDelay.enabled) {
    leftDelayNode.delayTime.value = microDelay.leftDelayUs / 1000.0;
    rightDelayNode.delayTime.value = microDelay.rightDelayUs / 1000.0;
  } else {
    leftDelayNode.delayTime.value = 0;
    rightDelayNode.delayTime.value = 0;
  }

  const mergerNode = offlineCtx.createChannelMerger(2);

  // 6. 3D Spatial Panner
  const pannerNode = offlineCtx.createPanner();
  if (spatial.enabled !== false) {
    pannerNode.panningModel = spatial.panningModel || 'HRTF';
    pannerNode.distanceModel = 'inverse';
    if (pannerNode.positionX) {
      pannerNode.positionX.value = spatial.x;
      pannerNode.positionY.value = spatial.y;
      pannerNode.positionZ.value = spatial.z;
    } else {
      pannerNode.setPosition(spatial.x, spatial.y, spatial.z);
    }
  } else {
    pannerNode.panningModel = 'equalpower';
    pannerNode.distanceModel = 'inverse';
    if (pannerNode.positionX) {
      pannerNode.positionX.value = 0;
      pannerNode.positionY.value = 0;
      pannerNode.positionZ.value = -1;
    } else {
      pannerNode.setPosition(0, 0, -1);
    }
  }

  // Dynamics Compressor
  const compressorNode = offlineCtx.createDynamicsCompressor();

  // Connect Offline Chain
  let curr: AudioNode = sourceNode;

  for (const filter of eqFilters) {
    curr.connect(filter);
    curr = filter;
  }
  curr.connect(bassFilter);
  curr = bassFilter;

  curr.connect(trebleFilter);
  curr = trebleFilter;

  // Splitter -> Pure Independent Channel Delays -> Independent Mute Nodes -> Merger
  const leftMuteNode = offlineCtx.createGain();
  const rightMuteNode = offlineCtx.createGain();
  leftMuteNode.gain.value = microDelay.leftMuted ? 0.0 : 1.0;
  rightMuteNode.gain.value = microDelay.rightMuted ? 0.0 : 1.0;

  curr.connect(splitterNode);

  splitterNode.connect(leftDelayNode, 0);
  leftDelayNode.connect(leftMuteNode);
  leftMuteNode.connect(mergerNode, 0, 0);

  splitterNode.connect(rightDelayNode, 1);
  rightDelayNode.connect(rightMuteNode);
  rightMuteNode.connect(mergerNode, 0, 1);

  mergerNode.connect(pannerNode);
  pannerNode.connect(compressorNode);
  compressorNode.connect(offlineCtx.destination);

  // Start Offline Rendering
  sourceNode.start(0);

  if (onProgress) onProgress(70, '3D સાઉન્ડ મિશ્રણ અને કન્વર્ઝન (Rendering Audio)...');

  const renderedBuffer = await offlineCtx.startRendering();

  let audioBlob: Blob;
  let ext = 'mp3';

  if (format === 'mp3') {
    if (onProgress) onProgress(85, 'MP3 એન્કોડિંગ થઈ રહ્યું છે (Encoding to MP3 192kbps)...');
    audioBlob = audioBufferToMp3(renderedBuffer, (pct) => {
      if (onProgress) onProgress(pct, 'MP3 એન્કોડિંગ થઈ રહ્યું છે (Encoding MP3)...');
    });
    ext = 'mp3';
  } else {
    if (onProgress) onProgress(90, 'WAVE ફાઇલ એન્કોડિંગ (Encoding to WAV)...');
    audioBlob = audioBufferToWav(renderedBuffer);
    ext = 'wav';
  }

  const exportUrl = URL.createObjectURL(audioBlob);

  if (onProgress) onProgress(100, 'કન્વર્ઝન પૂર્ણ થયું! (Completed)');

  const fileName = `3D-Sound_${microDelay.leftDelayUs}ms-${microDelay.rightDelayUs}ms_${Date.now()}.${ext}`;

  return {
    blob: audioBlob,
    url: exportUrl,
    fileName,
  };
}
