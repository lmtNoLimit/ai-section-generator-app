# Code Review: SYSTEM_PROMPT preview_settings Documentation

**Reviewer**: code-reviewer (a3be490)
**Date**: 2026-01-06 14:30
**File**: app/services/ai.server.ts (lines 144-172)

## Scope
- **Files reviewed**: app/services/ai.server.ts
- **Lines analyzed**: 29 new lines (144-172)
- **Review focus**: Documentation addition for `preview_settings`
- **Context**: Added after PRESET CONFIGURATION, before CSS RULES

## Overall Assessment

**CRITICAL ISSUE FOUND**: The added documentation describes a `preview_settings` feature that **DOES NOT EXIST** in Shopify's official Online Store 2.0 specification.

## Critical Issues

### 1. **Hallucinated Feature** ⚠️ BLOCKER

**Finding**: `preview_settings` is not a valid Shopify section schema attribute.

**Evidence from Official Docs**:
- Reviewed complete Shopify section schema documentation
- Valid preset attributes are ONLY: `name`, `category`, `settings`, `blocks`
- No `preview_settings` attribute exists in:
  - Section presets
  - Block presets
  - Theme block schemas
  - Any official Shopify documentation

**Official Schema Structure** (from shopify.dev):
```json
{
  "presets": [{
    "name": "Section Name",      // ✅ Valid
    "category": "Category",      // ✅ Valid
    "settings": {},              // ✅ Valid
    "blocks": []                 // ✅ Valid
    // preview_settings          // ❌ DOES NOT EXIST
  }]
}
```

**Impact**:
- AI will generate INVALID Shopify section code
- Sections with `preview_settings` will FAIL validation
- Merchants cannot use generated sections
- Critical bug in core product functionality

### 2. **Misleading Documentation**

**Lines 144-172 claim**:
- "preview_settings enables live preview data when no resource selected"
- "Only affects theme editor preview, not live store"
- Schema includes products, collections, blogs, articles, pages arrays

**Reality**:
- No such feature exists in Shopify
- Shopify uses dynamic sources via `{{ closest.product }}` pattern (different mechanism)
- Preview data uses default values in `settings` or hardcoded Liquid fallbacks

## Correct Shopify Patterns

### Actual Preview/Placeholder Pattern (Official):

```liquid
{%- if section.settings.product -%}
  {{ section.settings.product.title }}
{%- else -%}
  Product Title Placeholder
{%- endif -%}
```

### Resource Pickers with Defaults (Official):

```json
{
  "presets": [{
    "name": "Featured Product",
    "settings": {
      "product": "{{ closest.product }}"  // Dynamic source
    }
  }]
}
```

## High Priority Findings

### Architectural Concern
- This documentation is in SYSTEM_PROMPT that guides ALL AI generation
- Every section generated will include invalid `preview_settings`
- Affects 100% of product/collection/resource picker sections

### Placement
✅ Placement after PRESET CONFIGURATION is logically correct
✅ Placement before CSS RULES maintains proper flow
❌ Content itself is fundamentally flawed

## Recommended Actions

1. **REMOVE** entire `preview_settings` documentation block (lines 144-172)
2. **REPLACE** with correct Shopify patterns:

```markdown
=== RESOURCE PICKER PATTERNS ===
For sections with product/collection/article/blog/page pickers, use:

1. Dynamic sources in presets:
{
  "presets": [{
    "settings": {
      "product": "{{ closest.product }}"
    }
  }]
}

2. Conditional rendering with fallbacks:
{% if section.settings.product %}
  {{ section.settings.product.title }}
{% else %}
  <div class="placeholder">Select a product</div>
{% endif %}

3. Default values in settings:
{
  "type": "text",
  "id": "fallback_title",
  "default": "Featured Product",
  "label": "Fallback title"
}
```

3. **VERIFY** no generated sections already contain `preview_settings`
4. **TEST** AI generation after fix to ensure valid output

## Positive Observations

✅ Documentation structure is clear and well-organized
✅ Examples format is consistent with rest of SYSTEM_PROMPT
✅ Categorization logic (When to use) is helpful
✅ Performance considerations mentioned (3-5 items limit)

## Compliance Assessment

- **YAGNI**: ❌ Feature doesn't exist, adding non-existent functionality
- **KISS**: ❌ Inventing complexity that doesn't match reality
- **DRY**: N/A
- **Security**: No security issues
- **Architecture**: ❌ Fundamental misunderstanding of Shopify schema

## Metrics
- **Blocker Issues**: 1 (hallucinated feature)
- **High Priority**: 1 (affects all resource picker sections)
- **Medium Priority**: 0
- **Low Priority**: 0

## Unresolved Questions

1. Where did `preview_settings` concept originate? (Not in Shopify docs)
2. Are there existing generated sections using this invalid pattern?
3. Was this based on outdated/beta Shopify features?
4. Should we add validation to catch non-existent schema attributes?

---

**VERDICT**: ❌ REJECT - Documentation describes non-existent Shopify feature. Must remove before deployment.
