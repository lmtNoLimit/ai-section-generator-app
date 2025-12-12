import { FontDrop } from '../FontDrop';
import type { FontWithStack } from '../../mockData/types';

describe('FontDrop', () => {
  const georgiaFont: FontWithStack = {
    family: 'Georgia',
    fallback_families: 'serif',
    stack: 'Georgia, serif',
    style: 'normal',
    weight: 400
  };

  const customFont: FontWithStack = {
    family: 'Roboto',
    fallback_families: 'sans-serif',
    stack: '"Roboto", sans-serif',
    style: 'normal',
    weight: 400,
    src: 'https://fonts.example.com/roboto.woff2',
    format: 'woff2'
  };

  describe('property access', () => {
    it('returns family property', () => {
      const drop = new FontDrop(georgiaFont);
      expect(drop.family).toBe('Georgia');
    });

    it('returns fallback_families property', () => {
      const drop = new FontDrop(georgiaFont);
      expect(drop.fallback_families).toBe('serif');
    });

    it('returns stack property', () => {
      const drop = new FontDrop(georgiaFont);
      expect(drop.stack).toBe('Georgia, serif');
    });

    it('returns style property', () => {
      const drop = new FontDrop(georgiaFont);
      expect(drop.style).toBe('normal');
    });

    it('returns weight property', () => {
      const drop = new FontDrop(georgiaFont);
      expect(drop.weight).toBe(400);
    });

    it('returns empty string for src when not present', () => {
      const drop = new FontDrop(georgiaFont);
      expect(drop.src).toBe('');
    });

    it('returns src when present', () => {
      const drop = new FontDrop(customFont);
      expect(drop.src).toBe('https://fonts.example.com/roboto.woff2');
    });

    it('returns format when present', () => {
      const drop = new FontDrop(customFont);
      expect(drop.format).toBe('woff2');
    });
  });

  describe('string conversion', () => {
    it('toString returns font stack', () => {
      const drop = new FontDrop(georgiaFont);
      expect(drop.toString()).toBe('Georgia, serif');
    });

    it('valueOf returns font stack', () => {
      const drop = new FontDrop(georgiaFont);
      expect(drop.valueOf()).toBe('Georgia, serif');
    });

    it('toLiquidOutput returns font stack', () => {
      const drop = new FontDrop(georgiaFont);
      expect(drop.toLiquidOutput()).toBe('Georgia, serif');
    });
  });

  describe('liquidMethodMissing', () => {
    it('returns family for family key', () => {
      const drop = new FontDrop(georgiaFont);
      expect(drop.liquidMethodMissing('family')).toBe('Georgia');
    });

    it('returns stack for stack key', () => {
      const drop = new FontDrop(georgiaFont);
      expect(drop.liquidMethodMissing('stack')).toBe('Georgia, serif');
    });

    it('returns weight for weight key', () => {
      const drop = new FontDrop(georgiaFont);
      expect(drop.liquidMethodMissing('weight')).toBe(400);
    });

    it('returns undefined for unknown key', () => {
      const drop = new FontDrop(georgiaFont);
      expect(drop.liquidMethodMissing('unknown')).toBeUndefined();
    });
  });

  describe('getFontData', () => {
    it('returns copy of font data', () => {
      const drop = new FontDrop(georgiaFont);
      const data = drop.getFontData();
      expect(data).toEqual(georgiaFont);
      // Verify it's a copy, not the same reference
      expect(data).not.toBe(georgiaFont);
    });
  });
});
