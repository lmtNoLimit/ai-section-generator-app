# Code Review: Phase 2 Save Draft Removal

## Scope
- File reviewed: `app/routes/app.sections.$id.tsx`
- Lines changed: ~30 lines removed (Save Draft button, Revert button, unused variables)
- Review focus: Phase 2 implementation - removing Save Draft/Revert UI buttons
- Updated plans: None

## Overall Assessment
Phase 2 implementation **clean and correct**. Changes align with plan objectives. TypeScript passes, build succeeds, no security/performance issues introduced.

## Critical Issues
**None**

## High Priority Findings
**None**

## Medium Priority Improvements

### 1. Dead code in useEditorState hook
**File**: `app/components/editor/hooks/useEditorState.ts` (lines 89-96)

Still exports `revertToOriginal` and `canRevert` but route no longer uses them:

```typescript
// Lines 89-96 - DEAD CODE
const revertToOriginal = useCallback(() => {
  setSectionCode(originalCode);
  setLastCodeSource('initial');
}, [originalCode]);

const canRevert = sectionCode !== originalCode;

// Lines 134-135 - returned but unused
revertToOriginal,
canRevert,
```

**Impact**: Minor - increases bundle size slightly, confuses future developers

**Fix**: Remove from hook exports:
```typescript
// DELETE lines 89-96 and 134-135 from useEditorState.ts
```

### 2. isSavingDraft in GeneratePreviewColumn
**File**: `app/components/generate/GeneratePreviewColumn.tsx` (line 20, 49, 63)

Component still accepts `isSavingDraft` prop and uses it for Create mode. This is **correct** - Create page still has "Save Draft" button (different UX flow than editor).

**Status**: Valid usage - no action needed

## Low Priority Suggestions

### 1. Consider auto-save toast feedback
Current: Silent auto-save, toast only on manual Ctrl+S

Alternative: Show subtle toast on auto-save too ("Auto-saved" vs "Draft saved!")

**Recommendation**: Keep current behavior - less disruptive

### 2. Keyboard shortcut documentation
Ctrl+S still works but no visible UI hint

**Recommendation**: Add to help/docs if not already present

## Positive Observations

1. **Clean removal** - no orphaned variables or imports
2. **Type safety maintained** - TypeScript passes cleanly
3. **Build succeeds** - no runtime errors introduced
4. **YAGNI compliance** - removed unused UI elements
5. **Preserved functionality** - Ctrl+S keyboard shortcut retained for power users
6. **Toast feedback** - actionData effect still shows save confirmation
7. **Auto-save working** - useVersionState handles silent persistence

## Recommended Actions

1. **[Low priority]** Clean up dead code in `useEditorState.ts`:
   - Remove `revertToOriginal` function (lines 89-93)
   - Remove `canRevert` variable (line 96)
   - Remove from return object (lines 134-135)

2. **[Optional]** Test manual Ctrl+S to verify toast shows "Draft saved!"

## Metrics
- Type Coverage: ✅ Passes
- Build: ✅ Succeeds
- Lines removed: ~30
- Security issues: 0
- Performance issues: 0

## Unresolved Questions
None - implementation complete per Phase 2 spec.
