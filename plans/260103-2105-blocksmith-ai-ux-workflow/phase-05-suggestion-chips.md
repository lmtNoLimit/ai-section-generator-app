# Phase 05: Suggestion Chips

## Context Links

- [Main Plan](plan.md)
- [AI Chat UX Patterns Research](research/researcher-01-ai-chat-ux-patterns.md)
- [Chat Panel](../../app/components/chat/ChatPanel.tsx)

## Overview

| Attribute | Value |
|-----------|-------|
| Priority | P2 |
| Status | pending |
| Effort | 4h |
| Description | Context-aware follow-up action chips that appear after AI responses |

## Key Research Insights

From AI Chat UX Patterns research:
- **3-Tier Chip System**:
  - Tier 1: Immediate actions (Copy Code, Preview) - always visible
  - Tier 2: Code refinement chips - context-aware based on section type
  - Tier 3: Conversation next-steps - after 1+ exchanges
- **Timing**: Tier 2 chips render at 80% code completion
- **Section Type Detection**: Maintain `generatedSectionType` state, map to suggestions
- Top tools (ChatGPT, Claude) use context-aware suggestion placement

## Requirements

### Functional Requirements

1. **FR-05.1**: Show immediate action chips (Copy, Apply) after AI response
2. **FR-05.2**: Show context-aware refinement chips based on section type
3. **FR-05.3**: Chips send prefilled prompts to AI on click
4. **FR-05.4**: Show conversation next-step chips after 2+ exchanges
5. **FR-05.5**: Chips are scrollable when overflow

### Non-Functional Requirements

1. **NFR-05.1**: Chips render within 100ms of trigger
2. **NFR-05.2**: Chip clicks feel instant (<50ms response)
3. **NFR-05.3**: Chips don't interfere with message scrolling

## Architecture Design

### Component Structure

```
app/components/chat/
├── SuggestionChips.tsx        # NEW - chip container
├── SuggestionChip.tsx         # NEW - individual chip button
└── utils/
    ├── suggestion-engine.ts   # NEW - context-aware suggestions
    └── section-type-detector.ts # NEW - detect section type from code
```

### Suggestion Categories

```typescript
interface SuggestionCategory {
  id: string;
  label: string;
  prompt: string;
  icon?: string;
  tier: 1 | 2 | 3;
}

// Section type to suggestions mapping
const SECTION_SUGGESTIONS: Record<string, SuggestionCategory[]> = {
  hero: [
    { id: 'add-cta', label: 'Add CTA button', prompt: 'Add a call-to-action button with customizable text and link', tier: 2 },
    { id: 'add-overlay', label: 'Add overlay', prompt: 'Add a dark overlay to the background image for better text readability', tier: 2 },
    { id: 'make-fullwidth', label: 'Full width', prompt: 'Make the section full width without side margins', tier: 2 },
  ],
  productGrid: [
    { id: 'add-filters', label: 'Add filters', prompt: 'Add product filtering by category, price, and availability', tier: 2 },
    { id: 'add-quickview', label: 'Quick view', prompt: 'Add a quick view modal when hovering products', tier: 2 },
    { id: 'add-pagination', label: 'Pagination', prompt: 'Add pagination or infinite scroll for large collections', tier: 2 },
  ],
  testimonials: [
    { id: 'add-ratings', label: 'Star ratings', prompt: 'Add star ratings display to each testimonial', tier: 2 },
    { id: 'add-photos', label: 'Add photos', prompt: 'Add customer photos to testimonials', tier: 2 },
    { id: 'carousel', label: 'Make carousel', prompt: 'Convert to a horizontal scrolling carousel', tier: 2 },
  ],
  // ... more section types
};
```

### Data Flow

```
AI response complete →
  Detect section type from code →
  Generate context-aware suggestions →
  Render SuggestionChips →
  User clicks chip →
  Prefill chat input with prompt →
  Submit automatically (or let user edit)
```

## Related Code Files

| File | Purpose | Action |
|------|---------|--------|
| `app/components/chat/ChatMessage.tsx` | Message rendering | Modify - add chips after AI messages |
| `app/components/chat/SuggestionChips.tsx` | Chip container | Create new |
| `app/components/chat/utils/suggestion-engine.ts` | Suggestion logic | Create new |
| `app/components/chat/utils/section-type-detector.ts` | Type detection | Create new |
| `app/components/chat/ChatPanel.tsx` | Chat container | Modify - pass suggestion handlers |

## Implementation Steps

### Step 1: Create Section Type Detector (45min)

