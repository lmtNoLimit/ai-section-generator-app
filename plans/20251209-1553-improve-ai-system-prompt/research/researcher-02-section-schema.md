# Shopify Section Schema Structure & Requirements

**Date**: 2025-12-09
**Focus**: Complete schema structure, JSON format, validation rules, best practices

---

## 1. Core Schema Properties

All Shopify Liquid sections use `{% schema %}...{% endschema %}` tag containing valid JSON. Valid properties:

| Property | Type | Purpose | Required |
|----------|------|---------|----------|
| **name** | string | Section title shown in theme editor | Yes |
| **tag** | string | Wrapper HTML element (div, section, article, aside, header, footer, nav) | No |
| **class** | string | CSS classes applied to wrapper element | No |
| **limit** | number | Restrict section instances to 1 or 2 per template | No |
| **settings** | array | Merchant-customizable section-level options | No |
| **blocks** | array | Reusable content modules within section | No |
| **max_blocks** | number | Max block instances per section (default 50, customizable lower) | No |
| **presets** | array | Predefined configurations for "Add section" picker | No |
| **default** | object | Default configuration for static rendering | No |
| **locales** | object | Section-specific translations (sections.[name].[key]) | No |
| **enabled_on** | object | Restrict to specific templates/groups | No |
| **disabled_on** | object | Exclude from specific templates/groups | No |

---

## 2. Complete Schema Structure (JSON Example)

```json
{
  "name": "Hero Section",
  "tag": "section",
  "class": "hero-section",
  "limit": 1,
  "settings": [
    {
      "type": "text",
      "id": "heading",
      "label": "Heading",
      "default": "Welcome"
    },
    {
      "type": "image_picker",
      "id": "background_image",
      "label": "Background Image"
    },
    {
      "type": "color",
      "id": "text_color",
      "label": "Text Color",
      "default": "#000000"
    },
    {
      "type": "select",
      "id": "alignment",
      "label": "Text Alignment",
      "options": [
        { "value": "left", "label": "Left" },
        { "value": "center", "label": "Center" },
        { "value": "right", "label": "Right" }
      ],
      "default": "center"
    }
  ],
  "blocks": [
    {
      "type": "button",
      "name": "Call-to-Action Button",
      "limit": 2,
      "settings": [
        {
          "type": "text",
          "id": "button_text",
          "label": "Button Text",
          "default": "Learn More"
        },
        {
          "type": "url",
          "id": "button_link",
          "label": "Button Link"
        }
      ]
    },
    {
      "type": "text_block",
      "name": "Text Block",
      "settings": [
        {
          "type": "richtext",
          "id": "content",
          "label": "Content"
        }
      ]
    }
  ],
  "max_blocks": 5,
  "presets": [
    {
      "name": "Default Hero",
      "category": "Hero",
      "blocks": [
        {
          "type": "button",
          "settings": {
            "button_text": "Get Started"
          }
        }
      ]
    }
  ],
  "locales": {
    "en": {
      "heading": "Welcome"
    },
    "fr": {
      "heading": "Bienvenue"
    }
  },
  "enabled_on": {
    "templates": ["index", "product"]
  }
}
```

---

## 3. Block Configuration Details

Blocks define reusable content modules within sections:

```json
{
  "blocks": [
    {
      "type": "unique_identifier",
      "name": "Display Name in Editor",
      "limit": 5,
      "settings": [
        {
          "type": "text",
          "id": "setting_id",
          "label": "Setting Label"
        }
      ]
    }
  ]
}
```

**Block Title Precedence** (automatic display in editor):
1. Setting ID `heading` → used as title
2. Setting ID `title` → fallback if no heading
3. Setting ID `text` → fallback if no title
4. Block `name` → fallback if no text setting
5. Block `type` → final fallback

Example: Block with `{ "type": "text", "id": "heading", ... }` displays heading value as title.

---

## 4. Presets & Default Configuration

**Presets**: Show in "Add section" picker with category organization
```json
{
  "presets": [
    {
      "name": "Hero with Button",
      "category": "Marketing",
      "settings": {
        "heading": "Welcome to our store",
        "alignment": "center"
      },
      "blocks": [
        {
          "type": "button",
          "settings": {
            "button_text": "Shop Now"
          }
        }
      ]
    }
  ]
}
```

