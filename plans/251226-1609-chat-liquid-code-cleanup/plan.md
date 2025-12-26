---
title: "Remove Liquid Code Blocks from Chat Panel"
description: "Hide verbose Liquid code in chat messages, emphasize VersionCard + AI explanations for better UX"
status: complete
priority: P2
effort: 2h
branch: main
tags: [chat, ux, code-cleanup, version-card]
created: 2025-12-26
completed: 2025-12-26
---

# Remove Liquid Code Blocks from Chat Panel

## Problem Statement

Users see long Liquid code blocks inline in chat messages, creating visual noise. Code is already viewable in the Code Preview Panel (right side). Users want to see:
- VersionCard for version interactions
- Meaningful AI explanations about changes
- Clean, scannable chat history

## Solution Overview

Remove CodeBlock rendering from MessageItem. Keep text explanations visible. VersionCard already handles version preview/restore actions. Code remains accessible via Code Preview Panel.

## Scope

### In Scope
- Remove code block rendering from chat messages
- Keep text explanations visible
- Preserve VersionCard display and functionality
- Maintain code visibility in Code Preview Panel

### Out of Scope
- Code Preview Panel changes
- VersionCard UI modifications (already has good UX)
- AI response content changes (backend)

## Architecture Decision

**Approach**: Simplest solution - skip rendering code parts in MessageItem

**Rationale**:
- Code already visible in Code Preview Panel (no duplication needed)
- VersionCard provides version interaction (preview, restore)
- No new components or collapsible UI complexity
- Follows YAGNI principle

**Alternatives Considered**:
1. Collapsible code blocks - adds complexity, not needed when preview panel exists
2. Code summary (first 5 lines) - still clutters chat, preview panel better
3. Show code only on hover - poor UX, discoverability issues

## Files to Modify

| File | Change Type | Description |
|------|-------------|-------------|
| `app/components/chat/MessageItem.tsx` | Modify | Skip code parts in render loop |

**Files NOT Changing**:
- `CodeBlock.tsx` - may still be used elsewhere
- `VersionCard.tsx` - UX is good, no changes needed
- `ChatStyles.tsx` - keep code block CSS for potential future use

## Implementation

Single phase, see: [phase-01-remove-code-blocks.md](./phase-01-remove-code-blocks.md)

## Testing Strategy

1. **Manual verification**:
   - Chat shows text explanations (no code blocks)
   - VersionCard displays correctly
   - Preview button opens code in preview panel
   - Restore button works as expected

2. **Existing tests**:
   - Run `npm test -- MessageItem` to check parsing still works
   - VersionCard tests should pass unchanged

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Users miss code visibility | Low | Medium | Code Preview Panel already shows code |
| Breaking VersionCard | Low | High | No changes to VersionCard logic |
| AI response parsing breaks | Low | Medium | Only changing render, not parsing |

## Success Criteria

- [x] No code blocks visible in chat messages
- [x] Text explanations display correctly
- [x] VersionCard shows for AI messages with codeSnapshot
- [x] Preview/Restore actions work
- [x] No console errors
- [x] Existing tests pass (33/33 MessageItem tests pass)

## Validation Summary

**Validated:** 2025-12-26
**Questions asked:** 4

### Confirmed Decisions
- **Code visibility**: No indicator needed - just text + VersionCard. Users know code is in Preview Panel.
- **Code-only messages**: Trust AI provides text explanation. If no text, VersionCard still shows.
- **User messages**: Keep user-pasted code visible - only hide AI-generated code blocks.
- **AI response handling**: Trust AI includes explanation - no fallback message needed.

### Scope Clarification
- Only hide code blocks from **AI/assistant messages**
- User messages with pasted code remain unchanged
- PreviewCanvas stays the same (separate right panel)

## Implementation Status

**Phase 01**: ✅ COMPLETE (2025-12-26)
- Modified `MessageItem.tsx` to skip code blocks for AI messages (lines 141-169)
- Updated `MessageItem.test.tsx` with 33 passing tests
- TypeScript typecheck: ✅ Pass
- Linting: ✅ No errors
- Code review: ✅ Approved (see plans/reports/code-reviewer-251226-1625-chat-code-cleanup.md)

**Next Steps**:
- Monitor user feedback on code block removal
- Consider streaming cursor optimization (move textParts filter outside loop)
- Evaluate need for visual indicator when code is hidden
