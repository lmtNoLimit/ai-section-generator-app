/**
 * Template Validation Script
 *
 * Validates generated Liquid templates against existing validation rules
 * and additional AI-specific checks.
 *
 * Usage:
 *   npx tsx scripts/validate-templates.ts [input-file]
 *   npx tsx scripts/validate-templates.ts scripts/output/generated-templates-latest.json
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

// ESM module path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dynamic imports for app modules
const { VALIDATION_RULES } = await import(
  "../app/components/editor/validation/validation-rules"
);
const { parseSchema } = await import(
  "../app/components/preview/schema/parseSchema"
);

import type {
  ValidationResult,
  ParsedSchema,
} from "../app/components/editor/validation/validation-rules";

// ============================================
// Types and Interfaces
// ============================================

interface ValidationIssue {
  ruleId: string;
  ruleName: string;
  severity: "error" | "warning";
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

interface GeneratedTemplate {
  title: string;
  category: string;
  code: string | null;
  error?: string;
  retries: number;
  duration: number;
}

interface BatchInput {
  generatedAt: string;
  config: Record<string, unknown>;
  summary: {
    total: number;
    success: number;
    failed: number;
    avgDuration: number;
  };
  results: GeneratedTemplate[];
}

interface CategorySummary {
  total: number;
  valid: number;
  invalid: number;
  passRate: string;
}

interface ValidationReport {
  generatedAt: string;
  inputFile: string;
  summary: {
    total: number;
    valid: number;
    invalid: number;
    withWarnings: number;
    passRate: string;
  };
  byCategory: Record<string, CategorySummary>;
  errors: Array<{
    title: string;
    category: string;
    errors: ValidationIssue[];
  }>;
  warnings: Array<{
    title: string;
    category: string;
    warnings: ValidationIssue[];
  }>;
  validTemplates: string[];
  details: TemplateValidation[];
}

// ============================================
// AI-Specific Validation Rules
// ============================================

type AICheckFunction = (
  code: string,
  schema: ParsedSchema | null
) => ValidationIssue | null;

interface AIValidationCheck {
  id: string;
  name: string;
  check: AICheckFunction;
}

const AI_SPECIFIC_CHECKS: AIValidationCheck[] = [
  // Check for new_comment forms (common AI hallucination)
  {
    id: "no-new-comment-forms",
    name: "No new_comment forms",
    check: (code: string): ValidationIssue | null => {
      if (/form\s+['"]new_comment['"]/.test(code)) {
        return {
          ruleId: "no-new-comment-forms",
          ruleName: "No new_comment forms",
          severity: "error",
          message: "Contains new_comment form (not supported in sections)",
          suggestion: "Remove {% form 'new_comment' %} blocks",
        };
      }
      return null;
    },
  },
  // Check for contact forms in non-form sections
  {
    id: "no-contact-forms-in-sections",
    name: "No contact forms in non-form sections",
    check: (code: string): ValidationIssue | null => {
      // Only flag if it's not explicitly a contact/form section
      if (
        /form\s+['"]contact['"]/.test(code) &&
        !/{%\s*schema\s*%}[\s\S]*"name":\s*"[^"]*(?:contact|form)[^"]*"/i.test(
          code
        )
      ) {
        return {
          ruleId: "no-contact-forms-in-sections",
          ruleName: "No contact forms in non-form sections",
          severity: "warning",
          message: "Contains contact form in non-form section",
          suggestion:
            "Verify contact form is intentional for this section type",
        };
      }
      return null;
    },
  },
  // Check for image_picker conditionals
  {
    id: "image-picker-conditionals",
    name: "Image pickers have conditionals",
    check: (code: string, schema: ParsedSchema | null): ValidationIssue | null => {
      if (!schema?.settings) return null;

      const imagePickers = schema.settings.filter(
        (s) => s.type === "image_picker"
      );
      for (const picker of imagePickers) {
        // Check for conditional around image usage
        const conditionalPattern = new RegExp(
          `{%\\s*if\\s+section\\.settings\\.${picker.id}\\s*%}`,
          "i"
        );
        const usagePattern = new RegExp(
          `section\\.settings\\.${picker.id}`,
          "i"
        );

        // If used but no conditional found
        if (usagePattern.test(code) && !conditionalPattern.test(code)) {
          return {
            ruleId: "image-picker-conditionals",
            ruleName: "Image pickers have conditionals",
            severity: "warning",
            message: `Image picker "${picker.id}" may lack conditional check`,
            suggestion: `Add {% if section.settings.${picker.id} %} around image usage`,
          };
        }
      }
      return null;
    },
  },
  // Check for ai- CSS prefix
  {
    id: "css-ai-prefix",
    name: "CSS uses ai- prefix",
    check: (code: string): ValidationIssue | null => {
      const styleMatch = code.match(
        /{%\s*style\s*%}([\s\S]*?){%\s*endstyle\s*%}/
      );
      if (!styleMatch) return null;

      const css = styleMatch[1];
      // Match CSS class selectors (excluding IDs and element selectors)
      const classMatches = css.match(/\.([a-z][a-z0-9-_]*)/gi) || [];

      // Filter to unique classes and exclude shopify-section and ai- prefixed
      const nonPrefixed = [
        ...new Set(
          classMatches.filter(
            (cls) =>
              !cls.startsWith(".ai-") && !cls.includes("shopify-section")
          )
        ),
      ];

      if (nonPrefixed.length > 0) {
        return {
          ruleId: "css-ai-prefix",
          ruleName: "CSS uses ai- prefix",
          severity: "warning",
          message: `Classes without ai- prefix: ${nonPrefixed.slice(0, 5).join(", ")}${nonPrefixed.length > 5 ? "..." : ""}`,
          suggestion: "Use .ai- prefix for all custom classes",
        };
      }
      return null;
    },
  },
  // Check for hardcoded text in HTML (should use settings)
  {
    id: "no-hardcoded-display-text",
    name: "No hardcoded display text",
    check: (code: string): ValidationIssue | null => {
      // Remove schema block for analysis
      const htmlPart = code.replace(
        /{%\s*schema\s*%}[\s\S]*?{%\s*endschema\s*%}/,
        ""
      );
      // Remove style block
      const withoutStyle = htmlPart.replace(
        /{%\s*style\s*%}[\s\S]*?{%\s*endstyle\s*%}/,
        ""
      );

      // Look for suspicious hardcoded text patterns
      // Headings with hardcoded content
      const hardcodedHeading =
        /<h[1-6][^>]*>\s*[A-Z][a-zA-Z\s]{10,}\s*<\/h[1-6]>/;
      if (hardcodedHeading.test(withoutStyle)) {
        return {
          ruleId: "no-hardcoded-display-text",
          ruleName: "No hardcoded display text",
          severity: "warning",
          message: "Contains hardcoded heading text",
          suggestion:
            "Replace hardcoded text with {{ section.settings.* }} variables",
        };
      }
      return null;
    },
  },
  // Check for proper section.id scoping
  {
    id: "proper-section-scoping",
    name: "Proper section scoping",
    check: (code: string): ValidationIssue | null => {
      const hasStyle = /{%\s*style\s*%}[\s\S]*{%\s*endstyle\s*%}/.test(code);
      if (!hasStyle) return null;

      // Check for proper section ID scoping pattern
      const hasProperScoping =
        /#shopify-section-\{\{\s*section\.id\s*\}\}/.test(code);

      if (!hasProperScoping) {
        return {
          ruleId: "proper-section-scoping",
          ruleName: "Proper section scoping",
          severity: "warning",
          message: "CSS not scoped with #shopify-section-{{ section.id }}",
          suggestion:
            "Use #shopify-section-{{ section.id }} as root selector for CSS",
        };
      }
      return null;
    },
  },
  // Check schema name matches section name requirement
  {
    id: "schema-name-matches-title",
    name: "Schema name consistency",
    check: (code: string, schema: ParsedSchema | null): ValidationIssue | null => {
      if (!schema?.name) return null;

      // Check if schema name is generic (AI hallucination pattern)
      const genericNames = [
        "AI Generated Section",
        "Section",
        "Custom Section",
        "New Section",
      ];

      if (genericNames.includes(schema.name)) {
        return {
          ruleId: "schema-name-matches-title",
          ruleName: "Schema name consistency",
          severity: "error",
          message: `Schema has generic name: "${schema.name}"`,
          suggestion:
            "Replace with descriptive section name matching the template title",
        };
      }
      return null;
    },
  },
];

// ============================================
// Core Validation Functions
// ============================================

/**
 * Validate a single template against all rules
 */
