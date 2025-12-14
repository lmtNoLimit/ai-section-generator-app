# ChatGPT-like Route Unification Plan

**Created:** 2025-12-13
**Status:** Planning
**Priority:** High
**Estimated Effort:** 1-2 days

## Overview

Refactor section routes to a ChatGPT/Cursor/Lovable-style UX pattern where `/sections/new` is a minimal prompt-only interface that redirects to `/$id` after first message. Unifies the section creation and editing experience into a single conversational flow.

## Current State Analysis

| Route | Lines | Purpose | Components |
|-------|-------|---------|------------|
| `/sections/new` | ~410 | Create section, two-column layout | GenerateLayout, GenerateInputColumn, GeneratePreviewColumn, SaveTemplateModal |
| `/sections/$id` | ~310 | Edit section, 3-panel unified editor | UnifiedEditorLayout, ChatPanelWrapper, CodePreviewPanel, EditorSettingsPanel |

### Current `/new` Flow
1. User enters prompt → clicks Generate → AI generates code
2. User previews code → selects theme → enters filename
3. User clicks "Save Draft" or "Publish to Theme"
4. Redirect to `/$id` for further editing

### Current `/$id` Flow
1. Load section + conversation history
2. 3-panel layout: Chat | Code/Preview | Settings
3. Conversational AI iteration ("make it wider", "add CTA")
4. Save/Publish actions in header

## Proposed Change

**Target UX Pattern:** ChatGPT empty state → conversation with content

### New `/sections/new` (Minimal Prompt Interface)
```
┌──────────────────────────────────────────────────────────┐
│                                                           │
│                   [Logo/Header]                           │
│                                                           │
│         "Describe the section you want to create"        │
│                                                           │
│   ┌───────────────────────────────────────────────────┐  │
│   │ [Textarea: "A hero section with video background  │  │
│   │  and centered CTA button..."]                     │  │
│   │                                      [Send →]     │  │
│   └───────────────────────────────────────────────────┘  │
│                                                           │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│   │ Template │  │ Template │  │ Template │              │
│   │  Chip 1  │  │  Chip 2  │  │  Chip 3  │              │
│   └──────────┘  └──────────┘  └──────────┘              │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

### Flow After First Prompt
1. User submits prompt on `/sections/new`
2. Action: Create section (status=draft) + first conversation message
3. Redirect to `/sections/$id`
4. `/$id` continues with chat panel showing first message + AI response

## Phases

| Phase | Title | Status | Effort |
|-------|-------|--------|--------|
| 1 | [Simplify /new Route](./phase-01-simplify-new-route.md) | **Complete** | 0.5 days |
| 2 | [Integrate Initial Message with $id](./phase-02-integrate-initial-message.md) | Pending | 0.5 days |
| 3 | [Polish & Template Chips](./phase-03-polish-templates.md) | Pending | 0.5 days |

## Success Criteria

- [ ] `/sections/new` renders minimal centered prompt UI
- [ ] First prompt creates section + redirects to `/$id`
- [ ] `/$id` shows first prompt as conversation message
- [ ] AI response streaming works from initial message
- [ ] Template chips (optional) provide quick-start prompts
- [ ] All existing save/publish flows preserved
- [ ] Works in Shopify embedded iframe

## Key Technical Decisions

1. **Section creation timing**: Create section on first prompt submit (not on AI response completion)
   - Ensures redirect happens immediately
   - AI streaming continues on `/$id` page

2. **Conversation initialization**:
   - First message stored via `chatService.addMessage()` before redirect
   - `/$id` loads with pending AI response in flight

3. **Component reuse**:
   - Extract prompt input from existing `ChatInput` component
   - Keep `/$id` unchanged except for handling initial pending message

## Dependencies

- Existing: `chatService.getOrCreateConversation()`, `chatService.addMessage()`
- Existing: `sectionService.create()`
- Existing: Chat streaming via `/api/chat/stream`

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| SSE streaming during redirect | Race condition | Store message ID, resume on `/$id` load |
| User navigates away mid-stream | Lost response | Save partial response to DB |
| Shopify iframe navigation issues | Broken UX | Use `useNavigate` from react-router, not window.location |

## Files to Modify

| File | Change |
|------|--------|
| `app/routes/app.sections.new.tsx` | Complete rewrite (410→~100 lines) |
| `app/routes/app.sections.$id.tsx` | Handle pending initial message |
| `app/components/generate/*` | May deprecate some components |
| `app/services/chat.server.ts` | No changes expected |
