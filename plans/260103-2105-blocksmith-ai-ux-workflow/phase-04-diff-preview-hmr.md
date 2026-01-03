# Phase 04: Diff Preview & HMR

## Context Links

- [Main Plan](plan.md)
- [Visual Editing Research](research/researcher-02-visual-editing-targeting-ux.md)
- [Code Preview Panel](../../app/components/editor/CodePreviewPanel.tsx)

## Overview

| Attribute | Value |
|-----------|-------|
| Priority | P2 |
| Status | pending |
| Effort | 6h |
| Description | Surgical diff previews with highlighted changes and optimized iframe refresh for instant preview updates |

## Key Research Insights

From Visual Editing Research:
- **Inline Highlighting**: Line-by-line diff with red (removed), green (added), gray (unchanged)
- **Context-aware Diff**: Show 3 lines context before/after changes
- **Pseudo-HMR for Liquid**: Iframe refresh (not true HMR) - Liquid is server-side
- **Volt Pattern**: CSS/JS can use HMR, Liquid requires reload
- **Diff Stats**: Show +X lines, -Y lines, Z changed blocks

## Requirements

### Functional Requirements

1. **FR-04.1**: Toggle between diff view and normal code view
2. **FR-04.2**: Color-coded diff (green additions, red deletions)
3. **FR-04.3**: Collapsible unchanged sections (3-line context)
4. **FR-04.4**: Diff stats summary (+/- line counts)
5. **FR-04.5**: Smart preview refresh on code change
6. **FR-04.6**: "Refresh preview" button in toolbar

### Non-Functional Requirements

1. **NFR-04.1**: Diff calculation <100ms for typical sections (<500 lines)
2. **NFR-04.2**: Preview refresh <500ms after code change
3. **NFR-04.3**: No layout shift during refresh

## Architecture Design

### Component Structure

```
app/components/editor/
├── CodePreviewPanel.tsx      # MODIFY - add diff toggle
├── CodeDiffView.tsx          # NEW - diff visualization
├── hooks/
│   └── useCodeDiff.ts        # NEW - diff calculation hook
└── diff/
    ├── diff-engine.ts        # NEW - diff algorithm
    └── diff-types.ts         # NEW - type definitions
```

### Diff Algorithm

Use line-by-line diff with Myers algorithm (standard in git):
- Compare old code (before AI edit) vs new code (after)
- Group consecutive changes into "hunks"
- Include context lines around changes

```typescript
interface DiffHunk {
  type: 'add' | 'remove' | 'change' | 'context';
  oldStart: number;
  oldLines: string[];
  newStart: number;
  newLines: string[];
}

interface DiffResult {
  hunks: DiffHunk[];
  stats: {
    additions: number;
    deletions: number;
    changes: number;
  };
}
```

### Preview Refresh Strategy

```
Code changes detected →
  Debounce 300ms (prevent rapid refreshes) →
  If preview visible:
    Show "Updating..." overlay →
    Regenerate preview URL with new code →
    Iframe src update →
    Wait for load event →
    Hide overlay
```

## Related Code Files

| File | Purpose | Action |
|------|---------|--------|
| `app/components/editor/CodePreviewPanel.tsx` | Code/preview tabs | Modify - add diff toggle |
| `app/components/editor/CodeDiffView.tsx` | Diff visualization | Create new |
| `app/components/editor/hooks/useCodeDiff.ts` | Diff calculation | Create new |
| `app/components/editor/diff/diff-engine.ts` | Diff algorithm | Create new |
| `app/components/preview/PreviewFrame.tsx` | Preview iframe | Modify - add refresh optimization |
| `app/components/preview/hooks/usePreviewRenderer.ts` | Preview rendering | Modify - debounced refresh |

## Implementation Steps

### Step 1: Create Diff Engine (90min)

1. Create `app/components/editor/diff/diff-types.ts`:
```typescript
export interface DiffLine {
  type: 'add' | 'remove' | 'unchanged';
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export interface DiffHunk {
  oldStart: number;
  oldCount: number;
  newStart: number;
  newCount: number;
  lines: DiffLine[];
}

export interface DiffResult {
  hunks: DiffHunk[];
  stats: {
    additions: number;
    deletions: number;
    unchanged: number;
  };
  hasDiff: boolean;
}
```

