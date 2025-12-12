/**
 * Registry of web-safe fonts available in preview
 * Maps identifier → full font data
 */
import type { FontWithStack } from '../mockData/types';

export const WEB_SAFE_FONTS: Record<string, FontWithStack> = {
  'system-ui': {
    family: 'System UI',
    fallback_families: 'sans-serif',
    stack: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    style: 'normal',
    weight: 400
  },
  'arial': {
    family: 'Arial',
    fallback_families: 'sans-serif',
    stack: 'Arial, sans-serif',
    style: 'normal',
    weight: 400
  },
  'helvetica': {
    family: 'Helvetica',
    fallback_families: 'sans-serif',
    stack: 'Helvetica, Arial, sans-serif',
    style: 'normal',
    weight: 400
  },
  'georgia': {
    family: 'Georgia',
    fallback_families: 'serif',
    stack: 'Georgia, serif',
    style: 'normal',
    weight: 400
  },
  'times': {
    family: 'Times New Roman',
    fallback_families: 'serif',
    stack: '"Times New Roman", Times, serif',
    style: 'normal',
    weight: 400
  },
  'courier': {
    family: 'Courier New',
    fallback_families: 'monospace',
    stack: '"Courier New", Courier, monospace',
    style: 'normal',
    weight: 400
  },
  'verdana': {
    family: 'Verdana',
    fallback_families: 'sans-serif',
    stack: 'Verdana, Geneva, sans-serif',
    style: 'normal',
    weight: 400
  },
  'trebuchet': {
    family: 'Trebuchet MS',
    fallback_families: 'sans-serif',
    stack: '"Trebuchet MS", Helvetica, sans-serif',
    style: 'normal',
    weight: 400
  },
  'tahoma': {
    family: 'Tahoma',
    fallback_families: 'sans-serif',
    stack: 'Tahoma, Verdana, sans-serif',
    style: 'normal',
    weight: 400
  },
  'palatino': {
    family: 'Palatino',
    fallback_families: 'serif',
    stack: '"Palatino Linotype", Palatino, "Book Antiqua", serif',
    style: 'normal',
    weight: 400
  }
};

/** Get font data by identifier. Returns system-ui as fallback for unknown fonts */
export function getFontData(identifier: string): FontWithStack {
  return WEB_SAFE_FONTS[identifier] || WEB_SAFE_FONTS['system-ui'];
}

/** Check if a value is a known font identifier */
export function isFontIdentifier(value: string): boolean {
  return value in WEB_SAFE_FONTS;
}

/** Get all available font options for UI */
export function getFontOptions(): Array<{ value: string; label: string; stack: string }> {
  return Object.entries(WEB_SAFE_FONTS).map(([value, font]) => ({
    value,
    label: font.family,
    stack: font.stack
  }));
}
