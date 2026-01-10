/**
 * Batch Template Generation Script
 *
 * Generates Liquid code for all templates missing the `code` property
 * using the existing AIService.
 *
 * Usage:
 *   npx tsx scripts/batch-generate-templates.ts
 *   npx tsx scripts/batch-generate-templates.ts --category=hero
 *   npx tsx scripts/batch-generate-templates.ts --dry-run
 *   npx tsx scripts/batch-generate-templates.ts --limit=5
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

// ESM module path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dynamic imports for app modules
const { AIService } = await import("../app/services/ai.server");
const { DEFAULT_TEMPLATES } = await import("../app/data/default-templates");
import type { DefaultTemplate } from "../app/data/default-templates";

// ============================================
// Types and Interfaces
// ============================================

interface GenerationResult {
  title: string;
  category: string;
  code: string | null;
  error?: string;
  retries: number;
  duration: number; // ms
}

interface BatchConfig {
  retryAttempts: number;
  retryDelayMs: number;
  rateLimitDelayMs: number;
  categories?: string[];
  limit?: number;
  dryRun: boolean;
}

interface BatchOutput {
  generatedAt: string;
  config: BatchConfig;
  summary: {
    total: number;
    success: number;
    failed: number;
    avgDuration: number;
  };
  results: GenerationResult[];
}

// ============================================
// Utility Functions
// ============================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseArgs(): BatchConfig {
  const args = process.argv.slice(2);

  const categoryArg = args.find((a) => a.startsWith("--category="));
  const limitArg = args.find((a) => a.startsWith("--limit="));
  const dryRun = args.includes("--dry-run");

  return {
    retryAttempts: 2,
    retryDelayMs: 2000,
    rateLimitDelayMs: 1500, // 1.5s between requests for safety
    categories: categoryArg ? categoryArg.split("=")[1].split(",") : undefined,
    limit: limitArg ? parseInt(limitArg.split("=")[1], 10) : undefined,
    dryRun,
  };
}

/**
 * Enhance template prompt with additional context for better generation
 */
function enhancePrompt(template: DefaultTemplate): string {
  return `${template.prompt}

REQUIREMENTS:
- Section name: "${template.title}"
- Category: ${template.category}
- Follow system prompt rules exactly
- Schema must be first, valid JSON
- All settings must have unique IDs
- Include presets with matching name
- Use ai- prefix for CSS classes
- Responsive mobile-first design
- Include proper placeholder handling for images`;
}

/**
 * Basic validation of generated Liquid code
 */
