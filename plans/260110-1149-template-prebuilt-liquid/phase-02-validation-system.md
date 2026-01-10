# Phase 2: Validation System

## Context

- **Parent Plan**: [plan.md](./plan.md)
- **Dependencies**: [Phase 1](./phase-01-batch-generation-script.md) output
- **Blocks**: Phase 3

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-01-10 |
| Description | Automated validation pipeline for generated Liquid code |
| Priority | P1 |
| Status | pending |
| Effort | 1.5h |

## Requirements

1. Validate all generated templates against existing 9 validation rules
2. Parse and verify schema JSON structure
3. Check CSS scoping with `ai-` prefix
4. Identify common AI hallucinations (invalid forms, missing conditionals)
5. Generate validation report for human review
6. Flag templates needing manual attention

## Related Code Files

```
app/components/editor/validation/validation-rules.ts  # 9 existing rules
app/components/preview/schema/parseSchema.ts          # Schema parsing
scripts/output/generated-templates-*.json             # Phase 1 output
```

## Implementation Steps

### Step 1: Create Validation Script Structure (20 min)

Create `scripts/validate-templates.ts`:

```typescript
import { VALIDATION_RULES, type ParsedSchema } from '../app/components/editor/validation/validation-rules';
import { parseSchema } from '../app/components/preview/schema/parseSchema';

interface ValidationIssue {
  ruleId: string;
  ruleName: string;
  severity: 'error' | 'warning';
  message: string;
  suggestion?: string;
}

interface TemplateValidation {
  title: string;
  category: string;
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  schemaValid: boolean;
  settingsCount: number;
  blocksCount: number;
}
```

### Step 2: Implement Core Validation Function (25 min)

```typescript
function validateTemplate(
  title: string,
  category: string,
  code: string
): TemplateValidation {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  // Parse schema first
  let schema: ParsedSchema | null = null;
  try {
    schema = parseSchema(code) as ParsedSchema;
  } catch {
    errors.push({
      ruleId: 'schema-parse-error',
      ruleName: 'Schema parsing',
      severity: 'error',
      message: 'Failed to parse schema JSON',
    });
  }

  // Run all validation rules
  for (const rule of VALIDATION_RULES) {
    const result = rule.check(code, schema);

    if (!result.valid) {
      const issue: ValidationIssue = {
        ruleId: rule.id,
        ruleName: rule.name,
        severity: rule.severity,
        message: result.message,
        suggestion: result.suggestion,
      };

      if (rule.severity === 'error') {
        errors.push(issue);
      } else {
        warnings.push(issue);
      }
    }
  }

  return {
    title,
    category,
    valid: errors.length === 0,
    errors,
    warnings,
    schemaValid: schema !== null,
    settingsCount: schema?.settings?.length ?? 0,
    blocksCount: schema?.blocks?.length ?? 0,
  };
}
```

### Step 3: Add Custom Validation Rules (25 min)

Add AI-specific checks not in existing rules:

```typescript
const ADDITIONAL_CHECKS = [
  // Check for new_comment forms (common AI hallucination)
  {
    id: 'no-new-comment-forms',
    name: 'No new_comment forms',
    check: (code: string): ValidationIssue | null => {
      if (/form\s+['"]new_comment['"]/.test(code)) {
        return {
          ruleId: 'no-new-comment-forms',
          ruleName: 'No new_comment forms',
          severity: 'error',
          message: 'Contains new_comment form (not supported)',
          suggestion: 'Remove {% form \'new_comment\' %} blocks',
        };
      }
      return null;
    },
  },
  // Check for image_picker conditionals
  {
    id: 'image-picker-conditionals',
    name: 'Image pickers have conditionals',
    check: (code: string, schema: ParsedSchema | null): ValidationIssue | null => {
      if (!schema?.settings) return null;

      const imagePickers = schema.settings.filter(s => s.type === 'image_picker');
      for (const picker of imagePickers) {
        const conditionalPattern = new RegExp(
          `{%\\s*if\\s+section\\.settings\\.${picker.id}\\s*%}`
        );
        if (!conditionalPattern.test(code)) {
          return {
            ruleId: 'image-picker-conditionals',
            ruleName: 'Image pickers have conditionals',
            severity: 'warning',
            message: `Image picker "${picker.id}" may lack conditional check`,
            suggestion: 'Add {% if section.settings.image %} around image usage',
          };
        }
      }
      return null;
    },
  },
  // Check for ai- CSS prefix
  {
    id: 'css-ai-prefix',
    name: 'CSS uses ai- prefix',
    check: (code: string): ValidationIssue | null => {
      const styleMatch = code.match(/{%\s*style\s*%}([\s\S]*?){%\s*endstyle\s*%}/);
      if (!styleMatch) return null;

      const css = styleMatch[1];
      const classNames = css.match(/\.([a-z][a-z0-9-_]*)/gi) || [];

      const nonPrefixed = classNames.filter(cls =>
        !cls.startsWith('.ai-') && !cls.includes('shopify-section')
      );

      if (nonPrefixed.length > 0) {
        return {
          ruleId: 'css-ai-prefix',
          ruleName: 'CSS uses ai- prefix',
          severity: 'warning',
          message: `Classes without ai- prefix: ${nonPrefixed.slice(0, 3).join(', ')}`,
          suggestion: 'Use .ai- prefix for all custom classes',
        };
      }
      return null;
    },
  },
];
```