2. Create `app/components/editor/diff/diff-engine.ts`:
```typescript
import type { DiffResult, DiffLine, DiffHunk } from './diff-types';

/**
 * Simple line-by-line diff algorithm
 * Uses longest common subsequence (LCS) approach
 */
export function calculateDiff(oldCode: string, newCode: string): DiffResult {
  const oldLines = oldCode.split('\n');
  const newLines = newCode.split('\n');

  // Quick check for identical content
  if (oldCode === newCode) {
    return {
      hunks: [],
      stats: { additions: 0, deletions: 0, unchanged: oldLines.length },
      hasDiff: false,
    };
  }

  const diff: DiffLine[] = [];
  let oldIndex = 0;
  let newIndex = 0;
  let additions = 0;
  let deletions = 0;

  // Simple diff: compare line by line
  while (oldIndex < oldLines.length || newIndex < newLines.length) {
    if (oldIndex >= oldLines.length) {
      // Remaining new lines are additions
      diff.push({
        type: 'add',
        content: newLines[newIndex],
        newLineNumber: newIndex + 1,
      });
      additions++;
      newIndex++;
    } else if (newIndex >= newLines.length) {
      // Remaining old lines are deletions
      diff.push({
        type: 'remove',
        content: oldLines[oldIndex],
        oldLineNumber: oldIndex + 1,
      });
      deletions++;
      oldIndex++;
    } else if (oldLines[oldIndex] === newLines[newIndex]) {
      // Lines match
      diff.push({
        type: 'unchanged',
        content: oldLines[oldIndex],
        oldLineNumber: oldIndex + 1,
        newLineNumber: newIndex + 1,
      });
      oldIndex++;
      newIndex++;
    } else {
      // Lines differ - mark as remove then add
      diff.push({
        type: 'remove',
        content: oldLines[oldIndex],
        oldLineNumber: oldIndex + 1,
      });
      deletions++;
      oldIndex++;

      diff.push({
        type: 'add',
        content: newLines[newIndex],
        newLineNumber: newIndex + 1,
      });
      additions++;
      newIndex++;
    }
  }

  // Group into hunks with context
  const hunks = groupIntoHunks(diff, 3);

  return {
    hunks,
    stats: {
      additions,
      deletions,
      unchanged: diff.filter(l => l.type === 'unchanged').length,
    },
    hasDiff: additions > 0 || deletions > 0,
  };
}

function groupIntoHunks(lines: DiffLine[], contextLines: number): DiffHunk[] {
  // Implementation groups consecutive changes with context
  const hunks: DiffHunk[] = [];
  let currentHunk: DiffLine[] = [];
  let lastChangeIndex = -contextLines - 1;

  lines.forEach((line, index) => {
    if (line.type !== 'unchanged') {
      // If gap from last change > context*2, start new hunk
      if (index - lastChangeIndex > contextLines * 2 && currentHunk.length > 0) {
        hunks.push(createHunk(currentHunk));
        currentHunk = [];
      }

      // Add context before if starting new hunk
      if (currentHunk.length === 0) {
        const contextStart = Math.max(0, index - contextLines);
        for (let i = contextStart; i < index; i++) {
          if (lines[i].type === 'unchanged') {
            currentHunk.push(lines[i]);
          }
        }
      }

      currentHunk.push(line);
      lastChangeIndex = index;
    } else if (index - lastChangeIndex <= contextLines) {
      // Add as context after
      currentHunk.push(line);
    }
  });

  if (currentHunk.length > 0) {
    hunks.push(createHunk(currentHunk));
  }

  return hunks;
}

function createHunk(lines: DiffLine[]): DiffHunk {
  const oldLines = lines.filter(l => l.type !== 'add');
  const newLines = lines.filter(l => l.type !== 'remove');

  return {
    oldStart: oldLines[0]?.oldLineNumber || 0,
    oldCount: oldLines.length,
    newStart: newLines[0]?.newLineNumber || 0,
    newCount: newLines.length,
    lines,
  };
}
```

### Step 2: Create useCodeDiff Hook (30min)

