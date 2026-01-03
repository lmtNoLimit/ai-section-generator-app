# Phase 02: Live Build Progress

## Context Links

- [Main Plan](plan.md)
- [AI Chat UX Patterns Research](research/researcher-01-ai-chat-ux-patterns.md)
- [System Architecture](../../docs/system-architecture.md)

## Overview

| Attribute | Value |
|-----------|-------|
| Priority | P1 |
| Status | pending |
| Effort | 6h |
| Description | Real-time "Live Plan" checklist showing agent tasks, streaming code display with typing effect, and preview updates |

## Key Research Insights

From AI Chat UX Patterns research:
- **Visual Milestone Markers**: 4 phases (Analyzing, Building markup, Adding styles, Schema + validation)
- **Token-based Progress**: Progress % based on token count, not artificial steps
- **Chunked Streaming**: Buffer 50-100ms of tokens to prevent DOM thrashing
- **Simultaneous Preview**: Show code preview as it streams, not after completion
- Top tools (v0.dev, Cursor, Bolt) use real-time visual progress indicators

## Requirements

### Functional Requirements

1. **FR-02.1**: Live plan checklist showing 4 phases with checkmarks
2. **FR-02.2**: Progress bar updates based on actual token count
3. **FR-02.3**: Streaming code display with syntax highlighting
4. **FR-02.4**: Typing effect for message text (not code)
5. **FR-02.5**: Preview pane updates when code block completes

### Non-Functional Requirements

1. **NFR-02.1**: Visual latency <100ms from token receipt to display
2. **NFR-02.2**: No UI jank during streaming (60fps maintained)
3. **NFR-02.3**: Memory efficient for long streams (>10KB)

## Architecture Design

### Component Structure

```
app/components/chat/
├── ChatMessage.tsx           # Modify - add progress indicator
├── BuildProgressIndicator.tsx # NEW - phase checklist + progress bar
├── StreamingCodeBlock.tsx    # NEW - syntax-highlighted streaming
└── hooks/
    └── useStreamingProgress.ts # NEW - progress calculation logic
```

### Progress Phase Detection

```typescript
// Detect phase based on content analysis
const PHASES = [
  { id: 'analyzing', label: 'Analyzing prompt', trigger: null, percentage: 0 },
  { id: 'schema', label: 'Building schema', trigger: '{% schema %}', percentage: 25 },
  { id: 'styles', label: 'Adding styles', trigger: '{% style %}', percentage: 50 },
  { id: 'markup', label: 'Creating markup', trigger: '{% endstyle %}', percentage: 75 },
  { id: 'complete', label: 'Finalizing', trigger: '</div>', percentage: 100 },
];
```

### Data Flow

```
SSE Token Stream →
  useStreamingProgress (buffer & analyze) →
  Progress state update →
  BuildProgressIndicator (visual update) →
  StreamingCodeBlock (append & highlight) →
  Preview update (on code complete)
```

## Related Code Files

| File | Purpose | Action |
|------|---------|--------|
| `app/components/chat/ChatMessage.tsx` | Message rendering | Modify - integrate progress |
| `app/components/chat/hooks/useStreamingChat.ts` | SSE handling | Modify - expose progress state |
| `app/components/chat/BuildProgressIndicator.tsx` | Progress UI | Create new |
| `app/components/chat/StreamingCodeBlock.tsx` | Code display | Create new |
| `app/components/chat/hooks/useStreamingProgress.ts` | Progress logic | Create new |
| `app/services/chat.server.ts` | Server chat service | Review for streaming |

## Implementation Steps

### Step 1: Create useStreamingProgress Hook (60min)

