# Phase 02: Block Defaults - Quick Reference Guide

## Overview

Phase 02 expands schema parsing to support **all 31 Shopify schema setting types** with intelligent defaults. This ensures blocks render correctly in the preview system without undefined values.

---

## Type-to-Default Mapping

### Text Inputs (6 types)
| Type | Default | Use Case |
|------|---------|----------|
| `text` | `''` | Single-line text |
| `textarea` | `''` | Multi-line text |
| `richtext` | `''` | Rich HTML content |
| `inline_richtext` | `''` | Inline HTML (no block elements) |
| `html` | `''` | Raw HTML code |
| `liquid` | `''` | Liquid template code |

### Numbers (2 types)
| Type | Default | Use Case |
|------|---------|----------|
| `number` | `0` | Integer input |
| `range` | `min ?? 0` | Constrained number slider |

### Boolean (1 type)
| Type | Default | Use Case |
|------|---------|----------|
| `checkbox` | `false` | Toggle/flag |

### Colors (2 types)
| Type | Default | Use Case |
|------|---------|----------|
| `color` | `#000000` | Single color picker |
| `color_background` | `#000000` | Background color |

### Selection (3 types)
| Type | Default | Use Case |
|------|---------|----------|
| `select` | First option value | Dropdown list |
| `radio` | First option value | Radio button group |
| `text_alignment` | `left` | Text align (left/center/right) |

### Typography (1 type)
| Type | Default | Use Case |
|------|---------|----------|
| `font_picker` | `system-ui` | Font family selector |

### Media (3 types)
| Type | Default | Use Case |
|------|---------|----------|
| `image_picker` | `placeholder` | Image upload/selector |
| `video` | `''` | Video file upload |
| `video_url` | `''` | Video URL (YouTube/Vimeo) |

### URLs (1 type)
| Type | Default | Use Case |
|------|---------|----------|
| `url` | `#` | Link/button href |

### Resource Pickers (6 types)
| Type | Default | Use Case |
|------|---------|----------|
| `product` | `''` | Single product selector |
| `collection` | `''` | Single collection selector |
| `article` | `''` | Single article selector |
| `blog` | `''` | Single blog selector |
| `page` | `''` | Single page selector |
| `link_list` | `''` | Menu/navigation selector |

### Resource Lists (2 types)
| Type | Default | Use Case |
|------|---------|----------|
| `product_list` | `[]` | Multiple products |
| `collection_list` | `[]` | Multiple collections |

### Advanced (4 types)
| Type | Default | Use Case |
|------|---------|----------|
| `metaobject` | `''` | Custom metaobject |
| `metaobject_list` | `''` | Multiple metaobjects |
| `color_scheme` | `''` | Color scheme from theme |
| `color_scheme_group` | `''` | Group of color schemes |

### Display-Only (2 types)
| Type | Default | Use Case |
|------|---------|----------|
| `header` | (no value) | Section header/divider |
| `paragraph` | (no value) | Info text block |

---

## Default Resolution Order

1. **Explicit Schema Default** (if `setting.default` defined in schema)
   ```json
   { "type": "url", "id": "link", "default": "/products" }
   ```
   Result: `/products` (not `#`)

2. **Type-Specific Default** (from switch statement)
   ```json
   { "type": "url", "id": "link" }
   ```
   Result: `#`

3. **Safe Empty Value** (unknown types)
   ```json
   { "type": "unknown_future_type", "id": "field" }
   ```
   Result: `''`

---

## Usage Examples

### In SettingsPanel Component

```typescript
import { buildInitialState } from '../schema/parseSchema';

// Reset to defaults
const handleResetDefaults = () => {
  onChange(buildInitialState(settings));
};
```

### In Block Initialization

```typescript
// Block settings automatically get defaults
const blockSettings = blockDef?.settings || [];
const settings = buildInitialState(blockSettings);

return {
  id: `block-${index}`,
  type: presetBlock.type,
  settings // Populated with defaults
};
```

### Custom Default Override

```typescript
const schema = {
  name: "Hero Section",
  settings: [
    {
      type: "color",
      id: "background_color",
      default: "#ffffff"  // Overrides #000000 default
    }
  ]
};

const defaults = buildInitialState(schema.settings);
// defaults.background_color === "#ffffff"
```

---

## Key Functions

### buildInitialState(settings: SchemaSetting[]): SettingsState

**Purpose**: Create initial state from settings array with type-specific defaults

**Parameters**:
- `settings`: Array of SchemaSetting objects

**Returns**: Object with setting IDs as keys and default values

