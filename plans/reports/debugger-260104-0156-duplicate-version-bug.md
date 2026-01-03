# Duplicate Version Bug Investigation

**Date:** 2026-01-04 01:56
**Issue:** Shows 1 version initially (fake/optimistic), then 2 versions after reload (duplicate)
**Status:** Root cause identified

---

## Root Cause

**Double message creation from client and server:**

1. **Client-side optimistic message** (useChat.ts:227-235)
   - After streaming completes, creates `UIMessage` with `id: assistant-${Date.now()}`
   - Dispatches `COMPLETE_STREAMING` to add to local state
   - This creates the "fake" version visible immediately

2. **Server-side persisted message** (api.chat.stream.tsx:123-129)
   - Creates actual DB message via `chatService.addAssistantMessage()`
   - Returns real message with DB-generated ID
   - Sends `message_complete` event with codeSnapshot

3. **Loader re-fetch on page reload** (app.sections.$id.tsx:63)
   - Fetches messages from DB
   - Returns ONLY the server-persisted message (real ID)
   - Client's optimistic message is lost, replaced by DB version

**Result:**
- Initially: 1 version (optimistic client message)
- After reload: 1 version (DB message) - appears as "duplicate" because ID changed
- If both exist: 2 versions (client optimistic + DB message)

---

## Code Flow Analysis

### 1. Initial Generation Flow

**User submits prompt** → `/app/sections/new` (app.sections.new.tsx):
```typescript
// Line 73-85
const section = await sectionService.create({
  shop: session.shop,
  prompt,
  code: "", // Empty until AI generates
});

const conversation = await chatService.getOrCreateConversation(section.id, session.shop);
await chatService.addUserMessage(conversation.id, prompt); // DB write
```

**Redirect to editor** → `/app/sections/$id`:
```typescript
// Line 421-426 (app.sections.$id.tsx)
const isInitialGeneration = useMemo(() => {
  const hasUserMessage = initialMessages.some(m => m.role === 'user');
  const hasAssistantMessage = initialMessages.some(m => m.role === 'assistant');
  const hasCode = sectionCode.length > 0;
  return hasUserMessage && !hasAssistantMessage && !hasCode;
}, [initialMessages, sectionCode]);
```

**Auto-trigger AI** → ChatPanel.tsx (Line 100-114):
```typescript
useEffect(() => {
  if (isStreaming || hasTriggeredAutoGenRef.current) return;
  if (messages.length === 0) return;

  const lastMessage = messages[messages.length - 1];
  const hasAssistantResponse = messages.some((m) => m.role === "assistant");

  if (lastMessage.role === "user" && !hasAssistantResponse) {
    hasTriggeredAutoGenRef.current = true;
    triggerGeneration(lastMessage.content); // Triggers without adding user message
  }
}, [messages, isStreaming, triggerGeneration]);
```

### 2. AI Streaming Flow

**Client starts stream** → useChat.ts (Line 156-175):
```typescript
// streamResponse function
const response = await fetch('/api/chat/stream', {
  method: 'POST',
  body: formData, // conversationId, content, currentCode, continueGeneration=true
  signal: abortControllerRef.current.signal,
});
```

**Server processes** → api.chat.stream.tsx (Line 61-63):
```typescript
// Skip adding user message if continuing generation
if (!continueGeneration) {
  await chatService.addUserMessage(conversationId, sanitizedContent);
}
```

**Server streams tokens** → api.chat.stream.tsx (Line 97-112):
```typescript
for await (const token of generator) {
  fullContent += token;
  tokenCount += estimateTokens(token);

  controller.enqueue(
    encoder.encode(
      `data: ${JSON.stringify({
        type: 'content_delta',
        data: { content: token },
      })}\n\n`
    )
  );
}
```

**Client receives tokens** → useChat.ts (Line 199-206):
```typescript
case 'content_delta':
  if (event.data.content) {
    assistantContent += event.data.content;
    dispatch({ type: 'APPEND_CONTENT', content: event.data.content });
    processToken(event.data.content); // Build phase tracking
  }
  break;
```

### 3. Stream Completion - THE BUG

**Server saves to DB** → api.chat.stream.tsx (Line 122-144):
```typescript
// Save assistant message
const assistantMessage = await chatService.addAssistantMessage(
  conversationId,
  fullContent,
  sanitizedCode,
  tokenCount,
  'gemini-2.5-flash'
);

// Send completion event
controller.enqueue(
  encoder.encode(
    `data: ${JSON.stringify({
      type: 'message_complete',
      data: {
        messageId: assistantMessage.id, // Real DB ID
        codeSnapshot: sanitizedCode,
        hasCode: extraction.hasCode,
        changes: extraction.changes,
      },
    })}\n\n`
  )
);
```

**Client creates optimistic message** → useChat.ts (Line 226-235):
```typescript
// Add completed assistant message
const assistantMessage: UIMessage = {
  id: `assistant-${Date.now()}`, // ⚠️ FAKE ID - not DB ID
  conversationId,
  role: 'assistant',
  content: assistantContent,
  codeSnapshot, // From message_complete event
  createdAt: new Date(),
};
dispatch({ type: 'COMPLETE_STREAMING', message: assistantMessage });
```

**Problem:** Client ignores `messageId` from server's `message_complete` event!

### 4. Version State Derivation

