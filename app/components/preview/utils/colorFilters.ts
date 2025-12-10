/**
 * Shopify Liquid Color Filter Implementations
 * Color manipulation and conversion filters for section preview rendering
 */

interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

interface HSL {
  h: number;
  s: number;
  l: number;
}

/**
 * Parses color string (hex/rgb/rgba/hsl/hsla) to RGBA object
 */
function parseColor(color: string): RGBA | null {
  if (!color || typeof color !== 'string') return null;
  const s = color.trim().toLowerCase();

  // Hex format: #rgb, #rrggbb, #rrggbbaa
  if (s.startsWith('#')) {
    const hex = s.slice(1);
    if (hex.length === 3) {
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16),
        a: 1,
      };
    }
    if (hex.length === 6) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
        a: 1,
      };
    }
    if (hex.length === 8) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
        a: parseInt(hex.slice(6, 8), 16) / 255,
      };
    }
  }

  // RGB(A) format: rgb(r, g, b) or rgba(r, g, b, a)
  const rgbMatch = s.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1], 10),
      g: parseInt(rgbMatch[2], 10),
      b: parseInt(rgbMatch[3], 10),
      a: rgbMatch[4] ? parseFloat(rgbMatch[4]) : 1,
    };
  }

  // HSL(A) format: hsl(h, s%, l%) or hsla(h, s%, l%, a)
  const hslMatch = s.match(/hsla?\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*(?:,\s*([\d.]+)\s*)?\)/);
  if (hslMatch) {
    const rgb = hslToRgb(parseInt(hslMatch[1], 10), parseInt(hslMatch[2], 10), parseInt(hslMatch[3], 10));
    return {
      ...rgb,
      a: hslMatch[4] ? parseFloat(hslMatch[4]) : 1,
    };
  }

  return null;
}

/**
 * Converts RGB to HSL
 */
