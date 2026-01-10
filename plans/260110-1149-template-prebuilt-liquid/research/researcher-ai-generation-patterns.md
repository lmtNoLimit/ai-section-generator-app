# AI Generation Patterns for Shopify Liquid - Research Report

**Date**: 2026-01-10 | **Status**: Complete | **Scope**: Gemini API integration, system prompts, template structure

---

## Executive Summary

Blocksmith uses Google Gemini 2.5 Flash for production-ready Liquid generation. Current patterns support interactive streaming but lack batch generation. This research identifies patterns and recommends architecture for pre-generated template library.

---

## 1. Current Gemini API Integration

### API Configuration
- **Model**: `gemini-2.5-flash` (streaming & non-streaming)
- **Auth**: `GoogleGenerativeAI` client with API key from `GEMINI_API_KEY` env var
- **Class**: `AIService` in `app/services/ai.server.ts` (exports `generateSection()` and `generateSectionStream()`)

### Key Methods
```typescript
// Non-streaming (for batch generation)
async generateSection(prompt: string): Promise<string>

// Streaming (current interactive chat)
async *generateSectionStream(prompt: string, options?: StreamingOptions): AsyncGenerator<string>
```

### Response Processing
- **Output**: Raw Liquid only (no markdown fences expected, but sanitized if present)
- **Sanitization**:
  - Strips markdown fences: `` ```liquid ... ``` ``
  - Removes invalid forms (e.g., `new_comment`, missing `product` argument)
  - Preserves valid schema/style/markup

---

## 2. System Prompt Architecture

### Prompt Structure
The `SYSTEM_PROMPT` (385 lines) defines production rules:

**Three Main Sections**:
1. **Output Format** - Raw Liquid only, ordered: schema → style → markup
2. **Schema Rules** - Name, tags, settings, blocks, presets format
3. **Input Types Reference** - 30+ field types with validation (text, range, select, image_picker, resource pickers, etc.)

### Key Constraints for Batch Generation
- **Ordering Required**: `{% schema %}` MUST be first
- **Unique IDs**: All setting/block IDs unique per section
- **Defaults Typing**: Number defaults must be numeric (not strings)
- **Presets Required**: Must include `presets: [{name: "Section Name"}]`
- **Image Patterns**: Different handling for content images (image_tag) vs backgrounds (CSS)
- **Resource Conditionals**: All pickers must check existence first

### Validation Rules (15 items enforced)
- Range requires `min`, `max`, `step`
- Select requires `options: [{value, label}]`
- Richtext defaults must start with `<p>` or `<ul>`
- Resource pickers (collection, product) don't support defaults
- Forbidden: new_comment forms, global CSS resets, translation keys in labels

---

## 3. Template Data Structure

### DefaultTemplate Interface
```typescript
interface DefaultTemplate {
  title: string;              // e.g., "Hero with Background Image"
  description: string;        // 1-line human description
  category: string;          // From TEMPLATE_CATEGORIES (hero, features, testimonials, etc.)
  icon: string;              // Emoji icon
  prompt: string;            // AI-generatable prompt (optimized for Gemini)
  code?: string;             // Optional pre-built Liquid code
}
```

### Current Template Inventory
- **11 Categories**: hero, features, testimonials, pricing, cta, faq, team, gallery, content, footer
- **Planned**: 80+ templates (README mentions "Future: Template library")
- **Example**: `DEFAULT_TEMPLATES` array in `app/data/default-templates.ts`

### Prompt Design Patterns
Effective prompts are:
- Specific about layout (3 columns, 2-column grid)
- Include merchant features (color settings, background images, CTAs)
- Reference block types (repeating testimonials, pricing tiers)
- Avoid complexity (keep to 2-3 feature sets per template)

---

## 4. Batch Generation Architecture Recommendations

### Phase 1: Basic Batch Script (YAGNI)
**Input**: Array of `{title, description, category, prompt}`
**Output**: `DEFAULT_TEMPLATES` with generated `code` property
**Approach**:
- Loop over prompts sequentially (respect API rate limits)
- Call `generateSection(prompt)` for each
- Validate output has `{% schema %}` and valid JSON
- Write to TypeScript file or JSON

