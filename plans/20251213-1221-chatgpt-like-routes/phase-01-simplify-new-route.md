# Phase 01: Simplify /new Route

## Context Links
- Parent: [plan.md](./plan.md)
- Dependencies: None
- Docs: [codebase-summary.md](../../docs/codebase-summary.md)

## Overview

| Field | Value |
|-------|-------|
| Date | 2025-12-13 |
| Completed | 2025-12-14 |
| Description | Rewrite `/sections/new` to minimal prompt-only UI |
| Priority | High |
| Implementation Status | Done |
| Review Status | Approved (temporary) |
| Review Report | [code-reviewer-251213-auto-generation-review.md](./reports/code-reviewer-251213-auto-generation-review.md) |

## Key Insights

1. Current `/new` route has 410 lines with two-column layout, advanced options, theme selectors—unnecessary for initial prompt entry
2. ChatGPT-style UX focuses user on single action: describe what you want
3. Section creation should happen on submit, not after AI response
4. All configuration (theme, filename, advanced options) moves to `/$id` settings panel

## Requirements

### Functional
- FR1: Minimal centered layout with single textarea + submit button
- FR2: Submit action creates section in DB with status="draft"
- FR3: Submit action creates conversation + first message
- FR4: Redirect to `/sections/$id` immediately after section creation
- FR5: Optional template chips for quick-start prompts

### Non-Functional
- NFR1: Page load < 500ms (minimal components)
- NFR2: Works in Shopify embedded iframe
- NFR3: Responsive design (mobile-first)

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  app.sections.new.tsx (Simplified)                       │
│                                                          │
│  loader():                                               │
│    - Authenticate                                        │
│    - (Optional) Fetch template chips                     │
│                                                          │
│  action():                                               │
│    - Create Section (sectionService.create)              │
│    - Create Conversation (chatService.getOrCreate)       │
│    - Add First Message (chatService.addMessage)          │
│    - Return sectionId for redirect                       │
│                                                          │
│  Component():                                            │
│    - Centered layout (s-page)                            │
│    - Prompt textarea (ChatInput or custom)               │
│    - Submit button                                       │
│    - Template chips (optional)                           │
│    - useEffect to redirect on success                    │
└─────────────────────────────────────────────────────────┘
```

## Related Code Files

| File | Purpose | Change Type |
|------|---------|-------------|
| `app/routes/app.sections.new.tsx` | Main route file | Complete rewrite |
| `app/services/section.server.ts` | Section CRUD | No changes |
| `app/services/chat.server.ts` | Conversation CRUD | No changes |
| `app/components/chat/ChatInput.tsx` | May extract/reuse | Evaluate |

## Implementation Steps

### Step 1: Create New Route Shell
```typescript
// app/routes/app.sections.new.tsx (~100 lines)
import { useState } from 'react';
import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router';
import { useActionData, useNavigate, useNavigation, useSubmit } from 'react-router';
import { authenticate } from '../shopify.server';
import { sectionService } from '../services/section.server';
import { chatService } from '../services/chat.server';

export async function loader({ request }: LoaderFunctionArgs) {
  await authenticate.admin(request);
  // Optional: fetch template chips
  return {};
}

export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const prompt = formData.get('prompt') as string;

  // Create section with minimal data
  const section = await sectionService.create({
    shop: session.shop,
    prompt,
    code: '', // Empty until AI generates
    status: 'draft',
  });

  // Create conversation + first message
  const conversation = await chatService.getOrCreateConversation(section.id, session.shop);
  await chatService.addMessage({
    conversationId: conversation.id,
    role: 'user',
    content: prompt,
  });

  return { sectionId: section.id };
}
```

### Step 2: Implement Minimal UI Component
```tsx
export default function NewSectionPage() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const submit = useSubmit();
  const [prompt, setPrompt] = useState('');

  const isSubmitting = navigation.state === 'submitting';

  // Redirect on success
  useEffect(() => {
    if (actionData?.sectionId) {
      navigate(`/app/sections/${actionData.sectionId}`);
    }
  }, [actionData, navigate]);

  const handleSubmit = () => {
    if (!prompt.trim()) return;
    const formData = new FormData();
    formData.append('prompt', prompt);
    submit(formData, { method: 'post' });
  };

  return (
    <s-page inlineSize="narrow">
      <div className="new-section-container">
        <h1>Create a Section</h1>
        <p>Describe the section you want to create</p>

        <div className="prompt-input">
          <s-text-field
            label=""
            value={prompt}
            onInput={(e) => setPrompt(e.target.value)}
            multiline="4"
            placeholder="A hero section with video background and centered call-to-action..."
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

        {/* Optional: Template chips */}
        <div className="template-chips">
          <s-button-group>
            <s-button variant="plain" onClick={() => setPrompt('Hero section with background image')}>
              Hero
            </s-button>
            <s-button variant="plain" onClick={() => setPrompt('Product grid with 3 columns')}>
              Product Grid
            </s-button>
            <s-button variant="plain" onClick={() => setPrompt('Testimonial carousel')}>
              Testimonials
            </s-button>
          </s-button-group>
        </div>
      </div>
    </s-page>
  );
}
```

### Step 3: Add Minimal CSS
```css
/* app/styles/new-section.css or inline */
.new-section-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
  padding: 2rem;
}

