---
phase: 2
title: "Auto-Apply & Version Management"
status: pending
effort: 3h
---

# Phase 2: Auto-Apply & Version Management

**Parent Plan**: [plan.md](./plan.md)
**Dependencies**: Phase 1 (AIResponseCard Component)

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-01-26 |
| Priority | P1 |
| Effort | 3h |
| Status | Pending |

Implement bolt.new-style auto-apply on generation complete and non-destructive restore flow. Remove manual "Apply to Draft" friction, add clear Active version badge.

## Key Insights (from Research)

1. **Auto-apply reduces friction**: User asked for changes, extra click feels unnecessary
2. **Hybrid approach**: Auto-apply with version marker lets users restore previous state
3. **Non-destructive restore**: Creates new version from prior snapshot, preserves history
4. **Active badge clarity**: Users always know which version is currently applied

## Requirements

### Functional
- Auto-apply generated code to preview on stream completion
- Display "Active" badge on currently applied version
- Remove "Apply" button (auto-applied)
- Show "Restore" button on non-active versions only
- Non-destructive restore creates new version card
- RestoreMessage component for AI restore confirmation

### Non-Functional
- No toast/notification on auto-apply (badge update suffices)
- Restore disabled during streaming
- Network error handling on restore

## Architecture

### Auto-Apply Flow

```
Generation Complete (message_complete event)
       ↓
Extract code from response
       ↓
setActiveVersionId(newVersion.id)
       ↓
applyToPreview(code)  // onCodeUpdate callback
       ↓
Badge updates: "v3 Active"
```

### Restore Flow

```
User clicks [Restore] on v2
       ↓
System message: "Restoring to version 2..."
       ↓
POST /api/chat/restore { conversationId, fromVersionId }
       ↓
AI responds: "Restored your section to version 2"
       ↓
New version card: "(Restore) v4 Active"
       ↓
Auto-apply restored code to preview
```

### Data Model Changes

```typescript
// app/types/chat.types.ts - Existing CodeVersion
interface CodeVersion {
  id: string;
  versionNumber: number;
  code: string;
  createdAt: Date;
  messageContent: string;
  // NEW fields
  isRestore?: boolean;           // true if restore operation
  restoredFromVersion?: number;  // original version number
}

// NEW: Restore-specific message type
interface UIMessage {
  // ... existing fields
  isRestoreMessage?: boolean;    // true for system restore messages
}
```

### VersionCard Redesign

**Before (Manual Apply):**
```
┌─────────────────────────────────────┐
│ v2        2 min ago  [Preview] [Apply]│
└─────────────────────────────────────┘
```

**After (Auto-Apply):**
```
┌─────────────────────────────────────────┐
│ v3 Active         just now   [Restore]  │ ← Latest auto-applied
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│ v2                2 min ago  [Restore]  │ ← Restore available
└─────────────────────────────────────────┘
```

## Related Code Files

| File | Action | Purpose |
|------|--------|---------|
| `app/components/chat/VersionCard.tsx` | MODIFY | Remove Apply, add Restore logic |
| `app/components/chat/ChatPanel.tsx` | MODIFY | Add auto-apply on completion |
| `app/components/chat/hooks/useChat.ts` | MODIFY | Add onAutoApply callback |
| `app/components/chat/RestoreMessage.tsx` | CREATE | Restore confirmation message |
| `app/types/chat.types.ts` | MODIFY | Add isRestore, restoredFromVersion |
| `app/routes/api.chat.restore.tsx` | CREATE | Restore API endpoint |

## Implementation Steps

### Step 1: Update type definitions (20m)

1. Add `isRestore?: boolean` to CodeVersion
2. Add `restoredFromVersion?: number` to CodeVersion
3. Add `isRestoreMessage?: boolean` to UIMessage
4. Update type exports

### Step 2: Implement auto-apply in ChatPanel (45m)

1. Add effect to watch for stream completion
2. Extract code from latest message
3. Call `onCodeUpdate(code)` to apply to preview
4. Update `activeVersionId` state
5. Ensure no duplicate applies (debounce/flag)

