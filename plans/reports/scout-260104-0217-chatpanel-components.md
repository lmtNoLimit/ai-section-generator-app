# Scout Report: ChatPanel & Chat Components
**Date:** 2026-01-04  
**Time:** 02:17 UTC  
**Search Type:** Component & Feature Mapping  
**Scope:** ChatPanel, chat components, hooks, services, APIs, preview integration

---

## Summary
Located **27 active chat component files + 6 test files** across 4 primary directories, plus 2 chat-related API routes and 2 backend services. Chat system is modular with clear separation: UI components, hooks (state), services (persistence), and APIs (streaming).

---

## File Inventory

### 1. MAIN CHAT COMPONENT
**Location:** `/Users/lmtnolimit/working/ai-section-generator/app/components/chat/`

#### Core Components
| File | Purpose |
|------|---------|
| **ChatPanel.tsx** | Main chat container; flex column layout (header/messages/input); uses useChat hook; supports version display & suggestion chips; props: conversationId, initialMessages, currentCode, onCodeUpdate, onMessagesChange, version callbacks |
| **ChatInput.tsx** | User message input field; handles user submission; integrates PromptEnhancer & SuggestionChips; fires onSendMessage callback |
| **MessageList.tsx** | Scrollable message container; maps messages to MessageItem; auto-scroll on new messages via useAutoScroll hook |
| **MessageItem.tsx** | Individual message renderer; displays role (user/assistant), content, codeSnapshot; renders code blocks; version badges |
| **ChatStyles.tsx** | Centralized CSS class definitions for chat layout (flex containers, spacing, scrolling) |
| **index.ts** | Barrel export file; exports all components, hooks, types, utilities |

#### Message & Code Display
| File | Purpose |
|------|---------|
| **CodeBlock.tsx** | Renders code snippets with syntax highlighting; copyable; language detection |
| **StreamingCodeBlock.tsx** | Real-time code rendering during streaming; incremental display of code blocks |
| **TypingIndicator.tsx** | Animated indicator shown during AI response streaming |

#### Version Management
| File | Purpose |
|------|---------|
| **VersionTimeline.tsx** | Visual timeline of all code versions derived from messages with codeSnapshot |
| **VersionCard.tsx** | Individual version display; shows version number, message preview, timestamp; selectable |
| **VersionBadge.tsx** | Small badge showing version info (number, status); used inline in messages |

#### Build & Streaming Progress
| File | Purpose |
|------|---------|
| **BuildProgressIndicator.tsx** | Visual indicator of build/generation phases (parsing, compiling, publishing, etc.) |
| **StreamingCodeBlock.tsx** | Renders streaming code with phase indicators; integrates with useStreamingProgress hook |

#### Suggestion & Enhancement (Phase 05)
| File | Purpose |
|------|---------|
| **SuggestionChips.tsx** | Chip-style buttons showing AI-generated suggestions; integrated in ChatInput below text area |
| **PromptEnhancer.tsx** | Enhances user prompts before sending; calls /api/enhance-prompt endpoint |
| **PromptTemplates.tsx** | Pre-defined prompt templates for common tasks; selectable in ChatInput |
| **ThemeContextBadge.tsx** | Displays current theme context (CSS framework, colors, theme type) to help AI understand design system |

### 2. CHAT HOOKS
**Location:** `/Users/lmtnolimit/working/ai-section-generator/app/components/chat/hooks/`

| File | Purpose | Exports |
|------|---------|---------|
| **useChat.ts** | Main chat state & streaming mgmt; reducer pattern; handles messages, streaming, errors; manages API calls to `/api/chat/stream`; tracks pending messages; integrates useStreamingProgress | ChatState, ChatAction, UseChatOptions, StreamingProgress interfaces |
| **useAutoScroll.ts** | Auto-scroll MessageList to bottom on new messages; uses useEffect + useRef to track scroll position; prevents manual scroll interference | UseAutoScrollOptions interface |
| **useStreamingProgress.ts** | Tracks build phases during AI response (message_start → content_delta → message_complete); parses streaming events for phase info | BuildPhase, StreamingProgressState types |

### 3. CHAT UTILITIES
**Location:** `/Users/lmtnolimit/working/ai-section-generator/app/components/chat/utils/`

