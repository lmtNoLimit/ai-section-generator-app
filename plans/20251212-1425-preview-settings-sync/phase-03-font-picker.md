# Phase 03: Font Picker Data Loading

**Priority**: MEDIUM
**Status**: Pending
**Estimated Effort**: 2-3 hours

---

## Context

The font picker UI component (`FontPickerSetting.tsx`) exists and allows users to select from web-safe fonts. However, the selected font value doesn't affect the actual rendered typography in the preview iframe.

**Current Flow**:
```
FontPickerSetting renders <s-select> with font options
        ↓
User selects 'georgia' → onChange('georgia')
        ↓
settingsValues['heading_font'] = 'georgia'
        ↓
Template: {{ section.settings.heading_font }} → 'georgia'
        ↓
CSS: font-family: {{ section.settings.heading_font }} → 'georgia'
        ↓
Preview renders 'georgia' as plain text, not as font-family value
```

**Gap**: The font value is passed as a string identifier ('georgia'), but templates need the full font stack ('Georgia, serif'). Additionally, for Google Fonts (Shopify default), font CSS must be loaded.

---

## Overview

Enable font picker selections to affect preview typography:
1. Map font identifiers to CSS font stacks
2. Create font object with metadata (family, stack, weight, style)
3. Provide font loading mechanism for Google Fonts (future)
4. Ensure `{{ settings.heading_font }}` outputs usable CSS value

---

## Requirements

### Functional Requirements
- F1: Font picker values must be usable in CSS `font-family` property
- F2: Web-safe fonts render immediately (no loading)
- F3: Font object should have `.family`, `.stack`, `.weight` properties
- F4: Filters like `font_face` work with font objects

### Non-Functional Requirements
- N1: No external network requests for web-safe fonts
- N2: Preview renders fonts without flash of unstyled text (FOUT)

---

## Architecture

### Current Implementation

**`FontPickerSetting.tsx`**:
```typescript
const FONT_OPTIONS = [
  { value: 'system-ui', label: 'System UI', stack: 'system-ui, sans-serif' },
  { value: 'georgia', label: 'Georgia', stack: 'Georgia, serif' },
  // ... more fonts
];

// Stores just the identifier: 'georgia'
onChange(target.value);
```

**`fontFilters.ts`**:
```typescript
export const fontFilters = {
  font_face: (font, fallback) => { /* expects font object with url, format */ },
  font_url: (font) => { /* expects font object with url */ },
  font_modify: (font, size, weight, style) => { /* returns modified font object */ }
};
```

### Problem: Mismatch Between UI and Renderer

The UI stores a simple identifier ('georgia'), but:
- Templates need CSS-ready values for `font-family`
- `font_face` filter expects object with `url`, `format`
- No font metadata (weight, style) is preserved

### Proposed Solution

1. **Create FontDrop class** that wraps font data with Liquid-accessible properties
2. **Store full font object** instead of identifier in settings
3. **Map identifiers to font objects** on selection
4. **Inject font CSS** into preview iframe when custom fonts selected

---

## Implementation Steps

### Step 1: Define font data types

**File**: `app/components/preview/mockData/types.ts`

**Add** font types:

```typescript
/**
 * Font data structure for Shopify font_picker settings
 * Matches Shopify font object structure
 */
export interface MockFont {
  family: string;           // e.g., 'Georgia'
  fallback_families: string; // e.g., 'serif'
  style: 'normal' | 'italic';
  weight: number;           // e.g., 400, 700
  // For Google Fonts (future)
  src?: string;             // URL to font file
  format?: string;          // 'woff2', 'woff', etc.
}

/**
 * Font with computed stack for CSS usage
 */
export interface FontWithStack extends MockFont {
  stack: string;            // Full CSS font-family value
}
```

### Step 2: Create FontDrop class

**File**: `app/components/preview/drops/FontDrop.ts` (new file)

```typescript
import { ShopifyDrop } from './base/ShopifyDrop';
import type { MockFont, FontWithStack } from '../mockData/types';

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

  /**
   * Font family name (e.g., 'Georgia')
   */
  get family(): string {
    return this.font.family;
  }

  /**
   * Fallback font families (e.g., 'serif')
   */
  get fallback_families(): string {
    return this.font.fallback_families;
  }

  /**
   * Full CSS font-family stack
   */
  get stack(): string {
    return this.font.stack;
  }

  /**
   * Font style ('normal' or 'italic')
   */
  get style(): string {
    return this.font.style;
  }

  /**
   * Font weight (400, 700, etc.)
   */
  get weight(): number {
    return this.font.weight;
  }

  /**
   * Font source URL (for @font-face)
   * Returns empty string for web-safe fonts
   */
  get src(): string {
    return this.font.src || '';
  }

  /**
   * Font format (woff2, woff, etc.)
   */
  get format(): string {
    return this.font.format || '';
  }

  /**
   * String conversion returns CSS-ready font stack
   * Allows: font-family: {{ section.settings.heading_font }}
   */
  valueOf(): string {
    return this.font.stack;
  }

  toString(): string {
    return this.font.stack;
  }

  /**
   * Liquid output method - returns font stack for direct use in CSS
   */
  toLiquidOutput(): string {
    return this.font.stack;
  }
}
```

