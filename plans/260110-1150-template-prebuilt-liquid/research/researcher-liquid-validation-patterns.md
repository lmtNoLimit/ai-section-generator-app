# Liquid Validation Patterns - Technical Reference

**Research Date**: 2026-01-10 | **Codebase Analysis**: Complete

## Quick Reference: Validation Entry Points

### 1. Schema Extraction (Most Reliable Pattern)

**File**: `parseSchema.ts` lines 111-135
```typescript
const SCHEMA_BLOCK_REGEX = /{%-?\s*schema\s*-?%}[\s\S]*?{%-?\s*endschema\s*-?%}/gi;
const schemaMatch = liquidCode.match(/\{%\s*schema\s*%\}([\s\S]*?)\{%\s*endschema\s*%\}/);
const schema = JSON.parse(schemaMatch[1].trim());
```

**Handles**: Whitespace control (`-`), case-insensitive, non-throwing on error

---

## 2. Validation Rules Architecture

### Rule Structure (validation-rules.ts)

```typescript
interface ValidationRule {
  id: string;                    // Unique identifier
  name: string;                  // Human-readable name
  description: string;           // What it validates
  severity: 'error' | 'warning'; // Error stops build, warning doesn't
  check: (code: string, schema: ParsedSchema | null) => ValidationResult;
}

interface ValidationResult {
  valid: boolean;
  message: string;
  line?: number;
  suggestion?: string;
}
```

### All 9 Rules Summary

| ID | Severity | Input | Logic | Output |
|----|----------|-------|-------|--------|
| `schema-exists` | error | code | Regex test for `{%\s*schema\s*%}` | boolean |
| `schema-valid-json` | error | code → schema | Try JSON.parse | error msg |
| `schema-has-name` | error | schema | Check `schema?.name` type | message |
| `schema-has-presets` | warning | schema | Array length > 0 | message |
| `preset-matches-name` | warning | schema | `schema.name === presets[0].name` | match status |
| `number-defaults-are-numbers` | error | schema | Loop settings, check typeof | invalid IDs |
| `range-has-required-props` | error | schema | Check `min, max, step` exist | missing props |
| `select-has-options` | error | schema | Check options array length | invalid IDs |
| `css-uses-section-id` | warning | code | Regex `#shopify-section-{{` | scope status |
| `liquid-tags-balanced` | error | code | Count open/close tag pairs | issue list |

---

## 3. Parsing Function Library

### Core Functions (parseSchema.ts)

#### Translation Resolution
```typescript
resolveTranslationKey(value): string
// Input: "t:sections.hero.settings.heading.label"
// Output: "Heading"
// Logic: Extract last meaningful part, convert snake_case to Title Case
```

#### Settings Extraction
```typescript
extractSettings(schema: SchemaDefinition): SchemaSetting[]
// Filters supported setting types (31 types)
// Resolves translation keys
// Returns array of editable settings
```

#### State Initialization
```typescript
buildInitialState(settings: SchemaSetting[]): SettingsState
// Type-specific defaults:
// checkbox → false
// number/range → min or 0
// color → #000000
// select → first option
// resource types → empty string
// Resource types get no defaults per Shopify spec
```

#### Settings Sync
```typescript
updateSchemaDefaults(code: string, newDefaults: SettingsState): string
// Modifies only `default` attribute in {% schema %}
// Preserves all other attributes
// Skips RESOURCE_TYPES (product, collection, etc.)
// Returns updated liquid code with valid JSON
```

#### Difference Computation
```typescript
getSettingsDiff(schema, newValues): Partial<SettingsState>
// Returns only changed settings
// Uses type defaults when no explicit default
// Used for efficient updates (only sync changed values)
```

---

## 4. Type Constants (Critical for Automation)

### RESOURCE_TYPES (10 types - no defaults)
```typescript
'product', 'collection', 'article', 'blog', 'page', 'link_list',
'product_list', 'collection_list', 'metaobject', 'metaobject_list'
```

### PRESENTATIONAL_TYPES (10 types - block defaults OK)
```typescript
'checkbox', 'color', 'color_background', 'color_scheme',
'font_picker', 'number', 'radio', 'range', 'select', 'text_alignment'
```

---

## 5. Test Coverage Map

### Category: Edge Cases (Phase 05 - 140 test cases)

#### 5.1 Empty Schema (4 tests)
- Liquid without `{% schema %}`
- Empty liquid code
- Whitespace-only code

#### 5.2 Malformed JSON (4 tests)
- Invalid JSON syntax
- Truncated JSON
- Empty schema block
- Whitespace-only block

#### 5.3 Type Coercion (3 tests)
- String to number conversion
- Boolean preservation
- String preservation

