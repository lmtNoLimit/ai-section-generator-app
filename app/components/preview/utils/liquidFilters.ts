/**
 * Shopify Liquid Filter Implementations
 * Array, String, and Math filters for section preview rendering
 */

// ============================================================================
// Input Validation Constants
// ============================================================================

const MAX_ARRAY_SIZE = 10000;
const MAX_STRING_LENGTH = 100000;

/** Validates and truncates arrays to prevent DoS */
function validateArraySize<T>(arr: T[]): T[] {
  if (!Array.isArray(arr)) return [];
  if (arr.length > MAX_ARRAY_SIZE) {
    console.warn(`Liquid filter: Array exceeds max size (${MAX_ARRAY_SIZE}), truncating`);
    return arr.slice(0, MAX_ARRAY_SIZE);
  }
  return arr;
}

/** Validates and truncates strings to prevent DoS */
function validateStringLength(str: unknown): string {
  const s = String(str ?? '');
  if (s.length > MAX_STRING_LENGTH) {
    console.warn(`Liquid filter: String exceeds max length (${MAX_STRING_LENGTH}), truncating`);
    return s.slice(0, MAX_STRING_LENGTH);
  }
  return s;
}

// ============================================================================
// Array Filters
// ============================================================================

export const arrayFilters = {
  /** Returns first element of array */
  first: <T>(arr: T[]): T | undefined => arr?.[0],

  /** Returns last element of array */
  last: <T>(arr: T[]): T | undefined => arr?.[arr?.length - 1],

  /** Extracts property values from array of objects */
  map: <T>(arr: T[], key: string): unknown[] => {
    const validated = validateArraySize(arr);
    return validated.map((item) => {
      if (item != null && typeof item === 'object') {
        return (item as Record<string, unknown>)[key];
      }
      return undefined;
    });
  },

  /** Removes null/undefined values from array */
  compact: <T>(arr: T[]): T[] => arr?.filter((item) => item != null) ?? [],

  /** Concatenates two arrays */
  concat: <T>(arr1: T[], arr2: T[]): T[] => [...(arr1 ?? []), ...(arr2 ?? [])],

  /** Reverses array order */
  reverse: <T>(arr: T[]): T[] => [...(arr ?? [])].reverse(),

  /** Sorts array by optional property key */
  sort: <T>(arr: T[], key?: string): T[] => {
    const validated = validateArraySize(arr);
    const copy = [...validated];
    if (key) {
      return copy.sort((a, b) => {
        if (a == null || b == null) return 0;
        const aVal = (a as Record<string, unknown>)[key];
        const bVal = (b as Record<string, unknown>)[key];
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return aVal.localeCompare(bVal);
        }
        return Number(aVal) - Number(bVal);
      });
    }
    return copy.sort();
  },

  /** Case-insensitive natural sort */
  sort_natural: <T>(arr: T[], key?: string): T[] => {
    const validated = validateArraySize(arr);
    const copy = [...validated];
    return copy.sort((a, b) => {
      const aVal = key && a != null ? String((a as Record<string, unknown>)[key]) : String(a ?? '');
      const bVal = key && b != null ? String((b as Record<string, unknown>)[key]) : String(b ?? '');
      return aVal.toLowerCase().localeCompare(bVal.toLowerCase());
    });
  },

  /** Returns unique values */
  uniq: <T>(arr: T[]): T[] => [...new Set(arr ?? [])],

  /** Finds first item matching property value */
  find: <T>(arr: T[], key: string, value: unknown): T | undefined => {
    const validated = validateArraySize(arr);
    return validated.find((item) => {
      if (item == null || typeof item !== 'object') return false;
      return (item as Record<string, unknown>)[key] === value;
    });
  },

  /** Filters out items matching property value */
  reject: <T>(arr: T[], key: string, value: unknown): T[] => {
    const validated = validateArraySize(arr);
    return validated.filter((item) => {
      if (item == null || typeof item !== 'object') return true;
      return (item as Record<string, unknown>)[key] !== value;
    });
  },
};

// ============================================================================
// String Filters
// ============================================================================

