# Phase 02: Enhanced Input Experience

**Phase ID**: phase-02-enhanced-input-experience
**Date**: 2025-11-29
**Status**: ✅ Complete
**Priority**: High (Core UX)
**Estimated Effort**: 6-8 hours
**Completed**: 2025-11-29

---

## Context

**Parent Plan**: [Generate Screen Redesign Plan](./plan.md)
**Dependencies**: Phase 01 (Layout Restructuring)
**Blocks**: None (runs parallel with Phase 03)

**Related Documentation**:
- [Shopify Design Guidelines Research](./research/researcher-01-shopify-design-guidelines.md)
- [Competitor Analysis Research](./research/researcher-02-competitor-analysis.md)
- [Code Standards](../../docs/code-standards.md)

---

## Overview

Enhance input experience with template suggestions, prompt examples, progressive disclosure for advanced options, and improved prompt validation. Goal: Increase generation quality by guiding users toward better prompts.

**Current State**: Single prompt textarea, no suggestions or examples, no advanced options
**Target State**: Template gallery, quick examples, collapsible advanced options, character counter, validation

---

## Key Insights from Research

**Competitor Patterns** (research/researcher-02):
- Sectional: Contextual suggestions (hero, testimonials, CTAs)
- Shogun: Template-based approach (generate from templates)
- Tapita: Hybrid model (pre-built + AI generation)
- Common: Single-step prompts with hints/examples

**Shopify Design Patterns** (research/researcher-01):
- Progressive disclosure prevents form overwhelm
- Use Checkbox/Switch for toggleable options
- TextField supports character counter via helpText
- Stack component for consistent spacing

**High-Impact Opportunities**:
- Template suggestions reduce prompt friction
- Examples improve prompt quality
- Advanced options (tone, style) enable customization without complexity

---

## Requirements

### Functional Requirements

1. **Template Suggestions**
   - Display 6-8 common section types (hero, product grid, testimonials, FAQ, CTA, feature, gallery, newsletter)
   - Click template to populate prompt with pre-written description
   - Visual cards with icon, title, description

2. **Quick Prompt Examples**
   - Show 3-4 contextual prompt examples
   - One-click to populate prompt field
   - Rotate examples or show category-based (e.g., "Marketing", "Product", "Content")

3. **Progressive Disclosure (Advanced Options)**
   - Collapsible section for advanced settings
   - Options: Tone (professional/casual/friendly), Style (minimal/bold/elegant), Include schema (checkbox)
   - Default: Collapsed (hidden until user expands)

4. **Prompt Input Enhancements**
   - Character counter (e.g., "45/2000 characters")
   - Validation: Min 10 characters, max 2000 characters
   - Error message if validation fails

5. **Preserve Existing Behavior**
   - Generate button disabled if prompt empty or invalid
   - Loading states during generation
   - Error/success banners functional

### Non-Functional Requirements

1. **Performance**: Template/example data loaded from constants (no API calls)
2. **Accessibility**: Keyboard navigation, screen reader announcements, focus management
3. **Code Quality**: Components under 200 lines, TypeScript strict mode
4. **Mobile-Friendly**: Templates display in grid (responsive), examples stack vertically

---

## Architecture

### Component Structure

```
app/
├── routes/
│   └── app.generate.tsx                      # Import new components
└── components/
    └── generate/
        ├── GenerateInputColumn.tsx           # MODIFIED: Add templates, examples, advanced options
        ├── TemplateSuggestions.tsx           # NEW: Template gallery
        ├── PromptExamples.tsx                # NEW: Quick example chips
        ├── AdvancedOptions.tsx               # NEW: Collapsible advanced settings
        ├── PromptInput.tsx                   # MODIFIED: Add character counter, validation
        └── templates/                        # NEW: Template data
            └── template-data.ts              # Template definitions (icon, title, description, prompt)
```

### Data Structures