function validateLiquidCode(code: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Must have schema block
  if (!/{%\s*schema\s*%}/.test(code)) {
    errors.push("Missing {% schema %} block");
  }

  // Must have endschema
  if (!/{%\s*endschema\s*%}/.test(code)) {
    errors.push("Missing {% endschema %} block");
  }

  // Schema should contain valid JSON structure
  const schemaMatch = code.match(/{%\s*schema\s*%}([\s\S]*?){%\s*endschema\s*%}/);
  if (schemaMatch) {
    try {
      const schemaJson = JSON.parse(schemaMatch[1].trim());
      if (!schemaJson.name) {
        errors.push("Schema missing 'name' property");
      }
      if (!schemaJson.presets || !Array.isArray(schemaJson.presets)) {
        errors.push("Schema missing 'presets' array");
      }
    } catch {
      errors.push("Schema contains invalid JSON");
    }
  }

  // Should have style block for CSS
  if (!/{%\s*style\s*%}/.test(code) && !/<style>/.test(code)) {
    // Warn but don't fail - some sections might be CSS-minimal
    // errors.push("Missing style block");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================
// Core Generation Logic
// ============================================

async function generateTemplate(
  template: DefaultTemplate,
  aiService: InstanceType<typeof AIService>,
  config: BatchConfig
): Promise<GenerationResult> {
  const startTime = Date.now();
  let lastError: string | undefined;

  if (config.dryRun) {
    return {
      title: template.title,
      category: template.category,
      code: "[DRY RUN - would generate here]",
      retries: 0,
      duration: 0,
    };
  }

  for (let attempt = 0; attempt <= config.retryAttempts; attempt++) {
    try {
      const enhancedPrompt = enhancePrompt(template);
      const code = await aiService.generateSection(enhancedPrompt);

      // Validate generated code
      const validation = validateLiquidCode(code);
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
      }

      return {
        title: template.title,
        category: template.category,
        code,
        retries: attempt,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);

      if (attempt < config.retryAttempts) {
        const delay = config.retryDelayMs * Math.pow(2, attempt);
        console.log(`    ⚠️  Retry ${attempt + 1} in ${delay}ms: ${lastError}`);
        await sleep(delay);
      }
    }
  }

  return {
    title: template.title,
    category: template.category,
    code: null,
    error: lastError,
    retries: config.retryAttempts,
    duration: Date.now() - startTime,
  };
}

// ============================================
// Batch Processing
// ============================================

async function batchGenerate(config: BatchConfig): Promise<GenerationResult[]> {
  const aiService = new AIService();
  const results: GenerationResult[] = [];

  // Filter templates needing generation (no code property)
  let templates = DEFAULT_TEMPLATES.filter(
    (t: DefaultTemplate) => !t.code
  ) as DefaultTemplate[];

  // Filter by category if specified
  if (config.categories?.length) {
    templates = templates.filter((t) => config.categories!.includes(t.category));
  }

  // Apply limit if specified
  if (config.limit && config.limit > 0) {
    templates = templates.slice(0, config.limit);
  }

  console.log(`\n📋 Generating ${templates.length} templates...\n`);
  console.log(`   Config: ${JSON.stringify(config, null, 2)}\n`);

  // Sequential processing for rate limiting
  for (let i = 0; i < templates.length; i++) {
    const template = templates[i];
    const progress = `[${(i + 1).toString().padStart(3)}/${templates.length}]`;
    console.log(`${progress} 🔄 ${template.category}/${template.title}`);

    const result = await generateTemplate(template, aiService, config);
    results.push(result);

    if (result.code) {
      console.log(
        `${progress} ✅ Generated in ${result.duration}ms (${result.retries} retries)`
      );
    } else {
      console.log(`${progress} ❌ Failed: ${result.error}`);
    }

    // Rate limit: wait between requests (except for last one)
    if (i < templates.length - 1 && !config.dryRun) {
      await sleep(config.rateLimitDelayMs);
    }
  }

  return results;
}

// ============================================
// Main Entry Point
// ============================================

async function main() {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("        Batch Template Generation Script");
  console.log("═══════════════════════════════════════════════════════════");

  const config = parseArgs();

  if (config.dryRun) {
    console.log("\n⚠️  DRY RUN MODE - No actual API calls will be made\n");
  }

  const startTime = Date.now();
  const results = await batchGenerate(config);
  const totalDuration = Date.now() - startTime;

  // Calculate summary
  const successful = results.filter((r) => r.code !== null);
  const failed = results.filter((r) => r.code === null);
  const avgDuration =
    successful.length > 0
      ? Math.round(
          successful.reduce((sum, r) => sum + r.duration, 0) / successful.length
        )
      : 0;

  // Prepare output
  const output: BatchOutput = {
    generatedAt: new Date().toISOString(),
    config,
    summary: {
      total: results.length,
      success: successful.length,
      failed: failed.length,
      avgDuration,
    },
    results,
  };

  // Ensure output directory exists and write results
  const timestamp = Date.now();
  const outputDir = path.join(__dirname, "output");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  const outPath = path.join(outputDir, `generated-templates-${timestamp}.json`);
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

  // Print summary
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("                    GENERATION COMPLETE");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`\n📊 Summary:`);
  console.log(`   Total:     ${results.length}`);
  console.log(`   ✅ Success: ${successful.length}`);
  console.log(`   ❌ Failed:  ${failed.length}`);
  console.log(`   ⏱️  Avg time: ${avgDuration}ms per template`);
  console.log(`   ⏱️  Total:   ${Math.round(totalDuration / 1000)}s`);
  console.log(`\n📁 Results written to: ${outPath}`);

  if (failed.length > 0) {
    console.log(`\n❌ Failed templates:`);
    failed.forEach((f) => {
      console.log(`   - ${f.category}/${f.title}: ${f.error}`);
    });
  }

  console.log("\n═══════════════════════════════════════════════════════════\n");

  // Exit with error code if any failures
  process.exit(failed.length > 0 ? 1 : 0);
}

// Run
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
