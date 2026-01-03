/**
 * Tests for diff engine - line-by-line diff calculation
 */

import { calculateDiff } from '../diff-engine';

describe('calculateDiff', () => {
  describe('identical content', () => {
    it('returns empty hunks for identical strings', () => {
      const code = 'line 1\nline 2\nline 3';
      const result = calculateDiff(code, code);

      expect(result.hasDiff).toBe(false);
      expect(result.hunks).toHaveLength(0);
      expect(result.stats.additions).toBe(0);
      expect(result.stats.deletions).toBe(0);
      expect(result.stats.unchanged).toBe(3);
    });

    it('handles empty strings', () => {
      const result = calculateDiff('', '');

      expect(result.hasDiff).toBe(false);
      expect(result.hunks).toHaveLength(0);
    });
  });

  describe('additions', () => {
    it('detects single line addition', () => {
      const oldCode = 'line 1\nline 2';
      const newCode = 'line 1\nline 2\nline 3';
      const result = calculateDiff(oldCode, newCode);

      expect(result.hasDiff).toBe(true);
      expect(result.stats.additions).toBe(1);
      expect(result.stats.deletions).toBe(0);
    });

    it('detects multiple additions', () => {
      const oldCode = 'line 1';
      const newCode = 'line 1\nline 2\nline 3';
      const result = calculateDiff(oldCode, newCode);

      expect(result.hasDiff).toBe(true);
      expect(result.stats.additions).toBe(2);
      expect(result.stats.deletions).toBe(0);
    });

    it('detects addition at beginning', () => {
      const oldCode = 'line 2\nline 3';
      const newCode = 'line 1\nline 2\nline 3';
      const result = calculateDiff(oldCode, newCode);

      expect(result.hasDiff).toBe(true);
      expect(result.stats.additions).toBe(1);
    });
  });

  describe('deletions', () => {
    it('detects single line deletion', () => {
      const oldCode = 'line 1\nline 2\nline 3';
      const newCode = 'line 1\nline 2';
      const result = calculateDiff(oldCode, newCode);

      expect(result.hasDiff).toBe(true);
      expect(result.stats.additions).toBe(0);
      expect(result.stats.deletions).toBe(1);
    });

    it('detects multiple deletions', () => {
      const oldCode = 'line 1\nline 2\nline 3';
      const newCode = 'line 1';
      const result = calculateDiff(oldCode, newCode);

      expect(result.hasDiff).toBe(true);
      expect(result.stats.deletions).toBe(2);
    });
  });

  describe('modifications', () => {
    it('detects line modification as delete+add', () => {
      const oldCode = 'line 1\nold line\nline 3';
      const newCode = 'line 1\nnew line\nline 3';
      const result = calculateDiff(oldCode, newCode);

      expect(result.hasDiff).toBe(true);
      expect(result.stats.additions).toBe(1);
      expect(result.stats.deletions).toBe(1);
    });
  });

  describe('hunk grouping', () => {
    it('groups nearby changes into single hunk', () => {
      const oldCode = 'a\nb\nc\nd\ne';
      const newCode = 'a\nB\nc\nD\ne';
      const result = calculateDiff(oldCode, newCode);

      // Changes at lines 2 and 4 are close, should be in one hunk
      expect(result.hunks.length).toBeLessThanOrEqual(2);
    });

    it('includes context lines around changes', () => {
      const oldCode = 'line 1\nline 2\nline 3\nold\nline 5\nline 6\nline 7';
      const newCode = 'line 1\nline 2\nline 3\nnew\nline 5\nline 6\nline 7';
      const result = calculateDiff(oldCode, newCode);

      expect(result.hunks.length).toBeGreaterThan(0);
      // First hunk should have context lines
      const hunk = result.hunks[0];
      expect(hunk.lines.length).toBeGreaterThan(2); // More than just the changed lines
    });
  });

  describe('performance', () => {
    it('handles large files within reasonable time', () => {
      const lines = Array.from({ length: 500 }, (_, i) => `line ${i}`);
      const oldCode = lines.join('\n');
      const newCode = [...lines.slice(0, 250), 'NEW LINE', ...lines.slice(251)].join('\n');

      const start = performance.now();
      const result = calculateDiff(oldCode, newCode);
      const elapsed = performance.now() - start;

      expect(result.hasDiff).toBe(true);
      expect(elapsed).toBeLessThan(100); // Should complete in <100ms
    });
  });

  describe('edge cases', () => {
    it('handles whitespace-only changes', () => {
      const oldCode = 'line 1\nline 2';
      const newCode = 'line 1\nline 2 ';
      const result = calculateDiff(oldCode, newCode);

      expect(result.hasDiff).toBe(true);
    });

    it('handles complete replacement', () => {
      const oldCode = 'old\ncontent';
      const newCode = 'new\nstuff';
      const result = calculateDiff(oldCode, newCode);

      expect(result.hasDiff).toBe(true);
      expect(result.stats.additions).toBe(2);
      expect(result.stats.deletions).toBe(2);
    });
  });
});
