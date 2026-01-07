# Shopify Liquid Section Schema Research

**Date:** 2026-01-06
**Focus:** Section schema structure, settings types, access patterns, defaults, and synchronization

---

## 1. Liquid Schema Structure

### Schema Block
- Wrapped in `{% schema %}...{% endschema %}` tags (Liquid tag, no output)
- Contains JSON only (no Liquid code execution inside)
- Must be valid JSON using defined schema attributes
- Can be placed anywhere in section/block file but NOT nested in other Liquid tags
- **One schema tag per file maximum** - multiple tags cause syntax errors

### Schema Location
- Sections: `sections/*.liquid` - Via `{% schema %}` tag
- Blocks: `blocks/*.liquid` - Via `{% schema %}` tag
- Theme settings: `config/settings_schema.json` - Global theme settings

### Section Schema Attributes
```json
{
  "name": "string",           // Display name in editor
  "tag": "section|div|...",   // HTML wrapper element
  "class": "string",          // Additional CSS class
  "limit": 1 or 2,            // Max instances allowed
  "settings": [               // Section-level settings
    { /* input or sidebar settings */ }
  ],
  "blocks": [                 // Block definitions
    { "type": "slide", "name": "Slide", "settings": [...] }
  ],
  "max_blocks": 50,           // Default limit
  "presets": [                // Pre-configured layouts
    { "name": "preset", "settings": {...}, "blocks": [...] }
  ],
  "locales": {},              // Translation keys
  "enabled_on": {},           // Template restrictions
  "disabled_on": {}           // Template restrictions
}
```

---

## 2. Settings Types Reference

### Basic Input Settings

| Type | Use Case | Return Type | Notes |
|------|----------|-------------|-------|
| **checkbox** | Toggle on/off | boolean | Default: `false` if unspecified |
| **number** | Single value input | number or nil | Default must be number (not string) |
| **radio** | Single option picker | string | Default: first option if unspecified |
| **range** | Slider with bounds | number | Requires `min`, `max`, `step`, `unit` attributes |
| **select** | Dropdown/Segmented control | string | Renders as dropdown if >5 options or has groups |
| **text** | Single-line input | string or empty | NOT updated when switching presets |
| **textarea** | Multi-line input | string or empty | For larger text blocks |

### Specialized Input Settings

| Type | Return Type | Key Feature |
|------|------------|-------------|
| **article** | article object | NOT updated on preset switch |
| **blog** | blog object | NOT updated on preset switch |
| **collection** | collection object | NOT updated on preset switch |
| **collection_list** | array of collections | Supports pagination with paginate tag |
| **color** | string (hex) | Reactive CSS updates without refresh |
| **color_background** | string | Background color picker |
| **color_scheme** | string | Preset color scheme reference |
| **font_picker** | font object | Font selection |
| **image_picker** | image object | Modern: returns object (not handle) |
| **product** | product object | Modern: returns object (not handle) |
| **product_list** | array of products | Supports pagination |
| **richtext** | string (HTML) | Multi-format text editing |
| **html** | string (HTML) | Raw HTML input |
| **url** | string | Link/URL input |
| **video** | video object | Video file picker |
| **video_url** | video object | External video URL |
| **inline_richtext** | string (HTML) | Inline formatting only |
| **link_list** | menu object | Navigation menu picker |
| **page** | page object | Single page picker |
| **text_alignment** | string | Alignment preset (left/center/right) |

### Sidebar Settings (Non-configurable, Informational)
- **header** - Section title/grouping
- **paragraph** - Informational text
- **info** - Info attribute on input settings

---

## 3. Settings Access Patterns

### Access Syntax
```liquid
<!-- Global theme settings -->
{{ settings.my_setting_id }}

<!-- Section settings -->
{{ section.settings.my_setting_id }}

<!-- Block settings -->
{{ block.settings.my_setting_id }}
```

### Modern Resource Access (Current Standard)
```liquid
{% if section.settings.product != blank %}
  {{ section.settings.product.title }}
  {{ section.settings.product.featured_image }}
{% endif %}
```

### Legacy Resource Access (Deprecated)
```liquid
{% assign product = all_products[settings.product_id] %}
```

### Value Safety Checks
```liquid
{% if settings.message != blank %}
  {{ settings.message }}
{% endif %}

<!-- For resource-based settings -->
{% unless section.settings.article == blank %}
  {{ section.settings.article.title }}
{% endunless %}
```

---

## 4. Default Values Behavior

### Setting Defaults
- Applied at **schema definition time** (when setting created)
- Stored in `config/settings_data.json` under `"current"` object
- Displayed in Theme Customizer if no value entered
- Accessible immediately after initialization

### Type-Specific Default Behavior
| Type | Default if Unspecified | Notes |
|------|------------------------|-------|
| checkbox | `false` | Optional attribute |
| number | None (nil) | Optional but must be number type |
| radio | First option | If `default` omitted |
| range | Must specify | Required attribute |
| select | First option | If `default` omitted |
| text | Empty string | No automatic default |
| resource-based | None (blank) | Don't support `default` attribute |

### Preset Overrides
- Presets only update **presentational settings** (design-focused)
- Settings like `text`, `article`, `collection`, etc. are **NOT updated** on preset switch
- Stored in `config/settings_data.json` under `"presets"` object

### Presentational Settings (Updated by Presets)
checkbox, color, color_background, color_scheme, color_scheme_group, font_picker, number, radio, range, select

---

## 5. Settings Synchronization Patterns

### Code-to-UI Sync
1. Schema `default` values → Stored in `settings_data.json`
2. Editor changes → `settings_data.json` updated automatically
3. Liquid accesses via `section.settings.*` → Always reflects current value

### Schema Validation
- Use JSON schemas: `schemas/section.json` for sections, `schemas/theme_block.json` for blocks
- Invalid JSON prevents theme upload
- Must validate before committing changes

### Settings ID Uniqueness
- **Within a section:** All setting IDs must be unique
- **Within a block:** All setting IDs must be unique
- Duplicate IDs cause schema validation errors

### Conditional Settings
```json
{
  "type": "select",
  "id": "layout",
  "visible_if": "{{ section.settings.show_layout == true }}"
}
```
- Evaluated at runtime in Theme Customizer
- Use for dependent/conditional options

### Best Practices for Sync
1. Always define `default` values for consistency
2. Use CSS variables for single-property settings:
   ```liquid
   <div style="--gap: {{ block.settings.gap }}px">...</div>
   ```
3. Use CSS classes for multi-property settings:
   ```liquid
   <div class="{{ block.settings.layout }}">...</div>
   ```
4. Check for blank values before accessing resource objects
5. Use `section.shopify_attributes` on container for editor integration
6. Update schema when modifying setting structure

---

## Key Unresolved Questions

1. How are settings synchronized when theme is duplicated or exported?
2. Does `visible_if` support complex nested conditions or only simple equality?
3. Performance implications of many settings in single section?
4. Best practices for migrating settings when renaming setting IDs?

