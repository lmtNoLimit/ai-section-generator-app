# VersionCard Component Research
**Date**: 2025-12-26
**Focus**: VersionCard implementation, version tracking in AI responses, and chat UX patterns

---

## 1. VersionCard Component Implementation

### Location
- Component: `/app/components/chat/VersionCard.tsx` (118 lines)
- Tests: `/app/components/chat/__tests__/VersionCard.test.tsx` (490 test cases)

### Core Functionality
VersionCard is a **pure, memoized component** displaying version metadata with two action buttons:

**Props Interface:**
```typescript
interface VersionCardProps {
  versionNumber: number;           // Display v1, v2, v3, etc
  createdAt: Date;                 // Timestamp of generation
  isActive: boolean;               // Current active draft
  isSelected: boolean;             // Currently previewing
  onPreview: () => void;           // Eye icon handler
  onRestore: () => void;           // Return icon handler
}
```

**Visual Structure:**
- `version-card` (container)
  - `version-card__info` - displays "v1 • 3h ago"
  - `version-card__actions` - two icon buttons
    - Preview button (eye icon) - toggleable, applies `--active` class when `isSelected=true`
    - Restore button (return icon) - disabled when `isActive=true`

**Time Formatting Helper:**
Native JavaScript implementation (no date-fns dependency):
- `< 1 min` → "just now"
- `< 60 min` → "X min ago"
- `< 24 hours` → "Xh ago"
- `≥ 24 hours` → "Xd ago"

### Key Design Patterns
1. **Event Propagation Control**: `e.stopPropagation()` on button clicks to prevent parent handlers
2. **Accessibility First**:
   - Eye button: `aria-pressed` + dynamic `aria-label` (changes based on `isSelected`)
   - Restore button: `aria-label="Restore this version"` + `disabled` state binding
   - Both buttons: `type="button"` explicit attribute
3. **Memoization**: `React.memo()` with default shallow comparison for performance
4. **Icon Rendering**: Inline SVG icons (16x16) - eye and return/restore arrows

---

## 2. How Versions Relate to AI Responses

### Integration Point: MessageItem Component
Location: `/app/components/chat/MessageItem.tsx`

**Conditional Display Logic:**
```typescript
const showVersionBadge = !isUser && message.codeSnapshot && versionNumber;
```

VersionCard appears **only when**:
1. Message is from AI (not user)
2. Message has `codeSnapshot` attached (generated Liquid code)
3. `versionNumber` prop is provided by parent

**Message-to-Version Flow:**
```
UIMessage {
  role: 'assistant',
  content: 'Liquid code + explanation text',
  codeSnapshot?: string,     // Stores the generated code
  createdAt: Date
}
         ↓
    MessageItem
         ↓
    parseMessageContent() → [text parts, code blocks]
         ↓
    Renders:
    - Text explanation
    - CodeBlock components (syntax highlighted)
    - VersionCard (if codeSnapshot exists)
    - Error display (if isError=true)
```

**Version Props Passed From Parent:**
```typescript
<VersionCard
  versionNumber={versionNumber}      // Track which iteration
  createdAt={message.createdAt}      // When generated
  isActive={isActive}                // Is current draft
  isSelected={isSelected}            // Currently previewing
  onPreview={onVersionSelect}        // Preview action
  onRestore={onVersionApply}         // Apply version action
/>
```

---

## 3. Chat UX Patterns: Code vs Version Info

### Current Pattern in MessageItem

**Code Display**:
- Rendered as separate `<CodeBlock>` components
- Language-specific syntax highlighting (defaults to 'liquid')
- Extracted from markdown code fences (triple backticks)
- All code blocks visible by default in chat

**Version Info Display**:
- Shows only when message has `codeSnapshot`
- Small badge-like card below message content
- Non-intrusive, shows generation time + actions
- Two interaction modes:
  - **Preview**: Temporary view of older version
  - **Restore**: Apply version as current draft

### Separation of Concerns
1. **Text content** = explanation/context from AI
2. **Code blocks** = formatted, syntax-highlighted Liquid code
3. **Version card** = metadata + actions (not tied to code)

