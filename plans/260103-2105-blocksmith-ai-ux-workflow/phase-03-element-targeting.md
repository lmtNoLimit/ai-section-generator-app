# Phase 03: Element Targeting

## Context Links

- [Main Plan](plan.md)
- [Visual Editing Research](research/researcher-02-visual-editing-targeting-ux.md)
- [Preview Messaging Hook](../../app/components/preview/hooks/usePreviewMessaging.ts)

## Overview

| Attribute | Value |
|-----------|-------|
| Priority | P2 |
| Status | code-review-required |
| Effort | 8h (complete) + 2-3h (security fixes) |
| Description | Point-and-click element selection in preview iframe for targeted AI refinement |
| Review Report | [Code Review 260103-2326](../reports/code-reviewer-260103-2326-phase03-element-targeting.md) |
| Critical Issues | 2 (postMessage security) |
| Blocker | Must fix CRIT-01, CRIT-02 before production |

## Key Research Insights

From Visual Editing Research:
- **postMessage Pattern**: Cross-iframe communication proven by Webflow/Framer
- **Click-to-Select**: Preview iframe captures clicks, returns element metadata via postMessage
- **Selector Generation**: Use unique CSS selectors (class, id, data attributes)
- **Highlight Overlay**: Border/outline on selected element
- **Same-origin Requirement**: Works reliably only with same-origin iframes

Current architecture has `usePreviewMessaging` hook ready for extension.

## Requirements

### Functional Requirements

1. **FR-03.1**: Click element in preview to select it
2. **FR-03.2**: Highlight selected element with visual outline
3. **FR-03.3**: Show element info panel (tag, classes, text preview)
4. **FR-03.4**: "Edit this element" button sends context to AI
5. **FR-03.5**: Multi-select support for related elements
6. **FR-03.6**: Clear selection button/escape key

### Non-Functional Requirements

1. **NFR-03.1**: Selection feedback in <100ms
2. **NFR-03.2**: Works with dynamic content (Liquid-rendered)
3. **NFR-03.3**: No interference with existing preview interactions

## Architecture Design

### Component Structure

```
app/components/preview/
├── hooks/
│   └── usePreviewMessaging.ts    # MODIFY - add element targeting
│   └── useElementTargeting.ts    # NEW - targeting state management
├── ElementTargetingOverlay.tsx   # NEW - selection highlight UI
├── ElementInfoPanel.tsx          # NEW - selected element details
└── targeting/
    ├── iframe-injection.ts       # NEW - script injected into iframe
    └── selector-utils.ts         # NEW - CSS selector generation
```

### postMessage Protocol

```typescript
// Messages FROM iframe TO parent
interface ElementSelectedMessage {
  type: 'elementSelected';
  element: {
    selector: string;      // Unique CSS selector
    tagName: string;       // e.g., 'div', 'h2'
    className: string;     // e.g., 'ai-hero-title'
    textContent: string;   // First 100 chars
    boundingRect: DOMRect; // Position for overlay
    path: string[];        // Ancestor chain
  };
}

interface ElementHoverMessage {
  type: 'elementHover';
  element: { selector: string; boundingRect: DOMRect } | null;
}

// Messages FROM parent TO iframe
interface HighlightElementMessage {
  type: 'highlightElement';
  selector: string | null; // null to clear
}

interface EnableTargetingMessage {
  type: 'enableTargeting';
  enabled: boolean;
}
```

### Data Flow

```
User enables targeting mode →
  Parent sends 'enableTargeting' to iframe →
  Iframe attaches click listeners →
  User clicks element in preview →
  Iframe captures click, prevents default →
  Iframe generates unique selector →
  Iframe sends 'elementSelected' to parent →
  Parent updates state, shows overlay →
  User clicks "Edit this" →
  AI receives element context in prompt
```

## Related Code Files

| File | Purpose | Action |
|------|---------|--------|
| `app/components/preview/hooks/usePreviewMessaging.ts` | postMessage handling | Modify - add targeting messages |
| `app/components/preview/hooks/useElementTargeting.ts` | Targeting state | Create new |
| `app/components/preview/ElementTargetingOverlay.tsx` | Selection highlight | Create new |
| `app/components/preview/ElementInfoPanel.tsx` | Element details panel | Create new |
| `app/components/preview/targeting/iframe-injection.ts` | Iframe click handlers | Create new |
| `app/components/preview/targeting/selector-utils.ts` | Selector generation | Create new |
| `app/components/preview/PreviewFrame.tsx` | Preview container | Modify - inject targeting script |
| `app/components/chat/ChatInput.tsx` | Chat input | Modify - accept element context |