function validateTemplate(
  title: string,
  category: string,
  code: string
): TemplateValidation {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  // Parse schema first
  // parseSchema returns SchemaDefinition which is structurally compatible with ParsedSchema
  let schema: ParsedSchema | null = null;
  try {
    schema = parseSchema(code) as ParsedSchema | null;
  } catch {
    errors.push({
      ruleId: "schema-parse-error",
      ruleName: "Schema parsing",
      severity: "error",
      message: "Failed to parse schema JSON",
      suggestion: "Check for invalid JSON syntax in {% schema %} block",
    });
  }

  // Run existing validation rules
  for (const rule of VALIDATION_RULES) {
    const result: ValidationResult = rule.check(code, schema);

    if (!result.valid) {
      const issue: ValidationIssue = {
        ruleId: rule.id,
        ruleName: rule.name,
        severity: rule.severity,
        message: result.message,
        suggestion: result.suggestion,
      };

      if (rule.severity === "error") {
        errors.push(issue);
      } else {
        warnings.push(issue);
      }
    }
  }

  // Run AI-specific checks
  for (const check of AI_SPECIFIC_CHECKS) {
    const issue = check.check(code, schema);
    if (issue) {
      if (issue.severity === "error") {
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

// ============================================
// Batch Validation
// ============================================

/**
 * Validate all templates from a batch generation output file
 */
function validateGeneratedTemplates(inputPath: string): TemplateValidation[] {
  const input: BatchInput = JSON.parse(fs.readFileSync(inputPath, "utf-8"));
  const results: TemplateValidation[] = [];

  for (const template of input.results) {
    if (!template.code) {
      results.push({
        title: template.title,
        category: template.category,
        valid: false,
        errors: [
          {
            ruleId: "generation-failed",
            ruleName: "Generation",
            severity: "error",
            message: template.error || "No code generated",
          },
        ],
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

// ============================================
// Report Generation
// ============================================

/**
 * Group array by key
 */
function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce(
    (result, item) => {
      const groupKey = String(item[key]);
      if (!result[groupKey]) {
        result[groupKey] = [];
      }
      result[groupKey].push(item);
      return result;
    },
    {} as Record<string, T[]>
  );
}

/**
 * Generate validation report from results
 */
function generateReport(
  validations: TemplateValidation[],
  inputFile: string
): ValidationReport {
  const valid = validations.filter((v) => v.valid);
  const invalid = validations.filter((v) => !v.valid);
  const withWarnings = validations.filter((v) => v.warnings.length > 0);

  // Group by category with summary
  const grouped = groupBy(validations, "category");
  const byCategory: Record<string, CategorySummary> = {};

  for (const [category, items] of Object.entries(grouped)) {
    const catValid = items.filter((v) => v.valid).length;
    byCategory[category] = {
      total: items.length,
      valid: catValid,
      invalid: items.length - catValid,
      passRate: `${((catValid / items.length) * 100).toFixed(1)}%`,
    };
  }

  return {
    generatedAt: new Date().toISOString(),
    inputFile,
    summary: {
      total: validations.length,
      valid: valid.length,
      invalid: invalid.length,
      withWarnings: withWarnings.length,
      passRate: `${((valid.length / validations.length) * 100).toFixed(1)}%`,
    },
    byCategory,
    errors: invalid.map((v) => ({
      title: v.title,
      category: v.category,
      errors: v.errors,
    })),
    warnings: withWarnings.map((v) => ({
      title: v.title,
      category: v.category,
      warnings: v.warnings,
    })),
    validTemplates: valid.map((v) => v.title),
    details: validations,
  };
}

// ============================================
// CLI Entry Point
// ============================================

function findLatestGeneratedFile(): string | null {
  const outputDir = path.join(__dirname, "output");
  if (!fs.existsSync(outputDir)) {
    return null;
  }

  const files = fs
    .readdirSync(outputDir)
    .filter((f) => f.startsWith("generated-templates-") && f.endsWith(".json"))
    .sort()
    .reverse();

  return files.length > 0 ? path.join(outputDir, files[0]) : null;
}

async function main() {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("        Template Validation Script");
  console.log("═══════════════════════════════════════════════════════════");

  // Determine input file
  let inputPath = process.argv[2];

  if (!inputPath) {
    inputPath = findLatestGeneratedFile() || "";
    if (!inputPath) {
      console.error(
        "\n❌ No input file specified and no generated templates found."
      );
      console.error(
        "   Usage: npx tsx scripts/validate-templates.ts [input-file]\n"
      );
      process.exit(1);
    }
    console.log(`\n📁 Using latest file: ${inputPath}`);
  }

  if (!fs.existsSync(inputPath)) {
    console.error(`\n❌ Input file not found: ${inputPath}\n`);
    process.exit(1);
  }

  console.log(`\n🔍 Validating templates from: ${inputPath}`);

  // Run validation
  const validations = validateGeneratedTemplates(inputPath);
  const report = generateReport(validations, inputPath);

  // Ensure output directory exists
  const outputDir = path.join(__dirname, "output");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write report
  const timestamp = Date.now();
  const outPath = path.join(outputDir, `validation-report-${timestamp}.json`);
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

  // Print summary
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("                    VALIDATION SUMMARY");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`\n📊 Overall:`);
  console.log(`   Total:        ${report.summary.total}`);
  console.log(`   ✅ Valid:      ${report.summary.valid}`);
  console.log(`   ❌ Invalid:    ${report.summary.invalid}`);
  console.log(`   ⚠️  Warnings:   ${report.summary.withWarnings}`);
  console.log(`   📈 Pass Rate:  ${report.summary.passRate}`);

  // Category breakdown
  console.log(`\n📂 By Category:`);
  for (const [category, summary] of Object.entries(report.byCategory)) {
    const status = summary.invalid === 0 ? "✅" : "❌";
    console.log(
      `   ${status} ${category}: ${summary.valid}/${summary.total} (${summary.passRate})`
    );
  }

  // Show errors
  if (report.errors.length > 0) {
    console.log(`\n❌ Templates with Errors:`);
    for (const item of report.errors.slice(0, 10)) {
      console.log(`   • ${item.category}/${item.title}:`);
      for (const err of item.errors.slice(0, 3)) {
        console.log(`     - [${err.ruleId}] ${err.message}`);
      }
      if (item.errors.length > 3) {
        console.log(`     ... and ${item.errors.length - 3} more errors`);
      }
    }
    if (report.errors.length > 10) {
      console.log(`   ... and ${report.errors.length - 10} more templates`);
    }
  }

  // Show warnings summary
  if (report.warnings.length > 0) {
    console.log(`\n⚠️  Templates with Warnings: ${report.warnings.length}`);
    // Just show count per category
    const warningsByCategory = groupBy(report.warnings, "category");
    for (const [category, items] of Object.entries(warningsByCategory)) {
      console.log(`   ${category}: ${items.length}`);
    }
  }

  console.log(`\n📁 Full report: ${outPath}`);
  console.log("\n═══════════════════════════════════════════════════════════\n");

  // Exit with error code if any failures
  process.exit(report.summary.invalid > 0 ? 1 : 0);
}

// Run
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
