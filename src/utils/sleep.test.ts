import { describe, it, expect } from '@jest/globals';
import { sleep } from './sleep';

describe('sleep utilities', () => {
  describe('sleep', () => {
    it('should pause execution for specified milliseconds', async () => {
      const start = Date.now();
      await sleep(100);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(95); // Allow 5ms margin
      expect(elapsed).toBeLessThan(200); // Allow some overhead
    });

    it('should resolve with void', async () => {
      const result = await sleep(10);
      expect(result).toBeUndefined();
    });
  });
});