function rgbToHsl(r: number, g: number, b: number): HSL {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Converts HSL to RGB
 */
function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h /= 360;
  s /= 100;
  l /= 100;
  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

/**
 * Clamps value between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// ============================================================================
// Color Filter Exports
// ============================================================================

export const colorFilters = {
  /** Converts color to RGB/RGBA format */
  color_to_rgb: (color: string): string => {
    const parsed = parseColor(color);
    if (!parsed) return color;
    return parsed.a < 1
      ? `rgba(${parsed.r}, ${parsed.g}, ${parsed.b}, ${parsed.a})`
      : `rgb(${parsed.r}, ${parsed.g}, ${parsed.b})`;
  },

  /** Converts color to HSL/HSLA format */
  color_to_hsl: (color: string): string => {
    const parsed = parseColor(color);
    if (!parsed) return color;
    const hsl = rgbToHsl(parsed.r, parsed.g, parsed.b);
    return parsed.a < 1
      ? `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${parsed.a})`
      : `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
  },

  /** Converts color to hex format */
  color_to_hex: (color: string): string => {
    const parsed = parseColor(color);
    if (!parsed) return color;
    const toHex = (n: number) => n.toString(16).padStart(2, '0');
    return `#${toHex(parsed.r)}${toHex(parsed.g)}${toHex(parsed.b)}`;
  },

  /** Lightens color by amount (0-100) */
  color_lighten: (color: string, amount: number): string => {
    const parsed = parseColor(color);
    if (!parsed) return color;
    const hsl = rgbToHsl(parsed.r, parsed.g, parsed.b);
    hsl.l = clamp(hsl.l + (Number(amount) || 0), 0, 100);
    const rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
    return parsed.a < 1
      ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${parsed.a})`
      : `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  },

  /** Darkens color by amount (0-100) */
  color_darken: (color: string, amount: number): string => {
    const parsed = parseColor(color);
    if (!parsed) return color;
    const hsl = rgbToHsl(parsed.r, parsed.g, parsed.b);
    hsl.l = clamp(hsl.l - (Number(amount) || 0), 0, 100);
    const rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
    return parsed.a < 1
      ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${parsed.a})`
      : `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  },

  /** Increases saturation by amount (0-100) */
  color_saturate: (color: string, amount: number): string => {
    const parsed = parseColor(color);
    if (!parsed) return color;
    const hsl = rgbToHsl(parsed.r, parsed.g, parsed.b);
    hsl.s = clamp(hsl.s + (Number(amount) || 0), 0, 100);
    const rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
    return parsed.a < 1
      ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${parsed.a})`
      : `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  },

  /** Decreases saturation by amount (0-100) */
  color_desaturate: (color: string, amount: number): string => {
    const parsed = parseColor(color);
    if (!parsed) return color;
    const hsl = rgbToHsl(parsed.r, parsed.g, parsed.b);
    hsl.s = clamp(hsl.s - (Number(amount) || 0), 0, 100);
    const rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
    return parsed.a < 1
      ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${parsed.a})`
      : `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  },

  /** Returns perceived brightness (0-255) */
  color_brightness: (color: string): number => {
    const parsed = parseColor(color);
    if (!parsed) return 0;
    // Perceived brightness formula (ITU-R BT.601)
    return Math.round((parsed.r * 299 + parsed.g * 587 + parsed.b * 114) / 1000);
  },

  /** Modifies a specific color attribute */
  color_modify: (color: string, attr: string, value: number): string => {
    const parsed = parseColor(color);
    if (!parsed) return color;
    const hsl = rgbToHsl(parsed.r, parsed.g, parsed.b);

    switch (attr) {
      case 'alpha':
        return `rgba(${parsed.r}, ${parsed.g}, ${parsed.b}, ${clamp(Number(value), 0, 1)})`;
      case 'hue':
        hsl.h = ((Number(value) % 360) + 360) % 360;
        break;
      case 'saturation':
        hsl.s = clamp(Number(value), 0, 100);
        break;
      case 'lightness':
        hsl.l = clamp(Number(value), 0, 100);
        break;
      default:
        return color;
    }

    const rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
    return parsed.a < 1
      ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${parsed.a})`
      : `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  },

  /** Mixes two colors with optional weight (0-100, default 50) */
  color_mix: (color1: string, color2: string, weight = 50): string => {
    const c1 = parseColor(color1);
    const c2 = parseColor(color2);
    if (!c1 || !c2) return color1;

    const w = clamp(Number(weight), 0, 100) / 100;
    const r = Math.round(c1.r * w + c2.r * (1 - w));
    const g = Math.round(c1.g * w + c2.g * (1 - w));
    const b = Math.round(c1.b * w + c2.b * (1 - w));
    const a = c1.a * w + c2.a * (1 - w);

    return a < 1 ? `rgba(${r}, ${g}, ${b}, ${a})` : `rgb(${r}, ${g}, ${b})`;
  },

  /** Returns contrasting color (black or white) based on brightness */
  color_contrast: (color: string): string => {
    const parsed = parseColor(color);
    if (!parsed) return '#000000';
    const brightness = (parsed.r * 299 + parsed.g * 587 + parsed.b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#ffffff';
  },

  /** Extracts a specific color component */
  color_extract: (color: string, component: string): number => {
    const parsed = parseColor(color);
    if (!parsed) return 0;

    switch (component) {
      case 'red':
        return parsed.r;
      case 'green':
        return parsed.g;
      case 'blue':
        return parsed.b;
      case 'alpha':
        return parsed.a;
      case 'hue': {
        const hsl = rgbToHsl(parsed.r, parsed.g, parsed.b);
        return hsl.h;
      }
      case 'saturation': {
        const hsl = rgbToHsl(parsed.r, parsed.g, parsed.b);
        return hsl.s;
      }
      case 'lightness': {
        const hsl = rgbToHsl(parsed.r, parsed.g, parsed.b);
        return hsl.l;
      }
      default:
        return 0;
    }
  },
};
