# Research: Shopify Liquid Section Schema Settings Integration

**Date**: 2025-12-12
**Research Focus**: Preview system's handling of schema settings for production parity
**Status**: Complete (5 tool calls used)

---

## 1. Current Preview Architecture

### Core Components
- **Preview Location**: `/app/components/preview/`
- **Settings Panel**: `SettingsPanel.tsx` - Renders schema settings as collapsible form
- **Settings Types**: 23+ components in `/app/components/preview/settings/` matching all Shopify input types
- **Liquid Renderer**: `useLiquidRenderer.ts` - LiquidJS engine with 40+ Shopify filters/tags registered
- **Schema Parser**: `/app/components/preview/schema/parseSchema.ts` - Parses {% schema %} JSON blocks

### Settings Pipeline Flow
```
SchemaDefinition (parsed JSON)
  ↓
SchemaSetting[] (typed array)
  ↓
SettingsPanel (renders UI controls)
  ↓
SettingsState (Record<string, string|number|boolean>)
  ↓
useLiquidRenderer (passed to Liquid context as section.settings)
  ↓
HTML output with settings interpolated
```

---

## 2. Schema Setting Types Supported

### Framework: 31 Input Types Defined
**File**: `SchemaTypes.ts` defines all types as union type `SettingType`:

#### Text Input (5)
- `text` - Single line input
- `textarea` - Multi-line input
- `richtext` - HTML editor (default must wrap in `<p>` or `<ul>`)
- `inline_richtext` - Limited HTML (bold, italic, link only)
- `html` - Raw HTML input

#### Numeric (3)
- `number` - Integer/float (default MUST be number type, not string)
- `range` - Bounded slider (requires `min`, `max`, `step`)
- `checkbox` - Boolean toggle

#### Selection (3)
- `select` - Dropdown (requires `options` array)
- `radio` - Radio buttons (requires `options` array)
- `text_alignment` - Returns "left"/"center"/"right"

#### Color & Design (4)
- `color` - Hex color picker (default format: "#000000")
- `color_background` - CSS background (supports gradients)
- `font_picker` - Font selector (default required, format: "helvetica_n4")
- `color_scheme` / `color_scheme_group` - Advanced (deferred)

#### Media (3)
- `image_picker` - Image picker object (NO defaults supported)
- `video` - Video object (NO defaults supported)
- `video_url` - YouTube/Vimeo URL (requires `accept: ["youtube", "vimeo"]`)

#### Rich Content (3)
- `url` - Link input (default "#" recommended for buttons)
- `liquid` - Liquid code input (50KB max, cannot default to empty string)
- (html already listed above)

#### Resource Pickers (6)
- `article`, `blog`, `collection`, `page`, `product`, `link_list`
- Single resource selection (NO defaults supported)

#### Resource Lists (2)
- `collection_list`, `product_list` - Arrays with optional `limit` (max 50)

#### Display Only (2)
- `header` - Heading text (no storage)
- `paragraph` - Info text (no storage)

#### Metaobjects (2)
- `metaobject` - Single metaobject (requires `metaobject_type`)
- `metaobject_list` - Array of metaobjects (requires `metaobject_type`, supports `limit`)

**Coverage**: All 31 Shopify theme setting types defined. No gaps in type system.

---

## 3. How Settings Flow to Preview Context

### Key Integration Points

**File**: `useLiquidRenderer.ts` (lines 216-268)
- **Line 234-237**: Merge primitive settings with `settingsResourceDrops` (for product/collection pickers)
- **Line 240-248**: Build render context with `section` object:
  ```javascript
  section: {
    id: 'preview-section',
    settings: mergedSettings,  // Merged settings + drops
    blocks: blocks.map(block => new BlockDrop(block))
  }
  ```
- **Line 247**: Also expose `settings` directly in context for templates accessing `settings.key_name`

