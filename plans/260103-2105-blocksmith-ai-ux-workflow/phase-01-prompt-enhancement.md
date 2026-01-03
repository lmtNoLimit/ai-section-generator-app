# Phase 01: Prompt Enhancement

## Context Links

- [Main Plan](plan.md)
- [AI Chat UX Patterns Research](research/researcher-01-ai-chat-ux-patterns.md)
- [System Architecture](../../docs/system-architecture.md)

## Overview

| Attribute | Value |
|-----------|-------|
| Priority | P1 |
| Status | review-complete |
| Effort | 4h (actual: ~4h) |
| Description | "Enhance" button that transforms simple prompts into detailed, AI-optimized prompts with contextual awareness |
| Review | [Code Review Report](../reports/code-reviewer-260103-2239-phase01-prompt-enhancement.md) |

## Key Research Insights

From AI Chat UX Patterns research:
- **Pre-generation layer**: Show 2-3 "enhance" quick buttons below input
- **Post-generation layer**: Refinement chips appear after code completion
- **Timing**: Refinement chips render at 80% code completion for responsiveness
- Top tools (ChatGPT, Claude, Cursor) use multi-stage refinement patterns

## Requirements

### Functional Requirements

1. **FR-01.1**: "Enhance" button below prompt input that expands simple prompts
2. **FR-01.2**: Quick template buttons for common section types (hero, testimonials, product grid)
3. **FR-01.3**: Theme detection badge showing detected theme context
4. **FR-01.4**: "Generate variations" option to create 3 alternative prompts
5. **FR-01.5**: Enhanced prompt preview before generation

### Non-Functional Requirements

1. **NFR-01.1**: Enhancement completes in <2s
2. **NFR-01.2**: UI remains responsive during enhancement
3. **NFR-01.3**: Graceful degradation if enhancement API fails

## Architecture Design

### Component Structure

```
app/components/chat/
├── ChatInput.tsx           # Existing - add enhancement UI
├── PromptEnhancer.tsx      # NEW - enhancement logic & UI
├── PromptTemplates.tsx     # NEW - quick template buttons
└── ThemeContextBadge.tsx   # NEW - detected theme indicator
```

### Data Flow

```
User types prompt → Click "Enhance" →
  POST /api/enhance-prompt →
  AI returns enhanced prompt →
  Show preview modal →
  User confirms/edits →
  Submit to generation
```

### API Endpoint

```typescript
// app/routes/api.enhance-prompt.tsx
export async function action({ request }: ActionFunctionArgs) {
  const { prompt, context } = await request.json();

  const enhanced = await aiService.enhancePrompt(prompt, {
    themeStyle: context.themeStyle,
    sectionType: detectSectionType(prompt),
  });

  return json({ enhanced, suggestions: enhanced.variations });
}
```

## Related Code Files

| File | Purpose | Action |
|------|---------|--------|
| `app/components/chat/ChatPanel.tsx` | Main chat component | Modify - add enhancement UI |
| `app/components/chat/ChatInput.tsx` | Input field component | Modify - add enhance button |
| `app/services/ai.server.ts` | AI service | Modify - add enhancePrompt method |
| `app/routes/api.enhance-prompt.tsx` | Enhancement endpoint | Create new |
| `app/components/chat/PromptEnhancer.tsx` | Enhancement UI | Create new |
| `app/components/chat/PromptTemplates.tsx` | Template buttons | Create new |
| `app/utils/prompt-templates.ts` | Template definitions | Create new |

## Implementation Steps

### Step 1: Create Prompt Templates (30min)

1. Create `app/utils/prompt-templates.ts`:
```typescript
export const PROMPT_TEMPLATES = {
  hero: {
    name: 'Hero Banner',
    prompt: 'Create a hero section with a large heading, subheading, background image, and CTA button',
    icon: 'banner',
  },
  testimonials: {
    name: 'Testimonials',
    prompt: 'Create a testimonials section with 3 customer quotes, names, and star ratings',
    icon: 'quote',
  },
  productGrid: {
    name: 'Product Grid',
    prompt: 'Create a product grid section that displays products in a 3-column responsive layout',
    icon: 'products',
  },
  newsletter: {
    name: 'Newsletter',
    prompt: 'Create a newsletter signup section with email input and subscribe button',
    icon: 'email',
  },
  faq: {
    name: 'FAQ',
    prompt: 'Create an FAQ section with expandable/collapsible question and answer pairs',
    icon: 'question',
  },
};
```

### Step 2: Add Enhance Prompt AI Method (45min)

1. Add to `app/services/ai.server.ts`:
```typescript
async enhancePrompt(
  prompt: string,
  context?: { themeStyle?: string; sectionType?: string }
): Promise<{ enhanced: string; variations: string[] }> {
  const enhanceSystemPrompt = `You enhance user prompts for Shopify section generation.
Transform vague prompts into detailed, specific requirements.
Include: layout structure, responsive behavior, color scheme, typography, spacing.
Return JSON: { "enhanced": "...", "variations": ["alt1", "alt2", "alt3"] }`;

  const model = this.genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: enhanceSystemPrompt,
  });

  const result = await model.generateContent(
    `Enhance this prompt: "${prompt}". Context: ${JSON.stringify(context)}`
  );

  return JSON.parse(result.response.text());
}
```

### Step 3: Create API Endpoint (30min)