```typescript
async function batchGenerateTemplates(
  templates: TemplatePrompt[],
  options = { concurrency: 2, retries: 2 }
): Promise<DefaultTemplate[]> {
  const results = [];

  for (const template of templates) {
    try {
      const code = await aiService.generateSection(template.prompt);
      // Validate schema exists and parse JSON
      if (isValidLiquidSection(code)) {
        results.push({ ...template, code });
      }
    } catch (error) {
      // Retry logic, log failures
    }
  }

  return results;
}
```

### Phase 2: Error Handling & Validation
**Validation Gates**:
1. Parse schema JSON (catches malformed defaults, missing presets)
2. Check required fields (name, settings, presets)
3. Validate setting types match defaults (number/string consistency)
4. Confirm no forbidden syntax (new_comment forms, translation keys)

**Failure Handling**:
- Retry with adjusted prompt (simpler request)
- Fall back to manual template or skip
- Log to file for manual review

### Phase 3: Performance Optimization
- **Concurrency**: Use semaphore (max 2-3 concurrent API calls, respect rate limits)
- **Caching**: Skip regeneration if code exists in version control
- **Async**: Use parallel validation while generating next batch
- **Streaming**: Not suitable for batch (overhead); use non-streaming `generateSection()`

### Prompt Engineering for Reliability
1. **Lead with rules**: "Follow system rules: schema first, unique IDs, valid JSON"
2. **Simplify**: Break complex sections (e.g., multi-block sections) into smaller templates
3. **Examples**: Include inline JSON examples for tricky schema (range, select, richtext defaults)
4. **Specificity**: "Hero with 3-column testimonials" > "Create a hero section"

---

## 5. Integration Points

### Storage
- **File-based** (current): `app/data/default-templates.ts` as TypeScript array
- **Database** (future): Prisma model for versions, metadata, usage stats

### Template Lifecycle
1. Generate via batch script (or manual creation)
2. Validate & add to `DEFAULT_TEMPLATES`
3. UI renders in template picker (`/templates` route)
4. User selects → triggers edit flow with AI conversation
5. Option: "Use As-Is" skips AI, uses pre-built `code` directly

### Fallback Strategy
- If generation fails: Keep existing template (no code)
- Graceful degradation: Prompt-only templates still work (triggers AI generation in UI)

---

## 6. Key Findings & Recommendations

### Strengths
- **Robust system prompt**: 385 lines of detailed rules reduces hallucinations
- **Sanitization layer**: Catches common AI errors (form syntax, markdown fences)
- **Streaming support**: Already proven for interactive chat, can reuse

### Constraints
- **API rate limits**: Gemini Free tier ~60 RPM; batch should respect quotas
- **Schema validation**: Gemini occasionally violates rules; validation gate required
- **Prompt sensitivity**: Small wording changes affect output; templates need A/B testing

### Batch Generation Viability
✅ **Recommended approach**: Synchronous loop with validation, async I/O for storage
- Cost: 80 templates × $0.075/1M tokens ≈ $6 one-time
- Time: ~3-5 hours at 2 concurrent requests
- Maintenance: Automated script in `scripts/batch-generate-templates.ts`

---

## Implementation Checklist (Next Phase)

- [ ] Create `scripts/batch-generate-templates.ts` with concurrent semaphore
- [ ] Add validation function: `isValidLiquidSection(code): boolean`
- [ ] Update `DEFAULT_TEMPLATES` schema to track generation metadata (date, model, prompt version)
- [ ] Set up retry logic with exponential backoff
- [ ] Create dashboard to monitor generation success rates
- [ ] Document prompt engineering guide for template creators
- [ ] Add "regenerate template" admin action (re-run single template through Gemini)

---

## Unresolved Questions

1. **Template versioning**: Should pre-built templates version with schema/prompt changes?
2. **Prompt optimization**: What's the ROI on A/B testing template prompts vs. using current system prompt?
3. **Rate limiting strategy**: Should batch generation be scheduled (off-peak) or on-demand?
4. **Template customization**: Allow merchants to request new templates? (feedback loop)

---

**Report generated**: 2026-01-10
**Research scope**: Code review + API documentation analysis
**Confidence level**: High (based on production code review)
