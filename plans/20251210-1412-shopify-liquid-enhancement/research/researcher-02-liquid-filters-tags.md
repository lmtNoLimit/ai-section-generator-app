# Shopify Liquid Filters & Tags Research

**Research Date**: 2025-12-10
**Status**: Comprehensive analysis
**Sources**: shopify.dev/docs/api/liquid

---

## 1. SHOPIFY-SPECIFIC FILTERS (Essential for Sections)

### Image & Asset URL Filters
| Filter | Signature | Purpose | Complexity | Priority |
|--------|-----------|---------|-----------|----------|
| `img_url` | `img_url: 'size'` | CDN URL for product/image objects | Low | HIGH |
| `asset_img_url` | `asset_img_url: 'size'` | CDN URL for theme assets | Low | HIGH |
| `image_url` | `image_url: 'size'` | Generic CDN URL for images | Low | HIGH |

### Money & Currency Filters
| Filter | Signature | Purpose | Complexity | Priority |
|--------|-----------|---------|-----------|----------|
| `money` | `money` | Format as currency (e.g., "$19.99") | Low | HIGH |
| `money_with_currency` | `money_with_currency` | Format with currency code (e.g., "$19.99 USD") | Low | MEDIUM |
| `money_without_trailing_zeros` | `money_without_trailing_zeros` | Remove trailing zeros from money | Low | MEDIUM |

### String Manipulation Filters
| Filter | Signature | Purpose | Complexity | Priority |
|--------|-----------|---------|-----------|----------|
| `upcase` | `upcase` | Convert to uppercase | Low | MEDIUM |
| `downcase` | `downcase` | Convert to lowercase | Low | MEDIUM |
| `truncate` | `truncate: N` | Truncate to N chars (default 50) | Low | MEDIUM |
| `remove` | `remove: 'text'` | Remove substring | Low | MEDIUM |
| `split` | `split: 'delimiter'` | Split into array | Low | MEDIUM |

### Date/Time Filters
| Filter | Signature | Purpose | Complexity | Priority |
|--------|-----------|---------|-----------|----------|
| `date` | `date: 'format'` | Format date (e.g., "%B %d, %Y") | Medium | MEDIUM |

### Localization Filters
| Filter | Signature | Purpose | Complexity | Priority |
|--------|-----------|---------|-----------|----------|
| `currency_selector` | `currency_selector` | Generate currency dropdown HTML | Low | LOW |
| `t` (translation) | `t: 'key'` | Translate strings via theme locale | Medium | LOW |

### URL Filters
| Filter | Signature | Purpose | Complexity | Priority |
|--------|-----------|---------|-----------|----------|
| `url_param_escape` | `url_param_escape` | Escape for URL params | Low | LOW |
| `asset_url` | `asset_url` | URL to theme asset | Low | MEDIUM |

---

## 2. SHOPIFY-SPECIFIC TAGS (Essential for Sections)

### Section & Configuration Tags
| Tag | Syntax | Purpose | Complexity | Priority |
|-----|--------|---------|-----------|----------|
| `schema` | `{% schema %}{...}{% endschema %}` | Define section settings/blocks | Medium | CRITICAL |
| `section` | `{% section 'section-name' %}` | Include section in template | Low | HIGH |
| `presets` | (Inside schema) | Pre-configured section variants | Medium | HIGH |
| `blocks` | (Inside schema) | Repeatable content blocks | Medium | HIGH |

### Control Flow Tags
| Tag | Syntax | Purpose | Complexity | Priority |
|-----|--------|---------|-----------|----------|
| `if/else/elsif` | `{% if condition %} ... {% endif %}` | Conditional rendering | Low | CRITICAL |
| `for` | `{% for item in collection %} ... {% endfor %}` | Loop over arrays | Low | CRITICAL |
| `paginate` | `{% paginate array by N %}...{% endpaginate %}` | Pagination (collections/products) | Medium | MEDIUM |
| `case/when` | `{% case var %} {% when X %} ... {% endcase %}` | Switch-like logic | Low | MEDIUM |