**Template Definition**:
```typescript
interface SectionTemplate {
  id: string;
  title: string;
  description: string;
  icon: string; // Emoji or icon name
  category: 'marketing' | 'product' | 'content' | 'layout';
  prompt: string; // Pre-written prompt
}

const TEMPLATES: SectionTemplate[] = [
  {
    id: 'hero',
    title: 'Hero Section',
    description: 'Full-width banner with headline, subtext, and CTA',
    icon: '🎯',
    category: 'marketing',
    prompt: 'A hero section with a full-width background image, centered headline, subtext, and a primary call-to-action button. Include settings for image, text alignment, and button style.'
  },
  // ... more templates
];
```

**Prompt Example**:
```typescript
interface PromptExample {
  id: string;
  label: string;
  prompt: string;
}

const EXAMPLES: PromptExample[] = [
  { id: 'hero', label: 'Hero Section', prompt: '...' },
  { id: 'testimonials', label: 'Testimonials', prompt: '...' },
  { id: 'faq', label: 'FAQ Accordion', prompt: '...' },
];
```

**Advanced Options State**:
```typescript
interface AdvancedOptionsState {
  tone: 'professional' | 'casual' | 'friendly';
  style: 'minimal' | 'bold' | 'elegant';
  includeSchema: boolean;
}
```

---

## Related Code Files

**Modified**:
- `app/components/generate/GenerateInputColumn.tsx` - Add templates, examples, advanced options
- `app/components/generate/PromptInput.tsx` - Add character counter, validation
- `app/routes/app.generate.tsx` - Pass advanced options to generation handler (future)

**New**:
- `app/components/generate/TemplateSuggestions.tsx` - Template gallery
- `app/components/generate/PromptExamples.tsx` - Quick example chips
- `app/components/generate/AdvancedOptions.tsx` - Collapsible settings
- `app/components/generate/templates/template-data.ts` - Template definitions

**Unchanged**:
- Other generate components (ThemeSelector, CodePreview, etc.)

---

## Implementation Steps

### Step 1: Create Template Data File

**File**: `app/components/generate/templates/template-data.ts`

```typescript
export interface SectionTemplate {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'marketing' | 'product' | 'content' | 'layout';
  prompt: string;
}

export const SECTION_TEMPLATES: SectionTemplate[] = [
  {
    id: 'hero',
    title: 'Hero Section',
    description: 'Full-width banner with headline and CTA',
    icon: '🎯',
    category: 'marketing',
    prompt: 'A hero section with a full-width background image, centered headline, subtext, and a primary call-to-action button. Include settings for image upload, text alignment, and button customization.'
  },
  {
    id: 'product-grid',
    title: 'Product Grid',
    description: 'Responsive grid of featured products',
    icon: '🛍️',
    category: 'product',
    prompt: 'A responsive product grid section displaying featured products in a 3-column layout. Include product image, title, price, and "Add to Cart" button. Make it responsive (2 columns on tablet, 1 on mobile).'
  },
  {
    id: 'testimonials',
    title: 'Testimonials',
    description: 'Customer reviews with ratings',
    icon: '⭐',
    category: 'marketing',
    prompt: 'A testimonials section with customer quotes, star ratings, and customer names. Display 3 testimonials in a row with avatar images. Include schema settings for each testimonial.'
  },
  {
    id: 'faq',
    title: 'FAQ Accordion',
    description: 'Expandable questions and answers',
    icon: '❓',
    category: 'content',
    prompt: 'An FAQ section with collapsible accordion items. Each item has a question (clickable header) and answer (expandable content). Include settings to add/remove FAQ items with custom text.'
  },
  {
    id: 'cta-banner',
    title: 'CTA Banner',
    description: 'Call-to-action with background',
    icon: '📣',
    category: 'marketing',
    prompt: 'A call-to-action banner section with background color, headline, description text, and a prominent button. Include settings for text content, colors, and button link.'
  },
  {
    id: 'feature-columns',
    title: 'Feature Columns',
    description: '3-column features with icons',
    icon: '✨',
    category: 'content',
    prompt: 'A features section with 3 columns, each containing an icon, heading, and description. Include schema settings to customize icon, text, and link for each column.'
  },
  {
    id: 'image-gallery',
    title: 'Image Gallery',
    description: 'Responsive image grid',
    icon: '🖼️',
    category: 'layout',
    prompt: 'An image gallery section displaying images in a responsive grid (4 columns on desktop, 2 on tablet, 1 on mobile). Include lightbox functionality on click. Schema settings for adding/removing images.'
  },
  {
    id: 'newsletter',
    title: 'Newsletter Signup',
    description: 'Email subscription form',
    icon: '📧',
    category: 'marketing',
    prompt: 'A newsletter signup section with heading, description, email input field, and subscribe button. Include settings for form action URL, success message, and styling options.'
  }
];

export interface PromptExample {
  id: string;
  label: string;
  prompt: string;
}

export const PROMPT_EXAMPLES: PromptExample[] = [
  {
    id: 'before-after',
    label: 'Before/After Slider',
    prompt: 'A before-and-after image slider section with draggable divider to compare two images side-by-side'
  },
  {
    id: 'countdown',
    label: 'Countdown Timer',
    prompt: 'A countdown timer section for limited-time offers, displaying days, hours, minutes, and seconds until a target date'
  },
  {
    id: 'logo-list',
    label: 'Logo List',
    prompt: 'A section displaying partner or client logos in a horizontal scrolling row with hover effects'
  },
  {
    id: 'video-embed',
    label: 'Video Hero',
    prompt: 'A hero section with background video (YouTube or Vimeo embed), overlay text, and CTA button with semi-transparent backdrop'
  }
];
```

