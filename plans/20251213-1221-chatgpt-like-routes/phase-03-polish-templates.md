# Phase 03: Polish & Template Chips

## Context Links
- Parent: [plan.md](./plan.md)
- Dependencies: [Phase 01](./phase-01-simplify-new-route.md), [Phase 02](./phase-02-integrate-initial-message.md)
- Docs: [codebase-summary.md](../../docs/codebase-summary.md)

## Overview

| Field | Value |
|-------|-------|
| Date | 2025-12-13 |
| Description | Add UI polish, template chips, and final refinements |
| Priority | Medium |
| Implementation Status | Pending |
| Review Status | Pending |

## Key Insights

1. ChatGPT/Cursor show suggested prompts as chips/cards below input
2. Templates already exist in database (`SectionTemplate` model)
3. Quick-start chips reduce friction for new users
4. Visual polish important for perceived quality

## Requirements

### Functional
- FR1: Display 3-4 template chips below prompt input
- FR2: Clicking chip fills prompt textarea
- FR3: Load popular/featured templates from database
- FR4: Fallback to static chips if no templates
- FR5: Animate chip selection (optional)

### Non-Functional
- NFR1: Chips load without blocking page
- NFR2: Accessible (keyboard navigation, ARIA)
- NFR3: Responsive layout for mobile

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  /sections/new Loader                                    │
│                                                          │
│  1. Authenticate                                         │
│  2. Fetch featured templates (limit 4)                   │
│  3. Return { templates }                                 │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Component Layout                                        │
│                                                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │           "Create a Section"                       │  │
│  │  "Describe the section you want to create"        │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │  [Textarea for prompt]                             │  │
│  │                                        [Create →]  │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Try these:                                        │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐          │  │
│  │  │ 🖼 Hero  │ │ 🛒 Grid  │ │ 💬 FAQ   │          │  │
│  │  │ Section  │ │ Products │ │ Accordion│          │  │
│  │  └──────────┘ └──────────┘ └──────────┘          │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Related Code Files

| File | Purpose | Change Type |
|------|---------|-------------|
| `app/routes/app.sections.new.tsx` | Main route | Add template loading |
| `app/services/template.server.ts` | Template CRUD | Add featured query |
| `app/styles/new-section.css` | Styling | Add chip styles |
| `prisma/schema.prisma` | DB schema | No changes (has SectionTemplate) |

## Implementation Steps

### Step 1: Update Loader for Templates
```typescript
// app/routes/app.sections.new.tsx

import { templateService } from '../services/template.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);

  // Fetch featured templates (global + shop-specific)
  const templates = await templateService.getFeatured(session.shop, 4);

  return { templates };
}
```

### Step 2: Add getFeatured to Template Service
```typescript
// app/services/template.server.ts

interface FeaturedTemplate {
  id: string;
  title: string;
  prompt: string;
  icon?: string;
}

async getFeatured(shop: string, limit: number = 4): Promise<FeaturedTemplate[]> {
  // Try shop-specific templates first
  const shopTemplates = await prisma.sectionTemplate.findMany({
    where: { shop },
    select: { id: true, title: true, prompt: true, icon: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  if (shopTemplates.length >= limit) {
    return shopTemplates;
  }

  // Fall back to default templates
  const defaultTemplates: FeaturedTemplate[] = [
    {
      id: 'default-hero',
      title: 'Hero Section',
      prompt: 'A hero section with a large background image, heading, subheading, and call-to-action button',
      icon: '🖼',
    },
    {
      id: 'default-products',
      title: 'Product Grid',
      prompt: 'A 3-column product grid showing featured products with image, title, price, and add to cart button',
      icon: '🛒',
    },
    {
      id: 'default-faq',
      title: 'FAQ Accordion',
      prompt: 'An FAQ section with collapsible questions and answers in accordion style',
      icon: '❓',
    },
    {
      id: 'default-testimonials',
      title: 'Testimonials',
      prompt: 'A testimonial slider showing customer reviews with photo, name, and quote',
      icon: '💬',
    },
  ];

  return [...shopTemplates, ...defaultTemplates].slice(0, limit);
}
```

### Step 3: Add Template Chips Component
```tsx
// app/components/new-section/TemplateChips.tsx

interface TemplateChipsProps {
  templates: Array<{
    id: string;
    title: string;
    prompt: string;
    icon?: string;
  }>;
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}

export function TemplateChips({ templates, onSelect, disabled }: TemplateChipsProps) {
  if (templates.length === 0) return null;

  return (
    <div className="template-chips" aria-label="Suggested templates">
      <p className="template-chips__label">Try one of these:</p>
      <div className="template-chips__grid">
        {templates.map((template) => (
          <button
            key={template.id}
            className="template-chip"
            onClick={() => onSelect(template.prompt)}
            disabled={disabled}
            type="button"
            aria-label={`Use ${template.title} template`}
          >
            {template.icon && (
              <span className="template-chip__icon" aria-hidden="true">
                {template.icon}
              </span>
            )}
            <span className="template-chip__title">{template.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
```

