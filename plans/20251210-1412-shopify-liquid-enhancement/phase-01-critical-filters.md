# Phase 1: Critical Filters

## Context

- **Parent Plan**: [plan.md](./plan.md)
- **Dependencies**: None
- **Related Docs**: [research/researcher-02-liquid-filters-tags.md](./research/researcher-02-liquid-filters-tags.md)

## Overview

| Field | Value |
|-------|-------|
| Date | 2025-12-10 |
| Description | Implement missing critical filters for section rendering |
| Priority | P0/P1 |
| Status | ✅ DONE |
| Completed | 2025-12-10 |
| Estimated Effort | 4-6 hours |
| Actual Effort | 8 hours |
| Review Status | ✅ APPROVED WITH RECOMMENDATIONS |
| Review Report | [code-reviewer-251210-phase1-filters.md](./reports/code-reviewer-251210-phase1-filters.md) |

## Key Insights

1. Array filters are most critical - used in every product grid/collection section
2. String filters heavily used in SEO, URLs, and content sanitization
3. Math filters needed for calculations (discounts, quantities)
4. Current color filters are stubs - need real implementation

## Requirements

### Array Filters (P0)

| Filter | Signature | Current | Action |
|--------|-----------|---------|--------|
| first | `array \| first` | Missing | Implement |
| last | `array \| last` | Missing | Implement |
| map | `array \| map: 'property'` | Missing | Implement |
| compact | `array \| compact` | Missing | Implement |
| concat | `array \| concat: array2` | Missing | Implement |
| reverse | `array \| reverse` | Missing | Implement |
| sort | `array \| sort: 'property'` | Missing | Implement |
| sort_natural | `array \| sort_natural` | Missing | Implement |
| uniq | `array \| uniq` | Missing | Implement |
| find | `array \| find: 'prop', value` | Missing | Implement |
| reject | `array \| reject: 'prop', value` | Missing | Implement |
| size | `array \| size` | Built-in | Verify |

### String Filters (P1)

| Filter | Signature | Current | Action |
|--------|-----------|---------|--------|
| escape | `str \| escape` | Built-in | Verify |
| escape_once | `str \| escape_once` | Missing | Implement |
| newline_to_br | `str \| newline_to_br` | Missing | Implement |
| strip | `str \| strip` | Built-in | Verify |
| strip_html | `str \| strip_html` | Missing | Implement |
| strip_newlines | `str \| strip_newlines` | Missing | Implement |
| url_encode | `str \| url_encode` | Missing | Implement |
| url_decode | `str \| url_decode` | Missing | Implement |
| base64_encode | `str \| base64_encode` | Missing | Implement |
| base64_decode | `str \| base64_decode` | Missing | Implement |
| md5 | `str \| md5` | Missing | Implement |
| sha256 | `str \| sha256` | Missing | Implement |
| hmac_sha256 | `str \| hmac_sha256: secret` | Missing | Implement |
| remove_first | `str \| remove_first: 'sub'` | Missing | Implement |
| remove_last | `str \| remove_last: 'sub'` | Missing | Implement |
| replace_first | `str \| replace_first: 'old', 'new'` | Missing | Implement |
| replace_last | `str \| replace_last: 'old', 'new'` | Missing | Implement |
| slice | `str \| slice: start, length` | Missing | Implement |
| camelize | `str \| camelize` | Missing | Implement |

### Math Filters (P1)

| Filter | Signature | Current | Action |
|--------|-----------|---------|--------|
| abs | `num \| abs` | Missing | Implement |
| at_least | `num \| at_least: min` | Missing | Implement |
| at_most | `num \| at_most: max` | Missing | Implement |
| ceil | `num \| ceil` | Missing | Implement |
| floor | `num \| floor` | Missing | Implement |
| round | `num \| round: precision` | Missing | Implement |
| plus | `num \| plus: addend` | Missing | Implement |
| minus | `num \| minus: subtrahend` | Missing | Implement |

### Color Filters (P2 - Fix Stubs)

| Filter | Current | Action |
|--------|---------|--------|
| color_to_rgb | Stub (passthrough) | Real implementation |
| color_to_hsl | Stub (passthrough) | Real implementation |
| color_modify | Stub (passthrough) | Real implementation |
| color_lighten | Stub (passthrough) | Real implementation |
| color_darken | Stub (passthrough) | Real implementation |
| color_brightness | Missing | Implement |
| color_contrast | Missing | Implement |
| color_mix | Missing | Implement |
| color_saturate | Missing | Implement |
| color_desaturate | Missing | Implement |

## Related Code Files

- `app/components/preview/hooks/useLiquidRenderer.ts` - Main filter registration