### Variable Assignment Tags
| Tag | Syntax | Purpose | Complexity | Priority |
|-----|--------|---------|-----------|----------|
| `assign` | `{% assign var = value %}` | Create/update variable | Low | CRITICAL |
| `capture` | `{% capture var %} ... {% endcapture %}` | Capture output to variable | Low | HIGH |
| `increment/decrement` | `{% increment var %}` | Atomic counter | Low | LOW |

### Rendering Tags
| Tag | Syntax | Purpose | Complexity | Priority |
|-----|--------|---------|-----------|----------|
| `comment` | `{% comment %} ... {% endcomment %}` | Multi-line comments | Low | MEDIUM |
| `raw` | `{% raw %} ... {% endraw %}` | Disable Liquid parsing in block | Low | MEDIUM |
| `liquid` | `{% liquid ... %}` | Multi-statement blocks | Low | MEDIUM |

### Commerce-Specific Tags
| Tag | Syntax | Purpose | Complexity | Priority |
|-----|--------|---------|-----------|----------|
| `form` | `{% form 'type' %} ... {% endform %}` | Generate cart/checkout forms | High | MEDIUM |
| `render` | `{% render 'component' %}` | Include partial with isolated scope | Low | HIGH |
| `include` | `{% include 'component' %}` | Include partial with shared scope | Low | HIGH |

---

## 3. SECTION SCHEMA STRUCTURE (Critical for Rendering)

```json
{
  "name": "Section Name",
  "settings": [
    { "type": "text", "id": "title", "label": "Title" },
    { "type": "image_picker", "id": "image", "label": "Image" },
    { "type": "color", "id": "bg_color", "label": "Background Color" },
    { "type": "select", "id": "style", "label": "Style", "options": [...] }
  ],
  "blocks": [
    {
      "type": "feature",
      "name": "Feature",
      "settings": [...]
    }
  ],
  "presets": [
    {
      "name": "Feature 1",
      "blocks": [...]
    }
  ]
}
```

**Note**: Schema requires JSON parsing in liquidjs implementation.

---

## 4. IMPLEMENTATION COMPLEXITY SUMMARY

### CRITICAL (Immediate - Required for Section Rendering)
- Schema tag parsing & JSON interpretation
- If/else, for, assign, capture tags
- Money filter for pricing display
- Img_url, asset_img_url filters for image rendering

### HIGH (Phase 1)
- Section, render, include tags
- Blocks & presets (schema sub-structures)
- Paginate tag (for product lists)
- String filters (upcase, truncate, remove)

### MEDIUM (Phase 2)
- Date filter with format strings
- Form tag for checkout/cart integration
- Case/when conditional logic
- Localization tags (t filter)

### LOW (Phase 3+)
- Currency selector
- URL escape filters
- Raw/comment tags
- Increment/decrement

---

## 5. PRIORITY RANKING FOR LIQUIDJS ENHANCEMENT

**Tier 1 (MVP - Must Have)**:
1. Schema tag parsing + JSON validation
2. If/else conditional rendering
3. For loop iteration
4. Assign/capture variables
5. Money filter
6. Img_url, asset_img_url filters
7. Section inclusion

**Tier 2 (High Value)**:
1. Paginate tag
2. Blocks & presets (nested schema)
3. Render/include with scope isolation
4. String manipulation filters
5. Date formatting

**Tier 3 (Enhancement)**:
1. Form tag
2. Case/when logic
3. Localization filters
4. URL filters

---

## 6. KEY OBSERVATIONS

- **Schema is JSON** - Not Liquid syntax; requires specialized parsing
- **Filters use pipe syntax** - Standard Liquid; chainable
- **Blocks are repeatable** - Core feature for flexible sections
- **Presets simplify UX** - Pre-configured section variants
- **Image filters critical** - Most sections use product/asset images
- **Money formatting universal** - Every commerce section needs price display
- **Pagination needed** - Product grids, collections common in sections

---

## 7. UNRESOLVED QUESTIONS

1. Does liquidjs currently support schema JSON parsing?
2. How to handle scope isolation for render vs include tags?
3. Are date format strings fully compatible with liquidjs?
4. Which image size parameters does Shopify support in img_url?
5. How to validate JSON schema structure in liquidjs context?
