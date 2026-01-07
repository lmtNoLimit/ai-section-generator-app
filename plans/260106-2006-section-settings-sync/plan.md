---
title: "Section Settings Synchronization"
description: "Bidirectional sync between preview settings UI and Liquid schema defaults"
status: pending
priority: P1
effort: 6h
branch: main
tags: [preview, settings, schema, liquid, sync]
created: 2026-01-06
---

# Section Settings Synchronization Plan

## Problem Statement
Preview settings are ephemeral - lost on refresh, never sync back to Liquid schema.
Users can't set default values in app that match actual Liquid code behavior.

## Solution Overview
Bidirectional sync: Schema → Preview (existing) + Preview → Schema (new).
Settings represent section defaults, stored in Liquid `default` attributes.

## Architecture Decision
**Approach: Regenerate Liquid on save** (vs storing settings separately)
- KISS: Single source of truth (Liquid code)
- DRY: No duplicate settings storage
- Matches Shopify's native behavior (schema defaults)

## Implementation Phases

| Phase | Focus | Effort | Details |
|-------|-------|--------|---------|
| [Phase 01](./phase-01-schema-update-util.md) | Schema Update Utility | 1.5h | Parse/update Liquid defaults |
| [Phase 02](./phase-02-hook-enhancement.md) | Hook Enhancement | 1.5h | Add sync callback to hook |
| [Phase 03](./phase-03-route-integration.md) | Route Integration | 1.5h | Wire save action + auto-save |
| [Phase 04](./phase-04-resource-handling.md) | Resource Settings | 1h | Handle unsupported types |
| [Phase 05](./phase-05-testing.md) | Testing & Polish | 0.5h | Edge cases, UX feedback |

## Key Files Modified
- `app/components/preview/schema/parseSchema.ts` - Add `updateSchemaDefaults()`
- `app/components/preview/hooks/usePreviewSettings.ts` - Add sync callback
- `app/routes/app.sections.$id.tsx` - Wire settings save to draft action

## Data Flow (New)
```
User edits setting in SettingsPanel
    ↓
usePreviewSettings updates local state
    ↓
Auto-save triggers (debounced 2s)
    ↓
updateSchemaDefaults(code, settings) → new Liquid code
    ↓
saveDraft action saves code to DB
```

## Constraints
- Resource settings (product, collection) DON'T support defaults per Shopify
- Presets only update "presentational" settings (colors, numbers, selects)
- Must maintain valid JSON in schema block

## Success Criteria
1. Preview settings persist across refresh
2. Exported Liquid code has updated defaults
3. Reset button restores schema defaults
4. Resource settings show info banner explaining limitation

---

## Validation Summary

**Validated:** 2026-01-06
**Questions asked:** 6

### Confirmed Decisions

| Decision | User Choice |
|----------|-------------|
| AI regeneration conflict | Let AI overwrite - simpler state management |
| Auto-save timing | 2s debounce confirmed |
| Resource settings UX | Info banner per field |
| Block settings sync | **ALL block settings sync** (differs from plan) |
| Export behavior | Include custom defaults |
| Manual save button | Auto-save only - no explicit button |

### Action Items
- [ ] **Phase 04 Update**: Change block sync from "presentational-only" to "all block settings"
  - Remove `PRESENTATIONAL_TYPES` filter in `updatePresetBlockSettings()`
  - Sync ALL block settings including text/richtext to preset

### Risks Acknowledged
- AI regeneration overwrites user defaults (accepted tradeoff)
- Block text sync may increase preset size (minor concern)