### Step 4: Implement Batch Validation (20 min)

```typescript
async function validateGeneratedTemplates(inputPath: string) {
  const input = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
  const results: TemplateValidation[] = [];

  for (const template of input.results) {
    if (!template.code) {
      results.push({
        title: template.title,
        category: template.category,
        valid: false,
        errors: [{
          ruleId: 'generation-failed',
          ruleName: 'Generation',
          severity: 'error',
          message: template.error || 'No code generated',
        }],
        warnings: [],
        schemaValid: false,
        settingsCount: 0,
        blocksCount: 0,
      });
      continue;
    }

    const validation = validateTemplate(
      template.title,
      template.category,
      template.code
    );
    results.push(validation);
  }

  return results;
}
```

### Step 5: Generate Validation Report (20 min)

```typescript
function generateReport(validations: TemplateValidation[]) {
  const valid = validations.filter(v => v.valid);
  const invalid = validations.filter(v => !v.valid);
  const withWarnings = validations.filter(v => v.warnings.length > 0);

  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      total: validations.length,
      valid: valid.length,
      invalid: invalid.length,
      withWarnings: withWarnings.length,
      passRate: `${((valid.length / validations.length) * 100).toFixed(1)}%`,
    },
    byCategory: groupBy(validations, 'category'),
    errors: invalid.map(v => ({
      title: v.title,
      errors: v.errors,
    })),
    warnings: withWarnings.map(v => ({
      title: v.title,
      warnings: v.warnings,
    })),
    validTemplates: valid.map(v => v.title),
  };

  return report;
}

// CLI entry
async function main() {
  const inputPath = process.argv[2] || 'scripts/output/generated-templates-latest.json';

  console.log(`Validating templates from: ${inputPath}`);
  const validations = await validateGeneratedTemplates(inputPath);
  const report = generateReport(validations);

  const outPath = `scripts/output/validation-report-${Date.now()}.json`;
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

  console.log('\n=== Validation Summary ===');
  console.log(`Total: ${report.summary.total}`);
  console.log(`Valid: ${report.summary.valid} (${report.summary.passRate})`);
  console.log(`Invalid: ${report.summary.invalid}`);
  console.log(`With Warnings: ${report.summary.withWarnings}`);
  console.log(`\nReport: ${outPath}`);
}
```

### Step 6: Add Package Scripts (10 min)

```json
{
  "scripts": {
    "validate:templates": "npx tsx scripts/validate-templates.ts",
    "validate:templates:latest": "npx tsx scripts/validate-templates.ts scripts/output/generated-templates-latest.json"
  }
}
```

## Success Criteria

1. Validates all 9 existing rules correctly
2. Catches AI-specific hallucinations (new_comment, missing conditionals)
3. Generates actionable report with pass/fail per template
4. Groups issues by severity and category
5. 90%+ templates pass validation after Phase 1

## Human Spot-Check Process

After automated validation, human review 2-3 templates per category (~20-30 total):

1. **Complex templates**: Carousels, countdown timers, interactive elements
2. **Resource pickers**: Product, collection, article sections
3. **Block-based**: Templates with repeatable blocks (features, testimonials)

Focus areas:
- Schema settings completeness (all necessary controls present)
- CSS responsiveness (check mobile breakpoints)
- Placeholder states (when no image/product selected)

## Output Artifacts

```
scripts/
  validate-templates.ts
  output/
    validation-report-{timestamp}.json
```

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Validation too strict | Medium | Low | Separate errors vs warnings |
| Missing edge cases | Low | Medium | Human spot-check process |
| Large report hard to read | Low | Low | Summary + grouped output |

## Unresolved Questions

1. Should validation auto-regenerate failed templates?
2. What's the acceptable warning threshold per template?