---

### Step 2: Create TemplateSuggestions Component

**File**: `app/components/generate/TemplateSuggestions.tsx`

```typescript
import { SECTION_TEMPLATES, type SectionTemplate } from './templates/template-data';

export interface TemplateSuggestionsProps {
  onSelectTemplate: (prompt: string) => void;
  disabled?: boolean;
}

/**
 * Template gallery showing common section types
 * Click to populate prompt with pre-written description
 */
export function TemplateSuggestions({
  onSelectTemplate,
  disabled = false
}: TemplateSuggestionsProps) {
  const handleClick = (template: SectionTemplate) => {
    if (!disabled) {
      onSelectTemplate(template.prompt);
    }
  };

  return (
    <s-stack gap="300" vertical>
      <s-text variant="headingSm" as="h3">
        Quick Start Templates
      </s-text>

      {/* Grid layout: 2 columns on desktop, 1 on mobile */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 'var(--p-space-300)'
        }}
      >
        {SECTION_TEMPLATES.map((template) => (
          <s-button
            key={template.id}
            onClick={() => handleClick(template)}
            disabled={disabled}
            variant="secondary"
            style={{ height: 'auto', padding: 'var(--p-space-300)' }}
          >
            <s-stack gap="200" vertical align="start">
              <span style={{ fontSize: '24px' }}>{template.icon}</span>
              <s-text variant="bodySm" fontWeight="semibold">
                {template.title}
              </s-text>
              <s-text variant="bodySm" tone="subdued">
                {template.description}
              </s-text>
            </s-stack>
          </s-button>
        ))}
      </div>
    </s-stack>
  );
}
```

**Notes**:
- Grid layout responsive (CSS grid with auto-fill)
- Button variant="secondary" for less visual weight
- Disabled state prevents clicks during generation
- Icons use emoji for simplicity (no icon library needed)

---

### Step 3: Create PromptExamples Component

**File**: `app/components/generate/PromptExamples.tsx`

```typescript
import { PROMPT_EXAMPLES } from './templates/template-data';

export interface PromptExamplesProps {
  onSelectExample: (prompt: string) => void;
  disabled?: boolean;
}

/**
 * Quick prompt examples as chips/pills
 * Click to populate prompt field
 */
export function PromptExamples({
  onSelectExample,
  disabled = false
}: PromptExamplesProps) {
  return (
    <s-stack gap="300" vertical>
      <s-text variant="headingSm" as="h3">
        Or try an example
      </s-text>

      <s-stack gap="200" wrap>
        {PROMPT_EXAMPLES.map((example) => (
          <s-button
            key={example.id}
            onClick={() => onSelectExample(example.prompt)}
            disabled={disabled}
            size="slim"
            variant="plain"
          >
            {example.label}
          </s-button>
        ))}
      </s-stack>
    </s-stack>
  );
}
```

