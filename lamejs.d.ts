declare module 'lamejs' {
  export class Mp3Encoder {
    constructor(channels: number, samplerate: number, kbps: number);
    encodeBuffer(left: Int16Array, right?: Int16Array): Int16Array | Uint8Array;
    flush(): Int16Array | Uint8Array;
  }
}

declare module '@breezystack/lamejs' {
  export class Mp3Encoder {
    constructor(channels: number, samplerate: number, kbps: number);
    encodeBuffer(left: Int16Array, right?: Int16Array): Int16Array | Uint8Array;
    flush(): Int16Array | Uint8Array;
  }
  const lamejs: {
    Mp3Encoder: typeof Mp3Encoder;
  };
  export default lamejs;
}