## Implementation Steps

### Step 1: Create Filter Utilities Module

Create `app/components/preview/utils/liquidFilters.ts`:

```typescript
// Array filter implementations
export const arrayFilters = {
  first: <T>(arr: T[]): T | undefined => arr?.[0],
  last: <T>(arr: T[]): T | undefined => arr?.[arr?.length - 1],
  map: <T>(arr: T[], key: string): unknown[] => {
    if (!Array.isArray(arr)) return [];
    return arr.map(item => {
      if (typeof item === 'object' && item !== null) {
        return (item as Record<string, unknown>)[key];
      }
      return undefined;
    });
  },
  compact: <T>(arr: T[]): T[] => arr?.filter(item => item != null) ?? [],
  concat: <T>(arr1: T[], arr2: T[]): T[] => [...(arr1 ?? []), ...(arr2 ?? [])],
  reverse: <T>(arr: T[]): T[] => [...(arr ?? [])].reverse(),
  sort: <T>(arr: T[], key?: string): T[] => {
    if (!Array.isArray(arr)) return [];
    const copy = [...arr];
    if (key) {
      return copy.sort((a, b) => {
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
  sort_natural: <T>(arr: T[], key?: string): T[] => {
    // Case-insensitive natural sort
    if (!Array.isArray(arr)) return [];
    const copy = [...arr];
    return copy.sort((a, b) => {
      const aVal = key ? String((a as Record<string, unknown>)[key]) : String(a);
      const bVal = key ? String((b as Record<string, unknown>)[key]) : String(b);
      return aVal.toLowerCase().localeCompare(bVal.toLowerCase());
    });
  },
  uniq: <T>(arr: T[]): T[] => [...new Set(arr ?? [])],
  find: <T>(arr: T[], key: string, value: unknown): T | undefined => {
    if (!Array.isArray(arr)) return undefined;
    return arr.find(item => (item as Record<string, unknown>)[key] === value);
  },
  reject: <T>(arr: T[], key: string, value: unknown): T[] => {
    if (!Array.isArray(arr)) return [];
    return arr.filter(item => (item as Record<string, unknown>)[key] !== value);
  }
};

// String filter implementations
export const stringFilters = {
  escape_once: (str: string): string => {
    // Escape HTML but don't double-escape
    return String(str ?? '')
      .replace(/&(?!amp;|lt;|gt;|quot;|#)/g, '&amp;')
      .replace(/<(?![a-z/])/gi, '&lt;')
      .replace(/(?<![a-z"'])>/gi, '&gt;');
  },
  newline_to_br: (str: string): string => String(str ?? '').replace(/\n/g, '<br>'),
  strip_html: (str: string): string => String(str ?? '').replace(/<[^>]*>/g, ''),
  strip_newlines: (str: string): string => String(str ?? '').replace(/[\r\n]+/g, ''),
  url_encode: (str: string): string => encodeURIComponent(String(str ?? '')),
  url_decode: (str: string): string => decodeURIComponent(String(str ?? '')),
  base64_encode: (str: string): string => btoa(String(str ?? '')),
  base64_decode: (str: string): string => atob(String(str ?? '')),
  md5: (str: string): string => `[md5:${str}]`, // Placeholder - needs crypto
  sha256: (str: string): string => `[sha256:${str}]`, // Placeholder
  hmac_sha256: (str: string, _secret: string): string => `[hmac:${str}]`,
  remove_first: (str: string, sub: string): string => {
    const s = String(str ?? '');
    const idx = s.indexOf(sub);
    return idx === -1 ? s : s.slice(0, idx) + s.slice(idx + sub.length);
  },
  remove_last: (str: string, sub: string): string => {
    const s = String(str ?? '');
    const idx = s.lastIndexOf(sub);
    return idx === -1 ? s : s.slice(0, idx) + s.slice(idx + sub.length);
  },
  replace_first: (str: string, old: string, replacement: string): string => {
    const s = String(str ?? '');
    const idx = s.indexOf(old);
    return idx === -1 ? s : s.slice(0, idx) + replacement + s.slice(idx + old.length);
  },
  replace_last: (str: string, old: string, replacement: string): string => {
    const s = String(str ?? '');
    const idx = s.lastIndexOf(old);
    return idx === -1 ? s : s.slice(0, idx) + replacement + s.slice(idx + old.length);
  },
  slice: (str: string, start: number, length?: number): string => {
    const s = String(str ?? '');
    return length !== undefined ? s.slice(start, start + length) : s.slice(start);
  },
  camelize: (str: string): string => {
    return String(str ?? '')
      .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''));
  }
};

// Math filter implementations
export const mathFilters = {
  abs: (num: number): number => Math.abs(Number(num) || 0),
  at_least: (num: number, min: number): number => Math.max(Number(num) || 0, min),
  at_most: (num: number, max: number): number => Math.min(Number(num) || 0, max),
  ceil: (num: number): number => Math.ceil(Number(num) || 0),
  floor: (num: number): number => Math.floor(Number(num) || 0),
  round: (num: number, precision = 0): number => {
    const factor = Math.pow(10, precision);
    return Math.round((Number(num) || 0) * factor) / factor;
  },
  plus: (num: number, addend: number): number => (Number(num) || 0) + (Number(addend) || 0),
  minus: (num: number, sub: number): number => (Number(num) || 0) - (Number(sub) || 0)
};
```

