# Phase 01: Remove Code Blocks from Chat

**Effort**: 1-2 hours
**Risk**: Low
**Dependencies**: None

## Objective

Remove code block rendering from chat messages while preserving text explanations and VersionCard functionality.

## Tasks

### 1. Modify MessageItem.tsx (30 min)

**File**: `app/components/chat/MessageItem.tsx`

**Current behavior** (lines 142-157):
```typescript
{parts.map((part, index) => (
  part.type === 'code' ? (
    <CodeBlock
      key={index}
      code={part.content}
      language={part.language || 'liquid'}
    />
  ) : (
    <p key={index} className="chat-message__text">
      {part.content}
      {isStreaming && index === parts.length - 1 && (
        <span className="chat-cursor" aria-hidden="true">▋</span>
      )}
    </p>
  )
))}
```

**New behavior** - skip code parts for AI messages only:
```typescript
{parts.map((part, index) => {
  // Skip code blocks for AI messages - code is visible in Code Preview Panel
  // User messages keep their code visible
  if (part.type === 'code' && !isUser) return null;

  if (part.type === 'code') {
    // User message with code - render normally
    return (
      <CodeBlock
        key={index}
        code={part.content}
        language={part.language || 'liquid'}
      />
    );
  }

  // Text content
  const textParts = parts.filter(p => p.type === 'text');
  const isLastTextPart = part === textParts[textParts.length - 1];

  return (
    <p key={index} className="chat-message__text">
      {part.content}
      {isStreaming && isLastTextPart && (
        <span className="chat-cursor" aria-hidden="true">▋</span>
      )}
    </p>
  );
})}
```

### 2. Keep CodeBlock Import

CodeBlock import is still needed for user messages with pasted code.

**Note**: Keep `parseMessageContent()` function as-is. Code parsing still needed for:
- `codeSnapshot` detection in VersionCard display logic
- Potential future use (collapsible code, etc.)

### 3. Test Changes (30 min)

**Manual testing checklist**:
- [x] Open chat panel with existing conversation
- [x] Verify no code blocks appear in messages
- [x] Verify text explanations display correctly
- [x] Verify VersionCard appears for AI messages with code
- [x] Click preview (eye) button - code shows in preview panel
- [x] Click restore button - version restores correctly
- [x] Send new message - verify streaming cursor works on text
- [x] Check console for errors

**Automated tests**:
```bash
npm test -- MessageItem
npm test -- VersionCard
```

### 4. Edge Cases to Verify

1. **AI message with only code, no text**: Should show VersionCard only
2. **Message with multiple text parts**: All text parts should display
3. **Streaming message**: Cursor should appear at end of last text part
4. **Error message**: Error display should still work
5. **User message with code**: User messages should KEEP code visible (per validation)

## Rollback Plan

If issues arise, revert to original render logic:
```typescript
{parts.map((part, index) => (
  part.type === 'code' ? (
    <CodeBlock key={index} code={part.content} language={part.language || 'liquid'} />
  ) : (
    <p key={index} className="chat-message__text">{part.content}</p>
  )
))}
```

## Definition of Done

**Completed**: 2025-12-26

- [x] Code blocks not visible in chat
- [x] Text explanations visible
- [x] VersionCard displays correctly
- [x] Streaming cursor works
- [x] All MessageItem tests pass (33/33)
- [x] No TypeScript errors
- [x] No console errors
