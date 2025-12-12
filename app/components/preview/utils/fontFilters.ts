/**
 * Shopify Liquid Font Filter Implementations
 * Font manipulation and CSS generation for section preview
 * Supports both FontDrop objects and legacy plain objects
 */

import { FontDrop } from '../drops/FontDrop';
import type { FontWithStack } from '../mockData/types';

interface FontObject {
  family?: string;
  fallback_families?: string;
  weight?: number | string;
  style?: string;
  variants?: Array<{ weight: number; style: string }>;
  src?: string;
  format?: string;
  stack?: string;
}

/** Check if value is a FontDrop instance */
function isFontDrop(value: unknown): value is FontDrop {
  return value instanceof FontDrop;
}

export const fontFilters = {
  /**
   * Generates @font-face CSS declaration
   * For web-safe fonts, returns comment (no @font-face needed)
   * For custom fonts, generates proper @font-face with src
   */
  font_face: (font: unknown): string => {
    if (!font) return '';

    if (isFontDrop(font)) {
      // Web-safe font - no @font-face needed
      if (!font.src) {
        return `/* ${font.family} is a web-safe font */`;
      }
      // Custom font with src
      return `@font-face {
  font-family: "${font.family}";
  src: url("${font.src}") format("${font.format || 'woff2'}");
  font-weight: ${font.weight};
  font-style: ${font.style};
  font-display: swap;
}`;
    }

    // Legacy object support
    const fontObj = font as FontObject;
    const family = fontObj.family || 'sans-serif';
    const weight = fontObj.weight || 400;
    const style = fontObj.style || 'normal';

    // Check if it has a source URL
    if (!fontObj.src) {
      return `@font-face {
  font-family: "${family}";
  font-weight: ${weight};
  font-style: ${style};
  font-display: swap;
  src: local("${family}");
}`;
    }

    return `@font-face {
  font-family: "${family}";
  src: url("${fontObj.src}") format("${fontObj.format || 'woff2'}");
  font-weight: ${weight};
  font-style: ${style};
  font-display: swap;
}`;
  },

  /** Returns URL to font file */
  font_url: (font: unknown, format?: string): string => {
    if (!font) return '';

    if (isFontDrop(font)) {
      return font.src || '';
    }

    const fontObj = font as FontObject;
    if (fontObj.src) return fontObj.src;

    // Generate placeholder URL for fonts without src
    const family = (fontObj.family || 'arial').toLowerCase().replace(/\s+/g, '-');
    const ext = format || 'woff2';
    return `https://fonts.shopifycdn.com/preview/${family}.${ext}`;
  },

  /** Modifies font properties (weight, style) */
  font_modify: (font: unknown, attribute: string, value: string | number): FontDrop | FontObject => {
    if (!font) return { family: 'sans-serif' };

    if (isFontDrop(font)) {
      const data = font.getFontData();

      switch (attribute) {
        case 'weight':
          data.weight = typeof value === 'string'
            ? value === 'bold' ? 700
            : value === 'normal' ? 400
            : parseInt(value)
            : value;
          break;
        case 'style':
          data.style = value as 'normal' | 'italic';
          break;
      }

      return new FontDrop(data as FontWithStack);
    }

    // Legacy object support
    const fontObj = { ...(font as FontObject) };

    switch (attribute) {
      case 'weight':
        fontObj.weight = typeof value === 'string'
          ? value === 'bold' ? 700
          : value === 'normal' ? 400
          : parseInt(value)
          : value;
        break;
      case 'style':
        fontObj.style = String(value);
        break;
    }

    return fontObj;
  },
};