**Default**: Statically renders section without preset picker
```json
{
  "default": {
    "settings": {
      "heading": "Default Title"
    },
    "blocks": [
      {
        "type": "button",
        "settings": {
          "button_text": "Click Me"
        }
      }
    ]
  }
}
```

---

## 5. Template Availability Controls

Restrict sections to specific templates using `enabled_on` or `disabled_on` (not both):

```json
{
  "enabled_on": {
    "templates": ["index", "product", "collection"],
    "groups": ["header", "footer"]
  }
}
```

```json
{
  "disabled_on": {
    "templates": ["cart"],
    "groups": ["sidebar"]
  }
}
```

Valid template values: index, product, collection, cart, account, orders, search, password, 404, customers/account, gift-cards

---

## 6. Validation Rules (Critical)

1. **Single Schema Tag**: Only one `{% schema %}` per section
2. **No Nesting**: Schema cannot exist inside other Liquid tags (if, for, etc.)
3. **Unique IDs**: All setting IDs must be unique within section/block
4. **Unique Block Names**: All block types must be unique within section
5. **Valid JSON**: Schema tag must contain strictly valid JSON (no Liquid output)
6. **No Comments**: Standard JSON (no JS-style // comments)
7. **Proper Escaping**: Quote all strings, use valid number/boolean syntax

**Invalid Example**:
```liquid
{% if true %}
  {% schema %}
    { "name": "Section" }
  {% endschema %}
{% endif %}
```
❌ Schema cannot be nested inside Liquid tags

**Valid Example**:
```liquid
{% schema %}
{
  "name": "Valid Section"
}
{% endschema %}
```
✅ Schema at top level, valid JSON

---

## 7. Setting Types Quick Reference

Common setting types for sections & blocks:
- `text` - Single line input
- `textarea` - Multi-line input
- `richtext` - HTML editor
- `select` - Dropdown menu
- `checkbox` - Boolean toggle
- `color` - Color picker
- `image_picker` - Image selection
- `url` - Link input
- `number` - Numeric input
- `range` - Slider input
- `collection` - Collection picker
- `product` - Product picker
- `font_picker` - Font selection

---

## 8. Best Practices

1. **App Blocks Compatibility**: Make sections compatible with app blocks to allow merchants adding third-party content without code editing
2. **Meaningful Setting IDs**: Use descriptive IDs (button_text, not bt1) for maintainability
3. **Default Values**: Provide sensible defaults in all settings
4. **Block Title Strategy**: Use `heading` setting ID for automatic block titles in editor
5. **Localization**: Use `locales` for multi-language support instead of hardcoded strings
6. **Max Blocks**: Set reasonable `max_blocks` limit (50 is default; lower for performance)
7. **Template Targeting**: Use `enabled_on`/`disabled_on` for relevant templates only
8. **Semantic HTML**: Choose appropriate `tag` (section, article, aside) not just div

---

## 9. Schema Tag Rules Summary

- **Required**: `name` property only
- **Validation**: Strict JSON, single schema per section, unique IDs
- **No Liquid**: Schema tag cannot contain Liquid output (`{{ }}`, `{% %}`)
- **Root Level**: Must not be nested inside Liquid control flow
- **Organization**: Settings > Blocks > Presets recommended structure

---

## Key Takeaways for AI Section Generation

1. **Schema Required**: Every generated section must include valid `{% schema %}...{% endschema %}`
2. **Name Always Needed**: `name` property is only required field
3. **Settings Pattern**: Always provide section-level settings before blocks
4. **Block Structure**: Each block needs unique `type` and descriptive `name`
5. **ID Uniqueness**: Validate all setting/block IDs are unique within scope
6. **Template Control**: Consider using `enabled_on` for purpose-specific sections
7. **Title Precedence**: Use `heading` setting ID for automatic block titles
8. **Presets Optional**: Only include if section has multiple common configurations
9. **Validation Critical**: Generated JSON must pass strict validation (no Liquid, no trailing commas)

---

## Citations

- [Shopify Section Schema Documentation](https://shopify.dev/docs/storefronts/themes/architecture/sections/section-schema)
- Block configuration: Setting ID precedence for block titles
- Template restrictions: enabled_on/disabled_on usage patterns
- Best practices: App block compatibility recommendations
