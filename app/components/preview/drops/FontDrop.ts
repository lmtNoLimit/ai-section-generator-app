import { ShopifyDrop } from './base/ShopifyDrop';
import type { FontWithStack } from '../mockData/types';

/**
 * Drop class for font objects
 * Provides Liquid-compatible access to font properties
 *
 * Usage in Liquid:
 * {{ section.settings.heading_font.family }} → 'Georgia'
 * {{ section.settings.heading_font }} → 'Georgia, serif' (toString)
 */
export class FontDrop extends ShopifyDrop {
  private font: FontWithStack;

  constructor(font: FontWithStack) {
    super();
    this.font = font;
  }

  /** Font family name (e.g., 'Georgia') */
  get family(): string {
    return this.font.family;
  }

  /** Fallback font families (e.g., 'serif') */
  get fallback_families(): string {
    return this.font.fallback_families;
  }

  /** Full CSS font-family stack */
  get stack(): string {
    return this.font.stack;
  }

  /** Font style ('normal' or 'italic') */
  get style(): string {
    return this.font.style;
  }

  /** Font weight (400, 700, etc.) */
  get weight(): number {
    return this.font.weight;
  }

  /** Font source URL (for @font-face) - empty for web-safe fonts */
  get src(): string {
    return this.font.src || '';
  }

  /** Font format (woff2, woff, etc.) */
  get format(): string {
    return this.font.format || '';
  }

  /** String conversion returns CSS-ready font stack */
  valueOf(): string {
    return this.font.stack;
  }

  toString(): string {
    return this.font.stack;
  }

  /** Liquid output method - returns font stack for direct use in CSS */
  toLiquidOutput(): string {
    return this.font.stack;
  }

  /** LiquidJS property access */
  liquidMethodMissing(key: string): unknown {
    switch (key) {
      case 'family':
        return this.family;
      case 'fallback_families':
        return this.fallback_families;
      case 'stack':
        return this.stack;
      case 'style':
        return this.style;
      case 'weight':
        return this.weight;
      case 'src':
        return this.src;
      case 'format':
        return this.format;
      default:
        return undefined;
    }
  }

  /** Get raw font data for filter operations */
  getFontData(): FontWithStack {
    return { ...this.font };
  }
}