| File | Purpose |
|------|---------|
| **suggestion-engine.ts** | Generates AI suggestions based on user input; exports getSuggestions(), getDetectedSectionType(); calls backend for suggestion generation |
| **section-type-detector.ts** | Detects Shopify section type from code/context; helps AI understand section purpose; exports detectSectionType(), SectionType enum |

### 4. CHAT TYPES
**Location:** `/Users/lmtnolimit/working/ai-section-generator/app/types/`

| File | Contents |
|------|----------|
| **chat.types.ts** | MessageRole (user/assistant/system); UIMessage (full display message); ModelMessage (API format); ConversationState; SendMessageRequest/Response; StreamEvent/StreamEventType; CodeVersion; ConversationMeta |

### 5. CHAT SERVICES
**Location:** `/Users/lmtnolimit/working/ai-section-generator/app/services/`

| File | Purpose |
|------|---------|
| **chat.server.ts** | Backend ChatService class; methods: getOrCreateConversation(), getConversation(), addUserMessage(), addAssistantMessage(), getConversationMessages(); uses Prisma for persistence |
| **ai.server.ts** | Backend AI integration; handles Gemini API calls; streaming response formatting; code extraction from AI responses |

### 6. CHAT API ROUTES
**Location:** `/Users/lmtnolimit/working/ai-section-generator/app/routes/`

| Route | Method | Purpose |
|-------|--------|---------|
| **api.chat.stream.tsx** | POST | SSE streaming endpoint for chat messages; validates input (conversationId, content, currentCode); handles sanitization; streams Gemini responses; extracts code snapshots; integrates code-extractor & context-builder |
| **api.chat.messages.tsx** | GET/POST | RESTful endpoint for message history; fetch conversation messages; add new messages |

### 7. EDITOR INTEGRATION
**Location:** `/Users/lmtnolimit/working/ai-section-generator/app/components/editor/`

| File | Purpose |
|------|---------|
| **ChatPanelWrapper.tsx** | Minimal wrapper around ChatPanel; props: conversationId, initialMessages, currentCode, onCodeUpdate, onMessagesChange, versions, selectedVersionId, activeVersionId, onVersionSelect, onVersionApply, isInitialGeneration; shows loading state during initial AI generation; passes all props to ChatPanel |

### 8. PREVIEW INTEGRATION
**Location:** `/Users/lmtnolimit/working/ai-section-generator/app/components/preview/`

Relevant preview files that display AI-generated code:
- **SectionPreview.tsx** - Renders generated section code in preview iframe
- **AppProxyPreviewFrame.tsx** - Proxy preview frame for Shopify app blocks
- **PreviewToolbar.tsx** - Toolbar with preview controls
- **ElementInfoPanel.tsx** - Displays info about selected preview elements (integrates with element targeting)

### 9. MAIN ROUTE
**Location:** `/Users/lmtnolimit/working/ai-section-generator/app/routes/`

| File | Purpose |
|------|---------|
| **app.sections.$id.tsx** | Editor page route; uses ChatPanelWrapper for chat UI; orchestrates state between ChatPanel, CodePreview, PublishModal; loads section data & conversation history via chatService.getOrCreateConversation(); handles code updates & publishing |

---

## Test Files
**Location:** `/Users/lmtnolimit/working/ai-section-generator/app/components/chat/__tests__/`

| File | Tests |
|------|-------|
| **ChatInput.test.tsx** | ChatInput component behavior |
| **CodeBlock.test.tsx** | CodeBlock rendering & copy functionality |
| **MessageItem.test.tsx** | Message display, code blocks, metadata |
| **VersionCard.test.tsx** | Version card selection, display, callbacks |
| **useChat.test.ts** | Chat state reducer, streaming, error handling |
| **useAutoScroll.test.ts** | Auto-scroll behavior, refs, effects |

---

## Architecture Overview

### Data Flow
```
User Input (ChatInput)
  ↓
useChat hook (state management)
  ↓
POST /api/chat/stream (SSE streaming)
  ↓
ChatService.addUserMessage() (DB persistence)
  ↓
AI Service (Gemini API)
  ↓
Streaming response with code blocks
  ↓
ChatPanel displays (MessageList + VersionTimeline)
  ↓
onCodeUpdate callback → Editor preview
```