export const stringFilters = {
  /** Escapes HTML but doesn't double-escape already-escaped entities */
  escape_once: (str: string): string => {
    const s = validateStringLength(str);
    // Use lookahead to only escape unescaped characters (don't double-escape)
    return s
      .replace(/&(?!(amp|lt|gt|quot|#39|#\d+);)/gi, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  /** Converts newlines to <br> tags */
  newline_to_br: (str: string): string => String(str ?? '').replace(/\n/g, '<br>'),

  /** Strips all HTML tags */
  strip_html: (str: string): string => {
    const s = validateStringLength(str);
    // Use limited regex to prevent catastrophic backtracking
    return s.replace(/<[^>]{0,1000}>/g, '');
  },

  /** Removes all newline characters */
  strip_newlines: (str: string): string => String(str ?? '').replace(/[\r\n]+/g, ''),

  /** URL encodes a string */
  url_encode: (str: string): string => encodeURIComponent(String(str ?? '')),

  /** URL decodes a string */
  url_decode: (str: string): string => {
    try {
      return decodeURIComponent(String(str ?? ''));
    } catch {
      return String(str ?? '');
    }
  },

  /** Base64 encodes a string (handles Unicode via TextEncoder) */
  base64_encode: (str: string): string => {
    try {
      const s = validateStringLength(str);
      // Use TextEncoder for proper UTF-8 handling (supports Unicode/emoji)
      const bytes = new TextEncoder().encode(s);
      const binString = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join('');
      return btoa(binString);
    } catch {
      return String(str ?? '');
    }
  },

  /** Base64 decodes a string (handles Unicode via TextDecoder) */
  base64_decode: (str: string): string => {
    try {
      const s = String(str ?? '');
      const binString = atob(s);
      const bytes = Uint8Array.from(binString, (char) => char.codePointAt(0) ?? 0);
      return new TextDecoder().decode(bytes);
    } catch {
      return String(str ?? '');
    }
  },

  /** MD5 hash placeholder - returns mock hash for preview */
  md5: (str: string): string => {
    // Simple hash for preview purposes (not cryptographically secure)
    const s = String(str ?? '');
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
      const char = s.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(32, '0').slice(0, 32);
  },

  /** SHA256 hash placeholder - returns mock hash for preview */
  sha256: (str: string): string => {
    const s = String(str ?? '');
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
      const char = s.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(64, '0').slice(0, 64);
  },

  /** HMAC SHA256 placeholder */
  hmac_sha256: (str: string, _secret: string): string => {
    return stringFilters.sha256(str);
  },

  /** Removes first occurrence of substring */
  remove_first: (str: string, sub: string): string => {
    const s = String(str ?? '');
    const idx = s.indexOf(sub);
    return idx === -1 ? s : s.slice(0, idx) + s.slice(idx + sub.length);
  },

  /** Removes last occurrence of substring */
  remove_last: (str: string, sub: string): string => {
    const s = String(str ?? '');
    const idx = s.lastIndexOf(sub);
    return idx === -1 ? s : s.slice(0, idx) + s.slice(idx + sub.length);
  },

  /** Replaces first occurrence */
  replace_first: (str: string, old: string, replacement: string): string => {
    const s = String(str ?? '');
    const idx = s.indexOf(old);
    return idx === -1 ? s : s.slice(0, idx) + replacement + s.slice(idx + old.length);
  },

  /** Replaces last occurrence */
  replace_last: (str: string, old: string, replacement: string): string => {
    const s = String(str ?? '');
    const idx = s.lastIndexOf(old);
    return idx === -1 ? s : s.slice(0, idx) + replacement + s.slice(idx + old.length);
  },

  /** Extracts substring from start position with optional length */
  slice: (str: string, start: number, length?: number): string => {
    const s = String(str ?? '');
    // Handle negative start index (from end)
    const startIdx = start < 0 ? Math.max(0, s.length + start) : start;
    return length !== undefined ? s.slice(startIdx, startIdx + length) : s.slice(startIdx);
  },

  /** Converts to camelCase */
  camelize: (str: string): string => {
    return String(str ?? '').replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''));
  },
};

// ============================================================================
// Math Filters
// ============================================================================

export const mathFilters = {
  /** Returns absolute value */
  abs: (num: number): number => Math.abs(Number(num) || 0),

  /** Returns maximum of num and min */
  at_least: (num: number, min: number): number => Math.max(Number(num) || 0, Number(min) || 0),

  /** Returns minimum of num and max */
  at_most: (num: number, max: number): number => Math.min(Number(num) || 0, Number(max) || 0),

  /** Rounds up to nearest integer */
  ceil: (num: number): number => Math.ceil(Number(num) || 0),

  /** Rounds down to nearest integer */
  floor: (num: number): number => Math.floor(Number(num) || 0),

  /** Rounds to specified precision */
  round: (num: number, precision = 0): number => {
    const factor = Math.pow(10, Number(precision) || 0);
    return Math.round((Number(num) || 0) * factor) / factor;
  },

  /** Adds two numbers */
  plus: (num: number, addend: number): number => (Number(num) || 0) + (Number(addend) || 0),

  /** Subtracts second number from first */
  minus: (num: number, sub: number): number => (Number(num) || 0) - (Number(sub) || 0),
};
