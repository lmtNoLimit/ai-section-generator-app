# Code Review: Phase 04 - Diff Preview & HMR

## Scope

**Files Reviewed:**
- `app/components/editor/diff/diff-types.ts` (NEW - 34 lines)
- `app/components/editor/diff/diff-engine.ts` (NEW - 180 lines)
- `app/components/editor/hooks/useCodeDiff.ts` (NEW - 82 lines)
- `app/components/editor/CodeDiffView.tsx` (NEW - 190 lines)
- `app/components/editor/CodePreviewPanel.tsx` (MODIFIED - +70 lines)
- `app/components/editor/index.ts` (MODIFIED - +6 exports)

**Lines Analyzed:** ~566 LOC
**Review Focus:** Phase 04 implementation - diff visualization
**Build Status:** ✅ TypeScript compiled, build successful
**Plan Updated:** ✅ Updated `plans/260103-2105-blocksmith-ai-ux-workflow/phase-04-diff-preview-hmr.md`

---

## Overall Assessment

**Quality Score: 8.5/10**

Clean implementation, well-typed, follows React best practices. LCS diff algorithm correct but has performance concern for large files. No security vulnerabilities. Architecture aligns with existing codebase patterns.

**Critical Issues:** 0
**High Priority:** 1
**Medium Priority:** 3
**Low Priority:** 2

---

## Critical Issues

None.

---

## High Priority Findings

### H1: O(n*m) Complexity Without Size Guard

**File:** `app/components/editor/diff/diff-engine.ts:50-68`

**Issue:** LCS dynamic programming creates `(m+1) × (n+1)` matrix without input validation. For 1000-line files, allocates 1M cells = ~8MB memory + O(1M) iterations.

**Impact:** Browser freeze on large diffs (>500 lines each side). Plan promises <100ms but doesn't enforce.

**Fix:**
```typescript
export function calculateDiff(oldCode: string, newCode: string): DiffResult {
  const oldLines = oldCode.split('\n');
  const newLines = newCode.split('\n');

  // Guard against pathological input
  const MAX_LINES = 1000;
  if (oldLines.length > MAX_LINES || newLines.length > MAX_LINES) {
    console.warn(`Diff too large: ${oldLines.length}×${newLines.length} lines`);
    return {
      hunks: [],
      stats: {
        additions: newLines.length,
        deletions: oldLines.length,
        unchanged: 0
      },
      hasDiff: true,
    };
  }

  // ... rest of implementation
}
```

**Priority:** High - user-facing performance regression risk.

---

## Medium Priority Improvements

### M1: Inefficient Line Number Calculation

**File:** `app/components/editor/diff/diff-engine.ts:164-179`

**Issue:** `createHunk()` filters entire line array twice, then finds first match linearly - O(3n) passes.

**Current:**
```typescript
function createHunk(lines: DiffLine[], startOffset: number): DiffHunk {
  const oldLines = lines.filter((l) => l.type !== 'add');
  const newLines = lines.filter((l) => l.type !== 'remove');

  const firstOldLine = lines.find((l) => l.oldLineNumber !== undefined);
  const firstNewLine = lines.find((l) => l.newLineNumber !== undefined);
  // ...
}
```

**Better:**
```typescript
function createHunk(lines: DiffLine[], startOffset: number): DiffHunk {
  let oldCount = 0;
  let newCount = 0;
  let firstOldLine: number | undefined;
  let firstNewLine: number | undefined;

  for (const line of lines) {
    if (line.type !== 'add') {
      oldCount++;
      if (firstOldLine === undefined) firstOldLine = line.oldLineNumber;
    }
    if (line.type !== 'remove') {
      newCount++;
      if (firstNewLine === undefined) firstNewLine = line.newLineNumber;
    }
  }

  return {
    oldStart: firstOldLine ?? 1,
    oldCount,
    newStart: firstNewLine ?? 1,
    newCount,
    lines,
  };
}
```

**Impact:** 3× fewer array passes, cleaner code.