1. Create `app/components/chat/hooks/useStreamingProgress.ts`:
```typescript
import { useState, useCallback, useRef } from 'react';

interface Phase {
  id: string;
  label: string;
  trigger: string | null;
  percentage: number;
  completed: boolean;
}

interface StreamingProgress {
  phases: Phase[];
  currentPhase: string;
  percentage: number;
  tokenCount: number;
  estimatedTotal: number;
}

export function useStreamingProgress() {
  const [progress, setProgress] = useState<StreamingProgress>({
    phases: PHASES.map(p => ({ ...p, completed: false })),
    currentPhase: 'analyzing',
    percentage: 0,
    tokenCount: 0,
    estimatedTotal: 2000, // Typical section ~2000 tokens
  });

  const contentBuffer = useRef('');

  const processToken = useCallback((token: string) => {
    contentBuffer.current += token;
    const content = contentBuffer.current;

    // Detect phase transitions
    const newPhases = PHASES.map(phase => ({
      ...phase,
      completed: phase.trigger ? content.includes(phase.trigger) : false,
    }));

    // Calculate percentage based on detected phases
    const completedCount = newPhases.filter(p => p.completed).length;
    const percentage = Math.min((completedCount / (PHASES.length - 1)) * 100, 100);

    // Find current phase
    const currentPhaseIndex = newPhases.findIndex(p => !p.completed);
    const currentPhase = newPhases[currentPhaseIndex]?.id || 'complete';

    setProgress({
      phases: newPhases,
      currentPhase,
      percentage,
      tokenCount: content.length,
      estimatedTotal: 2000,
    });
  }, []);

  const reset = useCallback(() => {
    contentBuffer.current = '';
    setProgress({
      phases: PHASES.map(p => ({ ...p, completed: false })),
      currentPhase: 'analyzing',
      percentage: 0,
      tokenCount: 0,
      estimatedTotal: 2000,
    });
  }, []);

  return { progress, processToken, reset };
}

const PHASES = [
  { id: 'analyzing', label: 'Analyzing prompt', trigger: null, percentage: 0 },
  { id: 'schema', label: 'Building schema', trigger: '{% schema %}', percentage: 25 },
  { id: 'styles', label: 'Adding styles', trigger: '{% style %}', percentage: 50 },
  { id: 'markup', label: 'Creating markup', trigger: '{% endstyle %}', percentage: 75 },
  { id: 'complete', label: 'Finalizing', trigger: null, percentage: 100 },
];
```

### Step 2: Create BuildProgressIndicator Component (60min)

1. Create `app/components/chat/BuildProgressIndicator.tsx`:
```typescript
interface BuildProgressIndicatorProps {
  phases: Array<{ id: string; label: string; completed: boolean }>;
  currentPhase: string;
  percentage: number;
  isComplete: boolean;
}

export function BuildProgressIndicator({
  phases,
  currentPhase,
  percentage,
  isComplete,
}: BuildProgressIndicatorProps) {
  return (
    <s-box padding="base" background="subdued" borderRadius="base">
      <s-stack direction="block" gap="small">
        {/* Progress bar */}
        <s-box>
          <s-progress-bar
            value={percentage}
            size="small"
            tone={isComplete ? 'success' : 'default'}
          />
        </s-box>

        {/* Phase checklist */}
        <s-stack direction="block" gap="extra-small">
          {phases.map((phase) => (
            <s-stack key={phase.id} direction="inline" gap="small" alignItems="center">
              {phase.completed ? (
                <s-icon name="check" color="success" size="small" />
              ) : phase.id === currentPhase ? (
                <s-spinner size="small" />
              ) : (
                <s-icon name="circle" color="subdued" size="small" />
              )}
              <s-text
                variant="bodySm"
                color={phase.completed ? 'default' : 'subdued'}
                fontWeight={phase.id === currentPhase ? 'semibold' : 'regular'}
              >
                {phase.label}
              </s-text>
            </s-stack>
          ))}
        </s-stack>
      </s-stack>
    </s-box>
  );
}
```

### Step 3: Create StreamingCodeBlock Component (90min)

1. Create `app/components/chat/StreamingCodeBlock.tsx`:
```typescript
import { useRef, useEffect, useState } from 'react';

interface StreamingCodeBlockProps {
  code: string;
  isStreaming: boolean;
  language?: string;
}

export function StreamingCodeBlock({
  code,
  isStreaming,
  language = 'liquid',
}: StreamingCodeBlockProps) {
  const codeRef = useRef<HTMLPreElement>(null);
  const [displayedCode, setDisplayedCode] = useState('');
  const bufferRef = useRef('');
  const frameIdRef = useRef<number>();

  // Chunked display for smooth animation
  useEffect(() => {
    if (!isStreaming) {
      setDisplayedCode(code);
      return;
    }

    // Buffer incoming code
    bufferRef.current = code;

    // Update display in animation frames (60fps)
    const updateDisplay = () => {
      const current = displayedCode;
      const target = bufferRef.current;

      if (current.length < target.length) {
        // Append chunk (25 chars per frame for smooth effect)
        const chunkSize = Math.min(25, target.length - current.length);
        setDisplayedCode(target.slice(0, current.length + chunkSize));
        frameIdRef.current = requestAnimationFrame(updateDisplay);
      }
    };

    frameIdRef.current = requestAnimationFrame(updateDisplay);

    return () => {
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }
    };
  }, [code, isStreaming, displayedCode]);

  // Auto-scroll to bottom during streaming
  useEffect(() => {
    if (isStreaming && codeRef.current) {
      codeRef.current.scrollTop = codeRef.current.scrollHeight;
    }
  }, [displayedCode, isStreaming]);

  return (
    <s-box
      background="base"
      borderRadius="base"
      padding="small"
      overflow="auto"
      maxBlockSize="300px"
    >
      <pre
        ref={codeRef}
        className={`language-${language}`}
        style={{
          margin: 0,
          fontFamily: 'monospace',
          fontSize: '12px',
          lineHeight: 1.5,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        <code>{displayedCode}</code>
        {isStreaming && <span className="cursor-blink">|</span>}
      </pre>
    </s-box>
  );
}
```