### Step 3: Create font data registry

**File**: `app/components/preview/utils/fontRegistry.ts` (new file)

```typescript
import type { FontWithStack } from '../mockData/types';

/**
 * Registry of web-safe fonts available in preview
 * Maps identifier → full font data
 */
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

/**
 * Get font data by identifier
 * Returns system-ui as fallback for unknown fonts
 */
export function getFontData(identifier: string): FontWithStack {
  return WEB_SAFE_FONTS[identifier] || WEB_SAFE_FONTS['system-ui'];
}

/**
 * Get all available font options for UI
 */
export function getFontOptions(): Array<{ value: string; label: string; stack: string }> {
  return Object.entries(WEB_SAFE_FONTS).map(([value, font]) => ({
    value,
    label: font.family,
    stack: font.stack
  }));
}
```

### Step 4: Update FontPickerSetting to use registry

**File**: `app/components/preview/settings/FontPickerSetting.tsx`

```typescript
import type { SchemaSetting } from '../schema/SchemaTypes';
import { getFontOptions, getFontData } from '../utils/fontRegistry';

export function FontPickerSetting({ setting, value, onChange, disabled }: FontPickerSettingProps) {
  const fontOptions = getFontOptions();

  const handleChange = (e: Event) => {
    const target = e.target as HTMLSelectElement;
    onChange(target.value);
  };

  const selectedFont = getFontData(value);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <span style={{ fontWeight: 500 }}>{setting.label}</span>

      <s-select
        label="Font family"
        value={value || 'system-ui'}
        disabled={disabled || undefined}
        onChange={handleChange}
      >
        {fontOptions.map((font) => (
          <option key={font.value} value={font.value}>
            {font.label}
          </option>
        ))}
      </s-select>

      {/* Font preview with actual font stack */}
      <div style={{
        padding: '12px',
        backgroundColor: '#f6f6f7',
        borderRadius: '4px',
        fontFamily: selectedFont.stack,
        fontSize: '16px'
      }}>
        The quick brown fox jumps over the lazy dog
      </div>

      {setting.info && (
        <span style={{ fontSize: '13px', color: '#6d7175' }}>{setting.info}</span>
      )}
    </div>
  );
}
```

### Step 5: Create font settings processor in useLiquidRenderer

**File**: `app/components/preview/hooks/useLiquidRenderer.ts`

**Add** font processing before render:

```typescript
import { FontDrop } from '../drops/FontDrop';
import { getFontData } from '../utils/fontRegistry';

// Inside render function, after merging settings:

// Process font_picker settings - convert identifiers to FontDrop objects
const processedSettings: Record<string, unknown> = {};
for (const [key, value] of Object.entries(settings)) {
  if (typeof value === 'string' && getFontData(value) !== getFontData('unknown')) {
    // This looks like a font identifier, wrap in FontDrop
    processedSettings[key] = new FontDrop(getFontData(value));
  } else {
    processedSettings[key] = value;
  }
}
```

**Alternative approach** - detect font settings from schema:

```typescript
// In SectionPreview, pass schema to render for type detection
const render = async (template, settings, blocks, mockData, schema) => {
  // ...
  const fontSettingIds = schema?.settings
    ?.filter(s => s.type === 'font_picker')
    ?.map(s => s.id) || [];

  const processedSettings = { ...settings };
  for (const id of fontSettingIds) {
    if (typeof processedSettings[id] === 'string') {
      processedSettings[id] = new FontDrop(getFontData(processedSettings[id] as string));
    }
  }
};
```

### Step 6: Update fontFilters for FontDrop compatibility

**File**: `app/components/preview/utils/fontFilters.ts`