### Type System
- **UIMessage**: Full message for display (includes metadata, timestamps, error states)
- **ModelMessage**: Stripped message for AI API (role + content only)
- **CodeVersion**: Derived from messages with codeSnapshot; indexed for timeline
- **StreamEvent**: Streaming protocol (message_start, content_delta, message_complete, error)

### Styling Architecture
- Minimal CSS via ChatStyles class definitions
- Polaris Web Components for structure
- Flex layout for responsive sizing
- MessageList scrolls, ChatInput fixed at bottom

---

## Key Integrations

### 1. Chat ↔ Editor
- ChatPanelWrapper wraps ChatPanel for editor context
- onCodeUpdate callback sends generated code to CodePreviewPanel
- Versions displayed in editor alongside code preview
- VersionTimeline allows switching between versions

### 2. Chat ↔ Preview
- Generated code rendered in SectionPreview
- Element targeting integrates with preview (ElementInfoPanel)
- Preview toolbar shows current section status
- Real-time HMR feedback during generation

### 3. Chat ↔ Publishing
- PublishModal triggered when code is finalized
- ChatPanel versions selectable before publish
- Version metadata (createdAt, messageContent) shown

### 4. Chat ↔ AI Services
- useChat hook calls /api/chat/stream
- ai.server.ts handles Gemini API integration
- code-extractor.ts pulls Liquid code from AI responses
- context-builder.ts summarizes old messages for context window

---

## Database Models (Prisma)
Relevant schema definitions:
- **Conversation**: sectionId, shop, messageCount, totalTokens, isArchived, createdAt, updatedAt
- **Message**: conversationId, role, content, codeSnapshot, tokenCount, createdAt
- **CodeVersion**: Derived from message.codeSnapshot (not a separate table, computed property)

---

## State Management Summary

### useChat Hook Responsibilities
- Message state (messages array)
- Streaming state (isStreaming, streamingContent)
- Error handling (error, errorMessage)
- Pending message tracking
- API communication with /api/chat/stream
- Integration with useStreamingProgress for build phases

### Props Flow Pattern
```
Route (app.sections.$id.tsx)
  ↓
ChatPanelWrapper (layout wrapper)
  ↓
ChatPanel (main component, uses useChat)
  ├── MessageList → MessageItem → CodeBlock
  ├── VersionTimeline → VersionCard
  ├── ChatInput → SuggestionChips, PromptEnhancer
  └── BuildProgressIndicator (via useStreamingProgress)
```

---

## Utility Functions & Helpers

### Code Extraction
- `/app/utils/code-extractor.ts` - Parses AI responses, extracts Liquid code blocks

### Input Validation
- `/app/utils/input-sanitizer.ts` - Sanitizes user input, sanitizes Liquid code

### Context Building
- `/app/utils/context-builder.ts` - Summarizes old messages, manages context window for AI

### Error Handling
- `/app/utils/error-handler.ts` - parseError(), formatErrorMessage() for chat errors

---

## Feature Phases Status

| Phase | Feature | Files | Status |
|-------|---------|-------|--------|
| 01 | Prompt Enhancement | PromptEnhancer.tsx, /api/enhance-prompt | ✓ Active |
| 02 | Live Build Progress | BuildProgressIndicator, useStreamingProgress | ✓ Active |
| 03 | Element Targeting | ElementInfoPanel, useElementTargeting | ✓ Active |
| 04 | Diff Preview & HMR | CodeDiffView, useCodeDiff | ✓ Active |
| 05 | Suggestion Chips | SuggestionChips, suggestion-engine | ✓ Active |
| 06 | Publishing Flow | PublishModal integration | ✓ Active |

---

## Summary Stats
- **Total Chat Components**: 27
- **Custom Hooks**: 3
- **Chat Utilities**: 2
- **Chat Services**: 2
- **Chat API Routes**: 2
- **Test Files**: 6
- **Chat Types**: 1 consolidated file
- **Lines of Code (ChatPanel.tsx alone)**: ~200+
- **Database Tables**: Conversation, Message

---

## Unresolved Questions
1. How does CodeVersion versioning work in Prisma (computed vs stored)?
2. Are suggestion chips cached or generated fresh per message?
3. What context window strategy is used for long conversations (context-builder.ts)?
4. How are code snapshots stored (inline in Message or separate table)?