## Implementation Steps

### Step 1: Create Selector Utilities (45min)

1. Create `app/components/preview/targeting/selector-utils.ts`:
```typescript
/**
 * Generate a unique CSS selector for an element
 * Prioritizes: id > data attributes > class + index > tag + index
 */
export function generateUniqueSelector(element: Element): string {
  // Priority 1: ID
  if (element.id) {
    return `#${CSS.escape(element.id)}`;
  }

  // Priority 2: Data attributes (common in Liquid sections)
  const dataAttrs = Array.from(element.attributes)
    .filter(attr => attr.name.startsWith('data-'))
    .slice(0, 2);
  if (dataAttrs.length > 0) {
    const selector = dataAttrs
      .map(attr => `[${attr.name}="${CSS.escape(attr.value)}"]`)
      .join('');
    if (document.querySelectorAll(selector).length === 1) {
      return selector;
    }
  }

  // Priority 3: Class with index
  if (element.className && typeof element.className === 'string') {
    const classes = element.className.trim().split(/\s+/).slice(0, 2);
    if (classes.length > 0) {
      const classSelector = '.' + classes.map(c => CSS.escape(c)).join('.');
      const matches = document.querySelectorAll(classSelector);
      if (matches.length === 1) {
        return classSelector;
      }
      // Add nth-of-type
      const index = Array.from(matches).indexOf(element);
      if (index >= 0) {
        return `${classSelector}:nth-of-type(${index + 1})`;
      }
    }
  }

  // Priority 4: Tag with nth-child
  const parent = element.parentElement;
  if (parent) {
    const siblings = Array.from(parent.children).filter(
      child => child.tagName === element.tagName
    );
    const index = siblings.indexOf(element);
    const parentSelector = generateUniqueSelector(parent);
    return `${parentSelector} > ${element.tagName.toLowerCase()}:nth-of-type(${index + 1})`;
  }

  // Fallback
  return element.tagName.toLowerCase();
}

/**
 * Get ancestor path for breadcrumb display
 */
export function getAncestorPath(element: Element, maxDepth = 4): string[] {
  const path: string[] = [];
  let current: Element | null = element;

  while (current && path.length < maxDepth) {
    const tag = current.tagName.toLowerCase();
    const className = current.className?.split(' ')[0] || '';
    path.unshift(className ? `${tag}.${className}` : tag);
    current = current.parentElement;
  }

  return path;
}
```

### Step 2: Create Iframe Injection Script (60min)

1. Create `app/components/preview/targeting/iframe-injection.ts`:
```typescript
/**
 * Script to inject into preview iframe for element targeting
 * Must be stringified and injected via srcDoc or script tag
 */
export const IFRAME_TARGETING_SCRIPT = `
(function() {
  let targetingEnabled = false;
  let hoveredElement = null;
  let selectedElement = null;

  // Listen for parent messages
  window.addEventListener('message', function(event) {
    const { type, selector, enabled } = event.data;

    if (type === 'enableTargeting') {
      targetingEnabled = enabled;
      document.body.style.cursor = enabled ? 'crosshair' : '';
      if (!enabled) {
        clearHighlights();
      }
    }

    if (type === 'highlightElement') {
      if (selector) {
        const el = document.querySelector(selector);
        if (el) highlightElement(el, 'selected');
      } else {
        clearHighlights();
      }
    }
  });

  // Click handler
  document.addEventListener('click', function(event) {
    if (!targetingEnabled) return;

    event.preventDefault();
    event.stopPropagation();

    const element = event.target;
    if (!element || element === document.body) return;

    selectedElement = element;
    highlightElement(element, 'selected');

    // Generate selector and send to parent
    const selector = generateUniqueSelector(element);
    const rect = element.getBoundingClientRect();

    parent.postMessage({
      type: 'elementSelected',
      element: {
        selector: selector,
        tagName: element.tagName.toLowerCase(),
        className: element.className || '',
        textContent: (element.textContent || '').slice(0, 100).trim(),
        boundingRect: {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        },
        path: getAncestorPath(element),
      },
    }, '*');
  }, true);

  // Hover handler
  document.addEventListener('mouseover', function(event) {
    if (!targetingEnabled) return;

    const element = event.target;
    if (element === hoveredElement || element === selectedElement) return;

    if (hoveredElement) {
      hoveredElement.style.outline = '';
    }

    hoveredElement = element;
    if (element !== document.body) {
      element.style.outline = '2px dashed #0070f3';
    }
  }, true);

  function highlightElement(element, type) {
    clearHighlights();
    if (type === 'selected') {
      element.style.outline = '3px solid #0070f3';
      element.style.outlineOffset = '2px';
    }
  }

  function clearHighlights() {
    document.querySelectorAll('[style*="outline"]').forEach(el => {
      el.style.outline = '';
      el.style.outlineOffset = '';
    });
  }

  // Include selector utils (inlined)
  ${generateUniqueSelector.toString()}
  ${getAncestorPath.toString()}
})();
`;
```

### Step 3: Create useElementTargeting Hook (60min)

1. Create `app/components/preview/hooks/useElementTargeting.ts`:
```typescript
import { useState, useCallback, useEffect } from 'react';
import { usePreviewMessaging } from './usePreviewMessaging';

