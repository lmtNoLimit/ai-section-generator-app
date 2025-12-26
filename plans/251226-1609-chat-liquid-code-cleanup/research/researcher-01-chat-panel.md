# Research Report: Chat Panel & Liquid Code Rendering

**Date**: 2025-12-26 | **Subagent**: researcher | **Status**: Complete

---

## Executive Summary

Chat panel displays AI-generated Liquid code via a multi-layer component hierarchy. Code blocks appear inline within message content through markdown-style triple-backtick parsing. Version cards display below AI messages with code snapshots. Long Liquid code blocks render directly in chat without collapsing/pagination.

---

## Current Implementation Overview

### 1. Chat Panel Architecture

**File**: `app/components/chat/ChatPanel.tsx`

- Main container for chat UI with flex layout (100% height)
- Manages three sections: header, content area, input
- Displays version timeline in header if versions exist
- MessageList child handles scrolling and message rendering
- Props flow: versions → selectedVersionId → onVersionSelect callbacks

**Key Properties**:
```typescript
interface ChatPanelProps {
  conversationId: string;
  initialMessages?: UIMessage[];
  currentCode?: string;
  onCodeUpdate?: (code: string) => void;
  onMessagesChange?: (messages: UIMessage[]) => void;
  versions?: CodeVersion[];
  selectedVersionId?: string | null;
  activeVersionId?: string | null;
  onVersionSelect?: (versionId: string | null) => void;
  onVersionApply?: (versionId: string) => void;
}
```

### 2. Message Rendering Pipeline

**File**: `app/components/chat/MessageItem.tsx`

Message content parsed to ContentPart[] via `parseMessageContent()`:

```typescript
interface ContentPart {
  type: 'text' | 'code';
  content: string;
  language?: string;
}
```

**Parsing Logic**:
- Linear-time string scanning (safe from ReDoS)
- Detects triple-backtick blocks: ` ```liquid ... ``` `
- Extracts language identifier (default: 'liquid')
- Splits content into alternating text/code parts
- Trims whitespace from each part

**Example**: Message `"Here's code:\n\`\`\`liquid\n{% if x %}...{% endif %}\n\`\`\`"` → `[{type: 'text', content: "Here's code"}, {type: 'code', content: "{% if x %}...{% endif %}", language: 'liquid'}]`

**Rendering**:
- Text parts → `<p className="chat-message__text">`
- Code parts → `<CodeBlock />` component
- Version card shown below if: assistant message AND has codeSnapshot AND versionNumber exists

### 3. Code Block Display

**File**: `app/components/chat/CodeBlock.tsx`

Renders code with:
- Language label (top left): `<span className="chat-code-block__language">`
- Copy button (top right): clipboard.writeText() on click
- Line numbers (left margin): each line wrapped in `<div className="chat-code-block__line">`
- Syntax highlighting via CSS classes (applied via ChatStyles.tsx)

**Structure**:
```
<div className="chat-code-block">
  <div className="chat-code-block__header">
    <span className="chat-code-block__language">liquid</span>
    <button className="chat-code-block__copy">Copy</button>
  </div>
  <pre className="chat-code-block__pre">
    <code className="chat-code-block__code">
      [lines rendered]
    </code>
  </pre>
</div>
```

**No collapsing/pagination**: Full code rendered regardless of size.

### 4. Version Card Display

**File**: `app/components/chat/VersionCard.tsx`

Memoized component shown below AI messages with code snapshots:

```typescript
interface VersionCardProps {
  versionNumber: number;
  createdAt: Date;
  isActive: boolean;      // Current active draft
  isSelected: boolean;    // Currently previewing
  onPreview: () => void;  // Eye icon - temporary preview
  onRestore: () => void;  // Return icon - apply with dirty check
}
```

**Layout**:
```
<div className="version-card">
  <div className="version-card__info">
    <span>v1</span>
    <span>•</span>
    <span>5m ago</span>
  </div>
  <div className="version-card__actions">
    <button>[eye icon]</button>
    <button>[restore icon]</button>
  </div>
</div>
```

