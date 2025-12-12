# CI Lint Failures - GitHub Actions Run 20160694679

**Date**: 2025-12-12
**Run URL**: https://github.com/lmtNoLimit/ai-section-generator-app/actions/runs/20160694679
**Status**: FAILED
**Failed Step**: Lint
**Jobs Affected**: test (22.x), test (20.x)

## Executive Summary

Build failed at lint step due to 6 ESLint errors across 2 files. Both Node.js versions (20.x, 22.x) failed identically. Type check passed, unit tests not executed.

**Impact**: CI pipeline blocked, preventing merge/deployment.

**Root Cause**:
1. Unused function `extractFontData` (fontFilters.ts)
2. Five generator functions missing `yield` statements (liquidTags.ts)

## Technical Analysis

### Timeline
- **08:20:45** - Lint step started on both jobs
- **08:20:52-54** - ESLint detected 6 errors, process exited code 1
- Unit tests & coverage upload skipped due to lint failure

### Errors Breakdown

#### Error 1: Unused Function
**File**: `app/components/preview/utils/fontFilters.ts`
**Line**: 27
**Rule**: `@typescript-eslint/no-unused-vars`

```typescript
function extractFontData(font: unknown): FontObject {
  if (isFontDrop(font)) {
    return font.getFontData();
  }
  return (font as FontObject) || {};
}
```

**Analysis**: Function defined but never called. Initially intended to normalize font data extraction but later implementation directly called `isFontDrop()` and `font.getFontData()` inline.

#### Error 2-6: Generator Functions Without Yield
**File**: `app/components/preview/utils/liquidTags.ts`
**Lines**: 109, 121, 274, 402, 445
**Rule**: `require-yield`

Affected generator functions (all marked with `*` but no `yield`):
1. Line 109: `section` tag render
2. Line 121: `render` tag render
3. Line 274: `include` tag render
4. Line 402: `layout` tag render
5. Line 445: `sections` tag render

**Pattern**: All are stub implementations for Shopify Liquid tags that output HTML comments only. They don't need async operations but were declared as generators (`* render()`) for consistency with other tags that DO use `yield` (like `tablerow` at line 304).

**Code Example** (line 109):
```typescript
* render(_ctx: Context, emitter: Emitter) {
  let sectionName = 'unknown';
  if (this.args) {
    const match = this.args.match(/['"]([^'"]+)['"]/);
    sectionName = match ? match[1] : 'unknown';
  }
  emitter.write(`<!-- Section: ${sectionName} (not rendered in preview) -->`);
},
```

No `yield` statement present - function executes synchronously.

### Evidence

**ESLint Output**:
```
/home/runner/work/.../app/components/preview/utils/fontFilters.ts
  27:10  error  'extractFontData' is defined but never used  @typescript-eslint/no-unused-vars

/home/runner/work/.../app/components/preview/utils/liquidTags.ts
  109:13  error  This generator function does not have 'yield'  require-yield
  121:13  error  This generator function does not have 'yield'  require-yield
  274:13  error  This generator function does not have 'yield'  require-yield
  402:13  error  This generator function does not have 'yield'  require-yield
  445:13  error  This generator function does not have 'yield'  require-yield

✖ 6 problems (6 errors, 0 warnings)
```

## Root Cause

### Primary Cause
Generator function signature mismatch with ESLint's `require-yield` rule. Functions marked as generators (`*`) must contain at least one `yield` statement or should be converted to regular functions.

### Contributing Factors
1. Code consistency preference (marking all tag renders as generators) conflicted with actual implementation needs
2. `extractFontData` helper became unused after refactoring but wasn't removed
3. ESLint cache location configured but errors still triggered

## Actionable Recommendations

### Immediate Fixes (Priority 1)

**Fix 1: Remove unused function**
```typescript
// DELETE lines 26-32 in fontFilters.ts
// function extractFontData(font: unknown): FontObject { ... }
```

**Fix 2: Convert stub generators to regular functions**
In `liquidTags.ts`, remove `*` from 5 functions:

```typescript
// Line 109: Change
* render(_ctx: Context, emitter: Emitter) {
// To
render(_ctx: Context, emitter: Emitter) {

// Repeat for lines 121, 274, 402, 445
```

### Alternative Fix (if generator signature required)
Add dummy `yield` to maintain generator contract:
```typescript
* render(_ctx: Context, emitter: Emitter) {
  yield; // Satisfy require-yield rule
  // ... existing code
}
```

**Recommended**: Use Fix 2 (convert to regular functions) - cleaner, more accurate.

### Verification Steps
1. Apply fixes locally
2. Run `npm run lint` - should pass
3. Commit changes
4. Monitor CI: https://github.com/lmtNoLimit/ai-section-generator-app/actions

### Long-term Improvements (Priority 2)

1. **Pre-commit hooks**: Add husky + lint-staged to catch lint errors before push
2. **IDE integration**: Ensure ESLint plugin active in development environment
3. **Code review checklist**: Add "ESLint clean" requirement
4. **CI optimization**: Consider running lint before type-check (fail fast on cheap checks)

## Supporting Evidence

### Build Logs
- Full logs: `gh run view 20160694679 --repo lmtNoLimit/ai-section-generator-app --log-failed`
- Job IDs: 57872233657 (22.x), 57872233664 (20.x)
- Both jobs failed identically at 35-38s runtime

### File Context
- `fontFilters.ts`: Font manipulation utilities for Shopify preview
- `liquidTags.ts`: Custom Liquid tag implementations for template rendering
- Both files added in recent FontDrop feature implementation

### ESLint Configuration
- Cache location: `./node_modules/.cache/eslint`
- Ignore path: `.gitignore`
- Rules enforced: `@typescript-eslint/no-unused-vars`, `require-yield`

## Risk Assessment

**Implementation Risk**: LOW
- Straightforward code deletions/modifications
- No logic changes required
- Pure syntax/declaration fixes

**Testing Risk**: LOW
- Functions not used (`extractFontData`) or stubs (5 generators)
- No behavioral changes expected
- Existing tests should still pass

**Deployment Impact**: NONE
- Lint-only fixes, no runtime changes

## Unresolved Questions

None. Root cause identified with high confidence. Fixes are deterministic.