```typescript
import { FontDrop } from '../drops/FontDrop';

export const fontFilters = {
  /**
   * Generate @font-face CSS rule
   * For web-safe fonts, returns comment (no @font-face needed)
   * For custom fonts, generates proper @font-face
   */
  font_face: (font: FontDrop | Record<string, unknown>, fallback?: string) => {
    if (font instanceof FontDrop) {
      if (!font.src) {
        // Web-safe font, no @font-face needed
        return `/* ${font.family} is a web-safe font */`;
      }
      return `@font-face {
  font-family: "${font.family}";
  src: url("${font.src}") format("${font.format || 'woff2'}");
  font-weight: ${font.weight};
  font-style: ${font.style};
}`;
    }

    // Legacy object support
    const fontObj = font as Record<string, unknown>;
    if (!fontObj.src && !fontObj.url) {
      return fallback ? `/* Using fallback: ${fallback} */` : '';
    }
    const src = fontObj.src || fontObj.url;
    const format = fontObj.format || 'woff2';
    const family = fontObj.family || 'CustomFont';
    return `@font-face {
  font-family: "${family}";
  src: url("${src}") format("${format}");
}`;
  },

  /**
   * Get font URL for loading
   */
  font_url: (font: FontDrop | Record<string, unknown>) => {
    if (font instanceof FontDrop) {
      return font.src;
    }
    const fontObj = font as Record<string, unknown>;
    return fontObj.src || fontObj.url || '';
  },

  /**
   * Create modified font with different properties
   */
  font_modify: (
    font: FontDrop | Record<string, unknown>,
    attribute: string,
    value: string | number
  ) => {
    if (font instanceof FontDrop) {
      const data = {
        family: font.family,
        fallback_families: font.fallback_families,
        stack: font.stack,
        style: font.style as 'normal' | 'italic',
        weight: font.weight,
        src: font.src,
        format: font.format
      };

      switch (attribute) {
        case 'weight':
          data.weight = Number(value);
          break;
        case 'style':
          data.style = value as 'normal' | 'italic';
          break;
      }

      return new FontDrop(data);
    }

    // Legacy object support
    return { ...font, [attribute]: value };
  }
};
```

### Step 7: Export FontDrop

**File**: `app/components/preview/drops/index.ts`

**Add**:
```typescript
export { FontDrop } from './FontDrop';
```

---

## Todo List

- [ ] Add font types to `mockData/types.ts`
- [ ] Create `FontDrop.ts` in drops folder
- [ ] Create `fontRegistry.ts` utility
- [ ] Update `FontPickerSetting.tsx` to use registry
- [ ] Add font processing to `useLiquidRenderer.ts`
- [ ] Update `fontFilters.ts` for FontDrop compatibility
- [ ] Export FontDrop from drops/index.ts
- [ ] Add tests for FontDrop
- [ ] Test font rendering in preview iframe

---

## Success Criteria

1. **Test Case 1**: Basic font rendering
   - Schema has `{ type: 'font_picker', id: 'heading_font' }`
   - User selects "Georgia"
   - Template: `<h1 style="font-family: {{ section.settings.heading_font }}">Hello</h1>`
   - Preview shows heading in Georgia font

2. **Test Case 2**: Font property access
   - Template: `{{ section.settings.heading_font.family }}` → "Georgia"
   - Template: `{{ section.settings.heading_font.weight }}` → 400

3. **Test Case 3**: font_face filter
   - Template: `{{ section.settings.heading_font | font_face }}`
   - Output: `/* Georgia is a web-safe font */` (web-safe, no @font-face needed)

---

## Design Decisions (Resolved)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Google Fonts support | **Defer** | System fonts sufficient for preview; add later based on user feedback |
| Font CSS location | **Iframe head** | Cleaner separation; single injection point for future Google Fonts |
| Font weight variants | **Default 400 only** | Current scope; weight selection can be Phase 04+ |
| Font data source | **Static registry** | `fontRegistry.ts` with ~10 web-safe fonts; no external API calls |

## Future Enhancement: Google Fonts

When Google Fonts support is needed:

```typescript
// fontRegistry.ts - add Google Fonts section
export const GOOGLE_FONTS: Record<string, FontWithStack> = {
  'roboto': {
    family: 'Roboto',
    fallback_families: 'sans-serif',
    stack: '"Roboto", sans-serif',
    style: 'normal',
    weight: 400,
    src: 'https://fonts.googleapis.com/css2?family=Roboto&display=swap',
    format: 'google'  // Special marker for Google Fonts
  },
  // ...
};

// PreviewFrame.tsx - inject Google Font CSS in head
const fontLinks = Object.values(usedFonts)
  .filter(f => f.format === 'google')
  .map(f => `<link href="${f.src}" rel="stylesheet">`)
  .join('\n');
```