### Step 2: Create Color Utilities Module

Create `app/components/preview/utils/colorFilters.ts`:

```typescript
// Parse hex/rgb/hsl color to { r, g, b, a }
function parseColor(color: string): { r: number; g: number; b: number; a: number } | null {
  if (!color) return null;
  const s = color.trim();

  // Hex format
  if (s.startsWith('#')) {
    const hex = s.slice(1);
    if (hex.length === 3) {
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16),
        a: 1
      };
    }
    if (hex.length === 6 || hex.length === 8) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
        a: hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1
      };
    }
  }

  // RGB(A) format
  const rgbMatch = s.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1], 10),
      g: parseInt(rgbMatch[2], 10),
      b: parseInt(rgbMatch[3], 10),
      a: rgbMatch[4] ? parseFloat(rgbMatch[4]) : 1
    };
  }

  return null;
}

// Convert RGB to HSL
function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

// Convert HSL to RGB
function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h /= 360; s /= 100; l /= 100;
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

export const colorFilters = {
  color_to_rgb: (color: string): string => {
    const parsed = parseColor(color);
    if (!parsed) return color;
    return parsed.a < 1
      ? `rgba(${parsed.r}, ${parsed.g}, ${parsed.b}, ${parsed.a})`
      : `rgb(${parsed.r}, ${parsed.g}, ${parsed.b})`;
  },

  color_to_hsl: (color: string): string => {
    const parsed = parseColor(color);
    if (!parsed) return color;
    const hsl = rgbToHsl(parsed.r, parsed.g, parsed.b);
    return parsed.a < 1
      ? `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${parsed.a})`
      : `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
  },

  color_lighten: (color: string, amount: number): string => {
    const parsed = parseColor(color);
    if (!parsed) return color;
    const hsl = rgbToHsl(parsed.r, parsed.g, parsed.b);
    hsl.l = Math.min(100, hsl.l + amount);
    const rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
    return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  },

  color_darken: (color: string, amount: number): string => {
    const parsed = parseColor(color);
    if (!parsed) return color;
    const hsl = rgbToHsl(parsed.r, parsed.g, parsed.b);
    hsl.l = Math.max(0, hsl.l - amount);
    const rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
    return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  },

  color_saturate: (color: string, amount: number): string => {
    const parsed = parseColor(color);
    if (!parsed) return color;
    const hsl = rgbToHsl(parsed.r, parsed.g, parsed.b);
    hsl.s = Math.min(100, hsl.s + amount);
    const rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
    return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  },

  color_desaturate: (color: string, amount: number): string => {
    const parsed = parseColor(color);
    if (!parsed) return color;
    const hsl = rgbToHsl(parsed.r, parsed.g, parsed.b);
    hsl.s = Math.max(0, hsl.s - amount);
    const rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
    return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  },

  color_brightness: (color: string): number => {
    const parsed = parseColor(color);
    if (!parsed) return 0;
    // Perceived brightness formula
    return Math.round((parsed.r * 299 + parsed.g * 587 + parsed.b * 114) / 1000);
  },

  color_modify: (color: string, attr: string, value: number): string => {
    const parsed = parseColor(color);
    if (!parsed) return color;
    const hsl = rgbToHsl(parsed.r, parsed.g, parsed.b);

    switch (attr) {
      case 'alpha': return `rgba(${parsed.r}, ${parsed.g}, ${parsed.b}, ${value})`;
      case 'hue': hsl.h = value; break;
      case 'saturation': hsl.s = value; break;
      case 'lightness': hsl.l = value; break;
    }

    const rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
    return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  },

  color_mix: (color1: string, color2: string, weight = 50): string => {
    const c1 = parseColor(color1);
    const c2 = parseColor(color2);
    if (!c1 || !c2) return color1;

    const w = weight / 100;
    const r = Math.round(c1.r * w + c2.r * (1 - w));
    const g = Math.round(c1.g * w + c2.g * (1 - w));
    const b = Math.round(c1.b * w + c2.b * (1 - w));

    return `rgb(${r}, ${g}, ${b})`;
  },

  color_contrast: (color: string): string => {
    const parsed = parseColor(color);
    if (!parsed) return '#000000';
    const brightness = (parsed.r * 299 + parsed.g * 587 + parsed.b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#ffffff';
  }
};
```

### Step 3: Register Filters in useLiquidRenderer

Update `app/components/preview/hooks/useLiquidRenderer.ts`:

```typescript
// Add imports at top
import { arrayFilters, stringFilters, mathFilters } from '../utils/liquidFilters';
import { colorFilters } from '../utils/colorFilters';