interface SelectedElement {
  selector: string;
  tagName: string;
  className: string;
  textContent: string;
  boundingRect: DOMRect;
  path: string[];
}

interface UseElementTargetingResult {
  isTargetingEnabled: boolean;
  selectedElement: SelectedElement | null;
  enableTargeting: () => void;
  disableTargeting: () => void;
  clearSelection: () => void;
  getElementContext: () => string; // For AI prompt
}

export function useElementTargeting(): UseElementTargetingResult {
  const [isTargetingEnabled, setIsTargetingEnabled] = useState(false);
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);

  const { sendMessage } = usePreviewMessaging((message) => {
    if (message.type === 'elementSelected') {
      setSelectedElement(message.element);
    }
  });

  const enableTargeting = useCallback(() => {
    setIsTargetingEnabled(true);
    sendMessage({ type: 'enableTargeting', enabled: true });
  }, [sendMessage]);

  const disableTargeting = useCallback(() => {
    setIsTargetingEnabled(false);
    sendMessage({ type: 'enableTargeting', enabled: false });
    setSelectedElement(null);
  }, [sendMessage]);

  const clearSelection = useCallback(() => {
    setSelectedElement(null);
    sendMessage({ type: 'highlightElement', selector: null });
  }, [sendMessage]);

  // Escape key to cancel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isTargetingEnabled) {
        disableTargeting();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTargetingEnabled, disableTargeting]);

  // Generate context for AI prompt
  const getElementContext = useCallback(() => {
    if (!selectedElement) return '';

    return `Target element:
- Tag: <${selectedElement.tagName}>
- Classes: ${selectedElement.className || 'none'}
- Content preview: "${selectedElement.textContent}"
- Path: ${selectedElement.path.join(' > ')}
- Selector: ${selectedElement.selector}`;
  }, [selectedElement]);

  return {
    isTargetingEnabled,
    selectedElement,
    enableTargeting,
    disableTargeting,
    clearSelection,
    getElementContext,
  };
}
```

### Step 4: Create ElementInfoPanel Component (45min)

1. Create `app/components/preview/ElementInfoPanel.tsx`:
```typescript
interface ElementInfoPanelProps {
  element: {
    tagName: string;
    className: string;
    textContent: string;
    path: string[];
  };
  onEdit: () => void;
  onClear: () => void;
}

export function ElementInfoPanel({ element, onEdit, onClear }: ElementInfoPanelProps) {
  return (
    <s-box
      padding="base"
      background="base"
      borderWidth="small"
      borderColor="subdued"
      borderRadius="base"
    >
      <s-stack direction="block" gap="small">
        {/* Breadcrumb path */}
        <s-text variant="bodySm" color="subdued">
          {element.path.join(' > ')}
        </s-text>

        {/* Element tag */}
        <s-stack direction="inline" gap="small" alignItems="center">
          <s-badge tone="info">&lt;{element.tagName}&gt;</s-badge>
          {element.className && (
            <s-text variant="bodySm" fontFamily="mono">
              .{element.className.split(' ')[0]}
            </s-text>
          )}
        </s-stack>

        {/* Text preview */}
        {element.textContent && (
          <s-text variant="bodySm" color="subdued" truncate>
            "{element.textContent}"
          </s-text>
        )}

        {/* Actions */}
        <s-stack direction="inline" gap="small">
          <s-button variant="primary" size="small" onClick={onEdit}>
            Edit this element
          </s-button>
          <s-button variant="secondary" size="small" onClick={onClear}>
            Clear
          </s-button>
        </s-stack>
      </s-stack>
    </s-box>
  );
}
```

### Step 5: Modify PreviewFrame for Script Injection (45min)

1. Update `app/components/preview/PreviewFrame.tsx`:
   - Inject targeting script into srcDoc
   - Handle targeting state from parent
   - Ensure script runs after DOM ready

### Step 6: Add Targeting Toggle to Preview Toolbar (30min)

1. Modify `app/components/preview/PreviewToolbar.tsx`:
```typescript
// Add targeting toggle button
<s-button
  variant={isTargetingEnabled ? 'primary' : 'secondary'}
  size="small"
  onClick={isTargetingEnabled ? disableTargeting : enableTargeting}
  accessibilityLabel={isTargetingEnabled ? 'Disable element targeting' : 'Enable element targeting'}