```typescript
// In ChatPanel.tsx
useEffect(() => {
  if (!isStreaming && latestAssistantMessage?.codeSnapshot) {
    const latestVersion = versions.find(
      v => v.id === latestAssistantMessage.id
    );
    if (latestVersion && latestVersion.id !== activeVersionId) {
      onVersionApply?.(latestVersion.id);
    }
  }
}, [isStreaming, latestAssistantMessage, versions, activeVersionId]);
```

### Step 3: Modify VersionCard (45m)

1. Remove "Apply" button entirely
2. Keep "Preview" button for temporary preview
3. Add "Active" badge (already exists, ensure prominent)
4. Show "Restore" only on non-active versions
5. Add restore confirmation logic

```typescript
// VersionCard props update
interface VersionCardProps {
  versionNumber: number;
  createdAt: Date;
  isActive: boolean;
  isSelected: boolean;
  isRestore?: boolean;           // NEW
  restoredFromVersion?: number;  // NEW
  onPreview: () => void;
  onRestore: () => void;
}
```

### Step 4: Create RestoreMessage component (30m)

1. Create `app/components/chat/RestoreMessage.tsx`
2. Show restore source version and timestamp
3. Integrate into MessageList rendering
4. Style as system message (distinct from user/AI)

```typescript
interface RestoreMessageProps {
  restoredFromVersion: number;
  newVersion: number;
  timestamp: Date;
}
```

### Step 5: Create restore API endpoint (45m)

1. Create `app/routes/api.chat.restore.tsx`
2. Accept `conversationId`, `fromVersionId`
3. Fetch original version code
4. Create new assistant message with restored code
5. Set `isRestore: true`, `restoredFromVersion: N`
6. Return new version data

```typescript
// api.chat.restore.tsx
export async function action({ request }: ActionFunctionArgs) {
  // Auth, validate, create restore message
  const newMessage = await chatService.createRestoreMessage(
    conversationId,
    originalCode,
    originalVersionNumber
  );
  return json({ version: newMessage });
}
```

### Step 6: Wire up restore flow in ChatPanel (30m)

1. Add `handleRestore` function
2. Call restore API on Restore button click
3. Add restored message to messages state
4. Auto-apply restored version
5. Handle loading/error states

## Todo List

- [ ] Add isRestore, restoredFromVersion to CodeVersion type
- [ ] Add isRestoreMessage to UIMessage type
- [ ] Implement auto-apply effect in ChatPanel
- [ ] Remove Apply button from VersionCard
- [ ] Add Restore button logic to VersionCard
- [ ] Add restore confirmation display in VersionCard
- [ ] Create RestoreMessage.tsx component
- [ ] Create api.chat.restore.tsx endpoint
- [ ] Add createRestoreMessage to chatService
- [ ] Wire restore flow in ChatPanel
- [ ] Handle edge cases (restore during streaming, same version)
- [ ] Write unit tests for VersionCard changes
- [ ] Write integration test for restore flow

## Success Criteria

- [ ] Auto-apply: Code applies automatically on generation complete
- [ ] No Apply button: Only Preview and Restore visible
- [ ] Active badge: Clear indication of current version
- [ ] Restore works: Creates new version, preserves history
- [ ] RestoreMessage: Shows "(Restore) vN" with source info
- [ ] Edge cases: Restore disabled during streaming

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Race condition on auto-apply | Medium | Medium | Use flag/ref to prevent duplicate |
| Restore during streaming | Low | High | Disable button, show tooltip |
| Network error on restore | Low | Medium | Error banner, keep current active |

## Security Considerations

- Restore API validates conversation ownership
- Cannot restore to conversation not belonging to shop
- Restored code re-sanitized before apply
- No token cost for restore (free like bolt.new)

## Next Steps

After completing this phase:
1. Proceed to Phase 3: AI Prompt & Backend Integration
2. Add `<!-- CHANGES -->` comment extraction
3. Ensure AI generates change bullets in output
