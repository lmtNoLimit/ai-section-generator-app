# Phase 2: Add Validation Examples

**Effort**: Medium
**Depends On**: Phase 1

## Objective

Include correct JSON examples in prompt for common patterns to guide AI generation.

## Examples to Include

### 2.1 Basic Text Setting
```json
{
  "type": "text",
  "id": "heading",
  "label": "Heading",
  "placeholder": "Enter heading",
  "default": "Welcome"
}
```

### 2.2 Number Setting (Correct vs Wrong)
```json
// CORRECT
{ "type": "number", "id": "columns", "label": "Columns", "default": 3 }

// WRONG - default is string
{ "type": "number", "id": "columns", "label": "Columns", "default": "3" }
```

### 2.3 Range Setting (Required Props)
```json
{
  "type": "range",
  "id": "padding",
  "label": "Padding",
  "min": 0,
  "max": 100,
  "step": 5,
  "unit": "px",
  "default": 20
}
```

### 2.4 Select Setting (Required Options)
```json
{
  "type": "select",
  "id": "layout",
  "label": "Layout",
  "options": [
    { "value": "grid", "label": "Grid" },
    { "value": "list", "label": "List" },
    { "value": "carousel", "label": "Carousel" }
  ],
  "default": "grid"
}
```

### 2.5 Color Setting
```json
{
  "type": "color",
  "id": "bg_color",
  "label": "Background Color",
  "default": "#ffffff"
}
```

### 2.6 Image Picker (No Default)
```json
{
  "type": "image_picker",
  "id": "hero_image",
  "label": "Hero Image"
}
```

### 2.7 Richtext (Required Wrapper)
```json
{
  "type": "richtext",
  "id": "description",
  "label": "Description",
  "default": "<p>Enter your description here</p>"
}
```

### 2.8 URL Setting (With Default for Buttons)
```json
{
  "type": "url",
  "id": "button_link",
  "label": "Button Link",
  "default": "#"
}
```

### 2.9 Video URL (Required Accept)
```json
{
  "type": "video_url",
  "id": "video",
  "label": "Video URL",
  "accept": ["youtube", "vimeo"],
  "placeholder": "https://youtube.com/watch?v=..."
}
```

### 2.10 Block Configuration Example
```json
{
  "blocks": [
    {
      "type": "feature",
      "name": "Feature Card",
      "limit": 6,
      "settings": [
        { "type": "text", "id": "heading", "label": "Heading", "default": "Feature" },
        { "type": "textarea", "id": "text", "label": "Description" },
        { "type": "image_picker", "id": "icon", "label": "Icon" }
      ]
    }
  ]
}
```

### 2.11 Preset Configuration Example
```json
{
  "presets": [
    {
      "name": "Hero Banner",
      "settings": {
        "heading": "Welcome to our store"
      },
      "blocks": [
        {
          "type": "button",
          "settings": { "button_text": "Shop Now" }
        }
      ]
    }
  ]
}
```

### 2.12 Complete Minimal Section Example

```liquid
{% schema %}
{
  "name": "Feature Grid",
  "settings": [
    { "type": "text", "id": "heading", "label": "Heading", "default": "Features" },
    { "type": "range", "id": "columns", "label": "Columns", "min": 2, "max": 4, "step": 1, "default": 3 },
    { "type": "color", "id": "bg_color", "label": "Background", "default": "#f5f5f5" }
  ],
  "blocks": [
    {
      "type": "feature",
      "name": "Feature",
      "settings": [
        { "type": "text", "id": "heading", "label": "Title", "default": "Feature" },
        { "type": "textarea", "id": "text", "label": "Description" },
        { "type": "image_picker", "id": "image", "label": "Image" }
      ]
    }
  ],
  "max_blocks": 12,
  "presets": [{ "name": "Feature Grid" }]
}
{% endschema %}

{% style %}
#shopify-section-{{ section.id }} .ai-feature-grid { ... }
{% endstyle %}

<section class="ai-feature-grid">...</section>
```

## Integration Location

Add examples section between validation rules and common errors in SYSTEM_PROMPT.

## Success Criteria

- [ ] All common setting types have examples
- [ ] Block configuration example included
- [ ] Preset configuration example included
- [ ] Examples show correct vs incorrect patterns where applicable
