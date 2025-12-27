/**
 * Tests for OpenAI Audio Utilities
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  float32ToPCM16,
  pcm16ToBase64,
  base64ToPCM16,
  pcm16ToFloat32,
  resampleAudio,
  convertToMono,
  processAudioForOpenAI,
  createAudioBufferFromBase64,
  AudioChunkAccumulator,
} from '../audio';

describe('Audio Utilities', () => {
  describe('float32ToPCM16', () => {
    it('should convert Float32Array to Int16Array', () => {
      const float32 = new Float32Array([0, 0.5, -0.5, 1, -1]);
      const pcm16 = float32ToPCM16(float32);

      expect(pcm16).toBeInstanceOf(Int16Array);
      expect(pcm16.length).toBe(5);
    });

    it('should convert 0 to 0', () => {
      const float32 = new Float32Array([0]);
      const pcm16 = float32ToPCM16(float32);

      expect(pcm16[0]).toBe(0);
    });

    it('should convert 1 to max positive value (32767)', () => {
      const float32 = new Float32Array([1]);
      const pcm16 = float32ToPCM16(float32);

      expect(pcm16[0]).toBe(32767);
    });

    it('should convert -1 to max negative value (-32768)', () => {
      const float32 = new Float32Array([-1]);
      const pcm16 = float32ToPCM16(float32);

      expect(pcm16[0]).toBe(-32768);
    });

    it('should clamp values greater than 1', () => {
      const float32 = new Float32Array([1.5]);
      const pcm16 = float32ToPCM16(float32);

      expect(pcm16[0]).toBe(32767);
    });

    it('should clamp values less than -1', () => {
      const float32 = new Float32Array([-1.5]);
      const pcm16 = float32ToPCM16(float32);

      expect(pcm16[0]).toBe(-32768);
    });
  });

  describe('pcm16ToBase64', () => {
    it('should convert Int16Array to base64 string', () => {
      const pcm16 = new Int16Array([0, 1000, -1000]);
      const base64 = pcm16ToBase64(pcm16);

      expect(typeof base64).toBe('string');
      expect(base64.length).toBeGreaterThan(0);
    });

    it('should produce decodable base64', () => {
      const pcm16 = new Int16Array([100, 200, 300]);
      const base64 = pcm16ToBase64(pcm16);

      // Should not throw when decoding
      expect(() => atob(base64)).not.toThrow();
    });
  });

  describe('base64ToPCM16', () => {
    it('should convert base64 string back to Int16Array', () => {
      const original = new Int16Array([100, 200, 300, -100, -200]);
      const base64 = pcm16ToBase64(original);
      const decoded = base64ToPCM16(base64);

      expect(decoded).toBeInstanceOf(Int16Array);
      expect(decoded.length).toBe(original.length);
    });

    it('should round-trip correctly with pcm16ToBase64', () => {
      const original = new Int16Array([0, 32767, -32768, 1000, -1000]);
      const base64 = pcm16ToBase64(original);
      const decoded = base64ToPCM16(base64);

      expect(Array.from(decoded)).toEqual(Array.from(original));
    });
  });

  describe('pcm16ToFloat32', () => {
    it('should convert Int16Array to Float32Array', () => {
      const pcm16 = new Int16Array([0, 16384, -16384]);
      const float32 = pcm16ToFloat32(pcm16);

      expect(float32).toBeInstanceOf(Float32Array);
      expect(float32.length).toBe(3);
    });

    it('should convert 0 to 0', () => {
      const pcm16 = new Int16Array([0]);
      const float32 = pcm16ToFloat32(pcm16);

      expect(float32[0]).toBe(0);
    });

    it('should convert 32767 to approximately 1', () => {
      const pcm16 = new Int16Array([32767]);
      const float32 = pcm16ToFloat32(pcm16);

      expect(float32[0]).toBeCloseTo(1, 4);
    });

    it('should convert -32768 to -1', () => {
      const pcm16 = new Int16Array([-32768]);
      const float32 = pcm16ToFloat32(pcm16);

      expect(float32[0]).toBe(-1);
    });

    it('should round-trip with float32ToPCM16 approximately', () => {
      const original = new Float32Array([0, 0.5, -0.5]);
      const pcm16 = float32ToPCM16(original);
      const float32 = pcm16ToFloat32(pcm16);

      expect(float32[0]).toBeCloseTo(original[0], 2);
      expect(float32[1]).toBeCloseTo(original[1], 2);
      expect(float32[2]).toBeCloseTo(original[2], 2);
    });
  });

  describe('resampleAudio', () => {
    it('should return same array if sample rates match', () => {
      const audio = new Float32Array([0.1, 0.2, 0.3, 0.4]);
      const result = resampleAudio(audio, 48000, 48000);

      expect(result).toBe(audio);
    });

    it('should downsample audio correctly', () => {
      // 48kHz to 24kHz should roughly halve the length
      const audio = new Float32Array(48000); // 1 second at 48kHz
      audio.fill(0.5);

      const result = resampleAudio(audio, 48000, 24000);

      expect(result.length).toBe(24000); // 1 second at 24kHz
    });

    it('should upsample audio correctly', () => {
      // 24kHz to 48kHz should roughly double the length
      const audio = new Float32Array(24000); // 1 second at 24kHz
      audio.fill(0.5);

      const result = resampleAudio(audio, 24000, 48000);

      expect(result.length).toBe(48000); // 1 second at 48kHz
    });

    it('should use linear interpolation', () => {
      const audio = new Float32Array([0, 1]);
      const result = resampleAudio(audio, 1, 4); // Upsample 4x

      // With linear interpolation, we expect values between 0 and 1
      expect(result.length).toBe(8);
      expect(result[0]).toBe(0);
      // Middle values should be interpolated
      expect(result[result.length - 1]).toBeCloseTo(1, 1);
    });
  });

  describe('convertToMono', () => {
    it('should return same array if already mono', () => {
      const audio = new Float32Array([0.1, 0.2, 0.3]);
      const result = convertToMono(audio, 1);

      expect(result).toBe(audio);
    });

    it('should convert stereo to mono by averaging channels', () => {
      // Interleaved stereo: [L0, R0, L1, R1, L2, R2]
      const stereo = new Float32Array([0, 1, 0.2, 0.8, 0.4, 0.6]);
      const mono = convertToMono(stereo, 2);

      expect(mono.length).toBe(3);
      expect(mono[0]).toBeCloseTo(0.5, 5); // (0 + 1) / 2
      expect(mono[1]).toBeCloseTo(0.5, 5); // (0.2 + 0.8) / 2
      expect(mono[2]).toBeCloseTo(0.5, 5); // (0.4 + 0.6) / 2
    });

    it('should handle 4-channel audio', () => {
      // Interleaved 4-channel: [C0_0, C1_0, C2_0, C3_0, C0_1, C1_1, C2_1, C3_1]
      const quadChannel = new Float32Array([0, 0.4, 0.8, 1.2, 0.1, 0.3, 0.5, 0.7]);
      const mono = convertToMono(quadChannel, 4);

      expect(mono.length).toBe(2);
      expect(mono[0]).toBeCloseTo(0.6, 5); // (0 + 0.4 + 0.8 + 1.2) / 4
      expect(mono[1]).toBeCloseTo(0.4, 5); // (0.1 + 0.3 + 0.5 + 0.7) / 4
    });
  });

  describe('processAudioForOpenAI', () => {
    it('should return a base64 string', () => {
      const audio = new Float32Array([0.1, 0.2, 0.3, 0.4]);
      const result = processAudioForOpenAI(audio, 24000, 1);

      expect(typeof result).toBe('string');
      expect(() => atob(result)).not.toThrow();
    });

    it('should process mono audio at 24kHz without resampling', () => {
      const audio = new Float32Array(2400); // 0.1 seconds at 24kHz
      audio.fill(0.5);

      const result = processAudioForOpenAI(audio, 24000, 1);
      const decoded = base64ToPCM16(result);

      // Should have same number of samples since no resampling needed
      expect(decoded.length).toBe(2400);
    });

    it('should resample 48kHz to 24kHz', () => {
      const audio = new Float32Array(4800); // 0.1 seconds at 48kHz
      audio.fill(0.5);

      const result = processAudioForOpenAI(audio, 48000, 1);
      const decoded = base64ToPCM16(result);

      // Should have half the samples after resampling
      expect(decoded.length).toBe(2400);
    });

    it('should convert stereo to mono', () => {
      // Stereo audio: 2400 samples per channel = 4800 total
      const audio = new Float32Array(4800);
      audio.fill(0.5);

      const result = processAudioForOpenAI(audio, 24000, 2);
      const decoded = base64ToPCM16(result);

      // Should have half the samples after mono conversion
      expect(decoded.length).toBe(2400);
    });
  });

  describe('createAudioBufferFromBase64', () => {
    // Note: AudioContext is not available in Node.js/Vitest without mocking
    // These tests would need a mock AudioContext implementation
    it.skip('should create an AudioBuffer from base64 data', () => {
      // This test would require mocking AudioContext
    });
  });

  describe('AudioChunkAccumulator', () => {
    // Create a minimal mock AudioContext for testing
    const mockAudioContext = {
      createBuffer: vi.fn(),
      sampleRate: 24000,
    } as unknown as AudioContext;

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should start with zero chunks', () => {
      const accumulator = new AudioChunkAccumulator(mockAudioContext);

      expect(accumulator.getChunkCount()).toBe(0);
    });

    it('should add chunks correctly', () => {
      const accumulator = new AudioChunkAccumulator(mockAudioContext);

      accumulator.addChunk('chunk1');
      expect(accumulator.getChunkCount()).toBe(1);

      accumulator.addChunk('chunk2');
      expect(accumulator.getChunkCount()).toBe(2);
    });

    it('should clear accumulated chunks', () => {
      const accumulator = new AudioChunkAccumulator(mockAudioContext);

      accumulator.addChunk('chunk1');
      accumulator.addChunk('chunk2');
      accumulator.clear();

      expect(accumulator.getChunkCount()).toBe(0);
    });

    it('should return null when no chunks accumulated', () => {
      const accumulator = new AudioChunkAccumulator(mockAudioContext);

      const buffer = accumulator.getAudioBuffer();

      expect(buffer).toBeNull();
    });
  });
});
