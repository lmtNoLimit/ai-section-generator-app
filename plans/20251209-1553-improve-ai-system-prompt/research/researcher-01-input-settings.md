# Shopify Theme Input Settings Research

**Source:** https://shopify.dev/docs/storefronts/themes/architecture/settings/input-settings

## Universal Properties (All Types)

| Property | Required | Description |
|----------|----------|-------------|
| `type` | Yes | Setting type identifier |
| `id` | Yes | Unique identifier (used in settings object) |
| `label` | Yes | Display name in theme editor |
| `default` | No | Initial value |
| `info` | No | Help text (supports markdown links) |

---

## Complete Input Types Catalog

### 1. Text & Content
- **text** - Single-line string (not preset-aware); opt properties: `placeholder`
- **textarea** - Multi-line string; opt properties: `placeholder`
- **richtext** - HTML (bold, italic, underline, link, lists); wrapped in `<p>` or `<ul>` tags
- **inline_richtext** - Limited HTML (bold, italic, link only); no line breaks
- **html** - Raw HTML; auto-closes tags, strips `<html>`, `<head>`, `<body>`
- **liquid** - Liquid code (50KB max); req: `default` cannot be empty string
- **paragraph** - Display-only text block; no storage
- **header** - Display-only heading; no storage

### 2. Numbers & Ranges
- **number** - Integer/float; opt: `placeholder`
- **range** - Bounded integer; req: `min`, `max`, `step` (default 1), opt: `unit`
- **checkbox** - Boolean; returns true/false

### 3. Selection & Radio
- **select** - Dropdown/segmented control; req: `options` array
  - 6+ options or groups render as dropdown
  - 2-5 options render as segmented control
  - Options: `[{"value": "x", "label": "X"}]`
- **radio** - Radio button group; req: `options` array (same format)
- **text_alignment** - Preset: left/center/right; returns string

### 4. Color
- **color** - Single color; default format: `"#000000"`
- **color_background** - CSS background value; supports gradients, patterns
- **color_scheme** - Requires `color_scheme_group` in settings_schema.json only
  - Returns selected scheme object
  - Limit: Not supported in app blocks

### 5. Media Pickers
- **image_picker** - Returns image object with focal point support (use `image_tag` filter)
- **video** - Returns video object; supports metafield sources
- **video_url** - YouTube/Vimeo URLs; req: `accept` array; returns URL with `.id` and `.type`
- **font_picker** - System + Google Fonts; req: `default` specified; format: `"helvetica_n4"`

### 6. Resource Pickers (Single)
- **article** - Blog article; returns article object
- **blog** - Blog; returns blog object
- **collection** - Product collection; returns collection object
- **page** - Store page; returns page object
- **product** - Product; returns product object (published, active only)
- **url** - Manual or picker (articles, blogs, collections, pages, products); accepts `/collections`, `/collections/all`

### 7. Resource Lists (Array)
- **article_list** - Array of articles; opt: `limit` (max 50)
- **blog_list** - Array of blogs; opt: `limit` (max 50)
- **collection_list** - Array of collections; opt: `limit` (max 50)
- **link_list** - Menu/linklist; accepts `main-menu`, `footer`
- **product_list** - Array of products; opt: `limit` (max 50)

### 8. Metaobjects
- **metaobject** - Single custom object; req: `metaobject_type` (one per setting)
- **metaobject_list** - Array of custom objects; req: `metaobject_type`, opt: `limit` (max 50)

---

## Critical Validation Rules

### Common Errors
1. **String default for number**: `"default": "5"` ❌ use `"default": 5` ✓
2. **Range without bounds**: Missing `min`/`max` ❌
3. **Select without options**: `options: []` ❌
4. **Liquid not empty**: Cannot default to empty string ❌
5. **Richtext tags**: Only `<p>` or `<ul>` as top-level ❌
6. **Resource pickers with default**: Most resource types don't support defaults ❌
7. **Color scheme outside settings_schema.json**: Not supported in sections ❌
8. **Metaobject multiple types**: Only one `metaobject_type` allowed per setting ❌

### Preset Behavior
These settings **ignore preset values** (not updated when switching presets):
- text, textarea, article, blog, collection, image_picker, page, product, url

---

## JSON Schema Examples

### Text with Placeholder
```json
{
  "type": "text",
  "id": "heading",
  "label": "Heading",
  "placeholder": "Enter heading text",
  "default": "Welcome"
}
```

### Number with Min/Max
```json
{
  "type": "number",
  "id": "products_count",
  "label": "Products per page",
  "default": 12
}
```

### Range with Unit
```json
{
  "type": "range",
  "id": "spacing",
  "label": "Spacing",
  "min": 0,
  "max": 100,
  "step": 5,
  "unit": "px",
  "default": 20
}
```

### Select with Groups
```json
{
  "type": "select",
  "id": "layout",
  "label": "Layout",
  "options": [
    {"group": "Modern", "value": "grid", "label": "Grid"},
    {"group": "Classic", "value": "list", "label": "List"}
  ],
  "default": "grid"
}
```

### Richtext
```json
{
  "type": "richtext",
  "id": "description",
  "label": "Description",
  "default": "<p>Enter description</p>"
}
```

### Color Picker
```json
{
  "type": "color",
  "id": "accent",
  "label": "Accent Color",
  "default": "#000000"
}
```

### Product Picker
```json
{
  "type": "product",
  "id": "featured_product",
  "label": "Featured Product"
}
```

### Video URL
```json
{
  "type": "video_url",
  "id": "video",
  "label": "Video",
  "accept": ["youtube", "vimeo"],
  "placeholder": "https://youtube.com/watch?v=..."
}
```

---

## Key Design Principles

1. **Always specify type, id, label** - These three are non-negotiable
2. **Match defaults to type** - String values for text/select/color, numbers for number/range
3. **Use resource pickers for content** - collection, product, page, article vs. hardcoding
4. **Leverage limits on lists** - Prevent UI bloat with `limit: 50`
5. **Info text for guidance** - Help merchants understand setting purpose
6. **Respect preset behavior** - Text/media inputs won't sync with presets
7. **Validate options structure** - `options` array requires `value` + `label` fields

---

## Unresolved Questions
None - Shopify documentation is comprehensive for all input types.
