import { fontFilters } from '../fontFilters';
import { FontDrop } from '../../drops/FontDrop';
import type { FontWithStack } from '../../mockData/types';

describe('fontFilters', () => {
  // Test data
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

  describe('font_face', () => {
    describe('with FontDrop', () => {
      it('returns comment for web-safe fonts without src', () => {
        const drop = new FontDrop(georgiaFont);
        const result = fontFilters.font_face(drop);
        expect(result).toBe('/* Georgia is a web-safe font */');
      });

      it('generates @font-face for custom fonts with src', () => {
        const drop = new FontDrop(customFont);
        const result = fontFilters.font_face(drop);
        expect(result).toContain('@font-face');
        expect(result).toContain('font-family: "Roboto"');
        expect(result).toContain('src: url("https://fonts.example.com/roboto.woff2")');
        expect(result).toContain('format("woff2")');
        expect(result).toContain('font-weight: 400');
        expect(result).toContain('font-style: normal');
      });
    });

    describe('with legacy object', () => {
      it('generates @font-face CSS', () => {
        const result = fontFilters.font_face({
          family: 'Roboto',
          weight: 400,
          style: 'normal',
        });
        expect(result).toContain('@font-face');
        expect(result).toContain('font-family: "Roboto"');
        expect(result).toContain('font-weight: 400');
        expect(result).toContain('font-style: normal');
        expect(result).toContain('font-display: swap');
      });

      it('uses defaults for missing properties', () => {
        const result = fontFilters.font_face({});
        expect(result).toContain('font-family: "sans-serif"');
        expect(result).toContain('font-weight: 400');
        expect(result).toContain('font-style: normal');
      });

      it('returns empty string for null', () => {
        expect(fontFilters.font_face(null)).toBe('');
      });
    });
  });

  describe('font_url', () => {
    describe('with FontDrop', () => {
      it('returns empty string for web-safe fonts without src', () => {
        const drop = new FontDrop(georgiaFont);
        expect(fontFilters.font_url(drop)).toBe('');
      });

      it('returns src for custom fonts', () => {
        const drop = new FontDrop(customFont);
        expect(fontFilters.font_url(drop)).toBe('https://fonts.example.com/roboto.woff2');
      });
    });

    describe('with legacy object', () => {
      it('returns src if present', () => {
        const result = fontFilters.font_url({ src: 'https://example.com/font.woff2' });
        expect(result).toBe('https://example.com/font.woff2');
      });

      it('generates font URL with default woff2 format', () => {
        const result = fontFilters.font_url({ family: 'Roboto' });
        expect(result).toBe('https://fonts.shopifycdn.com/preview/roboto.woff2');
      });

      it('generates font URL with specified format', () => {
        const result = fontFilters.font_url({ family: 'Open Sans' }, 'woff');
        expect(result).toBe('https://fonts.shopifycdn.com/preview/open-sans.woff');
      });

      it('uses arial as default family', () => {
        const result = fontFilters.font_url({});
        expect(result).toBe('https://fonts.shopifycdn.com/preview/arial.woff2');
      });

      it('returns empty string for null', () => {
        expect(fontFilters.font_url(null)).toBe('');
      });
    });
  });

  describe('font_modify', () => {
    describe('with FontDrop', () => {
      it('returns new FontDrop with modified weight', () => {
        const drop = new FontDrop(georgiaFont);
        const result = fontFilters.font_modify(drop, 'weight', 700);
        expect(result).toBeInstanceOf(FontDrop);
        expect((result as FontDrop).weight).toBe(700);
        // Original unchanged
        expect(drop.weight).toBe(400);
      });

      it('handles bold string for weight', () => {
        const drop = new FontDrop(georgiaFont);
        const result = fontFilters.font_modify(drop, 'weight', 'bold');
        expect((result as FontDrop).weight).toBe(700);
      });

      it('handles normal string for weight', () => {
        const boldFont = { ...georgiaFont, weight: 700 as const };
        const drop = new FontDrop(boldFont);
        const result = fontFilters.font_modify(drop, 'weight', 'normal');
        expect((result as FontDrop).weight).toBe(400);
      });

      it('modifies style', () => {
        const drop = new FontDrop(georgiaFont);
        const result = fontFilters.font_modify(drop, 'style', 'italic');
        expect((result as FontDrop).style).toBe('italic');
      });
    });

    describe('with legacy object', () => {
      it('modifies weight with number', () => {
        const result = fontFilters.font_modify({ family: 'Roboto', weight: 400 }, 'weight', 700);
        expect(result.weight).toBe(700);
      });

      it('modifies weight with string bold', () => {
        const result = fontFilters.font_modify({ family: 'Roboto' }, 'weight', 'bold');
        expect(result.weight).toBe(700);
      });

      it('modifies weight with string normal', () => {
        const result = fontFilters.font_modify({ family: 'Roboto', weight: 700 }, 'weight', 'normal');
        expect(result.weight).toBe(400);
      });

      it('modifies weight with numeric string', () => {
        const result = fontFilters.font_modify({ family: 'Roboto' }, 'weight', '600');
        expect(result.weight).toBe(600);
      });

      it('modifies style', () => {
        const result = fontFilters.font_modify({ family: 'Roboto' }, 'style', 'italic');
        expect(result.style).toBe('italic');
      });

      it('preserves other properties', () => {
        const result = fontFilters.font_modify({ family: 'Roboto', weight: 400 }, 'style', 'italic');
        expect(result.family).toBe('Roboto');
        expect(result.weight).toBe(400);
      });

      it('returns default for null input', () => {
        const result = fontFilters.font_modify(null, 'weight', 700);
        expect(result.family).toBe('sans-serif');
      });
    });
  });
});