**Notes**:
- Slim buttons for compact display
- Wrap enabled (chips flow to next line if needed)
- Plain variant for minimal visual weight

---

### Step 4: Create AdvancedOptions Component

**File**: `app/components/generate/AdvancedOptions.tsx`

```typescript
import { useState } from 'react';

export interface AdvancedOptionsState {
  tone: 'professional' | 'casual' | 'friendly';
  style: 'minimal' | 'bold' | 'elegant';
  includeSchema: boolean;
}

export interface AdvancedOptionsProps {
  value: AdvancedOptionsState;
  onChange: (options: AdvancedOptionsState) => void;
  disabled?: boolean;
}

/**
 * Collapsible advanced options for generation customization
 * Tone, style, schema settings
 */
export function AdvancedOptions({
  value,
  onChange,
  disabled = false
}: AdvancedOptionsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToneChange = (e: Event) => {
    const target = e.target as HTMLSelectElement;
    onChange({ ...value, tone: target.value as AdvancedOptionsState['tone'] });
  };

  const handleStyleChange = (e: Event) => {
    const target = e.target as HTMLSelectElement;
    onChange({ ...value, style: target.value as AdvancedOptionsState['style'] });
  };

  const handleSchemaChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    onChange({ ...value, includeSchema: target.checked });
  };

  return (
    <s-stack gap="300" vertical>
      {/* Collapsible trigger */}
      <s-button
        onClick={() => setIsExpanded(!isExpanded)}
        variant="plain"
        disclosure={isExpanded ? 'up' : 'down'}
        disabled={disabled}
      >
        Advanced Options
      </s-button>

      {/* Collapsible content */}
      {isExpanded && (
        <s-stack gap="300" vertical>
          <s-select
            label="Tone"
            value={value.tone}
            onChange={handleToneChange}
            disabled={disabled}
            helpText="Writing style for generated content"
          >
            <option value="professional">Professional</option>
            <option value="casual">Casual</option>
            <option value="friendly">Friendly</option>
          </s-select>

          <s-select
            label="Style"
            value={value.style}
            onChange={handleStyleChange}
            disabled={disabled}
            helpText="Visual aesthetic for the section"
          >
            <option value="minimal">Minimal</option>
            <option value="bold">Bold</option>
            <option value="elegant">Elegant</option>
          </s-select>

          <s-checkbox
            checked={value.includeSchema}
            onChange={handleSchemaChange}
            disabled={disabled}
          >
            Include customizable schema settings
          </s-checkbox>
        </s-stack>
      )}
    </s-stack>
  );
}
```

**Notes**:
- Collapsed by default (progressive disclosure principle)
- Disclosure icon (up/down arrow) indicates state
- Options disabled during generation

---

### Step 5: Enhance PromptInput Component

**File**: `app/components/generate/PromptInput.tsx` (Modified)

```typescript
export interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  helpText?: string;
  error?: string;
  disabled?: boolean;
  minLength?: number;
  maxLength?: number;
}

/**
 * Prompt input field with character counter and validation
 */
export function PromptInput({
  value,
  onChange,
  placeholder = 'A hero section with a background image and centered text...',
  helpText = 'Describe the section you want to generate in natural language',
  error,
  disabled = false,
  minLength = 10,
  maxLength = 2000
}: PromptInputProps) {
  const handleInput = (e: Event) => {
    const target = e.target as HTMLInputElement;
    onChange(target.value);
  };

  // Character counter
  const charCount = value.length;
  const charCountText = `${charCount}/${maxLength} characters`;

  // Validation
  const isValid = charCount >= minLength && charCount <= maxLength;
  const validationError = !isValid && charCount > 0
    ? `Prompt must be between ${minLength} and ${maxLength} characters`
    : undefined;

  // Fixed height: 250px per design decision
  return (
    <s-text-field
      label="Prompt"
      value={value}
      onInput={handleInput}
      multiline="6"
      autoComplete="off"
      placeholder={placeholder}
      helpText={!error && !validationError ? `${helpText} (${charCountText})` : charCountText}
      error={error || validationError}
      disabled={disabled}
      style={{ minHeight: '250px' }}
    />
  );
}
```