1. Create `app/components/chat/utils/section-type-detector.ts`:
```typescript
export type SectionType =
  | 'hero'
  | 'productGrid'
  | 'testimonials'
  | 'newsletter'
  | 'faq'
  | 'features'
  | 'gallery'
  | 'header'
  | 'footer'
  | 'generic';

interface DetectionRule {
  type: SectionType;
  patterns: RegExp[];
  weight: number;
}

const DETECTION_RULES: DetectionRule[] = [
  {
    type: 'hero',
    patterns: [
      /class=".*hero/i,
      /hero.*section/i,
      /banner/i,
      /background-image.*cover/i,
    ],
    weight: 1,
  },
  {
    type: 'productGrid',
    patterns: [
      /product.*grid/i,
      /for product in/i,
      /product\.title/i,
      /collection\.products/i,
    ],
    weight: 1,
  },
  {
    type: 'testimonials',
    patterns: [
      /testimonial/i,
      /review/i,
      /quote/i,
      /customer.*said/i,
    ],
    weight: 1,
  },
  {
    type: 'newsletter',
    patterns: [
      /newsletter/i,
      /subscribe/i,
      /email.*input/i,
      /signup/i,
    ],
    weight: 1,
  },
  {
    type: 'faq',
    patterns: [
      /faq/i,
      /accordion/i,
      /question.*answer/i,
      /collapsible/i,
    ],
    weight: 1,
  },
  {
    type: 'features',
    patterns: [
      /feature/i,
      /benefit/i,
      /icon.*grid/i,
      /service/i,
    ],
    weight: 1,
  },
  {
    type: 'gallery',
    patterns: [
      /gallery/i,
      /lightbox/i,
      /image.*grid/i,
      /masonry/i,
    ],
    weight: 1,
  },
];

export function detectSectionType(code: string): SectionType {
  const scores: Record<SectionType, number> = {
    hero: 0,
    productGrid: 0,
    testimonials: 0,
    newsletter: 0,
    faq: 0,
    features: 0,
    gallery: 0,
    header: 0,
    footer: 0,
    generic: 0,
  };

  for (const rule of DETECTION_RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(code)) {
        scores[rule.type] += rule.weight;
      }
    }
  }

  // Find highest scoring type
  let maxType: SectionType = 'generic';
  let maxScore = 0;

  for (const [type, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      maxType = type as SectionType;
    }
  }

  // Require minimum score of 2 to avoid false positives
  return maxScore >= 2 ? maxType : 'generic';
}
```

### Step 2: Create Suggestion Engine (60min)