#### 5.4 Setting ID Handling (2 tests)
- Unknown setting IDs (ignored)
- All unknown IDs (unchanged)

#### 5.5 Settings Without ID (1 test)
- Header/paragraph display-only types

#### 5.6 Special Characters (3 tests)
- Quotes, newlines, unicode
- JSON escape sequences validated

---

## 6. Liquid Wrapper Patterns (Context Injection)

**File**: `liquid-wrapper.server.ts`

### Security Patterns

```typescript
const VALID_HANDLE_REGEX = /^[a-z0-9-]+$/i;
const VALID_SECTION_ID_REGEX = /^[a-z0-9_-]+$/i;
const MAX_SETTINGS_LENGTH = 70_000; // DoS prevention

function isValidHandle(handle: string): boolean {
  return VALID_HANDLE_REGEX.test(handle) && handle.length <= 255;
}
```

### Context Injection Pattern
```typescript
const assigns = [
  `{% assign product = all_products['${productHandle}'] %}`,
  `{% assign collection = collections['${collectionHandle}'] %}`,
  ...generateSettingsAssigns(settings),
  ...generateBlocksAssigns(blocks),
];

return `${assigns.join('\n')}\n<div class="blocksmith-preview">${cleanedCode}</div>`;
```

---

## 7. Recommended Validation Script Skeleton

```typescript
// validate-sections.ts
import { validateSchema, type SchemaValidationResult } from './schema-validator';
import * as fs from 'fs';
import * as path from 'path';

function validateFile(filePath: string): SchemaValidationResult {
  const code = fs.readFileSync(filePath, 'utf-8');
  return validateSchema(code);
}

function validateDirectory(dirPath: string): Map<string, SchemaValidationResult> {
  const results = new Map();
  const files = fs.globSync(path.join(dirPath, '**/*.liquid'));

  for (const file of files) {
    const result = validateFile(file);
    results.set(file, result);

    if (result.valid) {
      console.log(`✓ ${file}`);
    } else {
      console.log(`✗ ${file}`);
      result.errors.forEach(e => console.error(`  [ERROR] ${e.ruleName}: ${e.message}`));
    }
  }

  return results;
}

// CLI entry
if (require.main === module) {
  const dirPath = process.argv[2] || './app/sections';
  const results = validateDirectory(dirPath);
  const hasErrors = Array.from(results.values()).some(r => !r.valid);
  process.exit(hasErrors ? 1 : 0);
}
```

---

## 8. Function Call Dependency Graph

```
parseSchema(liquidCode)
  ├─ Regex extract {% schema %} block
  ├─ JSON.parse
  └─ returns SchemaDefinition | null

validateSchema(liquidCode)
  ├─ extractSchema(code) [same as parseSchema]
  ├─ VALIDATION_RULES.forEach(rule.check(code, schema))
  └─ returns { valid, errors, warnings, schema }

buildInitialState(settings)
  ├─ Loop settings array
  ├─ Type-specific defaults
  └─ returns SettingsState object

updateSchemaDefaults(liquidCode, newDefaults)
  ├─ Regex extract schema block
  ├─ JSON.parse
  ├─ Update settings[].default
  ├─ JSON.stringify
  └─ Replace in original code (preserves format)
```

---

## 9. Common Usage Patterns in Codebase

### Pattern 1: Extract, Validate, Build State
```typescript
const schema = parseSchema(liquidCode);
const settings = extractSettings(schema);
const initialState = buildInitialState(settings);
```

### Pattern 2: Validate Before Save
```typescript
const validation = validateSchema(liquidCode);
if (!validation.valid) {
  throw new Error(`Validation failed: ${validation.errors[0].message}`);
}
const updatedCode = updateSchemaDefaults(liquidCode, newValues);
```

### Pattern 3: Efficient Updates
```typescript
const diff = getSettingsDiff(schema, newValues);
if (Object.keys(diff).length === 0) {
  // No changes needed
  return code;
}
const updated = updateSchemaDefaults(code, diff);
```

---

## 10. Limitations & Gotchas

1. **Regex-based tag counting**: Doesn't validate nesting order, only pair counts
2. **Translation key heuristic**: Resolver skips common suffixes; edge cases possible
3. **Resource defaults**: Shopify API spec doesn't allow defaults; validation enforces this
4. **Performance**: Regex operations acceptable for <100KB files; batch processing needs optimization
5. **Line numbers**: Validation results don't include line numbers (regex doesn't track position)

---

## Files in This Research

```
plans/reports/
  └─ researcher-260110-1150-liquid-validation-patterns.md (strategic overview)

plans/260110-1150-template-prebuilt-liquid/research/
  └─ researcher-liquid-validation-patterns.md (this file - tactical reference)
```
