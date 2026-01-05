import { describe, it, expect } from '@jest/globals';
import { formatUSD, formatProbability, formatAddress, formatTimestamp, formatVolume, truncate } from './format';

describe('format utilities', () => {
  describe('formatUSD', () => {
    it('should format positive numbers with 2 decimals', () => {
      expect(formatUSD(1234.56)).toBe('$1,234.56');
      expect(formatUSD(1000)).toBe('$1,000.00');
    });

    it('should format large numbers with commas', () => {
      expect(formatUSD(1234567.89)).toBe('$1,234,567.89');
    });

    it('should handle zero', () => {
      expect(formatUSD(0)).toBe('$0.00');
    });

    it('should handle small decimals', () => {
      expect(formatUSD(0.01)).toBe('$0.01');
    });
  });

  describe('formatProbability', () => {
    it('should convert 0-1 to percentage', () => {
      expect(formatProbability(0.5)).toBe('50.0%');
      expect(formatProbability(0.654)).toBe('65.4%');
    });

    it('should handle edge cases', () => {
      expect(formatProbability(0)).toBe('0.0%');
      expect(formatProbability(1)).toBe('100.0%');
    });
  });

  describe('formatAddress', () => {
    it('should shorten valid Ethereum addresses', () => {
      const addr = '0x1234567890abcdef1234567890abcdef12345678';
      expect(formatAddress(addr)).toBe('0x1234...5678');
    });

    it('should return short addresses unchanged', () => {
      expect(formatAddress('0x123')).toBe('0x123');
    });
  });

  describe('formatTimestamp', () => {
    it('should format date to readable string', () => {
      const date = new Date('2026-01-06T12:30:45.123Z');
      const formatted = formatTimestamp(date);
      expect(formatted).toContain('2026-01-06');
      expect(formatted).toContain('12:30:45');
      expect(formatted).toContain('UTC');
    });
  });

  describe('formatVolume', () => {
    it('should format millions with M suffix', () => {
      expect(formatVolume(1000000)).toBe('$1.00M');
      expect(formatVolume(1500000)).toBe('$1.50M');
    });

    it('should format thousands with K suffix', () => {
      expect(formatVolume(1000)).toBe('$1.0K');
      expect(formatVolume(50000)).toBe('$50.0K');
    });

    it('should format small amounts without suffix', () => {
      expect(formatVolume(999)).toBe('$999');
      expect(formatVolume(100)).toBe('$100');
    });
  });

  describe('truncate', () => {
    it('should truncate long text', () => {
      const longText = 'This is a very long text that should be truncated';
      expect(truncate(longText, 20)).toBe('This is a very lo...');
    });

    it('should not truncate short text', () => {
      const shortText = 'Short';
      expect(truncate(shortText, 20)).toBe('Short');
    });
  });
});