// In useEffect, after existing filter registrations:

// Array filters
Object.entries(arrayFilters).forEach(([name, fn]) => {
  engine.registerFilter(name, fn);
});

// String filters
Object.entries(stringFilters).forEach(([name, fn]) => {
  engine.registerFilter(name, fn);
});

// Math filters
Object.entries(mathFilters).forEach(([name, fn]) => {
  engine.registerFilter(name, fn);
});

// Color filters (replace existing stubs)
Object.entries(colorFilters).forEach(([name, fn]) => {
  engine.registerFilter(name, fn);
});
```

### Step 4: Add Unit Tests

Create `app/components/preview/__tests__/liquidFilters.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { arrayFilters, stringFilters, mathFilters } from '../utils/liquidFilters';
import { colorFilters } from '../utils/colorFilters';

describe('Array Filters', () => {
  it('first returns first element', () => {
    expect(arrayFilters.first([1, 2, 3])).toBe(1);
    expect(arrayFilters.first([])).toBeUndefined();
  });

  it('map extracts property values', () => {
    const arr = [{ title: 'A' }, { title: 'B' }];
    expect(arrayFilters.map(arr, 'title')).toEqual(['A', 'B']);
  });

  it('sort_natural ignores case', () => {
    expect(arrayFilters.sort_natural(['Banana', 'apple', 'Cherry']))
      .toEqual(['apple', 'Banana', 'Cherry']);
  });
});

describe('String Filters', () => {
  it('strip_html removes tags', () => {
    expect(stringFilters.strip_html('<p>Hello <b>World</b></p>')).toBe('Hello World');
  });

  it('camelize converts to camelCase', () => {
    expect(stringFilters.camelize('hello-world')).toBe('helloWorld');
    expect(stringFilters.camelize('hello_world')).toBe('helloWorld');
  });
});

describe('Math Filters', () => {
  it('round with precision', () => {
    expect(mathFilters.round(3.14159, 2)).toBe(3.14);
  });

  it('at_least enforces minimum', () => {
    expect(mathFilters.at_least(5, 10)).toBe(10);
    expect(mathFilters.at_least(15, 10)).toBe(15);
  });
});

describe('Color Filters', () => {
  it('color_to_rgb converts hex', () => {
    expect(colorFilters.color_to_rgb('#ff0000')).toBe('rgb(255, 0, 0)');
  });

  it('color_brightness calculates correctly', () => {
    expect(colorFilters.color_brightness('#ffffff')).toBeGreaterThan(200);
    expect(colorFilters.color_brightness('#000000')).toBe(0);
  });
});
```

## Todo List

- [x] Create `liquidFilters.ts` utility module (DONE 2025-12-10)
- [x] Create `colorFilters.ts` utility module (DONE 2025-12-10)
- [x] Update `useLiquidRenderer.ts` with new filter registrations (DONE 2025-12-10)
- [x] Write unit tests for all new filters - 115 tests passing (DONE 2025-12-10)
- [x] Address HIGH priority security findings from code review (DONE 2025-12-10)
  - [x] Fix Unicode base64 encoding
  - [x] Add input size validation (DoS protection)
  - [x] Improve `escape_once` XSS handling
  - [x] Add null checks to array filters
- [x] Test with real Dawn theme section templates (DONE 2025-12-10)
- [x] Document edge cases and limitations (DONE 2025-12-10)

## Success Criteria

1. All listed filters implemented and registered
2. Unit tests pass with >90% coverage
3. Existing section previews still work
4. No performance regression (render time <100ms)
5. Dawn theme test sections render correctly

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Breaking existing filters | Low | High | Unit tests, gradual rollout |
| Performance with complex arrays | Medium | Medium | Lazy evaluation, size limits |
| Color parsing edge cases | Medium | Low | Fallback to original value |

---

**Estimated Completion**: 4-6 hours
**Next Phase**: [phase-02-missing-objects.md](./phase-02-missing-objects.md)