**useVersionState** derives versions from messages (useVersionState.ts:54-71):
```typescript
const versions = useMemo<CodeVersion[]>(() => {
  let versionNumber = 0;
  return messages
    .filter((m) => m.role === 'assistant')
    .map((m) => {
      const code = m.codeSnapshot || extractCodeFromContent(m.content);
      if (!code) return null;
      return {
        id: m.id, // Uses message ID as version ID
        versionNumber: ++versionNumber,
        code,
        createdAt: m.createdAt,
        messageContent: m.content.slice(0, 100),
      };
    })
    .filter((v): v is CodeVersion => v !== null);
}, [messages]);
```

**First render:** 1 version with `id: assistant-${timestamp}`
**After reload:** 1 version with `id: ${dbObjectId}` (different ID = appears as new version)

---

## Why Appears as Duplicate

### Scenario 1: Initial view (no reload)
- Messages state: `[{ id: 'assistant-1234567890', codeSnapshot: '...' }]`
- Versions: `[{ id: 'assistant-1234567890', versionNumber: 1 }]`
- **User sees: 1 version**

### Scenario 2: After reload
- Loader fetches from DB: `[{ id: '67abc123def...', codeSnapshot: '...' }]`
- Versions: `[{ id: '67abc123def...', versionNumber: 1 }]`
- **User sees: 1 version** (but different ID, so looks like a new version if they had the page open)

### Scenario 3: If optimistic message persists + loader adds DB message
- Messages: `[{ id: 'assistant-1234567890', ... }, { id: '67abc123def...', ... }]`
- Both have same codeSnapshot but different IDs
- **User sees: 2 versions** (DUPLICATE!)

---

## Evidence from Code

### 1. Message ID mismatch
**Server sends real ID** (api.chat.stream.tsx:138):
```typescript
messageId: assistantMessage.id, // Real DB ObjectId
```

**Client creates fake ID** (useChat.ts:228):
```typescript
id: `assistant-${Date.now()}`, // Temporary client-side ID
```

**Client never uses server's messageId!**

### 2. Race condition detection attempt exists
**useChat.ts:59-87** has duplicate prevention logic:
```typescript
case 'COMPLETE_STREAMING': {
  // Prevent duplicate messages - check if assistant message already exists
  let lastUserIndex = -1;
  for (let i = state.messages.length - 1; i >= 0; i--) {
    if (state.messages[i].role === 'user') {
      lastUserIndex = i;
      break;
    }
  }
  const hasAssistantAfterUser = state.messages.slice(lastUserIndex + 1).some((m) => m.role === 'assistant');
  const messageExists = state.messages.some((m) => m.id === action.message.id);

  if (messageExists || hasAssistantAfterUser) {
    // Already have assistant response, skip
    return {
      ...state,
      isStreaming: false,
      streamingContent: '',
    };
  }

  return {
    ...state,
    isStreaming: false,
    streamingContent: '',
    messages: [...state.messages, action.message],
  };
}
```

**But this doesn't prevent ID mismatch issue!**

### 3. No sync with DB message
**useChat.ts** never:
- Fetches the saved message from DB
- Updates local message ID with real DB ID
- Reconciles client state with server state

---

## Files Involved

1. **app/components/chat/hooks/useChat.ts** (Line 226-235)
   - Creates optimistic message with fake ID
   - Should use messageId from server event

2. **app/routes/api.chat.stream.tsx** (Line 122-144)
   - Saves message to DB
   - Sends messageId in completion event (but client ignores it)

3. **app/services/chat.server.ts** (Line 62-90)
   - `addAssistantMessage()` creates DB message
   - Returns UIMessage with real DB ID

4. **app/components/editor/hooks/useVersionState.ts** (Line 54-71)
   - Derives versions from message IDs
   - ID mismatch causes duplicate versions

5. **app/routes/app.sections.$id.tsx** (Line 63)
   - Loader fetches messages from DB
   - Replaces client state on page load

---

## Recommended Fix

### Option 1: Use server's messageId (RECOMMENDED)
**Modify useChat.ts (Line 208-214):**
```typescript
case 'message_complete':
  // Store the real message ID from server
  const realMessageId = event.data.messageId;
  codeSnapshot = event.data.codeSnapshot;
  if (codeSnapshot && onCodeUpdate) {
    onCodeUpdate(codeSnapshot);
  }
  // Pass messageId to completion handler
  messageIdRef.current = realMessageId;
  break;
```

**Then update completion (Line 226-235):**
```typescript
const assistantMessage: UIMessage = {
  id: messageIdRef.current || `assistant-${Date.now()}`, // Use real ID from server
  conversationId,
  role: 'assistant',
  content: assistantContent,
  codeSnapshot,
  createdAt: new Date(),
};
```

### Option 2: Fetch after save
After streaming completes, refetch conversation messages from DB to sync state.

### Option 3: Remove optimistic message
Only show streaming content, then refetch messages from DB when complete.

---

## Impact

**Affects:**
- Version history UI (shows duplicates)
- Version selection (wrong IDs)
- URL persistence (`?v=assistant-123` won't work after reload)

**Does NOT affect:**
- Code functionality (same code in both versions)
- DB data (only one message saved)
- AI generation (works correctly)

---

## Unresolved Questions

1. Why does duplicate prevention in `COMPLETE_STREAMING` not catch this?
   - Answer: It checks for duplicate IDs, but client ID ≠ server ID
2. Is there a scenario where both messages exist simultaneously?
   - Answer: Only if messages state isn't cleared on reload
3. Should we keep optimistic updates or rely on server state?
   - Recommendation: Keep optimistic, but sync IDs with server
