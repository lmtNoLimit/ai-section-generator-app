# Phase 06: Publishing Flow

## Context Links

- [Main Plan](plan.md)
- [Visual Editing Research](research/researcher-02-visual-editing-targeting-ux.md)
- [Publish Modal](../../app/components/editor/PublishModal.tsx)
- [Section Edit Route](../../app/routes/app.sections.$id.tsx)

## Overview

| Attribute | Value |
|-----------|-------|
| Priority | P1 |
| Status | pending |
| Effort | 4h |
| Description | Schema validation before publishing, "Push to Theme" with confirmation, and feedback bridge |

## Key Research Insights

From Visual Editing Research:
- **Live Validation Pattern**: Real-time field validation as user types
- **Inline Error Messages**: Red text below field, icon indicator
- **Error Hierarchy**: In-form → Form-level summary → Toast notification
- **Block Publishing if Invalid**: Clear blocker with fix guidance

Current architecture has `PublishModal.tsx` and action handlers in route file.

## Requirements

### Functional Requirements

1. **FR-06.1**: Validate Liquid schema before allowing publish
2. **FR-06.2**: Show validation status in publish modal
3. **FR-06.3**: Block publish button if validation fails
4. **FR-06.4**: Display specific error messages with fix suggestions
5. **FR-06.5**: Confirmation dialog before publishing
6. **FR-06.6**: Thumbs up/down feedback after successful publish

### Non-Functional Requirements

1. **NFR-06.1**: Validation completes in <200ms
2. **NFR-06.2**: Clear, actionable error messages
3. **NFR-06.3**: Feedback submission is optional, non-blocking

## Architecture Design

### Component Structure

```
app/components/editor/
├── PublishModal.tsx          # MODIFY - add validation status
├── SchemaValidation.tsx      # NEW - validation result display
├── FeedbackWidget.tsx        # NEW - thumbs up/down UI
└── validation/
    ├── schema-validator.ts   # NEW - comprehensive validation
    └── validation-rules.ts   # NEW - rule definitions
```

### Validation Rules

```typescript
interface ValidationRule {
  id: string;
  name: string;
  description: string;
  severity: 'error' | 'warning';
  check: (code: string, schema: object) => ValidationResult;
}

interface ValidationResult {
  valid: boolean;
  message: string;
  line?: number;
  fix?: string;
}
```

### Validation Categories

1. **Schema Structure**: Valid JSON, required fields (name, settings, presets)
2. **Setting Types**: Correct type values, required properties per type
3. **Default Values**: Type-appropriate defaults (number not string, etc.)
4. **Preset Configuration**: Name matches schema name, valid blocks
5. **Liquid Syntax**: Matching tags, valid filters
6. **CSS Scoping**: Uses section ID for scoping

## Related Code Files

| File | Purpose | Action |
|------|---------|--------|
| `app/components/editor/PublishModal.tsx` | Publish dialog | Modify - add validation |
| `app/components/editor/SchemaValidation.tsx` | Validation UI | Create new |
| `app/components/editor/FeedbackWidget.tsx` | Thumbs feedback | Create new |
| `app/components/editor/validation/schema-validator.ts` | Validator logic | Create new |
| `app/routes/app.sections.$id.tsx` | Publish action | Modify - validate before save |
| `app/routes/api.feedback.tsx` | Feedback endpoint | Create new |

## Implementation Steps

### Step 1: Create Validation Rules (60min)