**Notes**:
- Character counter in helpText
- Validation error if out of range
- Min/max configurable via props

---

### Step 6: Update GenerateInputColumn Component

**File**: `app/components/generate/GenerateInputColumn.tsx` (Modified)

```typescript
import { PromptInput } from './PromptInput';
import { TemplateSuggestions } from './TemplateSuggestions';
import { PromptExamples } from './PromptExamples';
import { AdvancedOptions, type AdvancedOptionsState } from './AdvancedOptions';

export interface GenerateInputColumnProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  advancedOptions: AdvancedOptionsState;
  onAdvancedOptionsChange: (options: AdvancedOptionsState) => void;
  disabled: boolean;
  onGenerate: () => void;
  isGenerating: boolean;
}

export function GenerateInputColumn({
  prompt,
  onPromptChange,
  advancedOptions,
  onAdvancedOptionsChange,
  disabled,
  onGenerate,
  isGenerating
}: GenerateInputColumnProps) {
  // Validate prompt before enabling generate button
  const isPromptValid = prompt.trim().length >= 10 && prompt.trim().length <= 2000;

  return (
    <s-stack gap="400" vertical>
      {/* Main input card */}
      <s-card>
        <s-stack gap="400" vertical>
          <s-text variant="headingMd" as="h2">
            Describe your section
          </s-text>

          <PromptInput
            value={prompt}
            onChange={onPromptChange}
            disabled={disabled}
          />

          <AdvancedOptions
            value={advancedOptions}
            onChange={onAdvancedOptionsChange}
            disabled={disabled}
          />

          <s-button
            variant="primary"
            onClick={onGenerate}
            loading={isGenerating ? "true" : undefined}
            disabled={disabled || !isPromptValid}
          >
            Generate Code
          </s-button>
        </s-stack>
      </s-card>

      {/* Template suggestions */}
      <s-card>
        <TemplateSuggestions
          onSelectTemplate={onPromptChange}
          disabled={disabled}
        />
      </s-card>

      {/* Prompt examples */}
      <s-card>
        <PromptExamples
          onSelectExample={onPromptChange}
          disabled={disabled}
        />
      </s-card>
    </s-stack>
  );
}
```

**Notes**:
- Templates and examples in separate cards (better visual grouping)
- Validation logic prevents generation with invalid prompt
- Advanced options collapsed by default

---

### Step 7: Update app.generate.tsx Route

**File**: `app/routes/app.generate.tsx` (Modified)

Add state for advanced options:

```typescript
export default function GeneratePage() {
  // ... existing state ...

  // Advanced options state
  const [advancedOptions, setAdvancedOptions] = useState<AdvancedOptionsState>({
    tone: 'professional',
    style: 'minimal',
    includeSchema: true
  });

  // ... existing handlers ...

  return (
    <>
      <s-page title="Generate Section">
        <s-stack gap="400" vertical>
          {/* ... banners ... */}

          <GenerateLayout
            inputColumn={
              <GenerateInputColumn
                prompt={prompt}
                onPromptChange={setPrompt}
                advancedOptions={advancedOptions}
                onAdvancedOptionsChange={setAdvancedOptions}
                disabled={isGenerating || isSaving}
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
              />
            }
            previewColumn={
              <GeneratePreviewColumn
                {/* ... unchanged ... */}
              />
            }
          />
        </s-stack>
      </s-page>
      {/* ... service mode indicator ... */}
    </>
  );
}
```

**Future Enhancement** (not in this phase):
- Pass `advancedOptions` to AI service for customized generation
- Update AI prompt to incorporate tone/style preferences

---

### Step 8: Update Component Barrel Export

**File**: `app/components/index.ts`

