# Investigation Report: Stuck "Generating your section..." Loader

**Issue ID:** debugger-260101-1113-stuck-generation-loader
**Date:** 2026-01-01
**Severity:** HIGH - Blocks user from seeing AI response
**Status:** Root cause identified

## Executive Summary

AI generation completes successfully but loader "Generating your section..." never disappears. Users cannot see AI response despite successful streaming. Root cause: stale message state used for `isInitialGeneration` flag.

**Impact:**
- Users see perpetual loading state
- AI responses invisible behind loader
- Affects all initial section generations
- No error shown - appears as infinite loading

**Root Cause:**
`isInitialGeneration` flag depends on stale `initialMessages` from loader props instead of live-updated `liveMessages` state.

## Technical Analysis

### Generation Flow (Working Parts)

1. **Route loads data** (`app/routes/app.sections.$id.tsx:34-74`)
   - Loader fetches section, conversation, messages
   - Returns initial state to component

2. **Auto-trigger detection** (`app/components/chat/ChatPanel.tsx:85-98`)
   - Detects last message is user with no assistant response
   - Calls `triggerGeneration()` correctly
   - Sets `isStreaming = true`

3. **API streaming** (`app/routes/api.chat.stream.tsx:86-169`)
   - SSE stream established
   - Gemini streaming works
   - Events sent: `message_start`, `content_delta`, `message_complete`

4. **Message state update** (`app/components/chat/hooks/useChat.ts:111-209`)
   - Receives stream events
   - Appends content via `APPEND_CONTENT` action
   - Completes via `COMPLETE_STREAMING` action (line 193)
   - Adds assistant message to local `messages` state

5. **Parent sync** (`app/components/chat/ChatPanel.tsx:80-82`)
   - ChatPanel calls `onMessagesChange(messages)`
   - Parent's `handleMessagesChange` updates `liveMessages` (line 75-77 in useEditorState.ts)

### Broken Part: Loader Visibility Logic

**File:** `app/routes/app.sections.$id.tsx`

**Lines 412-418:**
```typescript
const isInitialGeneration = useMemo(() => {
  if (!initialMessages || initialMessages.length === 0) return false;
  const hasUserMessage = initialMessages.some(m => m.role === 'user');
  const hasAssistantMessage = initialMessages.some(m => m.role === 'assistant');
  const hasCode = sectionCode.length > 0;
  return hasUserMessage && !hasAssistantMessage && !hasCode;
}, [initialMessages, sectionCode]);
```

**Lines 542-556:**
```typescript
<ChatPanelWrapper
  conversationId={conversationId}
  initialMessages={initialMessages}
  currentCode={sectionCode}
  onCodeUpdate={handleCodeUpdate}
  onMessagesChange={handleMessagesChange}
  versions={versions}
  selectedVersionId={selectedVersionId}
  activeVersionId={activeVersionId}
  onVersionSelect={selectVersion}
  onVersionApply={handleVersionApply}
  isInitialGeneration={isInitialGeneration}  // ⚠️ NEVER UPDATES
/>
```

**File:** `app/components/editor/hooks/useEditorState.ts`

**Lines 62-77:** (Working correctly)
```typescript
// Live messages state - synced from ChatPanel
const [liveMessages, setLiveMessages] = useState<UIMessage[]>(
  conversation?.messages || []
);

// Sync initial messages from loader
useEffect(() => {
  if (conversation?.messages) {
    setLiveMessages(conversation.messages);
  }
}, [conversation?.messages]);

// Callback for ChatPanel to sync messages
const handleMessagesChange = useCallback((messages: UIMessage[]) => {
  setLiveMessages(messages);  // ✅ Updates correctly
}, []);
```

**Lines 146-147:** (BUG - Returns stale data)
```typescript
conversationId: conversation?.id || null,
initialMessages: conversation?.messages || [],  // ❌ STALE - never updates
handleMessagesChange,
```

**Line 123:** (Proof pattern should use liveMessages)
```typescript
} = useVersionState({
  messages: liveMessages,  // ✅ Correctly uses live state
  initialCode: sectionCode,
  // ...
});
```

### Sequence Diagram