1. Create `app/components/editor/validation/validation-rules.ts`:
```typescript
export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  severity: 'error' | 'warning';
  check: (code: string, schema: ParsedSchema | null) => ValidationResult;
}

export interface ValidationResult {
  valid: boolean;
  message: string;
  line?: number;
  suggestion?: string;
}

export interface ParsedSchema {
  name?: string;
  settings?: Array<{ type: string; id: string; [key: string]: unknown }>;
  blocks?: Array<{ type: string; name: string; settings?: unknown[] }>;
  presets?: Array<{ name: string }>;
  [key: string]: unknown;
}

export const VALIDATION_RULES: ValidationRule[] = [
  // Schema structure
  {
    id: 'schema-exists',
    name: 'Schema block exists',
    description: 'Section must have a {% schema %} block',
    severity: 'error',
    check: (code) => {
      const hasSchema = /\{%\s*schema\s*%\}[\s\S]*\{%\s*endschema\s*%\}/.test(code);
      return {
        valid: hasSchema,
        message: hasSchema ? 'Schema block found' : 'Missing {% schema %} block',
        suggestion: hasSchema ? undefined : 'Add {% schema %} ... {% endschema %} block',
      };
    },
  },
  {
    id: 'schema-valid-json',
    name: 'Valid JSON in schema',
    description: 'Schema block must contain valid JSON',
    severity: 'error',
    check: (code) => {
      const schemaMatch = code.match(/\{%\s*schema\s*%\}([\s\S]*?)\{%\s*endschema\s*%\}/);
      if (!schemaMatch) {
        return { valid: false, message: 'No schema block to validate' };
      }
      try {
        JSON.parse(schemaMatch[1].trim());
        return { valid: true, message: 'Valid JSON' };
      } catch (e) {
        return {
          valid: false,
          message: `Invalid JSON: ${(e as Error).message}`,
          suggestion: 'Check for trailing commas, missing quotes, or invalid syntax',
        };
      }
    },
  },
  {
    id: 'schema-has-name',
    name: 'Schema has name',
    description: 'Schema must include a "name" property',
    severity: 'error',
    check: (code, schema) => {
      const hasName = schema?.name && typeof schema.name === 'string';
      return {
        valid: !!hasName,
        message: hasName ? `Section name: "${schema.name}"` : 'Missing "name" property',
        suggestion: hasName ? undefined : 'Add "name": "Section Name" to schema',
      };
    },
  },
  {
    id: 'schema-has-presets',
    name: 'Schema has presets',
    description: 'Schema should include presets for theme editor',
    severity: 'warning',
    check: (code, schema) => {
      const hasPresets = schema?.presets && Array.isArray(schema.presets) && schema.presets.length > 0;
      return {
        valid: !!hasPresets,
        message: hasPresets ? 'Presets defined' : 'No presets found',
        suggestion: hasPresets ? undefined : 'Add "presets": [{"name": "Section Name"}] for theme editor',
      };
    },
  },
  {
    id: 'preset-matches-name',
    name: 'Preset matches schema name',
    description: 'Preset name should match schema name',
    severity: 'warning',
    check: (code, schema) => {
      if (!schema?.name || !schema?.presets?.[0]?.name) {
        return { valid: true, message: 'Skipped (no name or preset)' };
      }
      const matches = schema.name === schema.presets[0].name;
      return {
        valid: matches,
        message: matches ? 'Preset name matches' : `Preset "${schema.presets[0].name}" doesn't match schema "${schema.name}"`,
        suggestion: matches ? undefined : `Change preset name to "${schema.name}"`,
      };
    },
  },
  // Setting validation
  {
    id: 'number-defaults-are-numbers',
    name: 'Number defaults are numbers',
    description: 'Number/range settings must have numeric defaults',
    severity: 'error',
    check: (code, schema) => {
      if (!schema?.settings) return { valid: true, message: 'No settings to check' };

      const invalid = schema.settings.filter(s =>
        (s.type === 'number' || s.type === 'range') &&
        s.default !== undefined &&
        typeof s.default !== 'number'
      );

      if (invalid.length === 0) {
        return { valid: true, message: 'All number defaults are numbers' };
      }

      return {
        valid: false,
        message: `Settings with string defaults: ${invalid.map(s => s.id).join(', ')}`,
        suggestion: 'Change "default": "5" to "default": 5 (remove quotes)',
      };
    },
  },
  {
    id: 'range-has-required-props',
    name: 'Range has min/max/step',
    description: 'Range settings must have min, max, and step',
    severity: 'error',
    check: (code, schema) => {
      if (!schema?.settings) return { valid: true, message: 'No settings to check' };

      const ranges = schema.settings.filter(s => s.type === 'range');
      const invalid = ranges.filter(s =>
        s.min === undefined || s.max === undefined || s.step === undefined
      );

      if (invalid.length === 0) {
        return { valid: true, message: 'All range settings have required props' };
      }

      return {
        valid: false,
        message: `Range settings missing props: ${invalid.map(s => s.id).join(', ')}`,
        suggestion: 'Add min, max, and step properties to range settings',
      };
    },
  },
  {
    id: 'select-has-options',
    name: 'Select has options',
    description: 'Select/radio settings must have options array',
    severity: 'error',
    check: (code, schema) => {
      if (!schema?.settings) return { valid: true, message: 'No settings to check' };

      const selects = schema.settings.filter(s => s.type === 'select' || s.type === 'radio');
      const invalid = selects.filter(s => !Array.isArray(s.options) || s.options.length === 0);

      if (invalid.length === 0) {
        return { valid: true, message: 'All select settings have options' };
      }

      return {
        valid: false,
        message: `Settings missing options: ${invalid.map(s => s.id).join(', ')}`,
        suggestion: 'Add "options": [{"value": "x", "label": "X"}] to select settings',
      };
    },
  },
  // CSS scoping
  {
    id: 'css-uses-section-id',
    name: 'CSS uses section ID',
    description: 'CSS should be scoped with section ID',
    severity: 'warning',
    check: (code) => {
      const hasStyle = /\{%\s*style\s*%\}[\s\S]*\{%\s*endstyle\s*%\}/.test(code);
      if (!hasStyle) {
        return { valid: true, message: 'No style block' };
      }

      const usesSectionId = /shopify-section-\{\{\s*section\.id\s*\}\}/.test(code);
      return {
        valid: usesSectionId,
        message: usesSectionId ? 'CSS properly scoped' : 'CSS not scoped with section ID',
        suggestion: usesSectionId ? undefined : 'Use #shopify-section-{{ section.id }} as root selector',
      };
    },
  },
  // Liquid syntax
  {
    id: 'liquid-tags-balanced',
    name: 'Liquid tags balanced',
    description: 'Opening and closing Liquid tags must match',
    severity: 'error',
    check: (code) => {
      const openTags = ['if', 'unless', 'for', 'case', 'capture', 'form', 'paginate', 'tablerow'];
      const issues: string[] = [];

      for (const tag of openTags) {
        const openCount = (code.match(new RegExp(`\\{%\\s*${tag}\\s`, 'g')) || []).length;
        const closeCount = (code.match(new RegExp(`\\{%\\s*end${tag}\\s*%\\}`, 'g')) || []).length;

        if (openCount !== closeCount) {
          issues.push(`${tag}: ${openCount} open, ${closeCount} close`);
        }
      }

      return {
        valid: issues.length === 0,
        message: issues.length === 0 ? 'All tags balanced' : `Unbalanced tags: ${issues.join('; ')}`,
        suggestion: issues.length === 0 ? undefined : 'Check for missing {% end... %} tags',
      };
    },
  },
];
```

### Step 2: Create Schema Validator (45min)

1. Create `app/components/editor/validation/schema-validator.ts`:
```typescript
import { VALIDATION_RULES, type ValidationResult, type ParsedSchema } from './validation-rules';