1. Create `app/routes/api.enhance-prompt.tsx`:
```typescript
import { json, type ActionFunctionArgs } from 'react-router';
import { authenticate } from '../shopify.server';
import { aiService } from '../services/ai.server';

export async function action({ request }: ActionFunctionArgs) {
  await authenticate.admin(request);

  const { prompt, context } = await request.json();

  if (!prompt || typeof prompt !== 'string') {
    return json({ error: 'Prompt required' }, { status: 400 });
  }

  try {
    const result = await aiService.enhancePrompt(prompt, context);
    return json(result);
  } catch (error) {
    console.error('Enhance prompt error:', error);
    return json({ error: 'Enhancement failed' }, { status: 500 });
  }
}
```

### Step 4: Create PromptEnhancer Component (60min)

1. Create `app/components/chat/PromptEnhancer.tsx`:
```typescript
import { useState } from 'react';
import { useFetcher } from 'react-router';

interface PromptEnhancerProps {
  prompt: string;
  onEnhanced: (enhanced: string) => void;
  onCancel: () => void;
}

export function PromptEnhancer({ prompt, onEnhanced, onCancel }: PromptEnhancerProps) {
  const fetcher = useFetcher();
  const [selectedVariation, setSelectedVariation] = useState(0);

  const isLoading = fetcher.state !== 'idle';
  const data = fetcher.data as { enhanced: string; variations: string[] } | undefined;

  const handleEnhance = () => {
    fetcher.submit(
      { prompt, context: {} },
      { method: 'POST', action: '/api/enhance-prompt', encType: 'application/json' }
    );
  };

  // Component JSX with Polaris Web Components
  return (
    <s-modal id="enhance-modal" heading="Enhance your prompt">
      {/* Enhancement UI */}
    </s-modal>
  );
}
```

### Step 5: Create PromptTemplates Component (30min)

1. Create `app/components/chat/PromptTemplates.tsx`:
```typescript
import { PROMPT_TEMPLATES } from '../../utils/prompt-templates';

interface PromptTemplatesProps {
  onSelect: (prompt: string) => void;
}

export function PromptTemplates({ onSelect }: PromptTemplatesProps) {
  return (
    <s-box padding="small">
      <s-text variant="bodySm" color="subdued">Quick start:</s-text>
      <s-stack direction="inline" gap="small" wrap>
        {Object.entries(PROMPT_TEMPLATES).map(([key, template]) => (
          <s-button
            key={key}
            variant="secondary"
            size="small"
            onClick={() => onSelect(template.prompt)}
          >
            {template.name}
          </s-button>
        ))}
      </s-stack>
    </s-box>
  );
}
```

### Step 6: Integrate into ChatInput (45min)

1. Modify `app/components/chat/ChatInput.tsx`:
   - Add "Enhance" button next to submit
   - Add template buttons below input (collapsible)
   - Wire up enhancement modal trigger
   - Handle enhanced prompt replacement

### Step 7: Add Theme Context Badge (30min)

1. Create `app/components/chat/ThemeContextBadge.tsx`:
```typescript
interface ThemeContextBadgeProps {
  themeName?: string;
  detected: boolean;
}

export function ThemeContextBadge({ themeName, detected }: ThemeContextBadgeProps) {
  if (!detected) return null;

  return (
    <s-badge tone="info" icon="theme">
      Theme: {themeName || 'Detected'}
    </s-badge>
  );
}
```

## Todo List

- [x] Create prompt templates utility file
- [x] Add enhancePrompt method to AIService
- [x] Create api.enhance-prompt.tsx endpoint
- [x] Create PromptEnhancer modal component
- [x] Create PromptTemplates quick buttons
- [x] Create ThemeContextBadge component
- [x] Integrate enhancement UI into ChatInput
- [x] Add loading states and error handling
- [ ] Test enhancement flow end-to-end (component tests needed)
- [ ] Add analytics tracking for template usage (deferred)

## Pre-Commit Fixes Required

- [ ] Fix accessibility: Convert div to button in PromptEnhancer.tsx:155
- [ ] Fix eslint errors in VersionTimeline.tsx (unused vars, hooks rule)
- [ ] Fix unnecessary escape in settings-transform.server.ts:29
- [ ] Fix vitest import in settings-transform.server.test.ts
- [ ] Run `npm run lint` - must pass with 0 errors

## Post-Commit Improvements

- [ ] Add test coverage for PromptEnhancer component
- [ ] Add test coverage for PromptTemplates component
- [ ] Add test coverage for api.enhance-prompt endpoint
- [ ] Implement rate limiting cleanup (prevent memory leak)
- [ ] Add timeout protection to enhancePrompt API call
- [ ] Add JSON schema validation for Gemini responses

## Success Criteria

1. User can click "Enhance" and see improved prompt in <2s
2. Quick template buttons insert ready-to-use prompts
3. Theme context badge appears when theme detected
4. Enhancement gracefully falls back on API error
5. UI matches Polaris design language

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Enhance API slow/fails | Medium | Low | Show original prompt as fallback |
| User confusion about variations | Low | Low | Clear UI with primary/secondary options |
| Template prompts outdated | Low | Low | Store in config file for easy updates |

## Security Considerations

- Rate limit enhancement API (10 requests/minute per shop)
- Sanitize prompt input before sending to AI
- Validate JSON response structure
- No PII in enhancement context

---

**Phase Status**: Review Complete - Pre-Commit Fixes Required
**Actual Effort**: ~4 hours (matches estimate)
**Dependencies**: None (standalone phase)
**Review Date**: 2026-01-03
**Review Score**: B+ (Good with minor improvements)
**Blockers**: Accessibility violations, eslint errors (see Pre-Commit Fixes above)
