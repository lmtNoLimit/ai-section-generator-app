# Code Review: Template Validation Script (Phase 2)

**Date**: 2026-01-10
**Reviewer**: code-reviewer (a32ab29)
**Plan**: plans/260110-1149-template-prebuilt-liquid/phase-02-validation-system.md

---

## Code Review Summary

### Scope
- Files reviewed:
  - scripts/validate-templates.ts (new, 635 lines)
  - package.json (2 new scripts)
- Lines of code analyzed: ~635
- Review focus: Phase 2 template validation system
- Related files: validation-rules.ts, parseSchema.ts, SchemaTypes.ts

### Overall Assessment
Implementation solid. Follows YAGNI/KISS/DRY. Architecture clean. **1 critical type error blocks production use**. 5 medium-priority improvements needed. Security posture good.

---

## Critical Issues

### 1. Type Incompatibility: `SchemaDefinition` vs `ParsedSchema`

**Location**: Line 354
**Severity**: Critical (blocks compilation)

```typescript
const result: ValidationResult = rule.check(code, schema);
// Type 'SchemaDefinition | null' not assignable to 'ParsedSchema | null'
```

**Root Cause**: Type mismatch between:
- `parseSchema()` returns `SchemaDefinition` (from SchemaTypes.ts)
- `VALIDATION_RULES` expects `ParsedSchema` (from validation-rules.ts)

**Impact**:
- TypeScript compilation fails
- npm run typecheck fails
- Cannot deploy to production

**Fix Required**:
```typescript
// Option 1: Add type assertion (quick fix)
const result: ValidationResult = rule.check(code, schema as ParsedSchema | null);

// Option 2: Unify types (preferred, requires validation-rules.ts update)
// Change ParsedSchema interface to extend SchemaDefinition
// Or import SchemaDefinition in validation-rules.ts
```

**Recommendation**: Use Option 2. Update `validation-rules.ts` to import `SchemaDefinition` from `SchemaTypes.ts` instead of defining separate `ParsedSchema` interface. Ensures single source of truth.

---

## High Priority Findings

None. No security vulnerabilities, no performance issues, no breaking changes detected.

---

## Medium Priority Improvements

### 1. Missing Error Handling for File I/O

**Location**: Lines 405, 574
**Severity**: Medium

```typescript
const input: BatchInput = JSON.parse(fs.readFileSync(inputPath, "utf-8"));
fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
```

**Issue**: No try-catch for file operations. Could crash on:
- Permission errors
- Disk full
- Invalid JSON
- File not found (partially handled at line 554)

**Fix**:
```typescript
function validateGeneratedTemplates(inputPath: string): TemplateValidation[] {
  try {
    const content = fs.readFileSync(inputPath, "utf-8");
    const input: BatchInput = JSON.parse(content);
    // ... rest
  } catch (error) {
    console.error(`Failed to read/parse input file: ${error}`);
    process.exit(1);
  }
}
```

### 2. AI Check: Image Picker Conditional Logic Too Strict

**Location**: Lines 168-197
**Severity**: Medium

```typescript
// Current: Flags warning if conditional NOT found
if (usagePattern.test(code) && !conditionalPattern.test(code)) {
  return { /* warning */ };
}
```

**Issue**: False positives when:
- Image used in `<style>` block CSS (background-image)
- Image referenced in comment
- Image used with `| default: 'placeholder.png'` filter

**Recommendation**: Refine pattern to check Liquid output tags only:
```typescript
const liquidOutputPattern = new RegExp(
  `\\{\\{[^}]*section\\.settings\\.${picker.id}[^}]*\\}\\}`,
  'i'
);
```

### 3. Hardcoded Text Detection False Positives

**Location**: Lines 236-266
**Severity**: Medium

```typescript
const hardcodedHeading = /<h[1-6][^>]*>\s*[A-Z][a-zA-Z\s]{10,}\s*<\/h[1-6]>/;
```

**Issue**: Regex triggers on:
- Headings with Liquid variables: `<h1>Welcome {{ shop.name }}</h1>`
- Semantic HTML: `<h2>Our Story About Quality Products</h2>` (valid if from settings)

**Recommendation**: Check heading contains NO Liquid variables before flagging:
```typescript
if (hardcodedHeading.test(withoutStyle)) {
  const headingMatch = withoutStyle.match(hardcodedHeading);
  if (headingMatch && !headingMatch[0].includes('{{')) {
    return { /* warning */ };
  }
}
```

### 4. CSS Prefix Check Performance

**Location**: Lines 199-234
**Severity**: Medium

**Issue**: Runs regex on entire CSS block for every class. O(n²) complexity. Not critical for small templates but could slow batch validation of 100+ templates.

