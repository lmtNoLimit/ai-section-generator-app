/**
 * Schema validator for Liquid sections
 * Runs all validation rules and returns comprehensive results
 */

import { VALIDATION_RULES, type ValidationResult, type ParsedSchema } from './validation-rules';

export interface SchemaValidationResult {
  valid: boolean;
  errors: ValidationResult[];
  warnings: ValidationResult[];
  schema: ParsedSchema | null;
}

/**
 * Extract and parse schema JSON from Liquid code
 */
function extractSchema(code: string): ParsedSchema | null {
  const schemaMatch = code.match(/{%\s*schema\s*%}([\s\S]*?){%\s*endschema\s*%}/);
  if (!schemaMatch) return null;

  try {
    return JSON.parse(schemaMatch[1].trim());
  } catch {
    return null;
  }
}

/**
 * Validate Liquid section code against all validation rules
 * @param code - Full Liquid section code including schema
 * @returns Validation result with errors, warnings, and parsed schema
 */
export function validateSchema(code: string): SchemaValidationResult {
  const schema = extractSchema(code);
  const errors: ValidationResult[] = [];
  const warnings: ValidationResult[] = [];

  for (const rule of VALIDATION_RULES) {
    const result = rule.check(code, schema);

    if (!result.valid) {
      const entry: ValidationResult = {
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

export type { ValidationResult, ParsedSchema };