### Step 4: Update Main Component
```tsx
// app/routes/app.sections.new.tsx

import { TemplateChips } from '../components/new-section/TemplateChips';

export default function NewSectionPage() {
  const { templates } = useLoaderData<typeof loader>();
  // ... existing state ...

  const handleTemplateSelect = (templatePrompt: string) => {
    setPrompt(templatePrompt);
    // Focus textarea after selection
    document.querySelector<HTMLTextAreaElement>('.prompt-textarea')?.focus();
  };

  return (
    <s-page inlineSize="narrow">
      <div className="new-section-container">
        <h1>Create a Section</h1>
        <p>Describe the section you want to create</p>

        <div className="prompt-input">
          <s-text-field
            className="prompt-textarea"
            label=""
            value={prompt}
            onInput={(e) => setPrompt(e.target.value)}
            multiline="4"
            placeholder="A hero section with video background..."
            disabled={isSubmitting}
          />
          <s-button
            variant="primary"
            onClick={handleSubmit}
            loading={isSubmitting}
            disabled={!prompt.trim()}
          >
            Create Section
          </s-button>
        </div>

        <TemplateChips
          templates={templates}
          onSelect={handleTemplateSelect}
          disabled={isSubmitting}
        />
      </div>
    </s-page>
  );
}
```

### Step 5: Add Polish Styles
```css
/* app/styles/new-section.css */

.new-section-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
  padding: 2rem;
  max-width: 700px;
  margin: 0 auto;
}

.new-section-container h1 {
  font-size: 1.75rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.new-section-container > p {
  color: var(--p-color-text-secondary);
  margin-bottom: 1.5rem;
}

.prompt-input {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.prompt-input s-button {
  align-self: flex-end;
}

/* Template Chips */
.template-chips {
  width: 100%;
  margin-top: 2rem;
}

.template-chips__label {
  font-size: 0.875rem;
  color: var(--p-color-text-secondary);
  margin-bottom: 0.75rem;
}

.template-chips__grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
}

.template-chip {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid var(--p-color-border);
  border-radius: 9999px;
  background: var(--p-color-bg-surface);
  cursor: pointer;
  transition: all 0.15s ease;
  font-size: 0.875rem;
}

.template-chip:hover:not(:disabled) {
  border-color: var(--p-color-border-hover);
  background: var(--p-color-bg-surface-hover);
}

.template-chip:focus {
  outline: 2px solid var(--p-color-border-interactive-focus);
  outline-offset: 2px;
}

.template-chip:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.template-chip__icon {
  font-size: 1rem;
}

.template-chip__title {
  font-weight: 500;
}

/* Responsive */
@media (max-width: 600px) {
  .new-section-container {
    padding: 1rem;
    min-height: 50vh;
  }

  .template-chips__grid {
    flex-direction: column;
  }

  .template-chip {
    width: 100%;
    justify-content: center;
  }
}
```

### Step 6: Cleanup Deprecated Components
Review and mark as deprecated or remove:
- `app/components/generate/GenerateLayout.tsx`
- `app/components/generate/GenerateInputColumn.tsx`
- `app/components/generate/GeneratePreviewColumn.tsx`
- `app/components/generate/AdvancedOptions.tsx`

Keep for potential future use:
- `SaveTemplateModal.tsx` (may move to `/$id` settings)

## Todo List

- [ ] Add getFeatured to templateService
- [ ] Create TemplateChips component
- [ ] Update /new route with templates
- [ ] Add CSS styles
- [ ] Test chip selection behavior
- [ ] Test responsive layout
- [ ] Review deprecated components
- [ ] Update component index exports

## Success Criteria

- [ ] 4 template chips displayed below input
- [ ] Clicking chip fills prompt
- [ ] Shop templates prioritized over defaults
- [ ] Chips disabled during submission
- [ ] Keyboard accessible (Tab, Enter)
- [ ] Mobile responsive

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| No shop templates yet | High | Low | Default templates fallback |
| CSS variable conflicts | Low | Low | Use Polaris design tokens |
| Template service error | Low | Medium | Graceful degradation (hide chips) |

## Security Considerations

- Sanitize template prompts before rendering
- Ensure shop isolation for template queries
- Rate limit template fetching

## Next Steps

After Phase 03 complete:
1. Final testing across all flows
2. Documentation update
3. Consider deprecating old `/generate` route if unused
4. Plan for template management UI (future phase)
