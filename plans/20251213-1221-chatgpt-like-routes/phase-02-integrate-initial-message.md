# Phase 02: Integrate Initial Message with $id

## Context Links
- Parent: [plan.md](./plan.md)
- Dependencies: [Phase 01](./phase-01-simplify-new-route.md)
- Docs: [codebase-summary.md](../../docs/codebase-summary.md)

## Overview

| Field | Value |
|-------|-------|
| Date | 2025-12-13 |
| Description | Update `/$id` to handle initial message and trigger AI response |
| Priority | High |
| Implementation Status | Pending |
| Review Status | Pending |

## Key Insights

1. Current `/$id` loads existing conversation with messages already containing AI responses
2. New flow: redirect from `/new` with user message but NO AI response yet
3. Need to detect "pending" state and auto-trigger AI generation
4. AI response should stream and update code preview in real-time

## Requirements

### Functional
- FR1: Detect new section (no AI response in conversation)
- FR2: Auto-trigger AI generation on page load for pending messages
- FR3: Stream AI response to chat panel
- FR4: Extract and apply generated code to section
- FR5: Update section.code when AI completes

### Non-Functional
- NFR1: AI response begins streaming < 500ms after page load
- NFR2: Graceful handling if user navigates away mid-stream
- NFR3: Error recovery with user-facing message

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  User submits prompt on /new                                 │
│         ↓                                                    │
│  Action creates: Section (code=''), Conversation, Message    │
│         ↓                                                    │
│  Redirect to /sections/$id                                   │
│         ↓                                                    │
│  /$id loader fetches: Section, Conversation, Messages        │
│         ↓                                                    │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Detect: Last message is 'user' role (no AI response) │  │
│  │  → Set pendingAIResponse = true                       │  │
│  └───────────────────────────────────────────────────────┘  │
│         ↓                                                    │
│  Component mounts with pendingAIResponse                     │
│         ↓                                                    │
│  useEffect: if pendingAIResponse, call /api/chat/stream      │
│         ↓                                                    │
│  ChatPanelWrapper handles streaming response                 │
│         ↓                                                    │
│  onCodeUpdate callback extracts code → updates section       │
└─────────────────────────────────────────────────────────────┘
```

## Related Code Files

| File | Purpose | Change Type |
|------|---------|-------------|
| `app/routes/app.sections.$id.tsx` | Editor page | Modify loader + add pending detection |
| `app/components/editor/ChatPanelWrapper.tsx` | Chat component | Add auto-send on mount |
| `app/routes/api.chat.stream.tsx` | Streaming API | No changes expected |
| `app/services/chat.server.ts` | Message handling | No changes expected |

## Implementation Steps

### Step 1: Update Loader to Detect Pending State
```typescript
// app/routes/app.sections.$id.tsx - loader

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const sectionId = params.id;

  // ... existing section/themes/conversation loading ...

  // Detect pending state: last message is user with no AI response
  const hasPendingMessage = messages.length > 0 &&
    messages[messages.length - 1].role === 'user' &&
    section.code === ''; // No generated code yet

  return {
    section,
    themes,
    conversation: {
      id: conversation.id,
      messages,
    },
    hasPendingMessage, // New flag
    pendingPrompt: hasPendingMessage ? messages[messages.length - 1].content : null,
  };
}
```

### Step 2: Add Auto-Trigger in Component
```typescript
// app/routes/app.sections.$id.tsx - component

export default function UnifiedEditorPage() {
  const { section, themes, conversation, hasPendingMessage, pendingPrompt } =
    useLoaderData<typeof loader>();

  // ... existing state/handlers ...

  // Track if we've triggered the initial AI response
  const hasTriggeredInitial = useRef(false);

  // Auto-trigger AI for pending message
  useEffect(() => {
    if (hasPendingMessage && !hasTriggeredInitial.current && pendingPrompt) {
      hasTriggeredInitial.current = true;
      // Trigger AI generation via ChatPanelWrapper
      // The ChatPanelWrapper should expose a method or accept a prop
    }
  }, [hasPendingMessage, pendingPrompt]);

  return (
    <s-page inlineSize="large">
      {/* ... existing layout ... */}

      <ChatPanelWrapper
        conversationId={conversationId}
        initialMessages={initialMessages}
        currentCode={sectionCode}
        onCodeUpdate={handleCodeUpdate}
        autoSendPending={hasPendingMessage} // New prop
        pendingPrompt={pendingPrompt} // New prop
      />
    </s-page>
  );
}
```

### Step 3: Update ChatPanelWrapper for Auto-Send
```typescript
// app/components/editor/ChatPanelWrapper.tsx

interface ChatPanelWrapperProps {
  conversationId: string;
  initialMessages: UIMessage[];
  currentCode: string;
  onCodeUpdate: (code: string, source: string) => void;
  autoSendPending?: boolean; // New
  pendingPrompt?: string | null; // New
}

export function ChatPanelWrapper({
  conversationId,
  initialMessages,
  currentCode,
  onCodeUpdate,
  autoSendPending,
  pendingPrompt,
}: ChatPanelWrapperProps) {
  const hasAutoSent = useRef(false);

  // Auto-trigger streaming for pending message
  useEffect(() => {
    if (autoSendPending && pendingPrompt && !hasAutoSent.current) {
      hasAutoSent.current = true;
      // Trigger the streaming API call
      // This may require adjusting the existing send logic
      triggerAIResponse(pendingPrompt);
    }
  }, [autoSendPending, pendingPrompt]);

  const triggerAIResponse = async (prompt: string) => {
    // Call /api/chat/stream with the prompt
    // Handle streaming response
    // Extract code and call onCodeUpdate
  };

  // ... rest of component
}
```

### Step 4: Handle Streaming Response
The existing streaming logic in ChatPanelWrapper should already handle:
1. Calling `/api/chat/stream` with prompt
2. Streaming assistant response to UI
3. Extracting code blocks from response
4. Calling `onCodeUpdate` with extracted code

Verify this flow works for auto-triggered messages.

### Step 5: Update Section Code on AI Complete
```typescript
// Ensure handleCodeUpdate triggers section update
const handleCodeUpdate = (code: string, source: string) => {
  // Update local state
  setSectionCode(code);
  setLastCodeSource(source);

  // Save to database (existing saveDraft action or new auto-save)
  if (code && code !== section.code) {
    // Debounced save to prevent excessive DB writes
    debouncedSaveCode(code);
  }
};
```

## Todo List

- [ ] Add hasPendingMessage to loader
- [ ] Pass pending state to component
- [ ] Update ChatPanelWrapper with auto-send props
- [ ] Implement auto-trigger useEffect
- [ ] Verify streaming works for auto-triggered
- [ ] Test code extraction and update
- [ ] Handle edge cases (network error, user refresh)

## Success Criteria

- [ ] Redirect from `/new` shows chat with user message
- [ ] AI response starts streaming automatically
- [ ] Code preview updates as AI generates
- [ ] Section.code updated in database
- [ ] No duplicate AI responses on refresh

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Duplicate AI triggers on fast refresh | Medium | Medium | Use hasAutoSent ref + DB check |
| Streaming error leaves bad state | Low | High | Add error state and retry UI |
| Race condition with code updates | Low | Medium | Use optimistic locking or timestamps |

## Security Considerations

- Validate section ownership in streaming endpoint
- Rate limit AI generation requests
- Sanitize prompt before sending to AI

## Next Steps

After Phase 02 complete:
1. Proceed to [Phase 03: Polish & Template Chips](./phase-03-polish-templates.md)
2. Add UI polish and optional quick-start templates