export interface SchemaValidationResult {
  valid: boolean;
  errors: ValidationResult[];
  warnings: ValidationResult[];
  schema: ParsedSchema | null;
}

export function validateSchema(code: string): SchemaValidationResult {
  // Extract and parse schema
  const schemaMatch = code.match(/\{%\s*schema\s*%\}([\s\S]*?)\{%\s*endschema\s*%\}/);
  let schema: ParsedSchema | null = null;

  if (schemaMatch) {
    try {
      schema = JSON.parse(schemaMatch[1].trim());
    } catch {
      // Will be caught by validation rule
    }
  }

  // Run all validation rules
  const errors: ValidationResult[] = [];
  const warnings: ValidationResult[] = [];

  for (const rule of VALIDATION_RULES) {
    const result = rule.check(code, schema);

    if (!result.valid) {
      const entry = {
        ...result,
        ruleId: rule.id,
        ruleName: rule.name,
      };

      if (rule.severity === 'error') {
        errors.push(entry);
      } else {
        warnings.push(entry);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    schema,
  };
}
```

### Step 3: Create SchemaValidation Component (45min)

1. Create `app/components/editor/SchemaValidation.tsx`:
```typescript
import type { SchemaValidationResult } from './validation/schema-validator';

interface SchemaValidationProps {
  validation: SchemaValidationResult;
  isLoading?: boolean;
}

export function SchemaValidation({ validation, isLoading }: SchemaValidationProps) {
  if (isLoading) {
    return (
      <s-box padding="base">
        <s-stack direction="inline" gap="small" alignItems="center">
          <s-spinner size="small" />
          <s-text color="subdued">Validating...</s-text>
        </s-stack>
      </s-box>
    );
  }

  const { valid, errors, warnings } = validation;

  return (
    <s-box padding="base">
      <s-stack direction="block" gap="base">
        {/* Status header */}
        <s-stack direction="inline" gap="small" alignItems="center">
          {valid ? (
            <>
              <s-icon name="check-circle" color="success" />
              <s-text fontWeight="semibold" color="success">Ready to publish</s-text>
            </>
          ) : (
            <>
              <s-icon name="alert-circle" color="critical" />
              <s-text fontWeight="semibold" color="critical">
                {errors.length} error{errors.length !== 1 ? 's' : ''} found
              </s-text>
            </>
          )}

          {warnings.length > 0 && (
            <s-badge tone="warning">{warnings.length} warning{warnings.length !== 1 ? 's' : ''}</s-badge>
          )}
        </s-stack>

        {/* Errors */}
        {errors.length > 0 && (
          <s-box>
            <s-stack direction="block" gap="small">
              {errors.map((error, index) => (
                <s-box
                  key={index}
                  padding="small"
                  background="critical-subdued"
                  borderRadius="base"
                >
                  <s-stack direction="block" gap="extra-small">
                    <s-text fontWeight="semibold" color="critical">
                      {error.message}
                    </s-text>
                    {error.suggestion && (
                      <s-text variant="bodySm" color="subdued">
                        Fix: {error.suggestion}
                      </s-text>
                    )}
                  </s-stack>
                </s-box>
              ))}
            </s-stack>
          </s-box>
        )}

        {/* Warnings (collapsible) */}
        {warnings.length > 0 && (
          <s-disclosure heading={`${warnings.length} warning${warnings.length !== 1 ? 's' : ''}`}>
            <s-stack direction="block" gap="small">
              {warnings.map((warning, index) => (
                <s-box
                  key={index}
                  padding="small"
                  background="warning-subdued"
                  borderRadius="base"
                >
                  <s-stack direction="block" gap="extra-small">
                    <s-text fontWeight="medium">{warning.message}</s-text>
                    {warning.suggestion && (
                      <s-text variant="bodySm" color="subdued">
                        Suggestion: {warning.suggestion}
                      </s-text>
                    )}
                  </s-stack>
                </s-box>
              ))}
            </s-stack>
          </s-disclosure>
        )}
      </s-stack>
    </s-box>
  );
}
```

### Step 4: Create FeedbackWidget Component (30min)

1. Create `app/components/editor/FeedbackWidget.tsx`:
```typescript
import { useState } from 'react';
import { useFetcher } from 'react-router';

interface FeedbackWidgetProps {
  sectionId: string;
  onDismiss?: () => void;
}

export function FeedbackWidget({ sectionId, onDismiss }: FeedbackWidgetProps) {
  const [submitted, setSubmitted] = useState(false);
  const fetcher = useFetcher();

  const handleFeedback = (positive: boolean) => {
    fetcher.submit(
      { sectionId, positive: String(positive) },
      { method: 'POST', action: '/api/feedback' }
    );
    setSubmitted(true);
    setTimeout(() => onDismiss?.(), 2000);
  };

  if (submitted) {
    return (
      <s-box padding="base" background="success-subdued" borderRadius="base">
        <s-stack direction="inline" gap="small" alignItems="center">
          <s-icon name="check" color="success" />
          <s-text color="success">Thanks for your feedback!</s-text>
        </s-stack>
      </s-box>
    );
  }

  return (
    <s-box padding="base" background="subdued" borderRadius="base">
      <s-stack direction="block" gap="small">
        <s-text>How was this AI-generated section?</s-text>
        <s-stack direction="inline" gap="base">
          <s-button
            variant="secondary"
            size="small"
            onClick={() => handleFeedback(true)}
          >
            <s-icon name="thumbs-up" />
            Good
          </s-button>
          <s-button
            variant="secondary"
            size="small"
            onClick={() => handleFeedback(false)}
          >
            <s-icon name="thumbs-down" />
            Needs work
          </s-button>
          <s-button
            variant="plain"
            size="small"
            onClick={onDismiss}
          >
            Skip
          </s-button>
        </s-stack>
      </s-stack>
    </s-box>
  );
}
```

### Step 5: Create Feedback API Endpoint (30min)

1. Create `app/routes/api.feedback.tsx`:
```typescript
import { json, type ActionFunctionArgs } from 'react-router';
import { authenticate } from '../shopify.server';
import prisma from '../db.server';

export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);

  const formData = await request.formData();
  const sectionId = formData.get('sectionId') as string;
  const positive = formData.get('positive') === 'true';

  if (!sectionId) {
    return json({ error: 'Section ID required' }, { status: 400 });
  }

  try {
    // Store feedback (add SectionFeedback model if needed)
    await prisma.sectionFeedback.create({
      data: {
        sectionId,
        shop: session.shop,
        positive,
        createdAt: new Date(),
      },
    });

    return json({ success: true });
  } catch (error) {
    console.error('Feedback error:', error);
    return json({ success: true }); // Don't fail silently
  }
}
```

### Step 6: Integrate Validation into PublishModal (45min)

1. Modify `app/components/editor/PublishModal.tsx`:
```typescript
import { useMemo } from 'react';
import { validateSchema } from './validation/schema-validator';
import { SchemaValidation } from './SchemaValidation';