1. Create `app/components/chat/utils/suggestion-engine.ts`:
```typescript
import { detectSectionType, type SectionType } from './section-type-detector';

export interface Suggestion {
  id: string;
  label: string;
  prompt: string;
  icon?: string;
  tier: 1 | 2 | 3;
}

// Tier 1: Always visible
const TIER1_SUGGESTIONS: Suggestion[] = [
  { id: 'copy', label: 'Copy code', prompt: '', icon: 'clipboard', tier: 1 },
  { id: 'apply', label: 'Apply to draft', prompt: '', icon: 'check', tier: 1 },
];

// Tier 2: Section-specific
const SECTION_SUGGESTIONS: Record<SectionType, Suggestion[]> = {
  hero: [
    { id: 'add-cta', label: 'Add CTA', prompt: 'Add a prominent call-to-action button with customizable text, link, and color', tier: 2 },
    { id: 'add-overlay', label: 'Dark overlay', prompt: 'Add a semi-transparent dark overlay to the background for better text contrast', tier: 2 },
    { id: 'parallax', label: 'Parallax effect', prompt: 'Add a subtle parallax scrolling effect to the background image', tier: 2 },
    { id: 'video-bg', label: 'Video background', prompt: 'Replace image background with video background option', tier: 2 },
  ],
  productGrid: [
    { id: 'add-filters', label: 'Add filters', prompt: 'Add product filtering by tags, price range, and availability', tier: 2 },
    { id: 'sort-options', label: 'Sort options', prompt: 'Add sort by price, name, date, and bestselling', tier: 2 },
    { id: 'quick-add', label: 'Quick add', prompt: 'Add quick add-to-cart button that appears on hover', tier: 2 },
    { id: 'wishlist', label: 'Wishlist', prompt: 'Add wishlist/favorite button on each product', tier: 2 },
  ],
  testimonials: [
    { id: 'ratings', label: 'Star ratings', prompt: 'Add 5-star rating display to each testimonial', tier: 2 },
    { id: 'photos', label: 'Customer photos', prompt: 'Add customer photo avatars to testimonials', tier: 2 },
    { id: 'carousel', label: 'Carousel', prompt: 'Convert to horizontal carousel with navigation arrows', tier: 2 },
    { id: 'verified', label: 'Verified badge', prompt: 'Add verified purchase badge indicator', tier: 2 },
  ],
  newsletter: [
    { id: 'gdpr', label: 'GDPR checkbox', prompt: 'Add GDPR consent checkbox with customizable text', tier: 2 },
    { id: 'incentive', label: 'Discount incentive', prompt: 'Add discount code incentive display (e.g., "Get 10% off")', tier: 2 },
    { id: 'segments', label: 'Interest segments', prompt: 'Add interest selection checkboxes for email segmentation', tier: 2 },
  ],
  faq: [
    { id: 'categories', label: 'Categories', prompt: 'Add category tabs to group FAQs by topic', tier: 2 },
    { id: 'search', label: 'Search', prompt: 'Add search bar to filter FAQ questions', tier: 2 },
    { id: 'schema', label: 'FAQ schema', prompt: 'Add structured data markup for SEO FAQ rich snippets', tier: 2 },
  ],
  features: [
    { id: 'icons', label: 'Add icons', prompt: 'Add icon picker setting for each feature', tier: 2 },
    { id: 'animations', label: 'Animations', prompt: 'Add fade-in animations when features scroll into view', tier: 2 },
    { id: 'links', label: 'Feature links', prompt: 'Add optional links to each feature for more details', tier: 2 },
  ],
  gallery: [
    { id: 'lightbox', label: 'Lightbox', prompt: 'Add lightbox modal for fullscreen image viewing', tier: 2 },
    { id: 'captions', label: 'Captions', prompt: 'Add caption text overlay on each image', tier: 2 },
    { id: 'masonry', label: 'Masonry layout', prompt: 'Convert to masonry grid layout for varied image sizes', tier: 2 },
  ],
  header: [
    { id: 'sticky', label: 'Sticky header', prompt: 'Make header sticky on scroll with transparent-to-solid transition', tier: 2 },
    { id: 'mega-menu', label: 'Mega menu', prompt: 'Add mega menu dropdown with images and columns', tier: 2 },
    { id: 'search', label: 'Search bar', prompt: 'Add expandable search bar with product suggestions', tier: 2 },
  ],
  footer: [
    { id: 'social', label: 'Social links', prompt: 'Add social media icon links section', tier: 2 },
    { id: 'newsletter', label: 'Newsletter', prompt: 'Add inline newsletter signup form', tier: 2 },
    { id: 'columns', label: 'More columns', prompt: 'Add additional customizable link columns', tier: 2 },
  ],
  generic: [
    { id: 'mobile', label: 'Mobile optimize', prompt: 'Improve mobile responsiveness with better touch targets and stacking', tier: 2 },
    { id: 'animate', label: 'Add animations', prompt: 'Add subtle entrance animations when section comes into view', tier: 2 },
    { id: 'spacing', label: 'Adjust spacing', prompt: 'Add customizable padding/margin settings for the section', tier: 2 },
    { id: 'colors', label: 'More colors', prompt: 'Add more color customization options for text, background, and accents', tier: 2 },
  ],
};

// Tier 3: Conversation next-steps
const TIER3_SUGGESTIONS: Suggestion[] = [
  { id: 'new-section', label: 'Create another section', prompt: 'I want to create a new section for...', tier: 3 },
  { id: 'preview-theme', label: 'Preview in theme', prompt: '', tier: 3 },
  { id: 'publish', label: 'Publish to theme', prompt: '', tier: 3 },
];

export function getSuggestions(
  code: string,
  messageCount: number,
  isLatestMessage: boolean
): Suggestion[] {
  if (!isLatestMessage) {
    return []; // Only show chips on latest message
  }

  const suggestions: Suggestion[] = [];

  // Tier 1: Always show
  suggestions.push(...TIER1_SUGGESTIONS);

  // Tier 2: Section-specific (if code exists)
  if (code) {
    const sectionType = detectSectionType(code);
    const typeSpecific = SECTION_SUGGESTIONS[sectionType] || SECTION_SUGGESTIONS.generic;
    suggestions.push(...typeSpecific.slice(0, 4)); // Limit to 4 chips
  }

  // Tier 3: After 2+ exchanges
  if (messageCount >= 4) { // 2 user + 2 AI messages
    suggestions.push(...TIER3_SUGGESTIONS);
  }

  return suggestions;
}
```

### Step 3: Create SuggestionChips Component (60min)