**Example**:
```typescript
const settings = [
  { type: 'text', id: 'title', label: 'Title' },
  { type: 'color', id: 'bg_color', label: 'Background' },
  { type: 'checkbox', id: 'enabled', label: 'Enabled' }
];

const state = buildInitialState(settings);
// state = {
//   title: '',
//   bg_color: '#000000',
//   enabled: false
// }
```

### extractSettings(schema: SchemaDefinition | null): SchemaSetting[]

**Purpose**: Extract editable settings from schema, filtering display-only types

**Supported Types**: 25+ editable types (excludes header, paragraph)

**Returns**: Array of SchemaSetting objects with resolved labels

### buildBlockInstancesFromPreset(schema): BlockInstance[]

**Purpose**: Initialize block instances from schema with default settings

**Returns**: Array of BlockInstance with populated settings using buildInitialState()

---

## Test Examples

### Test: Font Picker Default
```typescript
it('sets font_picker default to system-ui', () => {
  const settings = [{ type: 'font_picker', id: 'font', label: 'Font' }];
  const state = buildInitialState(settings);
  expect(state.font).toBe('system-ui');
});
```

### Test: Explicit Default Override
```typescript
it('uses explicit default over type default', () => {
  const settings = [
    { type: 'url', id: 'link', label: 'Link', default: '/products' }
  ];
  const state = buildInitialState(settings);
  expect(state.link).toBe('/products');
});
```

### Test: Resource Lists as JSON
```typescript
it('sets collection_list default to empty JSON array', () => {
  const settings = [
    { type: 'collection_list', id: 'collections', label: 'Collections' }
  ];
  const state = buildInitialState(settings);
  expect(state.collections).toBe('[]');
});
```

---

## Common Patterns

### Schema with Mixed Types
```json
{
  "name": "Product Hero",
  "settings": [
    {
      "type": "text",
      "id": "heading",
      "label": "Heading"
    },
    {
      "type": "color",
      "id": "text_color",
      "label": "Text Color",
      "default": "#ffffff"
    },
    {
      "type": "select",
      "id": "layout",
      "label": "Layout",
      "options": [
        { "value": "left", "label": "Image Left" },
        { "value": "right", "label": "Image Right" }
      ]
    }
  ]
}
```

**Defaults Applied**:
```javascript
{
  heading: '',
  text_color: '#ffffff',  // Explicit default used
  layout: 'left'          // First option used
}
```

### Block with Resource Settings
```json
{
  "blocks": [
    {
      "type": "product",
      "name": "Product Card",
      "settings": [
        { "type": "product", "id": "product", "label": "Product" },
        { "type": "text", "id": "title", "label": "Title" }
      ]
    }
  ]
}
```

**Defaults Applied**:
```javascript
{
  product: '',    // Resource picker, no auto-selection
  title: ''       // Text input
}
```

---

## Migration Guide (Phase 01 → Phase 02)

### No Breaking Changes
All existing code continues to work without modification.

### New Functionality
- 31 types now supported instead of ~10
- DRY refactor in SettingsPanel uses shared function
- Better test coverage

### Recommended Updates
```typescript
// Old: Inline defaults (still works)
// const defaults = { title: '', color: '#000000' };

// New: Use shared function (recommended)
import { buildInitialState } from '../schema/parseSchema';
const defaults = buildInitialState(settings);
```

---

## Troubleshooting

### Issue: Undefined value in preview
**Solution**: Ensure `buildInitialState()` is called on all settings arrays

### Issue: Wrong default for setting
**Solution**: Check explicit `default` field in schema first, then type mapping

### Issue: Resource picker not showing value
**Solution**: Resource pickers default to `''` (empty) intentionally - no auto-selection

### Issue: Color shows as black (#000000)
**Solution**: Define `default: "#yourcolor"` in schema to override

---

## Performance Notes

- **Time Complexity**: O(n) where n = number of settings (typically 5-15)
- **Space Complexity**: O(n) for output SettingsState object
- **No API Calls**: All defaults computed locally
- **No Side Effects**: Pure function, safe to call multiple times

---

## Related Documentation

- [System Architecture - Phase 02](./system-architecture.md#phase-02-block-defaults--schema-parsing-expansion)
- [Codebase Summary - Schema Module](./codebase-summary.md)
- [parseSchema.ts Source](../app/components/preview/schema/parseSchema.ts)
- [SettingsPanel Component](../app/components/preview/settings/SettingsPanel.tsx)

---

**Last Updated**: December 12, 2025
**Phase**: Phase 02 - COMPLETE
