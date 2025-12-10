import { colorFilters } from '../colorFilters';

describe('colorFilters', () => {
  describe('color_to_rgb', () => {
    it('converts hex to rgb', () => {
      expect(colorFilters.color_to_rgb('#ff0000')).toBe('rgb(255, 0, 0)');
      expect(colorFilters.color_to_rgb('#00ff00')).toBe('rgb(0, 255, 0)');
      expect(colorFilters.color_to_rgb('#0000ff')).toBe('rgb(0, 0, 255)');
    });

    it('converts short hex to rgb', () => {
      expect(colorFilters.color_to_rgb('#f00')).toBe('rgb(255, 0, 0)');
    });

    it('preserves alpha in rgba', () => {
      expect(colorFilters.color_to_rgb('#ff000080')).toBe('rgba(255, 0, 0, 0.5019607843137255)');
    });

    it('passes through rgb unchanged', () => {
      expect(colorFilters.color_to_rgb('rgb(255, 0, 0)')).toBe('rgb(255, 0, 0)');
    });

    it('returns original for invalid input', () => {
      expect(colorFilters.color_to_rgb('not-a-color')).toBe('not-a-color');
    });
  });

  describe('color_to_hsl', () => {
    it('converts hex to hsl', () => {
      expect(colorFilters.color_to_hsl('#ff0000')).toBe('hsl(0, 100%, 50%)');
      expect(colorFilters.color_to_hsl('#00ff00')).toBe('hsl(120, 100%, 50%)');
      expect(colorFilters.color_to_hsl('#0000ff')).toBe('hsl(240, 100%, 50%)');
    });

    it('converts rgb to hsl', () => {
      expect(colorFilters.color_to_hsl('rgb(255, 0, 0)')).toBe('hsl(0, 100%, 50%)');
    });
  });

  describe('color_to_hex', () => {
    it('converts rgb to hex', () => {
      expect(colorFilters.color_to_hex('rgb(255, 0, 0)')).toBe('#ff0000');
      expect(colorFilters.color_to_hex('rgb(0, 255, 0)')).toBe('#00ff00');
    });

    it('returns hex unchanged', () => {
      expect(colorFilters.color_to_hex('#ff0000')).toBe('#ff0000');
    });
  });

  describe('color_lighten', () => {
    it('lightens a color', () => {
      const result = colorFilters.color_lighten('#000000', 50);
      // Black lightened by 50% should be gray
      expect(result).toBe('rgb(128, 128, 128)');
    });

    it('does not exceed 100% lightness', () => {
      const result = colorFilters.color_lighten('#ffffff', 20);
      // Already white, should stay white
      expect(result).toBe('rgb(255, 255, 255)');
    });
  });

  describe('color_darken', () => {
    it('darkens a color', () => {
      const result = colorFilters.color_darken('#ffffff', 50);
      // White darkened by 50% should be gray
      expect(result).toBe('rgb(128, 128, 128)');
    });

    it('does not go below 0% lightness', () => {
      const result = colorFilters.color_darken('#000000', 20);
      // Already black, should stay black
      expect(result).toBe('rgb(0, 0, 0)');
    });
  });

  describe('color_saturate', () => {
    it('increases saturation', () => {
      // Gray has 0 saturation, increasing it makes it more colorful
      const result = colorFilters.color_saturate('hsl(0, 50%, 50%)', 25);
      expect(result).toMatch(/rgb\(\d+,\s*\d+,\s*\d+\)/);
    });
  });

  describe('color_desaturate', () => {
    it('decreases saturation', () => {
      const result = colorFilters.color_desaturate('#ff0000', 100);
      // Fully desaturated red should be gray
      expect(result).toBe('rgb(128, 128, 128)');
    });
  });

  describe('color_brightness', () => {
    it('returns high brightness for white', () => {
      expect(colorFilters.color_brightness('#ffffff')).toBeGreaterThan(200);
    });

    it('returns 0 brightness for black', () => {
      expect(colorFilters.color_brightness('#000000')).toBe(0);
    });

    it('returns middle brightness for gray', () => {
      const brightness = colorFilters.color_brightness('#808080');
      expect(brightness).toBeGreaterThan(100);
      expect(brightness).toBeLessThan(150);
    });
  });

  describe('color_modify', () => {
    it('modifies alpha', () => {
      expect(colorFilters.color_modify('#ff0000', 'alpha', 0.5)).toBe('rgba(255, 0, 0, 0.5)');
    });

    it('modifies hue', () => {
      const result = colorFilters.color_modify('#ff0000', 'hue', 120);
      // Changing hue from red (0) to green (120)
      expect(result).toMatch(/rgb\(\d+,\s*\d+,\s*\d+\)/);
    });

    it('modifies saturation', () => {
      const result = colorFilters.color_modify('#ff0000', 'saturation', 50);
      expect(result).toMatch(/rgb\(\d+,\s*\d+,\s*\d+\)/);
    });

    it('modifies lightness', () => {
      const result = colorFilters.color_modify('#ff0000', 'lightness', 75);
      expect(result).toMatch(/rgb\(\d+,\s*\d+,\s*\d+\)/);
    });
  });

  describe('color_mix', () => {
    it('mixes two colors equally', () => {
      const result = colorFilters.color_mix('#ff0000', '#0000ff', 50);
      // 50/50 mix of red and blue should be purple-ish
      expect(result).toMatch(/rgb\(\d+,\s*\d+,\s*\d+\)/);
    });

    it('weights toward first color', () => {
      const result = colorFilters.color_mix('#ff0000', '#0000ff', 100);
      expect(result).toBe('rgb(255, 0, 0)');
    });

    it('weights toward second color', () => {
      const result = colorFilters.color_mix('#ff0000', '#0000ff', 0);
      expect(result).toBe('rgb(0, 0, 255)');
    });
  });

  describe('color_contrast', () => {
    it('returns black for light colors', () => {
      expect(colorFilters.color_contrast('#ffffff')).toBe('#000000');
      expect(colorFilters.color_contrast('#ffff00')).toBe('#000000');
    });

    it('returns white for dark colors', () => {
      expect(colorFilters.color_contrast('#000000')).toBe('#ffffff');
      expect(colorFilters.color_contrast('#000080')).toBe('#ffffff');
    });
  });

  describe('color_extract', () => {
    it('extracts red component', () => {
      expect(colorFilters.color_extract('#ff0000', 'red')).toBe(255);
      expect(colorFilters.color_extract('#000000', 'red')).toBe(0);
    });

    it('extracts green component', () => {
      expect(colorFilters.color_extract('#00ff00', 'green')).toBe(255);
    });

    it('extracts blue component', () => {
      expect(colorFilters.color_extract('#0000ff', 'blue')).toBe(255);
    });

    it('extracts alpha component', () => {
      expect(colorFilters.color_extract('#ff0000', 'alpha')).toBe(1);
      expect(colorFilters.color_extract('rgba(255, 0, 0, 0.5)', 'alpha')).toBe(0.5);
    });

    it('extracts hue', () => {
      expect(colorFilters.color_extract('#ff0000', 'hue')).toBe(0);
      expect(colorFilters.color_extract('#00ff00', 'hue')).toBe(120);
    });

    it('extracts saturation', () => {
      expect(colorFilters.color_extract('#ff0000', 'saturation')).toBe(100);
      expect(colorFilters.color_extract('#808080', 'saturation')).toBe(0);
    });

    it('extracts lightness', () => {
      expect(colorFilters.color_extract('#ffffff', 'lightness')).toBe(100);
      expect(colorFilters.color_extract('#000000', 'lightness')).toBe(0);
    });
  });
});