---

### M2: Missing Error Boundary for Diff View

**File:** `app/components/editor/CodeDiffView.tsx`

**Issue:** No error boundary wraps diff rendering. Malformed diff crashes entire tab.

**Current:** Naked component tree:
```tsx
export function CodeDiffView({ diff, fileName }: CodeDiffViewProps) {
  return (
    <s-box blockSize="100%" overflow="hidden" display="auto">
      {/* ... */}
    </s-box>
  );
}
```

**Recommendation:**
```tsx
// In CodePreviewPanel.tsx
{activeTab === 'diff' && (
  <PreviewErrorBoundary onRetry={() => setActiveTab('code')}>
    <CodeDiffView diff={diff} fileName={fileName} />
  </PreviewErrorBoundary>
)}
```

Reuse existing `PreviewErrorBoundary` from preview tab.

---

### M3: useCodeDiff Auto-Enable Creates Infinite Loop Risk

**File:** `app/components/editor/hooks/useCodeDiff.ts:66-70`

**Issue:** `autoTrack` effect depends on `isDiffView`, which it modifies. No guard against flapping.

```typescript
useEffect(() => {
  if (autoTrack && diff.hasDiff && !isDiffView) {
    setIsDiffView(true);
  }
}, [autoTrack, diff.hasDiff, isDiffView]); // isDiffView in deps!
```

**Problem:** If external code toggles `isDiffView` off, effect re-enables → potential loop.

**Fix:** Remove `isDiffView` from dependencies:
```typescript
useEffect(() => {
  if (autoTrack && diff.hasDiff && !isDiffView) {
    setIsDiffView(true);
  }
}, [autoTrack, diff.hasDiff]); // Safe: one-way enable only
```

Currently unused (`autoTrack` never passed), but latent bug.

---

## Low Priority Suggestions

### L1: Hard-coded Context Lines

**File:** `app/components/editor/diff/diff-engine.ts:32`

```typescript
const hunks = groupIntoHunks(diff, 3); // Magic number
```

**Suggestion:** Make configurable via options:
```typescript
export function calculateDiff(
  oldCode: string,
  newCode: string,
  options: { contextLines?: number } = {}
): DiffResult {
  const contextLines = options.contextLines ?? 3;
  const hunks = groupIntoHunks(diff, contextLines);
  // ...
}
```

Enables future UX tuning without code change.

---

### L2: CSS Colors Not Theme-Aware

**File:** `app/components/editor/CodeDiffView.tsx:171-175`

**Issue:** Hard-coded RGB colors don't respect Polaris dark mode.

```typescript
bgColor: 'rgba(46, 160, 67, 0.15)', // Green for additions
textColor: '#1a7f37',
```

**Better:** Use Polaris CSS variables:
```typescript
bgColor: 'var(--p-color-bg-success-subdued)',
textColor: 'var(--p-color-text-success)',
```

GitHub-style diff colors intentional? If so, document in comment.

---

## Positive Observations

1. **Type Safety:** Excellent TypeScript usage. All interfaces well-defined, no `any` types.

2. **Algorithm Correctness:** LCS backtracking correct. Handles edge cases (empty files, identical content).

3. **React Patterns:** Proper `useMemo` for expensive diff calc, `useCallback` for handlers, ref usage correct.

4. **Code Clarity:** Well-commented, descriptive variable names (`backtrackDiff`, `groupIntoHunks`).

5. **Progressive Enhancement:** Diff tab only appears when `diff.hasDiff` - good UX.

6. **Accessibility:** Line numbers marked `userSelect: 'none'` prevents accidental copying.

7. **No Security Issues:** No XSS vectors, no unsafe HTML, no eval/dangerouslySetInnerHTML.

---

## Recommended Actions

1. **[CRITICAL]** Add input size guard to `calculateDiff()` - prevents browser freeze.
2. **[HIGH]** Optimize `createHunk()` - single-pass implementation.
3. **[MEDIUM]** Wrap `CodeDiffView` in error boundary.
4. **[MEDIUM]** Fix `useCodeDiff` effect dependencies.
5. **[LOW]** Make context lines configurable.
6. **[LOW]** Consider Polaris theme variables for diff colors.

