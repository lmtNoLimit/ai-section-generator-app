# Preview Settings Sync Enhancement Plan

**Created**: 2025-12-12
**Status**: Planning Complete
**Objective**: Ensure preview settings match Shopify production theme customizer behavior

---

## Summary

This plan addresses critical gaps between the preview system and Shopify's theme customizer:

1. **Resource picker values not flowing to template context** - When users select products/collections via schema settings, the data doesn't appear in `section.settings.{id}`
2. **Block settings don't inherit schema defaults** - Newly created blocks don't get default values from schema
3. **Font picker lacks real font data** - Component exists but fonts not loaded into rendering context

## Phase Overview

| Phase | Title | Priority | Status |
|-------|-------|----------|--------|
| 01 | Resource Picker Context Integration | HIGH | ✅ Complete |
| 02 | Block Settings Defaults Inheritance | HIGH | ✅ Complete (Review: 2025-12-12) |
| 03 | Font Picker Data Loading | MEDIUM | ✅ Complete (2025-12-12) |

---

## Architecture Context

```
User selects product in UI
        ↓
ProductSetting → onResourceSelect(settingId, resourceId, resource)
        ↓
SectionPreview.handleSettingsResourceSelect()
        ↓
settingsResources[settingId] = fetchedMockProduct
        ↓
buildPreviewContext({ settingsResources })
        ↓
settingsResourceDrops = { settingId: ProductDrop }
        ↓
useLiquidRenderer.render() merges into section.settings
        ↓
Template accesses {{ section.settings.featured_product.title }}
```

**Gap**: Step 5-6 - `settingsResourceDrops` built but not properly merged into `section.settings`

---

## Dependencies

- **Phase 01** has no dependencies (foundational)
- **Phase 02** depends on understanding from Phase 01 patterns
- **Phase 03** independent, can run parallel after Phase 01

## File Impact Summary

| File | Phase | Change Type |
|------|-------|-------------|
| `useLiquidRenderer.ts` | 01, 03 | Modify |
| `buildPreviewContext.ts` | 01 | Modify |
| `SectionPreview.tsx` | 01 | Modify |
| `parseSchema.ts` | 02 | Modify |
| `SettingsPanel.tsx` | 02 | Modify |
| `BlockDrop.ts` | 02 | Minor |
| `FontPickerSetting.tsx` | 03 | Modify |
| `fontFilters.ts` | 03 | Modify |

---

## Success Metrics

1. Resource picker selections accessible via `{{ section.settings.{id}.title }}`
2. Block settings auto-populate with schema defaults on creation
3. Font picker values affect rendered typography in preview

## Phase Details

- [Phase 01: Resource Picker Context Integration](./phase-01-resource-context.md)
- [Phase 02: Block Settings Defaults Inheritance](./phase-02-block-defaults.md)
- [Phase 03: Font Picker Data Loading](./phase-03-font-picker.md)

---

## Design Decisions (Resolved)

| Question | Decision | Rationale |
|----------|----------|-----------|
| Replace vs merge resource drops | **Replace** | Match Shopify behavior - `section.settings.product.id` for ID access |
| Block resource settings | **Composite key** `{blockId}:{settingId}` | Flat structure, easy to implement in Phase 01 |
| Font CSS location | **Iframe head** | Cleaner separation, single injection point |
| Google Fonts support | **Defer** | Start with system fonts; add later based on need |
| Block-level resource timing | **Phase 04** | Section-level covers 80% of use cases |