### Step 4: Modify useStreamingChat Hook (60min)

1. Update `app/components/chat/hooks/useStreamingChat.ts`:
   - Integrate `useStreamingProgress` hook
   - Expose progress state to consumers
   - Add chunked buffer for DOM updates (50-100ms)
   - Track streaming status per message

```typescript
// Add to existing hook
const { progress, processToken, reset: resetProgress } = useStreamingProgress();

// In token handler
const handleToken = useCallback((token: string) => {
  processToken(token);
  // ... existing token handling
}, [processToken]);
```

### Step 5: Integrate Progress into ChatMessage (45min)

1. Modify `app/components/chat/ChatMessage.tsx`:
   - Add `BuildProgressIndicator` when message is streaming
   - Replace static code block with `StreamingCodeBlock`
   - Show progress only during active generation
   - Hide progress after completion with fade animation

```typescript
// In ChatMessage component
{isStreaming && (
  <BuildProgressIndicator
    phases={progress.phases}
    currentPhase={progress.currentPhase}
    percentage={progress.percentage}
    isComplete={!isStreaming}
  />
)}

<StreamingCodeBlock
  code={codeContent}
  isStreaming={isStreaming}
  language="liquid"
/>
```

### Step 6: Add CSS Animations (30min)

1. Add to chat styles:
```css
/* Cursor blink animation */
.cursor-blink {
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  50% { opacity: 0; }
}

/* Progress fade out */
.progress-complete {
  animation: fadeOut 0.5s ease-out forwards;
}

@keyframes fadeOut {
  to { opacity: 0; height: 0; }
}

/* Code line reveal */
.code-line-reveal {
  animation: revealLine 0.05s ease-out forwards;
}

@keyframes revealLine {
  from { opacity: 0; transform: translateX(-10px); }
  to { opacity: 1; transform: translateX(0); }
}
```

### Step 7: Preview Update Trigger (45min)

1. Modify preview update logic to trigger when code block completes:
   - Detect end of code block (`{% endschema %}` or closing HTML tag)
   - Trigger preview refresh via existing `usePreviewMessaging`
   - Add debounce to prevent rapid updates

```typescript
// In useStreamingChat or parent component
useEffect(() => {
  if (!isStreaming && codeContent) {
    // Code complete, trigger preview update
    onCodeComplete?.(codeContent);
  }
}, [isStreaming, codeContent]);
```

## Todo List

- [ ] Create useStreamingProgress hook with phase detection
- [ ] Create BuildProgressIndicator component
- [ ] Create StreamingCodeBlock component with chunked display
- [ ] Modify useStreamingChat to expose progress state
- [ ] Integrate progress indicator into ChatMessage
- [ ] Add CSS animations for streaming effects
- [ ] Add preview update trigger on code complete
- [ ] Test streaming performance with long outputs
- [ ] Add accessibility labels for progress states

## Success Criteria

1. Progress bar updates in real-time during generation
2. Phase checkmarks appear as each phase completes
3. Code displays with smooth typing effect (no jank)
4. Preview updates automatically when code completes
5. UI maintains 60fps during streaming

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Phase detection inaccurate | Medium | Low | Fallback to token-based % |
| Animation causes jank | Low | Medium | Use requestAnimationFrame |
| Memory leak in streaming | Low | High | Proper cleanup in useEffect |
| Long outputs overflow | Low | Low | Virtualize code display |

## Security Considerations

- Sanitize code before display (prevent XSS in code content)
- Rate limit SSE connections
- Validate token format from AI response

---

**Phase Status**: Pending
**Estimated Completion**: 6 hours
**Dependencies**: Existing SSE streaming infrastructure