```typescript
// Generate feature components
export { TemplateSuggestions } from './generate/TemplateSuggestions';
export { PromptExamples } from './generate/PromptExamples';
export { AdvancedOptions, type AdvancedOptionsState } from './generate/AdvancedOptions';
// ... existing exports ...
```

---

### Step 9: Manual Testing

**Test Scenarios**:

1. **Template Suggestions**
   - ✅ 8 templates displayed in grid (2 columns on desktop)
   - ✅ Click template populates prompt field
   - ✅ Templates disabled during generation
   - ✅ Grid responsive (1 column on mobile)

2. **Prompt Examples**
   - ✅ 4 examples displayed as chips
   - ✅ Click example populates prompt field
   - ✅ Examples wrap to next line if needed

3. **Advanced Options**
   - ✅ Collapsed by default
   - ✅ Click expands to show options
   - ✅ Tone, Style, Schema options functional
   - ✅ Disabled during generation

4. **Prompt Input Validation**
   - ✅ Character counter displays (e.g., "45/2000")
   - ✅ Error shows if prompt < 10 characters
   - ✅ Error shows if prompt > 2000 characters
   - ✅ Generate button disabled if invalid

5. **Functionality**
   - ✅ Templates/examples populate prompt correctly
   - ✅ Generate still works after prompt selection
   - ✅ Advanced options state preserved during generation

---

## Todo List

- [x] Create `template-data.ts` with templates and examples
- [x] Create `TemplateSuggestions.tsx` component
- [x] Create `PromptExamples.tsx` component
- [x] Create `AdvancedOptions.tsx` component
- [x] Enhance `PromptInput.tsx` with character counter and validation
- [x] Update `GenerateInputColumn.tsx` to include new components
- [x] Update `app.generate.tsx` with advancedOptions state
- [x] Update `app/components/index.ts` barrel export
- [x] Test template selection (8 templates)
- [x] Test example selection (4 examples)
- [x] Test advanced options (expand/collapse, settings)
- [x] Test prompt validation (min/max length)
- [x] Test mobile responsiveness (template grid, examples wrap)
- [x] Test accessibility (keyboard nav, screen reader)
- [x] Code review and cleanup

---

## Success Criteria

**Functional**:
- ✅ 8 template suggestions displayed and clickable
- ✅ 4 prompt examples displayed and clickable
- ✅ Advanced options collapsible (tone, style, schema)
- ✅ Character counter shows current/max characters
- ✅ Validation prevents generation with invalid prompt
- ✅ Templates/examples populate prompt field correctly

**Non-Functional**:
- ✅ Components under 200 lines each
- ✅ Mobile-responsive (grid, wrap)
- ✅ Accessibility (keyboard, screen reader)
- ✅ No performance degradation
- ✅ TypeScript strict mode compliant

---

## Risk Assessment

**Medium Risk**:
- Template data structure (may need iteration based on UX feedback)
- Advanced options state management (ensure proper propagation)
- Grid layout responsiveness (test on multiple devices)

**Mitigation**:
- Start with 8 common templates (expand later based on analytics)
- Keep advanced options simple (3 settings only)
- Test grid layout in Chrome DevTools (multiple viewports)

---

## Security Considerations

**No New Security Concerns**:
- Templates/examples are hardcoded constants (no user input)
- Advanced options are enums (no arbitrary values)
- Prompt validation prevents excessively long inputs
- No new API calls or data persistence

**Existing Security Maintained**:
- Prompt still validated before sending to AI service
- Character limit prevents prompt injection attacks (future: add content filtering)

---

## Next Steps

**After Phase 02 Completion**:
1. Code review and approval
2. Merge to main branch
3. Begin Phase 03: Improved Preview & Feedback (can run in parallel)
   - Enhanced code preview with copy/download
   - Loading states with progress indicator
   - Better error/success messaging

**Future Enhancements (Post-Phase 02)**:
- AI service integration: Pass `advancedOptions` to generation prompt
- Analytics: Track which templates/examples used most
- Dynamic templates: Load from database instead of constants (Phase 04)