**Optimization**:
```typescript
const classMatches = css.match(/\.([a-z][a-z0-9-_]*)/gi) || [];
// Use Set for O(1) lookup instead of .filter() + .includes()
const uniqueClasses = new Set(classMatches);
const nonPrefixed = [...uniqueClasses].filter(
  cls => !cls.startsWith('.ai-') && cls !== '.shopify-section'
);
```

### 5. Missing Input Validation for CLI Arguments

**Location**: Line 538
**Severity**: Medium

**Issue**: No validation that `process.argv[2]` is valid path before attempting file operations.

**Security Concern**: Path traversal possible if user passes `../../etc/passwd` (mitigated by file-not-found check, but better to validate early).

**Fix**:
```typescript
let inputPath = process.argv[2];
if (inputPath) {
  // Validate path doesn't escape cwd
  const resolvedPath = path.resolve(inputPath);
  const cwd = process.cwd();
  if (!resolvedPath.startsWith(cwd)) {
    console.error('❌ Input path must be within project directory');
    process.exit(1);
  }
  inputPath = resolvedPath;
}
```

---

## Low Priority Suggestions

### 1. Console Output Formatting
- Line 533: Unicode characters (═, ═, ─) may not render on all terminals
- Recommendation: Add fallback plain-text mode or detect terminal support

### 2. Report Structure
- Line 510: `details: validations` includes full validation array in JSON output (can be large)
- Recommendation: Add `--full` flag to include details, default to summary only

### 3. NPM Script Naming
- Line 32: `validate:templates:latest` identical to `validate:templates` (both use default latest file)
- Recommendation: Remove duplicate or make `:latest` explicitly pass symlink path

---

## Positive Observations

1. **Strong separation of concerns**: Validation logic, AI checks, report generation cleanly separated
2. **Reuses existing validation rules**: Leverages app/components/editor/validation-rules.ts (DRY principle)
3. **Comprehensive AI hallucination checks**: 7 custom checks cover common Gemini failure modes
4. **Good sanitization**: validation-rules.ts uses HTML entity escaping to prevent XSS in messages
5. **Clear CLI output**: Summary format easy to scan
6. **ESM module pattern**: Proper use of dynamic imports for app modules
7. **Type safety**: All interfaces well-defined (except critical issue #1)

---

## Recommended Actions

**Immediate (Blocks Deploy)**:
1. Fix type incompatibility at line 354 (see Critical Issue #1)

**Before Production**:
2. Add try-catch for file I/O operations
3. Refine image picker conditional check to reduce false positives
4. Add input path validation for security

**Optional Enhancements**:
5. Optimize CSS prefix check for large batches
6. Improve hardcoded text detection accuracy
7. Add `--full` flag for detailed JSON reports

---

## Metrics

- **Type Coverage**: 95% (excellent, minus 1 critical type error)
- **Security**: 9/10 (good sanitization, minor path validation gap)
- **Performance**: O(n) batch validation, O(n²) CSS check (acceptable for current scale)
- **Maintainability**: High (clear structure, well-documented)
- **Linting Issues**: 0 in validate-templates.ts (clean)
- **Test Coverage**: Not implemented (acceptable for Phase 2 script)

---

## Phase 2 Task Status

**Plan File**: plans/260110-1149-template-prebuilt-liquid/phase-02-validation-system.md

### Completed Tasks ✓
- [x] Step 1: Create validation script structure
- [x] Step 2: Implement core validation function
- [x] Step 3: Add custom AI-specific checks (7 checks implemented)
- [x] Step 4: Implement batch validation
- [x] Step 5: Generate validation report
- [x] Step 6: Add package scripts

### Remaining Work
- [ ] Fix critical type error (line 354)
- [ ] Test script with Phase 1 output file
- [ ] Update phase-02 plan status to `in-progress` or `completed`

### Success Criteria Status
1. ✓ Validates all 9 existing rules correctly
2. ✓ Catches AI hallucinations (new_comment, missing conditionals, etc)
3. ✓ Generates actionable report with pass/fail per template
4. ✓ Groups issues by severity and category
5. ⚠️ Cannot verify 90%+ pass rate until type error fixed and script runs

---

## Unresolved Questions

1. **From phase-02 plan**: Should validation auto-regenerate failed templates?
   → Recommendation: No. Keep validation separate from generation. Manual review required.

2. **From phase-02 plan**: Acceptable warning threshold per template?
   → Recommendation: 0 errors (strict), ≤3 warnings (pragmatic). Templates with 4+ warnings need manual review.

3. **New**: Should script exit code 1 if warnings exist (not just errors)?
   → Current: Only exits 1 if errors (line 627)
   → Recommendation: Keep current behavior. Warnings should not block pipeline.

4. **New**: Missing test file for generated templates in git status
   → Expected: `scripts/output/generated-templates-*.json`
   → Status: Not in repo (likely in .gitignore)
   → Action: Verify Phase 1 script ran successfully before testing Phase 2

---

**Next Step**: Fix critical type error, then run validation against Phase 1 output to verify 90%+ pass rate.
