---
phase: 1
title: "AIResponseCard Component"
status: completed
effort: 3h
completed: 2026-01-26T11:33:00Z
---

# Phase 1: AIResponseCard Component

**Parent Plan**: [plan.md](./plan.md)
**Dependencies**: None (foundational)

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-01-26 |
| Priority | P1 |
| Effort | 3h |
| Status | Pending |

Create unified `AIResponseCard` component that handles BOTH streaming and completed states with smooth CSS transitions. Replaces current split between `MessageItem` (completed) and inline streaming display.

## Key Insights (from Research)

1. **Phase indicators reduce anxiety**: Users understand "thinking time" = analysis happening
2. **Indeterminate spinner + phase text = optimal**: Better than percentage bars for AI tasks
3. **Streaming visual consistency**: Same component for streaming AND saved = trust
4. **Change bullets**: Scannable at a glance, focus on what changed

## Requirements

### Functional
- Display phase indicators during streaming (Analyzing -> Schema -> Styling -> Finalizing)
- Show change bullets after completion (extracted from AI response)
- Collapse code by default with accordion expand
- Smooth CSS transitions between streaming -> completed states
- Version number badge in header

### Non-Functional
- GPU-accelerated CSS transitions (no JS animation overhead)
- Memoized to prevent unnecessary re-renders
- Accessible (ARIA labels, keyboard navigation)

## Architecture

### Component Props

```typescript
interface AIResponseCardProps {
  // State
  isStreaming: boolean;
  streamingPhase?: 'analyzing' | 'schema' | 'styling' | 'finalizing';
  phaseContext?: string; // "Adding 3 customizable settings"
  progress?: number; // 0-100 (indeterminate if undefined)

  // Content
  message: string; // AI response text
  changes?: string[]; // ["Added hero banner", "Changed colors"]
  code?: string;
  versionNumber?: number;

  // Actions
  onCodeToggle?: (expanded: boolean) => void;

  // Version actions (passed through)
  isActive?: boolean;
  onRestore?: () => void;
}
```

### Phase Definitions

```typescript
const PHASES = [
  { id: 'analyzing', label: 'Analyzing your request', icon: 'search' },
  { id: 'schema', label: 'Building section schema', icon: 'code' },
  { id: 'styling', label: 'Adding styles', icon: 'paint' },
  { id: 'finalizing', label: 'Finalizing code', icon: 'checkmark' },
];
```

### Visual States

**Streaming State:**
```
┌─────────────────────────────────────────────┐
│ AI                                          │
│ ┌─────────────────────────────────────────┐ │
│ │ ✓ Analyzing your request                │ │
│ │ ● Building section schema...            │ │
│ │   → Adding 3 customizable settings      │ │
│ │ ○ Adding styles                         │ │
│ │ ○ Finalizing code                       │ │
│ └─────────────────────────────────────────┘ │
│ [████████░░░░░░░░░░] indeterminate          │
└─────────────────────────────────────────────┘
```

**Completed State (collapsed):**
```
┌─────────────────────────────────────────────┐
│ AI                                     v2   │
│ ┌─────────────────────────────────────────┐ │
│ │ • Added hero banner with overlay        │ │
│ │ • Set background color to deep blue     │ │
│ │ • Added CTA button with hover effect    │ │
│ │                                         │ │
│ │ ▼ Show code                             │ │
│ └─────────────────────────────────────────┘ │
│ [v2 Active]                                 │
└─────────────────────────────────────────────┘
```

## Related Code Files

| File | Action | Purpose |
|------|--------|---------|
| `app/components/chat/AIResponseCard.tsx` | CREATE | New unified component |
| `app/components/chat/MessageItem.tsx` | MODIFY | Delegate to AIResponseCard for assistant |
| `app/components/chat/hooks/useStreamingProgress.ts` | MODIFY | Add phaseContext extraction |
| `app/components/chat/chat-animations.css` | MODIFY | Add phase transition animations |
| `app/components/chat/index.ts` | MODIFY | Export AIResponseCard |

## Implementation Steps

### Step 1: Create AIResponseCard skeleton (30m)

1. Create `app/components/chat/AIResponseCard.tsx`
2. Define props interface with all states
3. Basic layout with Polaris s-box, s-stack
4. Export from index.ts

### Step 2: Implement streaming phase display (45m)

1. Add phase list with icons (✓ completed, ● current, ○ pending)
2. Integrate with existing `useStreamingProgress` hook
3. Add phaseContext display below current phase
4. Add indeterminate progress bar

### Step 3: Implement completed state display (45m)

1. Change bullets list from `changes[]` prop
2. Collapsible code accordion with "Show code" / "Hide code"
3. Version badge in header
4. Active badge integration

### Step 4: Add CSS transitions (30m)

1. Phase list -> change bullets transition (height + opacity, 300ms)
2. Progress bar -> hidden transition (opacity fade, 200ms)
3. Code accordion (max-height transition, 250ms)
4. Add to chat-animations.css

### Step 5: Integrate with MessageItem (30m)

1. Modify MessageItem to use AIResponseCard for `role === 'assistant'`
2. Pass streaming state and content
3. Remove duplicated code block handling
4. Update memoization comparison

## Todo List

- [ ] Create AIResponseCard.tsx with props interface
- [ ] Implement streaming phase indicators
- [ ] Add phaseContext to useStreamingProgress hook
- [ ] Implement change bullets display
- [ ] Add collapsible code accordion
- [ ] Add version badge to header
- [ ] Implement CSS transitions in chat-animations.css
- [ ] Integrate AIResponseCard into MessageItem
- [ ] Update MessageItem memoization
- [ ] Export from chat/index.ts
- [ ] Write unit tests for AIResponseCard

## Success Criteria

- [ ] Streaming state shows phase indicators with current context
- [ ] Completed state shows change bullets
- [ ] Code collapsed by default, expands via accordion
- [ ] Smooth transitions between states (no jarring jumps)
- [ ] Visual consistency: streaming matches reloaded appearance
- [ ] Component memoized properly

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| CSS transition timing issues | Medium | Low | Use CSS-only with fixed max-heights |
| Phase detection inaccuracy | Medium | Medium | Fallback to token-based progress |
| Code accordion height calculation | Low | Low | Use max-height with overflow hidden |

## Security Considerations

- Sanitize `changes[]` content before display (XSS prevention)
- Code content already sanitized by `sanitizeLiquidCode()` in API
- No user input rendered unsafely

## Next Steps

After completing this phase:
1. Proceed to Phase 2: Auto-Apply & Version Management
2. AIResponseCard will receive auto-apply trigger
3. VersionCard modifications depend on AIResponseCard integration