---

## Task Completeness Verification

**Plan File:** `plans/260103-2105-blocksmith-ai-ux-workflow/phase-04-diff-preview-hmr.md`

### Completed Tasks ✅

- ✅ Create diff-types.ts with type definitions
- ✅ Create diff-engine.ts with diff algorithm (LCS-based)
- ✅ Create useCodeDiff hook
- ✅ Create CodeDiffView component
- ✅ Add diff toggle to CodePreviewPanel
- ✅ Track previous code for diff comparison

### Incomplete Tasks ❌

- ❌ Optimize preview refresh with debounce (no HMR implementation found)
- ❌ Add refresh overlay during update (not implemented)
- ❌ Test diff with large code changes (no tests added)
- ❌ Add keyboard shortcut for diff toggle (Cmd+D) (not implemented)

**Note:** Phase 04 labeled "Diff Preview & HMR" but only diff preview implemented. HMR/refresh optimization missing from deliverables. Plan describes `usePreviewRenderer` hook modifications (lines 463-517) but those files don't exist:
- `app/components/preview/hooks/usePreviewRenderer.ts` - NOT FOUND
- `app/components/preview/PreviewFrame.tsx` refresh overlay - NOT FOUND

**Status Update Required:** Mark diff preview complete, HMR as TODO.

---

## Metrics

**Type Coverage:** 100% (all functions typed)
**Test Coverage:** 0% (no tests added)
**Linting Issues:** 0
**Build Status:** ✅ Clean
**Bundle Impact:** +13KB (CodeDiffView + diff-engine)

---

## Security Audit

✅ **No vulnerabilities found**

- Input sanitization: Not needed - plain text comparison
- XSS: No `dangerouslySetInnerHTML`, content escaped by React
- DoS: **FOUND** - unbounded LCS matrix (see H1)
- Memory: **CONCERN** - O(n×m) allocation (see H1)
- Injection: None - no eval/Function constructor

---

## Performance Analysis

**Diff Calculation:**
- **Best case:** O(1) - identical files (early return line 17)
- **Worst case:** O(n×m) time + space - completely different files
- **Typical:** O(n×m) for 100-line files = 10K ops ≈ 5-10ms ✅

**Rendering:**
- Each `DiffLine` = 3 `<span>` elements
- 500-line diff = 1500 DOM nodes - acceptable
- Virtualization not needed unless >1000 lines

**Memory:**
- LCS table: 8 bytes × (n+1) × (m+1)
- 500×500 = 2MB ✅
- 1000×1000 = 8MB ⚠️

---

## Architecture Alignment

✅ **Follows codebase patterns:**

1. **Directory Structure:** Matches existing `app/components/editor/hooks/`, `app/components/editor/diff/`
2. **Barrel Exports:** Properly updated `index.ts`
3. **Polaris Components:** Uses `s-box`, `s-badge`, `s-button` consistently
4. **Type Organization:** Separate `diff-types.ts` like `preview/types.ts`
5. **Hook Naming:** `useCodeDiff` follows `useEditorState` convention

---

## Unresolved Questions

1. **HMR Implementation:** Plan promised preview refresh optimization. Deferred to Phase 05?
2. **Large File Strategy:** Virtualization mentioned in risks (line 569) - when to implement?
3. **Color Theme:** GitHub-style diff colors intentional? Should follow Polaris theme?
4. **autoTrack Parameter:** Added to `useCodeDiff` but never used. Future feature?

---

**Plan Status:** Phase 04 50% complete (diff preview ✅, HMR ❌)
**Recommended Next Steps:**
1. Fix H1 (size guard) before user testing
2. Update plan - split into Phase 04a (diff) and Phase 04b (HMR)
3. Add tests for diff algorithm edge cases
4. Implement preview refresh if critical path
