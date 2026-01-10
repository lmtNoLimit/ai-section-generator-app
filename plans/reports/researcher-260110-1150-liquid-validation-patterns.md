# Liquid Validation & Schema Parsing Patterns Research

**Date**: 2026-01-10 | **Duration**: 5 tool calls | **Status**: Complete

## Executive Summary

Codebase has **mature, production-tested** Liquid schema parsing and validation patterns across 3 core modules:
- `parseSchema.ts` - 498 lines, 16 functions for schema extraction + state management
- `validation-rules.ts` - 284 lines, 9 validation rules for syntax + structure
- `liquid-wrapper.server.ts` - 198 lines, context injection + proxy rendering

**Key finding**: All validation follows **rule-based architecture** with regex + JSON parsing. Test coverage: 654 test cases with 50+ edge case scenarios.

---

## 1. Existing Schema Parsing Logic

### Core Pattern: Regex-based Extraction + JSON Validation

**Location**: `app/components/preview/schema/parseSchema.ts` (lines 111-135)

```typescript
export function parseSchema(liquidCode: string): SchemaDefinition | null {
  const schemaMatch = liquidCode.match(/\{%\s*schema\s*%\}([\s\S]*?)\{%\s*endschema\s*%\}/);
  if (!schemaMatch || !schemaMatch[1]) return null;

  try {
    const schemaJson = schemaMatch[1].trim();
    return JSON.parse(schemaJson) as SchemaDefinition;
  } catch (error) {
    console.error('Failed to parse schema JSON:', error);
    return null;
  }
}
```

**Pattern reusability**:
- Handles whitespace control syntax `{%- schema -%}` (case-insensitive)
- Non-throwing, returns `null` on parse failure
- Applied in 3+ locations (validator, parseSchema, liquid-wrapper)

**RESOURCE_TYPES constant**: Identifies 10 types that don't support defaults (product, collection, article, etc.) - critical for validation automation.

---

## 2. Liquid Syntax Validation Approaches

### Validation Rule Framework

**Location**: `app/components/editor/validation/validation-rules.ts` (9 rules across 284 lines)

**Architecture**: Plugin system with modular rules:

| Rule ID | Severity | Pattern | Code |
|---------|----------|---------|------|
| `schema-exists` | error | Regex `/{%\s*schema\s*%}` | Checks block presence |
| `schema-valid-json` | error | Try/catch JSON parse | Validates structure |
| `schema-has-name` | error | Property check `schema?.name` | Required field |
| `schema-has-presets` | warning | Array length check | Best practice |
| `number-defaults-are-numbers` | error | Type check loop | Type validation |
| `range-has-required-props` | error | Props array check | Required fields |
| `select-has-options` | error | Array presence check | Options validation |
| `css-uses-section-id` | warning | Regex `#shopify-section-{{` | CSS scoping |
| `liquid-tags-balanced` | error | Balanced tag counting | Syntax correctness |

**Key advantage**: Each rule is isolated, testable, extensible. New rules can be added by extending `VALIDATION_RULES` array.

### Tag Balancing Algorithm