**File**: `buildPreviewContext.ts` (lines 64-93)
- **Lines 69-81**: Build `settingsResourceDrops` - wraps selected product/collection in Drop classes
- **Resource Type Detection**: Uses shape detection (e.g., 'variants' in object = Product)
- **Line 163-164**: Inject `settingsResourceDrops` into context if settings selected resources

**File**: `SettingsPanel.tsx` (lines 18-19, 62-67)
- **Props**: `resourceSettings`, `onResourceSelect` for single resource pickers
- **Props**: `multiResourceSettings`, `onMultiResourceSelect` for resource lists
- **Line 62-67**: Fallback to local state if external handlers not provided

### Current Setting Value Types Supported in Runtime
- **Primitives**: string, number, boolean
- **Resource Objects**: ProductDrop, CollectionDrop (wrapped from mock data)
- **Arrays**: BlockInstance[], SelectedResource[]

---

## 4. Gap Analysis: Production Parity Issues

### Critical Gaps

| Gap | Impact | Severity | Notes |
|-----|--------|----------|-------|
| **Missing `settingsResourceDrops` in Preview**  | Resource pickers (product/collection) not rendered in preview | HIGH | Settings exist but don't flow to template context properly |
| **No Block Setting Defaults** | Blocks created without setting defaults don't inherit schema defaults | MEDIUM | Only section-level settings have defaults applied |
| **Font Picker Not Fully Implemented** | `font_picker` type supported but no actual font loading/preview | MEDIUM | Type defined, but font data not provided to renderer |
| **Color Scheme Types Deferred** | `color_scheme`/`color_scheme_group` marked as "deferred" | LOW | Shopify theme feature, lower priority |
| **Metaobject Types Not Implemented** | `metaobject`/`metaobject_list` defined but no UI components | LOW | Advanced feature, likely future work |
| **Video Object Shape Undefined** | `video` type picker exists but Drop class not found | MEDIUM | No VideoImageDrop or equivalent |

### Non-Critical Gaps

- HTML editor (`richtext`) renders plaintext in preview instead of styled HTML
- Resource list items don't show visual thumbnails (products/collections)
- Placeholder logic in `img_url` filter returns SVG inline (not from actual image URLs)

---

## 5. Key Code Files Involved

### Schema Definition & Types
- **`SchemaTypes.ts`** (114 lines) - TypeScript interfaces for all schema structures
- **`parseSchema.ts`** - Parser converting {% schema %} JSON to SchemaDefinition objects

### UI Components (20+ Setting Components)
- **`SettingsPanel.tsx`** - Main container, manages form state
- **`SettingField.tsx`** - Router component selecting correct input type
- **Individual Setting Components**:
  - `TextSetting.tsx`, `NumberSetting.tsx`, `SelectSetting.tsx`, `CheckboxSetting.tsx`
  - `ColorSetting.tsx`, `ImageSetting.tsx`, `RadioSetting.tsx`, `FontPickerSetting.tsx`
  - `ProductSetting.tsx`, `CollectionSetting.tsx`, `ProductListSetting.tsx`, `CollectionListSetting.tsx`
  - `ArticleSetting.tsx`, `BlogSetting.tsx`, `PageSetting.tsx`, `LinkListSetting.tsx`
  - `VideoSetting.tsx`, `VideoUrlSetting.tsx`, `TextAlignmentSetting.tsx`

### Rendering Pipeline
- **`useLiquidRenderer.ts`** (272 lines) - LiquidJS engine with 40+ filters/tags
- **`buildPreviewContext.ts`** (196 lines) - Creates Drop classes for Shopify data
- **`drops/` folder** (18 Drop classes) - ProductDrop, CollectionDrop, ArticleDrop, etc.
- **`utils/liquidFilters.ts`** - 60+ filter implementations (img_url, money, etc.)

### AI Generation
- **`ai.server.ts`** - SYSTEM_PROMPT defines schema generation rules (150+ lines of schema examples)

