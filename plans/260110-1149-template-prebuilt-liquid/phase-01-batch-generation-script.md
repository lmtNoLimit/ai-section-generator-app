# Phase 1: Batch Generation Script

## Context

- **Parent Plan**: [plan.md](./plan.md)
- **Dependencies**: None (first phase)
- **Blocks**: Phase 2, 3, 4

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-01-10 |
| Description | Build batch generation script using existing AIService |
| Priority | P1 |
| Status | completed |
| Effort | 2.5h |
| Review | [code-reviewer-260110-1209-batch-template-script.md](../reports/code-reviewer-260110-1209-batch-template-script.md) |
| Review Status | APPROVED |
| Completed | 2026-01-10 14:30 UTC |

## Requirements

1. Generate Liquid code for all 99 templates missing `code` property
2. Use existing `AIService.generateSection()` (non-streaming)
3. Rate limiting to respect Gemini API quotas (~60 RPM free tier)
4. Retry logic with exponential backoff
5. Progress tracking and logging
6. Output to JSON file for review before integration

## Related Code Files

```
app/services/ai.server.ts          # AIService, SYSTEM_PROMPT
app/data/default-templates.ts      # DefaultTemplate interface, 102 templates
```

## Implementation Steps

### Step 1: Create Script Structure (30 min)

Create `scripts/batch-generate-templates.ts`:

```typescript
// Structure outline
import { AIService, SYSTEM_PROMPT } from '../app/services/ai.server';
import { DEFAULT_TEMPLATES, type DefaultTemplate } from '../app/data/default-templates';

interface GenerationResult {
  title: string;
  category: string;
  code: string | null;
  error?: string;
  retries: number;
}

interface BatchConfig {
  concurrency: number;      // Max 2 for rate limiting
  retryAttempts: number;    // Default 2
  retryDelayMs: number;     // Default 2000, doubles on retry
  categories?: string[];    // Filter to specific categories
}
```

### Step 2: Implement Core Generation Logic (45 min)

```typescript
async function generateTemplate(
  template: DefaultTemplate,
  aiService: AIService,
  config: BatchConfig
): Promise<GenerationResult> {
  let lastError: string | undefined;

  for (let attempt = 0; attempt <= config.retryAttempts; attempt++) {
    try {
      const code = await aiService.generateSection(template.prompt);

      // Basic validation: must have {% schema %}
      if (!/{%\s*schema\s*%}/.test(code)) {
        throw new Error('Missing schema block');
      }

      return {
        title: template.title,
        category: template.category,
        code,
        retries: attempt,
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);

      if (attempt < config.retryAttempts) {
        const delay = config.retryDelayMs * Math.pow(2, attempt);
        console.log(`  Retry ${attempt + 1} in ${delay}ms...`);
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
  };
}
```

### Step 3: Implement Batch Processing with Semaphore (30 min)

```typescript
async function batchGenerate(config: BatchConfig): Promise<GenerationResult[]> {
  const aiService = new AIService();
  const results: GenerationResult[] = [];

  // Filter templates needing generation
  let templates = DEFAULT_TEMPLATES.filter(t => !t.code);

  if (config.categories?.length) {
    templates = templates.filter(t => config.categories!.includes(t.category));
  }

  console.log(`Generating ${templates.length} templates...`);

  // Sequential processing for rate limiting
  for (let i = 0; i < templates.length; i++) {
    const template = templates[i];
    console.log(`[${i + 1}/${templates.length}] ${template.title}`);

    const result = await generateTemplate(template, aiService, config);
    results.push(result);

    // Rate limit: 1 request per second minimum
    if (i < templates.length - 1) {
      await sleep(1000);
    }
  }

  return results;
}
```

### Step 4: Add CLI Interface and Output (30 min)

```typescript
// CLI entry point
async function main() {
  const args = process.argv.slice(2);
  const categoryArg = args.find(a => a.startsWith('--category='));

  const config: BatchConfig = {
    concurrency: 1,
    retryAttempts: 2,
    retryDelayMs: 2000,
    categories: categoryArg
      ? categoryArg.split('=')[1].split(',')
      : undefined,
  };

  console.log('Starting batch generation...');
  console.log(`Config: ${JSON.stringify(config)}`);

  const results = await batchGenerate(config);

  // Write results to JSON
  const output = {
    generatedAt: new Date().toISOString(),
    config,
    summary: {
      total: results.length,
      success: results.filter(r => r.code).length,
      failed: results.filter(r => !r.code).length,
    },
    results,
  };

  const outPath = `scripts/output/generated-templates-${Date.now()}.json`;
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

  console.log(`\nResults written to: ${outPath}`);
  console.log(`Success: ${output.summary.success}/${output.summary.total}`);
}
```

### Step 5: Add Enhanced Prompt Wrapper (25 min)

Wrap template prompts with reinforcement:

```typescript
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
- Responsive mobile-first design`;
}
```

### Step 6: Create Output Directory and Package Scripts (10 min)

```bash
# Create output directory
mkdir -p scripts/output

# Add to package.json scripts
"generate:templates": "npx tsx scripts/batch-generate-templates.ts",
"generate:templates:hero": "npx tsx scripts/batch-generate-templates.ts --category=hero",
"generate:templates:features": "npx tsx scripts/batch-generate-templates.ts --category=features",
"generate:templates:cta": "npx tsx scripts/batch-generate-templates.ts --category=cta"
```

## Success Criteria

1. Script runs without errors
2. Generates valid Liquid for 90%+ of templates on first attempt
3. Output JSON includes all template metadata
4. Failed templates logged with actionable error messages
5. Rate limiting prevents API quota issues

## Output Artifacts

```
scripts/
  batch-generate-templates.ts
  output/
    generated-templates-{timestamp}.json
```

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| API quota exceeded | Low | Medium | Sequential processing, 1 RPS |
| Prompt generates invalid code | Medium | Low | Retry logic, enhanced prompts |
| Long running time (~100 templates @ 1 RPS = ~2 min) | Expected | None | Progress logging |

## Unresolved Questions

1. Should we cache successful generations to avoid regeneration on re-runs?
2. Should failed templates fall back to simpler prompts?