### Design Philosophy
- Code is **always visible** in chat (inline with message)
- Version info is **supplementary metadata** (appears below)
- Users can preview/restore without seeing raw code
- Clean separation prevents code from dominating chat UX

---

## 4. UX Recommendations: Hiding Code vs Showing Versions

### Current Strengths
✓ Version card is minimal, doesn't clutter message
✓ Eye icon (preview) lets users toggle views without leaving chat
✓ Restore button allows quick rollback to older versions
✓ Time formatting shows recency ("3h ago" is scannable)

### Recommended UX Improvements

**1. Code Visibility Toggle**
- Add expandable/collapsible code blocks in chat
- Show code summary (first 5 lines + "...") initially
- Full code appears in detail panel or modal
- Version card becomes shortcut to preview older code

**2. Version Timeline Sidebar**
- VersionTimeline component exists (`/app/components/chat/VersionTimeline.tsx`)
- Could show compact list of all versions
- VersionCard becomes the timeline item representation
- Main chat shows only text + summary

**3. Action Consolidation**
- Preview button could open side-by-side comparison
- Restore could show confirmation (dirty check on message edits)
- Save action separate from restore (currently appears to be)

**4. Accessibility Enhancements**
- Eye button `aria-pressed` already handles state
- Consider adding `aria-describedby` linking VersionCard to code block
- Screen readers should announce "version 3, generated 2 hours ago, currently previewing"

### Code Hide Pattern
If hiding code in chat, VersionCard becomes **primary interaction point**:
```typescript
// Proposed conditional rendering:
<div className="chat-message__content">
  {/* Always show text explanation */}
  {textParts.map(...)}

  {/* Code optionally collapsible */}
  {showCode ? <CodeBlock /> : <CodeSummary lines={5} />}

  {/* Version card acts as code preview shortcut */}
  {showVersionBadge && <VersionCard ... />}
</div>
```

---

## 5. Code Structure Summary

### Component Files
| File | Lines | Purpose |
|------|-------|---------|
| `VersionCard.tsx` | 118 | Card display + time formatting |
| `VersionCard.test.tsx` | 490 | 39 test suites, 100%+ coverage |
| `MessageItem.tsx` | 192 | Message rendering + version integration |
| `CodeBlock.tsx` | ? | Syntax highlighting (referenced, not reviewed) |
| `VersionTimeline.tsx` | ? | Version history list (exists, not reviewed) |
| `VersionBadge.tsx` | ? | Alternative badge display (exists, not reviewed) |

### Key Dependencies
- React 18+ (memo, functional components)
- No external date library (native Date + math)
- No external icon library (inline SVG)
- CSS class-based styling (BEM naming: `version-card__*`)

---

## 6. Design Patterns Applied

### 1. **Component Composition**
- MessageItem orchestrates what to display
- VersionCard is pure presentation layer
- CodeBlock handles code rendering
- Clear separation of concerns

### 2. **State Management**
- `isActive`: controlled by parent (draft tracking)
- `isSelected`: controlled by parent (preview tracking)
- No local state in VersionCard (truly presentational)

### 3. **Accessibility**
- ARIA roles: `aria-label`, `aria-pressed`, `aria-hidden`
- Semantic HTML: `role="article"` on messages
- Keyboard accessible: all buttons have explicit `type="button"`

### 4. **Performance**
- React.memo() prevents unnecessary re-renders
- No inline function creation in render
- Relative time calculated once per render (no polling)

---

## Unresolved Questions

1. **How is `versionNumber` incremented?** - Presumably in parent Chat component or service layer
2. **What triggers `onVersionSelect` vs `onVersionApply`?** - Expected behavior after each action?
3. **Is `codeSnapshot` stored in database or derived?** - Where does version history persist?
4. **Does restore check for unsaved changes?** - "Dirty check" mentioned in comments but not in VersionCard
5. **How do users differentiate between drafts and published versions?** - Is that shown elsewhere?
6. **Mobile UX**: Are icon buttons appropriately sized for touch targets on mobile?