1. Create `app/components/chat/SuggestionChips.tsx`:
```typescript
import type { Suggestion } from './utils/suggestion-engine';

interface SuggestionChipsProps {
  suggestions: Suggestion[];
  onChipClick: (suggestion: Suggestion) => void;
  onCopy?: () => void;
  onApply?: () => void;
}

export function SuggestionChips({
  suggestions,
  onChipClick,
  onCopy,
  onApply,
}: SuggestionChipsProps) {
  // Group by tier
  const tier1 = suggestions.filter(s => s.tier === 1);
  const tier2 = suggestions.filter(s => s.tier === 2);
  const tier3 = suggestions.filter(s => s.tier === 3);

  const handleClick = (suggestion: Suggestion) => {
    if (suggestion.id === 'copy') {
      onCopy?.();
    } else if (suggestion.id === 'apply') {
      onApply?.();
    } else {
      onChipClick(suggestion);
    }
  };

  return (
    <s-box padding="small">
      <s-stack direction="block" gap="small">
        {/* Tier 1: Immediate actions */}
        {tier1.length > 0 && (
          <s-stack direction="inline" gap="small">
            {tier1.map(suggestion => (
              <s-button
                key={suggestion.id}
                variant="secondary"
                size="small"
                onClick={() => handleClick(suggestion)}
              >
                {suggestion.icon && <s-icon name={suggestion.icon} />}
                {suggestion.label}
              </s-button>
            ))}
          </s-stack>
        )}

        {/* Tier 2: Refinement chips - scrollable */}
        {tier2.length > 0 && (
          <s-box overflow="auto">
            <s-stack direction="inline" gap="extra-small" wrap="false">
              {tier2.map(suggestion => (
                <s-button
                  key={suggestion.id}
                  variant="plain"
                  size="small"
                  onClick={() => handleClick(suggestion)}
                >
                  <s-badge tone="info">{suggestion.label}</s-badge>
                </s-button>
              ))}
            </s-stack>
          </s-box>
        )}

        {/* Tier 3: Next steps */}
        {tier3.length > 0 && (
          <s-stack direction="inline" gap="small">
            {tier3.map(suggestion => (
              <s-button
                key={suggestion.id}
                variant="plain"
                size="small"
                onClick={() => handleClick(suggestion)}
              >
                {suggestion.label}
              </s-button>
            ))}
          </s-stack>
        )}
      </s-stack>
    </s-box>
  );
}
```

### Step 4: Integrate into ChatMessage (45min)

1. Modify `app/components/chat/ChatMessage.tsx`:
```typescript
// Import suggestion components
import { SuggestionChips } from './SuggestionChips';
import { getSuggestions } from './utils/suggestion-engine';

// In component
const suggestions = useMemo(() => {
  if (message.role !== 'assistant' || isStreaming) {
    return [];
  }
  return getSuggestions(
    message.codeSnapshot || '',
    messageCount,
    isLatestMessage
  );
}, [message, isStreaming, messageCount, isLatestMessage]);

// After message content
{suggestions.length > 0 && (
  <SuggestionChips
    suggestions={suggestions}
    onChipClick={onSuggestionClick}
    onCopy={() => copyToClipboard(message.codeSnapshot)}
    onApply={() => onApplyCode?.(message.codeSnapshot)}
  />
)}
```

### Step 5: Handle Chip Click Actions (30min)

1. Add chip click handler in `ChatPanel.tsx`:
```typescript
const handleSuggestionClick = useCallback((suggestion: Suggestion) => {
  if (suggestion.prompt) {
    // Set input value to suggestion prompt
    setInputValue(suggestion.prompt);
    // Optionally auto-submit
    // handleSubmit(suggestion.prompt);
  }

  // Handle special actions
  if (suggestion.id === 'preview-theme') {
    // Switch to preview tab
    setActiveTab('preview');
  }
  if (suggestion.id === 'publish') {
    // Open publish modal
    openPublishModal();
  }
}, [setInputValue]);
```

## Todo List

- [ ] Create section-type-detector.ts utility
- [ ] Create suggestion-engine.ts with all section types
- [ ] Create SuggestionChips component
- [ ] Integrate chips into ChatMessage
- [ ] Add chip click handlers in ChatPanel
- [ ] Add copy-to-clipboard functionality
- [ ] Add keyboard navigation for chips
- [ ] Test detection accuracy with various sections
- [ ] Add analytics tracking for chip usage

## Success Criteria

1. Tier 1 chips (Copy, Apply) always visible after AI response
2. Tier 2 chips match detected section type
3. Clicking refinement chip fills prompt input
4. Chips scroll horizontally when overflowing
5. Tier 3 chips appear after 2+ exchanges

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Type detection inaccurate | Medium | Low | Fallback to generic suggestions |
| Too many chips clutters UI | Low | Medium | Limit to 4-5 per tier |
| Chip prompts too generic | Medium | Low | Refine based on user feedback |
| Chips interfere with scrolling | Low | Medium | Use horizontal scroll container |

## Security Considerations

- Sanitize suggestion prompts before display
- Rate limit chip-triggered submissions
- No sensitive data in suggestion prompts

---

**Phase Status**: Pending
**Estimated Completion**: 4 hours
**Dependencies**: Phase 02 (streaming completion state)