```
User creates section → Loader shows "Generating..."
                    ↓
ChatPanel.triggerGeneration() → API streaming starts
                    ↓
useChat receives SSE events → messages state updates
                    ↓
ChatPanel.onMessagesChange → liveMessages updates in useEditorState
                    ↓
useEditorState returns → initialMessages: conversation?.messages (STALE)
                    ↓
Route's isInitialGeneration → still checks stale initialMessages
                    ↓
hasAssistantMessage = false (wrong) → isInitialGeneration = true (wrong)
                    ↓
Loader stays visible FOREVER → blocks UI
```

## Evidence

**File Locations:**

| File | Lines | Issue |
|------|-------|-------|
| `app/routes/app.sections.$id.tsx` | 412-418 | `isInitialGeneration` uses stale `initialMessages` |
| `app/routes/app.sections.$id.tsx` | 555 | Passes `isInitialGeneration` to wrapper |
| `app/components/editor/hooks/useEditorState.ts` | 147 | Returns stale `conversation?.messages` as `initialMessages` |
| `app/components/editor/hooks/useEditorState.ts` | 63-77 | `liveMessages` state updates correctly |
| `app/components/editor/hooks/useEditorState.ts` | 123 | Pattern: `useVersionState` correctly uses `liveMessages` |
| `app/components/editor/ChatPanelWrapper.tsx` | 42-51 | Loader shown when `isInitialGeneration={true}` |

**Data Flow:**
- ✅ AI streaming completes
- ✅ `useChat` messages state updates
- ✅ `onMessagesChange` callback fires
- ✅ `liveMessages` updates in useEditorState
- ❌ `initialMessages` returned from useEditorState stays stale
- ❌ Route's `isInitialGeneration` memo never recalculates with new data
- ❌ Loader never hides

## Solution

### Fix #1: Return liveMessages instead of stale prop (RECOMMENDED)

**File:** `app/components/editor/hooks/useEditorState.ts`

**Change line 147:**
```diff
  // Conversation
  conversationId: conversation?.id || null,
- initialMessages: conversation?.messages || [],
+ initialMessages: liveMessages,  // Use live state that updates
  handleMessagesChange,
```

**Why:**
- Minimal change
- Follows existing pattern (useVersionState uses liveMessages at line 123)
- Route's memo will recalculate when liveMessages updates
- isInitialGeneration will become false when assistant message arrives

### Fix #2: Alternative - Move isInitialGeneration to useEditorState (More refactoring)

Move calculation inside `useEditorState` where it has access to `liveMessages`:

```typescript
// In useEditorState.ts
const isInitialGeneration = useMemo(() => {
  if (!liveMessages || liveMessages.length === 0) return false;
  const hasUserMessage = liveMessages.some(m => m.role === 'user');
  const hasAssistantMessage = liveMessages.some(m => m.role === 'assistant');
  const hasCode = sectionCode.length > 0;
  return hasUserMessage && !hasAssistantMessage && !hasCode;
}, [liveMessages, sectionCode]);

return {
  // ... existing returns
  isInitialGeneration,
}
```

Then remove from route, use from hook:
```typescript
const {
  // ... existing
  isInitialGeneration,  // Add to destructure
} = useEditorState({...});
```

**Why:**
- Centralizes logic
- Prevents future stale data bugs
- More maintainable
- Better separation of concerns

### Testing

After fix, verify:
1. Create new section with initial message
2. Loader shows "Generating your section..."
3. AI streams response
4. Loader disappears when first assistant message arrives
5. Chat UI shows messages properly
6. Versions timeline appears (proves messages updated)

## Preventive Measures

1. **Code review checklist item:**
   - When syncing state between components, ensure returned values use synced state, not props
   - Check memo dependencies include all dynamic data

2. **Naming convention:**
   - Use `initial*` only for truly initial/static data from loader
   - Use `live*` or `current*` for reactive state
   - Consider renaming in useEditorState: `initialMessages` → `messages` or `liveMessages`

3. **Testing:**
   - Add integration test for initial generation flow
   - Test: loader visible → API completes → loader hides
   - Mock SSE stream in test

## Unresolved Questions

None - root cause definitively identified, fix straightforward.