---

## 6. Schema Generation vs Preview Alignment

### AI Generates All 31 Types
- SYSTEM_PROMPT explicitly lists all types with validation rules
- Default value validation rules are strict (e.g., number defaults must be numbers not strings)
- Resource pickers explicitly marked "NO defaults supported" in prompt

### Preview Settings Components Cover
- ✅ All basic input types (text, textarea, number, range, checkbox)
- ✅ Selection types (select, radio, text_alignment)
- ✅ Color types (color, color_background)
- ✅ Media types (image_picker, video_url)
- ✅ Resource pickers (product, collection, article, blog, page, link_list, product_list, collection_list)
- ⚠️ Font picker (component exists, but font data not loaded)
- ❌ Metaobjects (types defined, no UI components)
- ❌ Color schemes (types defined, no UI components)

### Default Value Handling
- Section-level settings: Defaults populated from schema during SettingsPanel init
- Block-level settings: Blocks created without defaults (each block needs manual handling)
- Resource pickers: Defaults explicitly not supported (matches Shopify)

---

## 7. Critical Implementation Details

### SchemaSetting Interface Properties
```typescript
interface SchemaSetting {
  type: SettingType;           // Input type (required)
  id: string;                  // Unique identifier (required)
  label: string;               // UI label (required)
  default?: string | number | boolean;  // Default value (optional)
  placeholder?: string;        // Input placeholder
  info?: string;               // Help text
  options?: SelectOption[];    // For select/radio only
  min?: number;                // For range only
  max?: number;                // For range only
  step?: number;               // For range only
  unit?: string;               // For range only
  content?: string;            // For header/paragraph
  accept?: string[];           // For video_url only
  limit?: number;              // For list types
}
```

### Block Instance Runtime Structure
```typescript
interface BlockInstance {
  id: string;           // Auto-generated unique ID
  type: string;         // Block type from schema
  settings: SettingsState;  // Block settings with defaults
}
```

### Liquid Context at Render Time
```javascript
{
  section: {
    id: 'preview-section',
    settings: { ...primitiveSettings, ...resourceDrops },
    blocks: [BlockDrop, BlockDrop, ...]  // Each mapped to Drop class
  },
  settings: { ...primitiveSettings, ...resourceDrops },
  // Plus all Shopify global drops (product, collection, shop, etc.)
}
```

---

## 8. Testing & Verification Points

### What Currently Works
1. Primitive settings (text, number, color) render correctly in preview
2. Block settings UI renders but doesn't apply defaults properly
3. Liquid template {% schema %} blocks correctly stripped from renderer
4. Section.blocks array correctly populated with BlockDrop instances

### What Needs Testing
1. Resource picker values actually flow to template context
2. settingsResourceDrops properly merged into section.settings
3. Font picker selections affect template rendering
4. Product/collection picker selected items are accessible as `section.settings.product_id`

---

## Unresolved Questions

1. **Video object structure**: What properties should VideoSetting pass? (src, url, image_url, duration?)
2. **Font picker data source**: Where does font list come from? (Hardcoded list, Shopify API, system fonts?)
3. **Resource list thumbnails**: Should ProductListSetting/CollectionListSetting show thumbnails or just titles?
4. **Block defaults inheritance**: Should block settings auto-inherit section-level defaults?
5. **Richtext HTML rendering**: Should richtext settings be rendered as styled HTML or escaped plaintext in preview?

---

## Summary

**Status**: Preview system has comprehensive schema setting type coverage (31 types defined) but incomplete flow for resource-based settings to template context. Gap primarily affects product/collection picker rendering. Font picker UI exists but font data not integrated. All primitive types work correctly. Block-level setting defaults not auto-applied (design choice or oversight?).

**Next Phase**: Implement resource drop injection into section.settings context, verify product/collection picker selections flow through to template, and complete font picker integration with actual font data.