// In component
const validation = useMemo(() => {
  return validateSchema(code);
}, [code]);

// Add to modal content
<SchemaValidation validation={validation} />

// Disable publish button if invalid
<s-button
  variant="primary"
  disabled={!validation.valid || isPublishing}
  onClick={handlePublish}
>
  Publish to Theme
</s-button>
```

### Step 7: Show Feedback After Publish (30min)

1. Modify success handling in route:
```typescript
// After successful publish, show feedback widget
{publishSuccess && (
  <FeedbackWidget
    sectionId={section.id}
    onDismiss={() => setPublishSuccess(false)}
  />
)}
```

## Todo List

- [ ] Create validation-rules.ts with all rules
- [ ] Create schema-validator.ts
- [ ] Create SchemaValidation component
- [ ] Create FeedbackWidget component
- [ ] Create api.feedback.tsx endpoint
- [ ] Add SectionFeedback model to Prisma schema
- [ ] Integrate validation into PublishModal
- [ ] Disable publish button when invalid
- [ ] Show feedback widget after publish
- [ ] Test validation with various sections

## Success Criteria

1. Validation runs in <200ms
2. Publish button disabled when errors exist
3. Error messages are clear and actionable
4. Feedback widget appears after successful publish
5. Feedback submission works reliably

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Validation too strict | Medium | Medium | Start with critical rules only |
| False positives | Low | Medium | Add escape hatch option |
| Feedback fatigue | Low | Low | Only show once per publish |

## Security Considerations

- Validate sectionId belongs to shop before feedback save
- Rate limit feedback submissions
- Sanitize feedback data before storage

---

**Phase Status**: Pending
**Estimated Completion**: 4 hours
**Dependencies**: Existing PublishModal, Prisma schema update
