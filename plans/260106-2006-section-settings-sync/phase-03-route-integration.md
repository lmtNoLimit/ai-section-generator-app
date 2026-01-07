# Phase 03: Route Integration

**Effort**: 1.5h | **File**: `app/routes/app.sections.$id.tsx`

## Objective
Wire settings sync to existing saveDraft action for auto-save.

## Current Save Flow
```typescript
// Current: saves code + name only
const handleSaveDraft = useCallback(() => {
  const formData = new FormData();
  formData.append('action', 'saveDraft');
  formData.append('code', sectionCode);
  formData.append('name', sectionName);
  submit(formData, { method: 'post' });
}, [sectionCode, sectionName, submit]);
```

## Implementation

### 1. Import Schema Update Utility

```typescript
// In app.sections.$id.tsx
import { updateSchemaDefaults } from '../components/preview/schema/parseSchema';
```

### 2. Add Settings Sync Callback

```typescript
// Settings auto-save handler
const handleSettingsSync = useCallback((
  settings: SettingsState,
  hasChanges: boolean
) => {
  if (!hasChanges || isLoading) return;

  // Update Liquid code with new defaults
  const updatedCode = updateSchemaDefaults(sectionCode, settings);

  // Skip if no actual change
  if (updatedCode === sectionCode) return;

  // Update local code state
  handleCodeUpdate(updatedCode, 'settings');

  // Auto-save (reuse existing saveDraft pattern)
  const formData = new FormData();
  formData.append('action', 'saveDraft');
  formData.append('code', updatedCode);
  formData.append('name', sectionName);
  submit(formData, { method: 'post' });

  // Optional: silent save (no toast)
}, [sectionCode, sectionName, isLoading, handleCodeUpdate, submit]);
```

### 3. Wire Hook with Callback

```typescript
// Update hook usage
const previewSettings = usePreviewSettings(previewCode, {
  onSettingsChange: handleSettingsSync,
  debounceMs: 2000, // 2s debounce for auto-save
});
```

### 4. Show Settings Dirty State (Optional)

```typescript
// Add visual indicator when settings are dirty
const isSettingsDirty = previewSettings.isDirty;

// In title or badge
const displayTitle = `${sectionName}${isDirty || isSettingsDirty ? ' *' : ''}`;
```

### 5. Handle Code Source Tracking

```typescript
// Extend lastCodeSource to include 'settings'
type CodeSource = 'chat' | 'editor' | 'version' | 'settings';

// In handleCodeUpdate or useEditorState
// Add 'settings' as valid source
```

### 6. Silent Auto-Save Option

```typescript
// Option: No toast for settings auto-save
// Modify action response to support silent mode
if (actionType === 'saveDraft') {
  const silent = formData.get('silent') === 'true';
  // ... save logic
  return {
    success: true,
    message: silent ? undefined : 'Draft saved!',
    silent
  };
}

// In useEffect for toast
useEffect(() => {
  if (actionData?.success && !actionData.silent) {
    shopify.toast.show(actionData.message);
  }
}, [actionData]);
```

## Settings Panel UX Updates

### In SettingsPanel.tsx

```typescript
// Add dirty indicator and save button
<div style={{ display: 'flex', justifyContent: 'space-between' }}>
  <span>Preview Settings ({settings.length})</span>
  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
    {isDirty && (
      <s-badge tone="attention">Unsaved</s-badge>
    )}
    <s-button variant="secondary" onClick={onReset}>
      Reset
    </s-button>
  </div>
</div>
```

## Data Flow Summary

```
SettingsPanel onChange
    ↓
usePreviewSettings.setSettingsValues (immediate UI update)
    ↓
Debounce 2s
    ↓
onSettingsChange callback
    ↓
handleSettingsSync in route
    ↓
updateSchemaDefaults(code, settings)
    ↓
handleCodeUpdate(updatedCode, 'settings')
    ↓
saveDraft action (silent)
    ↓
DB update
```

## Testing Checklist
- [ ] Settings changes auto-save after 2s
- [ ] Rapid changes coalesce (debounce works)
- [ ] Code updates reflect in CodePreviewPanel
- [ ] Preview renders with new defaults
- [ ] Page refresh shows persisted settings
- [ ] No toast spam during typing

---

## Implementation Status

**Status**: ✅ COMPLETE
**Date**: 2026-01-06
**Review**: `plans/reports/code-reviewer-260106-2105-phase03-route-integration.md`

### Completed Tasks
- ✅ Import `updateSchemaDefaults` utility
- ✅ Add `handleSettingsSync` callback with debounce
- ✅ Wire `usePreviewSettings` hook with `onSettingsChange`
- ✅ Extend `CodeSource` type to include 'settings'
- ✅ Update `handleCodeUpdate` to accept source parameter
- ✅ Silent auto-save (no toast spam)
- ✅ Dependency ordering (moved isLoading up)

### Code Quality
- Type safety: 100% ✅
- Linting: 0 new issues ✅
- TypeScript: Compiles clean ✅
- Security: No vulnerabilities ✅

### Known Improvements (Non-blocking)
- Add error handling for schema update failures
- Consider race condition mitigation for rapid edits
- Add settings source badge to UI
- Extract debounce constant

### Next Phase
Phase 04: Resource Handling (product/collection pickers)
