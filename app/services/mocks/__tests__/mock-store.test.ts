import { mockStore } from '../mock-store';

describe('MockStore', () => {
  beforeEach(() => {
    mockStore.reset();
  });

  describe('saveSection', () => {
    it('saves section metadata', () => {
      const metadata = mockStore.saveSection('theme1', 'test.liquid', 'content');

      expect(metadata.filename).toBe('test.liquid');
      expect(metadata.size).toBe('content'.length);
      expect(metadata.contentType).toBe('text/liquid');
      expect(metadata.checksum).toBeTruthy();
    });

    it('generates consistent checksums', () => {
      const meta1 = mockStore.saveSection('theme1', 'test.liquid', 'same content');
      const meta2 = mockStore.saveSection('theme2', 'test.liquid', 'same content');

      expect(meta1.checksum).toBe(meta2.checksum);
    });

    it('generates different checksums for different content', () => {
      const meta1 = mockStore.saveSection('theme1', 'test.liquid', 'content1');
      const meta2 = mockStore.saveSection('theme1', 'test.liquid', 'content2');

      expect(meta1.checksum).not.toBe(meta2.checksum);
    });
  });

  describe('getSections', () => {
    it('returns sections for specific theme', () => {
      mockStore.saveSection('theme1', 'section1.liquid', 'content1');
      mockStore.saveSection('theme1', 'section2.liquid', 'content2');
      mockStore.saveSection('theme2', 'section3.liquid', 'content3');

      const sections = mockStore.getSections('theme1');

      expect(sections).toHaveLength(2);
    });

    it('returns empty array for theme with no sections', () => {
      const sections = mockStore.getSections('nonexistent');

      expect(sections).toEqual([]);
    });
  });

  describe('generationCount', () => {
    it('increments generation count', () => {
      const count1 = mockStore.incrementGeneration();
      const count2 = mockStore.incrementGeneration();

      expect(count2).toBe(count1 + 1);
    });

    it('returns current count', () => {
      mockStore.incrementGeneration();
      mockStore.incrementGeneration();

      expect(mockStore.getGenerationCount()).toBe(2);
    });
  });

  describe('reset', () => {
    it('clears all data', () => {
      mockStore.saveSection('theme1', 'test.liquid', 'content');
      mockStore.incrementGeneration();

      mockStore.reset();

      expect(mockStore.getSections('theme1')).toEqual([]);
      expect(mockStore.getGenerationCount()).toBe(0);
    });
  });
});
