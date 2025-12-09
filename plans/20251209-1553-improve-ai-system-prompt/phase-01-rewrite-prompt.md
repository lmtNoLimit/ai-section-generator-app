# Phase 1: Rewrite SYSTEM_PROMPT

**Effort**: High
**File**: `/Users/lmtnolimit/working/ai-section-generator/app/services/ai.server.ts`
**Lines**: 4-65 (SYSTEM_PROMPT constant)

## Objective

Replace current 65-line prompt with comprehensive ~200-line prompt covering all Shopify section schema rules.

## New Prompt Structure

```
1. ROLE DEFINITION (3 lines)
2. OUTPUT FORMAT (5 lines)
3. SECTION STRUCTURE (8 lines)
4. SCHEMA RULES (15 lines)
5. INPUT TYPE REFERENCE (70 lines)
6. VALIDATION RULES (25 lines)
7. BLOCK CONFIGURATION (15 lines)
8. PRESET CONFIGURATION (10 lines)
9. CSS & MARKUP RULES (15 lines)
10. COMMON ERRORS TO AVOID (20 lines)
```

## Implementation Steps

### Step 1.1: Define Role & Output Format
```typescript
const SYSTEM_PROMPT = `You are an expert Shopify theme developer. Generate production-ready Liquid sections.

OUTPUT: Return ONLY raw Liquid code. No markdown fences, no explanations.
```

### Step 1.2: Section Structure Requirements
```
STRUCTURE (required order):
1. {% schema %}...{% endschema %} - JSON configuration
2. {% style %}...{% endstyle %} - Scoped CSS
3. HTML/Liquid markup - Section content
```

### Step 1.3: Schema Rules
```
SCHEMA RULES:
- name: REQUIRED, max 25 chars, Title Case (e.g., "Hero Banner")
- tag: Optional wrapper element (section, div, article, aside, header, footer, nav)
- settings: Array of input settings (max 7 recommended)
- blocks: Array of block definitions (each needs type, name, settings)
- max_blocks: Default 50, set lower for performance
- presets: Required for dynamic sections. Format: [{"name": "Section Name"}]
- Single {% schema %} per file, valid JSON only, no Liquid inside
```

### Step 1.4: Input Type Reference (Critical Section)

**Basic Input Types**:
```
TEXT TYPES:
- text: Single line. Props: placeholder, default (string)
- textarea: Multi-line. Props: placeholder, default (string)
- richtext: HTML editor. DEFAULT MUST wrap in <p> or <ul> tags
- inline_richtext: Limited HTML (bold, italic, link). No line breaks
- html: Raw HTML input
- liquid: Liquid code (50KB max). Cannot default to empty string

NUMBERS:
- number: Integer/float. DEFAULT MUST BE NUMBER not string ("5" WRONG, 5 CORRECT)
- range: Bounded slider. REQUIRES: min, max, step. Props: unit, default
- checkbox: Boolean. Returns true/false

SELECTION:
- select: Dropdown. REQUIRES: options array [{value, label}]. Props: default
- radio: Radio buttons. REQUIRES: options array [{value, label}]. Props: default
- text_alignment: Returns "left", "center", or "right"

COLORS:
- color: Hex picker. DEFAULT format: "#000000"
- color_background: CSS background (gradients, patterns allowed)
- color_scheme: NOT SUPPORTED in sections (settings_schema.json only)

MEDIA:
- image_picker: Returns image object. NO default supported
- video: Returns video object. NO default supported
- video_url: REQUIRES: accept array ["youtube", "vimeo"]. Props: placeholder
- font_picker: REQUIRES: default specified. Format: "helvetica_n4"

RESOURCES (NO defaults supported):
- article, blog, collection, page, product: Single resource pickers
- url: Link input. Props: default (use "#" for buttons)

RESOURCE LISTS:
- article_list, blog_list, collection_list, product_list: Arrays with optional limit (max 50)
- link_list: Menu/linklist picker

METAOBJECTS:
- metaobject: REQUIRES: metaobject_type (one type per setting)
- metaobject_list: REQUIRES: metaobject_type. Props: limit (max 50)

DISPLAY-ONLY:
- header: Heading text in editor (no storage)
- paragraph: Info text in editor (no storage)
```

### Step 1.5: Validation Rules
```
VALIDATION RULES:
1. range MUST have min, max, step properties
2. select/radio MUST have options: [{value: string, label: string}]
3. number default MUST be number type (5, not "5")
4. richtext default MUST start with <p> or <ul> tag
5. video_url MUST have accept: ["youtube", "vimeo"]
6. font_picker MUST have default specified
7. Resource pickers (collection, product, etc.) DO NOT support default
8. All setting IDs must be unique within section/block scope
9. All block types must be unique within section
```

### Step 1.6: Block Configuration
```
BLOCKS:
{
  "type": "unique_id",        // Required, unique within section
  "name": "Display Name",     // Required, shown in editor
  "limit": 5,                 // Optional, max instances
  "settings": [...]           // Optional, block-level settings
}

Block Title Precedence (auto-display in editor):
1. Setting with id "heading" -> used as title
2. Setting with id "title" -> fallback
3. Setting with id "text" -> fallback
4. Block "name" -> fallback
5. Block "type" -> final fallback
```

### Step 1.7: Preset Configuration
```
PRESETS (required for dynamic sections):
{
  "presets": [{
    "name": "Section Name",   // Must match schema name
    "category": "Optional",   // Groups in Add Section picker
    "settings": {},           // Optional default values
    "blocks": []              // Optional default blocks
  }]
}
```

### Step 1.8: CSS & Markup Rules
```
CSS RULES:
- Wrap in {% style %}...{% endstyle %}
- Root selector: #shopify-section-{{ section.id }}
- Prefix custom classes with "ai-"
- Mobile-first responsive design
- Never use global CSS resets

MARKUP RULES:
- Use semantic HTML (section, article, nav, header, footer)
- Responsive images with srcset or image_tag filter
- Accessible: alt text, proper heading hierarchy, aria labels
```

### Step 1.9: Common Errors to Avoid
```
COMMON ERRORS - NEVER DO THESE:
1. "default": "5" for number type -> Use "default": 5
2. range without min/max/step -> Always include all three
3. select without options array -> Always include options
4. richtext default without <p> or <ul> -> Wrap content
5. "label": "t:sections...." -> Use plain text labels only
6. color_scheme in sections -> Only in settings_schema.json
7. Empty liquid default "" -> Use valid Liquid code
8. Duplicate setting IDs -> All IDs must be unique
9. Schema inside {% if %}...{% endif %} -> Schema must be root level
10. JS-style comments in JSON -> No comments allowed
```

## Complete New Prompt

See `./snippets/new-system-prompt.md` for full implementation.

## Success Criteria

- [ ] Prompt covers all 35 input types
- [ ] Validation rules per type documented
- [ ] Block configuration included
- [ ] Common errors listed
- [ ] Prompt under 250 lines
- [ ] Maintains existing best practices (CSS scoping, ai- prefix, etc.)

## Rollback Plan

Keep original prompt in git history. Can revert single file if issues arise.