**Styling**: CSS classes for active/selected states applied in ChatStyles.tsx

---

## Liquid Code Block Rendering in Chat

### Where Code Appears

1. **Message Content**: Parsed and rendered inline via CodeBlock component
2. **Version Card Context**: Shows version metadata, not full code
3. **Code Preview Panel**: Separate right-panel component displays current code (different from chat)

### Current Behavior

- **No collapsing**: All code blocks rendered at full height
- **No pagination**: No scroll within code blocks
- **Single code block per message**: Markdown parser handles multiple blocks but each rendered sequentially
- **Copy functionality**: Per-block copy button
- **No syntax highlighting in chat**: Just markdown code blocks with language label

### File Flow (Section Editing)

**Route**: `app/routes/app.sections.$id.tsx`

```
UI Flow:
ChatPanel → MessageList → MessageItem → CodeBlock
              ↓
        [Full Liquid code rendered]
```

---

## Key Files to Modify for Cleanup

### Primary Targets (if collapsing is needed):

| File | Purpose | Modification Type |
|------|---------|-------------------|
| `app/components/chat/CodeBlock.tsx` | Code block rendering | Add collapse/expand UI |
| `app/components/chat/MessageItem.tsx` | Message parsing & layout | Adjust spacing around collapsed blocks |
| `app/components/chat/ChatStyles.tsx` | Code block styling | Update CSS for collapse states |

### Secondary Targets (context):

| File | Purpose |
|------|---------|
| `app/components/chat/ChatPanel.tsx` | Main chat container |
| `app/components/chat/MessageList.tsx` | Message list wrapper |
| `app/components/chat/VersionCard.tsx` | Version metadata display |
| `app/routes/app.sections.$id.tsx` | Route integrating chat |

---

## CSS Classes in Use

Code block styles (from ChatStyles.tsx):
```
chat-code-block
  ├── chat-code-block__header
  ├── chat-code-block__language
  ├── chat-code-block__copy
  ├── chat-code-block__pre
  ├── chat-code-block__code
  ├── chat-code-block__line
  ├── chat-code-block__line-number
  └── chat-code-block__line-content

version-card
  ├── version-card__info
  ├── version-card__number
  ├── version-card__time
  ├── version-card__actions
  ├── version-card__icon
  ├── version-card--active (modifier)
  └── version-card--selected (modifier)

chat-message
  ├── chat-message__avatar
  ├── chat-message__content
  ├── chat-message__text
  ├── chat-message__error
  ├── chat-message--user (modifier)
  ├── chat-message--assistant (modifier)
  └── chat-message--selected (modifier)
```

---

## Data Types

### UIMessage (from types):
```typescript
interface UIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
  codeSnapshot?: string;
  isError?: boolean;
  errorMessage?: string;
}
```

### CodeVersion:
```typescript
interface CodeVersion {
  id: string;
  number: number;
  createdAt: Date;
  code: string;
}
```

---

## Integration Points

1. **Chat → Preview**: onCodeUpdate callback sends parsed code to preview panel
2. **Chat → Version State**: onVersionSelect/onVersionApply trigger preview and restore actions
3. **Messages → Parent**: onMessagesChange syncs UI messages back to route component

---

## Unresolved Questions

1. **ChatStyles.tsx location**: Need to verify where ChatStyles.tsx defines actual CSS rules (in-file CSS or external stylesheet)?
2. **Syntax highlighting**: Are code blocks using a library (Prism, Highlight.js) or just language label styling?
3. **Message list scrolling**: How is overflow handled in MessageList when code blocks are very large?
4. **Version card positioning**: Is version card always below code, or adjacent?
5. **Collapse scope**: Should collapse affect individual code blocks or entire message content?

---

## Next Steps

- Read ChatStyles.tsx for CSS implementation details
- Check MessageList.tsx for scroll behavior
- Verify if syntax highlighting library is in use
- Review CodePreview.tsx to understand code-preview-panel rendering (different from chat)