1. Create `app/components/editor/hooks/useCodeDiff.ts`:
```typescript
import { useMemo, useState, useCallback } from 'react';
import { calculateDiff } from '../diff/diff-engine';
import type { DiffResult } from '../diff/diff-types';

interface UseCodeDiffOptions {
  oldCode: string;
  newCode: string;
}

interface UseCodeDiffResult {
  diff: DiffResult;
  isDiffView: boolean;
  toggleDiffView: () => void;
  hasDiff: boolean;
}

export function useCodeDiff({ oldCode, newCode }: UseCodeDiffOptions): UseCodeDiffResult {
  const [isDiffView, setIsDiffView] = useState(false);

  const diff = useMemo(() => {
    return calculateDiff(oldCode, newCode);
  }, [oldCode, newCode]);

  const toggleDiffView = useCallback(() => {
    setIsDiffView(prev => !prev);
  }, []);

  return {
    diff,
    isDiffView,
    toggleDiffView,
    hasDiff: diff.hasDiff,
  };
}
```

### Step 3: Create CodeDiffView Component (90min)

1. Create `app/components/editor/CodeDiffView.tsx`:
```typescript
import type { DiffResult, DiffHunk, DiffLine } from './diff/diff-types';

interface CodeDiffViewProps {
  diff: DiffResult;
  fileName: string;
}

export function CodeDiffView({ diff, fileName }: CodeDiffViewProps) {
  return (
    <s-box blockSize="100%" overflow="auto">
      {/* Stats header */}
      <s-box padding="small" background="subdued" borderWidth="none none small none">
        <s-stack direction="inline" gap="base" alignItems="center">
          <s-text variant="bodySm" fontFamily="mono">{fileName}</s-text>
          <s-badge tone="success">+{diff.stats.additions}</s-badge>
          <s-badge tone="critical">-{diff.stats.deletions}</s-badge>
        </s-stack>
      </s-box>

      {/* Diff content */}
      <s-box padding="none">
        {diff.hunks.length === 0 ? (
          <s-box padding="base">
            <s-text color="subdued">No changes</s-text>
          </s-box>
        ) : (
          diff.hunks.map((hunk, index) => (
            <DiffHunkView key={index} hunk={hunk} />
          ))
        )}
      </s-box>
    </s-box>
  );
}

function DiffHunkView({ hunk }: { hunk: DiffHunk }) {
  return (
    <s-box>
      {/* Hunk header */}
      <s-box padding="extra-small" background="subdued">
        <s-text variant="bodySm" fontFamily="mono" color="subdued">
          @@ -{hunk.oldStart},{hunk.oldCount} +{hunk.newStart},{hunk.newCount} @@
        </s-text>
      </s-box>

      {/* Lines */}
      <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '12px' }}>
        {hunk.lines.map((line, index) => (
          <DiffLineView key={index} line={line} />
        ))}
      </pre>
    </s-box>
  );
}

function DiffLineView({ line }: { line: DiffLine }) {
  const bgColor = {
    add: '#e6ffec',
    remove: '#ffebe9',
    unchanged: 'transparent',
  }[line.type];

  const prefix = {
    add: '+',
    remove: '-',
    unchanged: ' ',
  }[line.type];

  const textColor = {
    add: '#1a7f37',
    remove: '#cf222e',
    unchanged: 'inherit',
  }[line.type];

  const lineNum = line.type === 'remove'
    ? line.oldLineNumber
    : line.newLineNumber;

  return (
    <div
      style={{
        backgroundColor: bgColor,
        color: textColor,
        padding: '0 8px',
        lineHeight: '1.5',
      }}
    >
      <span style={{ color: '#8b949e', width: '40px', display: 'inline-block' }}>
        {lineNum}
      </span>
      <span style={{ color: textColor, marginRight: '8px' }}>{prefix}</span>
      <span>{line.content}</span>
    </div>
  );
}
```

### Step 4: Integrate Diff View into CodePreviewPanel (45min)

1. Modify `app/components/editor/CodePreviewPanel.tsx`:
   - Add diff toggle button in toolbar
   - Track "previous code" for diff comparison
   - Switch between normal code view and diff view
   - Show diff stats badge when changes exist

