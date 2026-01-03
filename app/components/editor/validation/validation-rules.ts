/**
 * Liquid section schema validation rules
 * Validates schema structure, settings, and Liquid syntax
 */

/**
 * Sanitize user-provided strings to prevent XSS in validation messages
 * Escapes HTML special characters
 */
function sanitize(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

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
  ruleId?: string;
  ruleName?: string;
}

export interface ParsedSchema {
  name?: string;
  settings?: Array<{
    type: string;
    id: string;
    default?: unknown;
    min?: number;
    max?: number;
    step?: number;
    options?: Array<{ value: string; label: string }>;
    [key: string]: unknown;
  }>;
  blocks?: Array<{
    type: string;
    name: string;
    settings?: unknown[];
  }>;
  presets?: Array<{ name: string }>;
  [key: string]: unknown;
}

export const VALIDATION_RULES: ValidationRule[] = [
  // Schema structure rules
  {
    id: 'schema-exists',
    name: 'Schema block exists',
    description: 'Section must have a {% schema %} block',
    severity: 'error',
    check: (code) => {
      const hasSchema = /{%\s*schema\s*%}[\s\S]*{%\s*endschema\s*%}/.test(code);
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
      const schemaMatch = code.match(/{%\s*schema\s*%}([\s\S]*?){%\s*endschema\s*%}/);
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
    check: (_code, schema) => {
      const hasName = schema?.name && typeof schema.name === 'string';
      return {
        valid: !!hasName,
        message: hasName
          ? `Section name: "${sanitize(schema.name || '')}"`
          : 'Missing "name" property',
        suggestion: hasName ? undefined : 'Add "name": "Section Name" to schema',
      };
    },
  },
  {
    id: 'schema-has-presets',
    name: 'Schema has presets',
    description: 'Schema should include presets for theme editor',
    severity: 'warning',
    check: (_code, schema) => {
      const hasPresets =
        schema?.presets && Array.isArray(schema.presets) && schema.presets.length > 0;
      return {
        valid: !!hasPresets,
        message: hasPresets ? 'Presets defined' : 'No presets found',
        suggestion: hasPresets
          ? undefined
          : 'Add "presets": [{"name": "Section Name"}] for theme editor',
      };
    },
  },
  {
    id: 'preset-matches-name',
    name: 'Preset matches schema name',
    description: 'Preset name should match schema name',
    severity: 'warning',
    check: (_code, schema) => {
      if (!schema?.name || !schema?.presets?.[0]?.name) {
        return { valid: true, message: 'Skipped (no name or preset)' };
      }
      const matches = schema.name === schema.presets[0].name;
      const presetName = sanitize(schema.presets[0].name);
      const schemaName = sanitize(schema.name);
      return {
        valid: matches,
        message: matches
          ? 'Preset name matches'
          : `Preset "${presetName}" doesn't match schema "${schemaName}"`,
        suggestion: matches ? undefined : `Change preset name to "${schemaName}"`,
      };
    },
  },
  // Setting validation rules
  {
    id: 'number-defaults-are-numbers',
    name: 'Number defaults are numbers',
    description: 'Number/range settings must have numeric defaults',
    severity: 'error',
    check: (_code, schema) => {
      if (!schema?.settings) return { valid: true, message: 'No settings to check' };

      const invalid = schema.settings.filter(
        (s) =>
          (s.type === 'number' || s.type === 'range') &&
          s.default !== undefined &&
          typeof s.default !== 'number'
      );

      if (invalid.length === 0) {
        return { valid: true, message: 'All number defaults are numbers' };
      }

      return {
        valid: false,
        message: `Settings with string defaults: ${invalid.map((s) => s.id).join(', ')}`,
        suggestion: 'Change "default": "5" to "default": 5 (remove quotes)',
      };
    },
  },
  {
    id: 'range-has-required-props',
    name: 'Range has min/max/step',
    description: 'Range settings must have min, max, and step',
    severity: 'error',
    check: (_code, schema) => {
      if (!schema?.settings) return { valid: true, message: 'No settings to check' };

      const ranges = schema.settings.filter((s) => s.type === 'range');
      const invalid = ranges.filter(
        (s) => s.min === undefined || s.max === undefined || s.step === undefined
      );

      if (invalid.length === 0) {
        return { valid: true, message: 'All range settings have required props' };
      }

      return {
        valid: false,
        message: `Range settings missing props: ${invalid.map((s) => s.id).join(', ')}`,
        suggestion: 'Add min, max, and step properties to range settings',
      };
    },
  },
  {
    id: 'select-has-options',
    name: 'Select has options',
    description: 'Select/radio settings must have options array',
    severity: 'error',
    check: (_code, schema) => {
      if (!schema?.settings) return { valid: true, message: 'No settings to check' };

      const selects = schema.settings.filter((s) => s.type === 'select' || s.type === 'radio');
      const invalid = selects.filter(
        (s) => !Array.isArray(s.options) || s.options.length === 0
      );

      if (invalid.length === 0) {
        return { valid: true, message: 'All select settings have options' };
      }

      return {
        valid: false,
        message: `Settings missing options: ${invalid.map((s) => s.id).join(', ')}`,
        suggestion: 'Add "options": [{"value": "x", "label": "X"}] to select settings',
      };
    },
  },
  // CSS scoping rule
  {
    id: 'css-uses-section-id',
    name: 'CSS uses section ID',
    description: 'CSS should be scoped with section ID',
    severity: 'warning',
    check: (code) => {
      const hasStyle = /{%\s*style\s*%}[\s\S]*{%\s*endstyle\s*%}/.test(code);
      if (!hasStyle) {
        return { valid: true, message: 'No style block' };
      }

      const usesSectionId = /shopify-section-\{\{\s*section\.id\s*\}\}/.test(code);
      return {
        valid: usesSectionId,
        message: usesSectionId ? 'CSS properly scoped' : 'CSS not scoped with section ID',
        suggestion: usesSectionId
          ? undefined
          : 'Use #shopify-section-{{ section.id }} as root selector',
      };
    },
  },
  // Liquid syntax rule
  {
    id: 'liquid-tags-balanced',
    name: 'Liquid tags balanced',
    description: 'Opening and closing Liquid tags must match',
    severity: 'error',
    check: (code) => {
      const openTags = [
        'if',
        'unless',
        'for',
        'case',
        'capture',
        'form',
        'paginate',
        'tablerow',
      ];
      const issues: string[] = [];

      for (const tag of openTags) {
        const openCount = (code.match(new RegExp(`{%\\s*${tag}\\s`, 'g')) || []).length;
        const closeCount = (code.match(new RegExp(`{%\\s*end${tag}\\s*%}`, 'g')) || []).length;

        if (openCount !== closeCount) {
          issues.push(`${tag}: ${openCount} open, ${closeCount} close`);
        }
      }

      return {
        valid: issues.length === 0,
        message:
          issues.length === 0 ? 'All tags balanced' : `Unbalanced tags: ${issues.join('; ')}`,
        suggestion: issues.length === 0 ? undefined : 'Check for missing {% end... %} tags',
      };
    },
  },
];
