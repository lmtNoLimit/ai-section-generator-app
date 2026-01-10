# Brainstorm Report: Template Pre-Built Liquid Strategy

**Date**: 2026-01-10
**Session**: Template System Overhaul
**Status**: Consensus Reached

---

## Problem Statement

Current template system has 102 templates but only 3 have pre-built Liquid code. The section generation flow evolved (streaming, chat, schema parsing), making prompt-only templates outdated. "Use As-Is" button doesn't work for 99% of templates.

**Root Causes Identified:**
- Flow changed entirely (chat/streaming replaced simple prompt→code)
- Schema/settings parsing changed

---

## Goal

**Instant gratification**: Merchants click template → immediately get working section → zero AI wait time

---

## Decision Summary

### Selected Approach: AI Pre-Generation (Option B)

Use AI to batch-generate Liquid code for all 102 templates once, validate automatically, human spot-check, store as static code.

**Why This Approach:**
- 80% faster than manual writing
- Consistent patterns via enhanced system prompt
- Automated validation catches most issues
- Phased rollout reduces risk

### Rejected Alternatives:
- **Manual Pre-Built (Option A)**: Too time-intensive for 102 templates
- **Hybrid Instant+Polish (Option C)**: More complex architecture, still uses AI credits

---

## Implementation Plan

### Phase 1: Core Categories (32 templates)
- Hero (12 templates)
- Features (12 templates)
- CTA (12 templates)

### Phase 2: Content Categories (32 templates)
- Testimonials (12 templates)
- Pricing (10 templates)
- FAQ (10 templates)

### Phase 3: Supplementary Categories (38 templates)
- Team (10 templates)
- Gallery (12 templates)
- Content (12 templates)
- Footer (10 templates)

---

## Technical Tasks

### 1. Create Generation System
- Build batch script using Gemini API
- Create enhanced system prompt with:
  - Shopify Liquid best practices
  - Schema structure requirements
  - CSS patterns (responsive, accessible)
  - Section naming conventions
  - Block structure for dynamic content

### 2. Automated Validation
- Liquid syntax parsing
- Schema JSON validation
- Required sections check ({% schema %}, styles, markup)
- Responsive pattern verification
- Accessibility checks (alt text, ARIA labels)

### 3. Quality Review Process
- Human reviews 2-3 templates per category (~20-30 total)
- Focus areas:
  - Complex interactive templates (carousels, countdown)
  - Schema settings completeness
  - CSS edge cases (RTL, mobile)

### 4. Codebase Updates
- Populate `code` field in `default-templates.ts`
- Migration script for existing merchant DBs
- Update template seeder service

### 5. UX Flow
```
Template → "Use As-Is" → Section created with pre-built code
                       → Preview immediately available
                       → User can chat with AI to modify
```

---

## Files to Modify

| File | Change |
|------|--------|
| `app/data/default-templates.ts` | Add `code` field to all 102 templates |
| `app/services/template-seeder.server.ts` | Ensure code propagates to DB |
| `app/routes/app.templates.tsx` | Enable "Use As-Is" for all templates |
| `app/routes/app.sections.new.tsx` | Handle `?code=` param for direct creation |
| New: `scripts/generate-template-code.ts` | Batch generation script |
| New: `scripts/validate-templates.ts` | Automated validation |

---

## Success Metrics

- [ ] 100% of templates have pre-built code
- [ ] Liquid validation passes for all templates
- [ ] Schema parsing works for all templates
- [ ] "Use As-Is" creates working section instantly
- [ ] Preview renders correctly for all templates

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| AI generates inconsistent quality | Enhanced system prompt + spot checks |
| Schema parsing breaks | Automated validation catches before deployment |
| CSS conflicts with themes | Use scoped class names, CSS custom properties |
| Migration breaks existing templates | Backup + incremental rollout |

---

## Next Steps

1. `/plan` - Create detailed implementation plan with code specifications
2. `/cook` - Start with batch generation script
3. Focus on Phase 1 categories first (Hero, Features, CTA)

---

## Unresolved Questions

1. Should we version templates (allow merchants to get updates)?
2. How to handle theme-specific styling (Dawn vs Debut)?
3. Should pre-built code be minified or readable?