>
  <s-icon name="target" />
  {isTargetingEnabled ? 'Cancel' : 'Target'}
</s-button>
```

### Step 7: Integrate with Chat Input (60min)

1. Modify `app/components/chat/ChatInput.tsx`:
   - Accept element context prop
   - Show element badge when targeting active
   - Include element context in AI prompt
   - Clear element after sending message

```typescript
// When element is selected, show in input area
{selectedElement && (
  <s-box padding="small" background="subdued">
    <s-stack direction="inline" gap="small" alignItems="center">
      <s-badge tone="info">Editing: {selectedElement.tagName}</s-badge>
      <s-button variant="plain" size="small" onClick={clearSelection}>
        <s-icon name="cancel" />
      </s-button>
    </s-stack>
  </s-box>
)}
```

## Todo List

### Implementation (Complete ✅)
- [x] Create selector-utils.ts with unique selector generation
- [x] Create iframe-injection.ts script
- [x] Create useElementTargeting hook
- [x] Create ElementInfoPanel component
- [x] Modify PreviewFrame to inject targeting script
- [x] Add targeting toggle to PreviewToolbar
- [x] Integrate element context with ChatInput
- [x] Add escape key handler to cancel targeting

### Security Fixes (Required ⛔)
- [ ] **CRIT-01**: Replace `postMessage(..., '*')` with origin validation (ALL files)
- [ ] **CRIT-02**: Add origin validation to ALL message handlers
- [ ] **HIGH-02**: Fix selector uniqueness (nth-of-type → nth-child)
- [ ] **HIGH-01**: Add event listener cleanup on targeting disable
- [ ] **HIGH-03**: Escape attribute names in selector generation

### Testing & QA (Pending)
- [ ] Test with various Liquid section structures
- [ ] Test with SVG/Shadow DOM elements
- [ ] Performance test with 1000+ element DOM
- [ ] Verify selector uniqueness with real sections
- [ ] Add accessibility labels and keyboard navigation

## Success Criteria

1. Click any element in preview to select it
2. Selected element shows visible highlight (outline)
3. Element info displays tag, class, text preview
4. "Edit this element" sends context to AI
5. Escape key cancels targeting mode
6. Works with dynamically rendered Liquid content

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Cross-origin issues | Low | High | Use same-origin App Proxy preview |
| Selector not unique | Medium | Low | Fallback to nth-child |
| Performance on complex DOM | Low | Medium | Debounce hover events |
| Conflicts with preview interactions | Medium | Medium | Toggle mode on/off |

## Security Considerations

- ❌ **CRITICAL**: Validate postMessage origin (NOT implemented - uses wildcard '*')
- ⚠️ **HIGH**: Sanitize selector strings before use (partial - CSS.escape on values only)
- ✅ Don't expose internal page structure to external sources (nonce implemented but insufficient)
- ✅ Limit text content preview to 100 chars

### Security Audit Results (2026-01-03)
- **2 Critical Issues**: postMessage wildcard origins, missing origin validation
- **3 High Issues**: memory leaks, selector bugs, XSS vectors
- **Security Rating**: 5/10 (Not Production Ready)
- **See**: [Full Security Report](../reports/code-reviewer-260103-2326-phase03-element-targeting.md#security-audit-summary)

---

**Phase Status**: Code Review Required (Security Fixes Pending)
**Implementation Time**: 8 hours (Complete)
**Security Fix Time**: 2-3 hours (Required)
**Dependencies**: Phase 02 (streaming state), existing usePreviewMessaging
**Code Review**: [Report 260103-2326](../reports/code-reviewer-260103-2326-phase03-element-targeting.md)
