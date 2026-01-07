# Phase 01: Schema Update Utility

**Effort**: 1.5h | **File**: `app/components/preview/schema/parseSchema.ts`

## Objective
Create utility to update Liquid schema `default` values from settings state.

## Implementation

### 1. Add `updateSchemaDefaults()` Function

```typescript
/**
 * Update schema setting defaults in Liquid code
 * Modifies only the `default` attribute of each setting in {% schema %}
 */
export function updateSchemaDefaults(
  liquidCode: string,
  newDefaults: SettingsState
): string {
  // Extract schema block
  const schemaMatch = liquidCode.match(
    /(\{%\s*schema\s*%\})([\s\S]*?)(\{%\s*endschema\s*%\})/
  );
  if (!schemaMatch) return liquidCode;

  const [fullMatch, openTag, schemaJson, closeTag] = schemaMatch;

  try {
    const schema = JSON.parse(schemaJson.trim()) as SchemaDefinition;

    // Update settings defaults
    if (schema.settings) {
      schema.settings = schema.settings.map(setting => {
        if (!setting.id || newDefaults[setting.id] === undefined) {
          return setting;
        }

        // Skip resource-based settings (don't support defaults)
        if (RESOURCE_TYPES.includes(setting.type)) {
          return setting;
        }

        return {
          ...setting,
          default: newDefaults[setting.id]
        };
      });
    }

    // Update block settings defaults (optional, blocks in presets)
    // Blocks use preset.blocks[].settings, not schema.blocks[].settings.default

    // Rebuild Liquid with updated schema
    const updatedSchema = JSON.stringify(schema, null, 2);
    return liquidCode.replace(fullMatch, `${openTag}\n${updatedSchema}\n${closeTag}`);
  } catch {
    console.error('Failed to update schema defaults');
    return liquidCode;
  }
}

// Resource types that don't support defaults
const RESOURCE_TYPES = [
  'product', 'collection', 'article', 'blog', 'page', 'link_list',
  'product_list', 'collection_list', 'metaobject', 'metaobject_list'
];
```

### 2. Add Type Export for Settings Sync

```typescript
export interface SettingsSyncResult {
  code: string;
  unsupportedSettings: string[]; // IDs of settings that couldn't be synced
}

export function updateSchemaDefaultsWithReport(
  liquidCode: string,
  newDefaults: SettingsState
): SettingsSyncResult {
  const unsupportedSettings: string[] = [];
  // ... implementation tracks which settings were skipped
  return { code: updatedCode, unsupportedSettings };
}
```

### 3. Add Diff Helper (Optional)

```typescript
/**
 * Compare current schema defaults with new settings
 * Returns only changed settings for efficient updates
 */
export function getSettingsDiff(
  schema: SchemaDefinition | null,
  newValues: SettingsState
): Partial<SettingsState> {
  if (!schema?.settings) return {};

  const diff: Partial<SettingsState> = {};
  for (const setting of schema.settings) {
    if (!setting.id) continue;
    const oldValue = setting.default ?? buildDefaultForType(setting);
    const newValue = newValues[setting.id];
    if (oldValue !== newValue) {
      diff[setting.id] = newValue;
    }
  }
  return diff;
}
```

## Testing Checklist
- [x] Updates single setting default
- [x] Preserves non-default attributes (label, info, options)
- [x] Handles missing schema gracefully
- [x] Skips resource-based settings
- [x] Maintains valid JSON formatting
- [x] Preserves preset configurations

## Edge Cases
- Empty schema block → return original ✅
- Malformed JSON → log error, return original ✅
- Setting ID not in schema → skip silently ✅
- Block settings → handled via presets (Phase 04)

---

## Completion Report

**Status**: ✅ **COMPLETE**
**Date**: 2026-01-06
**Review**: [code-reviewer-260106-2046-phase01-schema-update.md](../reports/code-reviewer-260106-2046-phase01-schema-update.md)

### Implementation Summary
- ✅ `RESOURCE_TYPES` constant (10 types)
- ✅ `updateSchemaDefaults()` function
- ✅ `updateSchemaDefaultsWithReport()` with unsupported tracking
- ✅ `buildDefaultForType()` helper
- ✅ `getSettingsDiff()` utility
- ✅ 19 comprehensive tests (50/50 passing)
- ✅ TypeScript strict mode compliance
- ✅ Zero linting issues
- ✅ Build verification successful

### Quality Metrics
- **Type Safety**: 100%
- **Test Pass Rate**: 100% (50/50)
- **Security Issues**: 0
- **Code Standards**: Compliant

**Next Phase**: Phase 02 - Hook Enhancement
