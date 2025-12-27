/**
 * Audio Utilities for OpenAI Realtime API
 * Handles audio format conversion, encoding, and chunking
 */

/**
 * Convert Float32Array audio data to PCM16 format
 * OpenAI expects 16-bit PCM audio at 24kHz, mono
 */
export function float32ToPCM16(float32Array: Float32Array): Int16Array {
  const pcm16 = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    // Clamp values to [-1, 1] range
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    // Convert to 16-bit integer
    pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return pcm16;
}

/**
 * Convert PCM16 Int16Array to base64 string
 * Required format for OpenAI Realtime API
 */
export function pcm16ToBase64(pcm16: Int16Array): string {
  const buffer = new Uint8Array(pcm16.buffer);
  let binary = '';
  const len = buffer.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary);
}

/**
 * Convert base64 string to PCM16 Int16Array
 * Used for decoding audio received from OpenAI
 */
export function base64ToPCM16(base64: string): Int16Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Int16Array(bytes.buffer);
}

/**
 * Convert PCM16 to Float32Array for audio playback
 */
export function pcm16ToFloat32(pcm16: Int16Array): Float32Array {
  const float32 = new Float32Array(pcm16.length);
  for (let i = 0; i < pcm16.length; i++) {
    float32[i] = pcm16[i] / (pcm16[i] < 0 ? 0x8000 : 0x7fff);
  }
  return float32;
}

/**
 * Resample audio from one sample rate to another
 * @param audioData - Input audio data
 * @param fromSampleRate - Original sample rate (e.g., 48000)
 * @param toSampleRate - Target sample rate (e.g., 24000)
 */
export function resampleAudio(
  audioData: Float32Array,
  fromSampleRate: number,
  toSampleRate: number
): Float32Array {
  if (fromSampleRate === toSampleRate) {
    return audioData;
  }

  const ratio = fromSampleRate / toSampleRate;
  const newLength = Math.round(audioData.length / ratio);
  const result = new Float32Array(newLength);

  for (let i = 0; i < newLength; i++) {
    const sourceIndex = i * ratio;
    const index = Math.floor(sourceIndex);
    const fraction = sourceIndex - index;

    // Linear interpolation
    if (index + 1 < audioData.length) {
      result[i] = audioData[index] * (1 - fraction) + audioData[index + 1] * fraction;
    } else {
      result[i] = audioData[index];
    }
  }

  return result;
}

/**
 * Merge multiple audio channels into mono
 * @param audioData - Multi-channel audio data
 * @param numberOfChannels - Number of channels in input
 */
export function convertToMono(audioData: Float32Array, numberOfChannels: number): Float32Array {
  if (numberOfChannels === 1) {
    return audioData;
  }

  const monoLength = audioData.length / numberOfChannels;
  const mono = new Float32Array(monoLength);

  for (let i = 0; i < monoLength; i++) {
    let sum = 0;
    for (let channel = 0; channel < numberOfChannels; channel++) {
      sum += audioData[i * numberOfChannels + channel];
    }
    mono[i] = sum / numberOfChannels;
  }

  return mono;
}

/**
 * Process raw audio from microphone and convert to OpenAI format
 * @param audioData - Raw Float32Array from AudioContext
 * @param sampleRate - Original sample rate from microphone
 * @param numberOfChannels - Number of channels in input
 * @returns Base64 encoded PCM16 audio at 24kHz mono
 */
export function processAudioForOpenAI(
  audioData: Float32Array,
  sampleRate: number,
  numberOfChannels: number
): string {
  // Convert to mono if needed
  let mono = convertToMono(audioData, numberOfChannels);

  // Resample to 24kHz (OpenAI's expected rate)
  const TARGET_SAMPLE_RATE = 24000;
  if (sampleRate !== TARGET_SAMPLE_RATE) {
    mono = resampleAudio(mono, sampleRate, TARGET_SAMPLE_RATE);
  }

  // Convert to PCM16
  const pcm16 = float32ToPCM16(mono);

  // Encode to base64
  return pcm16ToBase64(pcm16);
}

/**
 * Create an AudioBuffer from base64 PCM16 data
 * Used for playing back OpenAI's audio responses
 */
export function createAudioBufferFromBase64(
  base64: string,
  audioContext: AudioContext
): AudioBuffer {
  const pcm16 = base64ToPCM16(base64);
  const float32 = pcm16ToFloat32(pcm16);

  // OpenAI outputs 24kHz mono audio
  const sampleRate = 24000;
  const audioBuffer = audioContext.createBuffer(1, float32.length, sampleRate);
  // Create a new Float32Array to ensure correct buffer type
  const channelData = new Float32Array(float32);
  audioBuffer.copyToChannel(channelData, 0);

  return audioBuffer;
}

/**
 * Audio chunk accumulator for streaming playback
 * Accumulates base64 audio chunks and creates playable buffers
 */
export class AudioChunkAccumulator {
  private chunks: string[] = [];
  private audioContext: AudioContext;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
  }

  /**
   * Add a new audio chunk
   */
  addChunk(base64Chunk: string): void {
    this.chunks.push(base64Chunk);
  }

  /**
   * Get accumulated audio as a single AudioBuffer
   */
  getAudioBuffer(): AudioBuffer | null {
    if (this.chunks.length === 0) {
      return null;
    }

    // Concatenate all base64 chunks
    const concatenated = this.chunks.join('');

    try {
      return createAudioBufferFromBase64(concatenated, this.audioContext);
    } catch (error) {
      console.error('[Audio] Error creating audio buffer:', error);
      return null;
    }
  }

  /**
   * Clear accumulated chunks
   */
  clear(): void {
    this.chunks = [];
  }

  /**
   * Get number of accumulated chunks
   */
  getChunkCount(): number {
    return this.chunks.length;
  }
}
