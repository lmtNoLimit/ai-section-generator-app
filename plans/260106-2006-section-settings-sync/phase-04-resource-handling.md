# Phase 04: Resource Settings Handling

**Status**: ✅ COMPLETE | **Effort**: 1h | **Files**: `parseSchema.ts`, `SettingField.tsx`, `parseSchema.test.ts`
**Review**: [code-reviewer-260106-2120-phase04-resource-handling.md](../reports/code-reviewer-260106-2120-phase04-resource-handling.md)

## Objective
Handle resource-based settings that don't support `default` attribute per Shopify.

## Resource Types (No Default Support)
```typescript
const RESOURCE_TYPES = [
  'product',
  'collection',
  'article',
  'blog',
  'page',
  'link_list',
  'product_list',
  'collection_list',
  'metaobject',
  'metaobject_list'
];
```

## Implementation

### 1. Add Info Banner in SettingField

```typescript
// In SettingField.tsx
const isResourceType = RESOURCE_TYPES.includes(setting.type);

// Render info banner for resource settings
{isResourceType && (
  <s-inline-stack gap="tight" align="start" wrap="nowrap">
    <s-icon name="info" size="small" />
    <s-text size="small" color="subdued">
      Resource settings don't support defaults. Values are set per-instance in Theme Customizer.
    </s-text>
  </s-inline-stack>
)}
```

### 2. Visual Distinction

```typescript
// Add subtle visual cue for resource settings
<div style={{
  opacity: isResourceType ? 0.9 : 1,
  borderLeft: isResourceType ? '3px solid #e4e5e7' : 'none',
  paddingLeft: isResourceType ? '12px' : 0,
}}>
  {/* Setting field content */}
</div>
```

### 3. Skip in Schema Update

```typescript
// Already in Phase 01, but ensure graceful handling
export function updateSchemaDefaults(
  liquidCode: string,
  newDefaults: SettingsState
): string {
  // ...
  schema.settings = schema.settings.map(setting => {
    // Skip resource types explicitly
    if (RESOURCE_TYPES.includes(setting.type)) {
      // Remove any accidental default that might exist
      const { default: _, ...rest } = setting;
      return rest;
    }
    // ... update default for other types
  });
}
```

### 4. Block Settings (Preset Pattern)

Block settings are stored in `presets[0].blocks[].settings`, not in schema defaults.

```typescript
/**
 * Update block settings in preset configuration
 * Only updates "presentational" settings per Shopify spec
 */
export function updatePresetBlockSettings(
  liquidCode: string,
  blockIndex: number,
  blockSettings: SettingsState
): string {
  // Extract and parse schema
  const schema = parseSchema(liquidCode);
  if (!schema?.presets?.[0]?.blocks?.[blockIndex]) return liquidCode;

  // Only update presentational settings
  const PRESENTATIONAL_TYPES = [
    'checkbox', 'color', 'color_background', 'color_scheme',
    'font_picker', 'number', 'radio', 'range', 'select'
  ];

  const preset = schema.presets[0];
  const block = preset.blocks[blockIndex];
  const blockDef = schema.blocks?.find(b => b.type === block.type);

  if (!blockDef?.settings) return liquidCode;

  // Filter to presentational settings only
  const updatedSettings = { ...block.settings };
  for (const setting of blockDef.settings) {
    if (PRESENTATIONAL_TYPES.includes(setting.type)) {
      if (blockSettings[setting.id] !== undefined) {
        updatedSettings[setting.id] = blockSettings[setting.id];
      }
    }
  }

  preset.blocks[blockIndex].settings = updatedSettings;

  // Rebuild Liquid with updated schema
  return replaceSchemaInLiquid(liquidCode, schema);
}
```

### 5. UI Warning for Non-Presentational Block Settings

```typescript
// In SettingsPanel block section
const NON_PRESENTATIONAL_TYPES = ['text', 'textarea', 'richtext', ...];

{NON_PRESENTATIONAL_TYPES.includes(setting.type) && (
  <s-inline-stack gap="tight">
    <s-icon name="info" size="small" />
    <s-text size="small" color="subdued">
      This value is for preview only. Set in Theme Customizer for production.
    </s-text>
  </s-inline-stack>
)}
```

## UX Summary

| Setting Type | Behavior | UI Indication |
|--------------|----------|---------------|
| Text/number/color | Syncs to schema default | Normal field |
| Resource pickers | Preview only | Info banner + left border |
| Block presentational | Syncs to preset | Normal field |
| Block text/rich | Preview only | Info banner |

## Testing Checklist
- [x] Resource settings show info banner
- [x] Resource settings work in preview
- [x] Resource settings NOT written to schema
- [x] Block presentational settings sync to preset
- [x] Block text settings show preview-only note

---

## Implementation Summary (2026-01-06)

### Completed Tasks
1. ✅ Added RESOURCE_TYPES constant (10 types)
2. ✅ Added PRESENTATIONAL_TYPES constant (10 types)
3. ✅ Implemented isResourceType() type guard
4. ✅ Implemented isPresentationalType() type guard
5. ✅ Created ResourceSettingInfo banner component
6. ✅ Created BlockPreviewOnlyInfo banner component
7. ✅ Applied visual distinction (left border) to resource settings
8. ✅ Added detection logic for block preview-only settings
9. ✅ Comprehensive test coverage (56 tests passing)

### Files Modified
- `app/components/preview/schema/parseSchema.ts` (+142 lines)
  - Exported constants and type guard functions
  - Maintains DRY principle for type checking
- `app/components/preview/settings/SettingField.tsx` (+114/-64 lines)
  - Refactored from early returns to switch statement with fieldComponent
  - Added conditional wrapping for resource and block preview-only settings
- `app/components/preview/schema/__tests__/parseSchema.test.ts` (+6 suites)
  - 100% coverage for new exports

### Code Quality
- TypeScript: ✅ No type errors
- Tests: ✅ 56/56 passing
- Build: ✅ Production build successful
- Security: ✅ No vulnerabilities
- Performance: A- (minor Set optimization available)

### Recommendations for Next Phase
1. Consider Set conversion for type guards (O(1) vs O(n) lookup)
2. Extract inline styles to constants if more banners added
3. Add error context to catch blocks for debugging