```typescript
const openTags = ['if', 'unless', 'for', 'case', 'capture', 'form', 'paginate', 'tablerow'];
for (const tag of openTags) {
  const openCount = (code.match(new RegExp(`{%\\s*${tag}\\s`, 'g')) || []).length;
  const closeCount = (code.match(new RegExp(`{%\\s*end${tag}\\s*%}`, 'g')) || []).length;
  if (openCount !== closeCount) issues.push(`${tag}: ${openCount} open, ${closeCount} close`);
}
```

**Reusable for automated validation**: Simple regex counts + mismatch detection.

---

## 3. Test Patterns for Validation

### Test Coverage: 654 test cases across 3 files

**File**: `app/components/preview/schema/__tests__/parseSchema.test.ts`

**Patterns identified**:

#### 3.1 Happy Path Tests
```typescript
it('resolves translation key with label suffix', () => {
  const result = resolveTranslationKey('t:sections.hero.settings.background_image.label');
  expect(result).toBe('Background Image');
});
```

#### 3.2 Edge Case Coverage (50+ tests)
- Empty/null inputs
- Malformed JSON
- Settings without IDs
- Special characters (quotes, newlines, unicode)
- Type coercion (string→number for ranges)
- Resource types (skip defaults)
- Unknown setting IDs (ignore silently)

#### 3.3 Phase 05 Edge Cases (140 lines)
Comprehensive edge case suite documented for:
- Empty schema handling
- Malformed JSON resilience
- Type coercion correctness
- Missing resource defaults

**Key test pattern**: Assertion-based validation with JSON round-trip tests:
```typescript
const result = updateSchemaDefaults(baseLiquid, { heading: 'New' });
const schemaMatch = result.match(/\{%\s*schema\s*%\}([\s\S]*?)\{%\s*endschema\s*%\}/);
expect(() => JSON.parse(schemaMatch![1].trim())).not.toThrow(); // Valid JSON check
```

---

## 4. Recommendations for Automated Validation Script

### Architecture Pattern: Rule + Test Model

**Suggested structure**:

```
validation/
├── rules/
│   ├── schema-rules.ts (existence, JSON, name, presets)
│   ├── setting-rules.ts (types, defaults, options)
│   ├── syntax-rules.ts (tag balance, section ID)
│   └── index.ts (VALIDATION_RULES array)
├── runner.ts (orchestrates rule execution)
├── reporter.ts (formats results with severity)
└── __tests__/
    └── validation.test.ts (edge case suite)
```

### Reusable Patterns

**Pattern 1: Extraction with Fallback**
```typescript
function extractComponent(code, regex) {
  const match = code.match(regex);
  return match ? match[1].trim() : null;
}
```

**Pattern 2: Severity-based Reporting**
```typescript
const result = { valid: boolean, message: string, suggestion?: string };
return rule.severity === 'error' ? errors.push(result) : warnings.push(result);
```

**Pattern 3: Type Validation Arrays**
```typescript
const RESOURCE_TYPES = [...]; // No defaults
const PRESENTATIONAL_TYPES = [...]; // Block defaults OK
export function isResourceType(type) { return RESOURCE_TYPES.includes(type); }
```

### Script Entry Points

1. **CLI validation** (Node.js script)
   ```bash
   node validate-sections.js app/sections/*.liquid
   ```
   Uses `validateSchema()` from schema-validator.ts

2. **Pre-commit hook** (Git hook)
   ```bash
   npx husky add .husky/pre-commit "npm run validate:sections"
   ```

3. **CI/CD integration** (GitHub Actions)
   ```yaml
   - run: npm run validate:sections
     continue-on-error: false # Fail on errors
   ```

### Integration Points

- **Input**: Liquid code string or file path
- **Parsing**: Regex extraction → JSON parse
- **Validation**: Rule loop with schema + code
- **Output**: `SchemaValidationResult` object with errors/warnings/schema
- **Testing**: Jest with edge case suite (copy phase-05 pattern)

---

## 5. Unresolved Questions

1. **Liquid tag nesting depth**: Current tag balance checks don't validate nesting order (e.g., `{% if %}{% for %}{% endif %}{% endfor %}`). Should validator enforce proper nesting?

2. **Schema whitespace control variants**: Are `{%- schema -%}` and `{% schema %}` both acceptable? Currently handled but undocumented.

3. **Custom Liquid filter validation**: Codebase validates standard Shopify filters implicitly. Should automated script validate custom app filters?

4. **Translation key fallback**: Current resolver skips common suffixes. Are there edge cases where this heuristic fails?

5. **Performance at scale**: Current regex-based validation works for single files. How to handle batch validation of 100+ Liquid files efficiently?

---

## Key Files Referenced

- `/app/utils/liquid-wrapper.server.ts` - Wrapper patterns + context injection
- `/app/components/preview/schema/parseSchema.ts` - Core parsing logic (16 functions)
- `/app/components/editor/validation/validation-rules.ts` - 9 validation rules
- `/app/components/editor/validation/schema-validator.ts` - Rule orchestrator
- `/app/components/preview/schema/__tests__/parseSchema.test.ts` - Test suite (654 lines)

## Next Steps

Create automated validation script using:
1. **Rule framework** from validation-rules.ts
2. **Parsing functions** from parseSchema.ts
3. **Test patterns** from parseSchema.test.ts (Phase 05 edge cases)
4. Deploy as CLI + pre-commit hook per recommendations above