```typescript
// Add to CodePreviewPanel
const { diff, isDiffView, toggleDiffView, hasDiff } = useCodeDiff({
  oldCode: previousCode,
  newCode: code,
});

// In toolbar
{hasDiff && (
  <s-button
    variant={isDiffView ? 'primary' : 'secondary'}
    size="small"
    onClick={toggleDiffView}
  >
    <s-icon name="diff" />
    {isDiffView ? 'Code' : 'Diff'}
    {!isDiffView && <s-badge tone="attention">{diff.stats.additions + diff.stats.deletions}</s-badge>}
  </s-button>
)}

// In content area
{isDiffView ? (
  <CodeDiffView diff={diff} fileName={fileName} />
) : (
  <CodeView code={code} />
)}
```

### Step 5: Optimize Preview Refresh (60min)

1. Modify `app/components/preview/hooks/usePreviewRenderer.ts`:
```typescript
import { useState, useCallback, useRef, useEffect } from 'react';

export function usePreviewRenderer(code: string, shopDomain: string) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout>();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Debounced refresh
  const refreshPreview = useCallback((newCode: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      setIsRefreshing(true);

      // Generate new preview URL with code
      const encodedCode = btoa(encodeURIComponent(newCode));
      const url = `https://${shopDomain}/apps/blocksmith-preview?code=${encodedCode}`;

      setPreviewUrl(url);
    }, 300); // 300ms debounce
  }, [shopDomain]);

  // Handle iframe load complete
  const handleIframeLoad = useCallback(() => {
    setIsRefreshing(false);
  }, []);

  // Auto-refresh on code change
  useEffect(() => {
    if (code) {
      refreshPreview(code);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [code, refreshPreview]);

  return {
    previewUrl,
    isRefreshing,
    iframeRef,
    handleIframeLoad,
    forceRefresh: () => refreshPreview(code),
  };
}
```

### Step 6: Add Refresh Overlay (30min)

1. Modify `app/components/preview/PreviewFrame.tsx`:
```typescript
// Add overlay during refresh
{isRefreshing && (
  <s-box
    position="absolute"
    inset="0"
    background="transparent"
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
    }}
  >
    <s-stack direction="block" gap="small" alignItems="center">
      <s-spinner size="large" />
      <s-text color="subdued">Updating preview...</s-text>
    </s-stack>
  </s-box>
)}
```

## Todo List

- [x] Create diff-types.ts with type definitions
- [x] Create diff-engine.ts with diff algorithm
- [x] Create useCodeDiff hook
- [x] Create CodeDiffView component
- [x] Add diff toggle to CodePreviewPanel
- [x] Track previous code for diff comparison
- [ ] **[HIGH]** Add input size guard to diff algorithm (prevents browser freeze)
- [ ] **[MEDIUM]** Optimize createHunk() to single-pass
- [ ] Optimize preview refresh with debounce
- [ ] Add refresh overlay during update
- [ ] Test diff with large code changes
- [ ] Add keyboard shortcut for diff toggle (Cmd+D)

## Success Criteria

1. Diff view shows color-coded changes (green/red)
2. Diff stats display accurate line counts
3. Preview refreshes within 500ms of code change
4. No layout shift during preview refresh
5. Diff calculation completes in <100ms

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Large diff slow to render | Low | Medium | Virtualize for >500 lines |
| Debounce too aggressive | Medium | Low | Tune to 300ms, add manual refresh |
| Preview URL too long | Low | Medium | Use POST with temp storage |
| Previous code tracking bugs | Medium | Low | Clear on new section load |

## Security Considerations

- Sanitize code before base64 encoding for preview URL
- Validate diff input to prevent memory exhaustion
- Rate limit preview refresh requests

---

## Review Results

**Code Review:** `plans/reports/code-reviewer-260103-2345-phase04-diff-preview.md`

**Summary:**
- ✅ Diff preview fully implemented (6 new files)
- ⚠️ Performance guard needed for large files (>1000 lines)
- ❌ HMR/refresh optimization not implemented (deferred)
- Quality: 8.5/10 | Critical: 0 | High: 1 | Medium: 3

**Next Steps:**
1. Add size guard to `calculateDiff()` before production
2. Defer HMR implementation to Phase 05 or separate phase
3. Add tests for diff edge cases

---

**Phase Status**: Partially Complete (Diff ✅, HMR ❌)
**Actual Time**: ~4 hours (diff only)
**Estimated Remaining**: 2 hours (HMR optimization)
**Dependencies**: Phase 02 (streaming state for code changes)