.prompt-input {
  width: 100%;
  max-width: 600px;
  margin: 2rem 0;
}

.template-chips {
  margin-top: 1rem;
}
```

### Step 4: Remove Unused Components
Evaluate and potentially deprecate:
- `GenerateLayout.tsx`
- `GenerateInputColumn.tsx`
- `GeneratePreviewColumn.tsx`
- `AdvancedOptions.tsx`
- `SaveTemplateModal.tsx` (move to `/$id` if needed)

## Todo List

- [x] Create new route shell with loader/action
- [x] Implement minimal UI component
- [x] Add CSS styles
- [x] Test section creation flow
- [x] Verify redirect to `/$id`
- [x] Implement auto-trigger for pending messages
- [x] **Fix C1: Race condition in auto-trigger effect** (CRITICAL) - Resolved
- [x] **Fix C2: Add messageId deduplication** (CRITICAL) - Resolved
- [x] **Fix H1: Reset hasTriggeredAutoGenRef on conversationId change** (HIGH) - Resolved
- [x] Test in Shopify embedded iframe
- [x] Evaluate component deprecation

## Success Criteria

- [x] Route renders in < 500ms
- [x] Single textarea + button UI matches mockup
- [x] Submit creates section + conversation
- [x] Redirect to `/sections/$id` works
- [x] Auto-trigger generation for first message
- [x] **No race conditions in auto-trigger** (CRITICAL)
- [x] **Idempotent request handling** (CRITICAL)
- [x] Works in Shopify iframe

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Breaking existing flows | Low | High | Keep old route temporarily as fallback |
| CSS conflicts with Polaris | Medium | Low | Use scoped class names |
| Missing validation | Medium | Medium | Add prompt length validation |

## Security Considerations

- Validate prompt input (max length, sanitize)
- Ensure shop isolation in section creation
- CSRF protection via React Router form

## Review Findings (2025-12-13)

**Critical Issues (RESOLVED):**
- C1: Race condition in auto-trigger effect (double-firing possible) - Fixed via effect cleanup & ref tracking
- C2: No idempotency for `continueGeneration` requests - Fixed via `continueGeneration` flag & message ID dedup

**High Priority (RESOLVED):**
- H1: `hasTriggeredAutoGenRef` not reset on conversationId change - Fixed via dependency array

**Status:** Phase 01 COMPLETE. All critical issues resolved. Approved for Phase 02 proceeding.

See [code-reviewer-251213-auto-generation-review.md](./reports/code-reviewer-251213-auto-generation-review.md) for details.

## Completion Summary (2025-12-14)

**Delivered:**
- ChatGPT-style minimal prompt UI on `/sections/new` route
- Auto-generation trigger on redirect to `/$id`
- Template chips for quick-start prompts
- Race condition mitigation & idempotent request handling
- All acceptance criteria met

**Files Modified:**
- `app/routes/app.sections.new.tsx` - Complete rewrite to minimal UI
- `app/styles/new-section.css` - New styling file
- `app/routes/api.chat.stream.tsx` - Added `continueGeneration` flag
- `app/components/chat/hooks/useChat.ts` - Added `triggerGeneration` method
- `app/components/chat/ChatPanel.tsx` - Auto-trigger on first message
- `app/utils/input-sanitizer.ts` - ESLint fixes

**Next Steps:**

Proceed to [Phase 02](./phase-02-integrate-initial-message.md) - Integrate Initial Message with $id
