# Phase 03: Improved Preview & Feedback

**Phase ID**: phase-03-improved-preview-feedback
**Date**: 2025-11-29
**Status**: ✅ Complete
**Priority**: High (Polish)
**Estimated Effort**: 5-7 hours
**Completed**: 2025-11-29

---

## Context

**Parent Plan**: [Generate Screen Redesign Plan](./plan.md)
**Dependencies**: Phase 01 (Layout Restructuring)
**Blocks**: None (runs parallel with Phase 02)

**Related Documentation**:
- [Shopify Design Guidelines Research](./research/researcher-01-shopify-design-guidelines.md)
- [Competitor Analysis Research](./research/researcher-02-competitor-analysis.md)
- [Code Standards](../../docs/code-standards.md)

---

## Overview

Enhance code preview, loading states, and feedback mechanisms to improve merchant confidence and UX polish. Add copy/download features, progress indicators, better error messaging, and empty states.

**Current State**: Basic code preview (pre tag), simple loading spinner, generic banners
**Target State**: Enhanced preview with copy/download, detailed loading states, actionable error messages, empty state guidance

---

## Key Insights from Research

**Shopify Design Patterns** (research/researcher-01):
- Spinner (size="large") during generation
- Banner tones: info (generating), success (saved), critical (error)
- Loading states: disable inputs/buttons during operations
- Empty states: Provide clear next steps when no content

**Competitor Patterns** (research/researcher-02):
- Sectional: Loading with progress messages ("Analyzing prompt...", "Generating code...")
- Shogun: Copy code button prominent, syntax highlighting
- Common: Download as file option, clear error recovery steps

**High-Impact Opportunities**:
- Copy button reduces friction (no manual selection needed)
- Download enables offline editing
- Progress messages build trust during long operations
- Actionable errors guide recovery (not just "Failed")

---

## Requirements

### Functional Requirements

1. **Enhanced Code Preview**
   - Copy to clipboard button (one-click copy)
   - Download as file button (downloads .liquid file)
   - Syntax highlighting (optional: use lightweight library or CSS classes)
   - Line numbers (optional: for easier reference)
   - Scrollable container (max height ~500px)

2. **Loading States**
   - Generate: Spinner + progress message ("Generating section code...")
   - Save: Spinner + progress message ("Saving to theme...")
   - Disable all inputs and buttons during operations
   - Show spinner in preview column if generating

3. **Empty State**
   - Display when no code generated yet
   - Clear message: "Generated code will appear here"
   - Suggestion: "Enter a prompt or choose a template to get started"
   - Icon or illustration (optional)

4. **Enhanced Feedback Banners**
   - **Info**: "Generating your section... This may take 10-15 seconds"
   - **Success**: "Section saved successfully to [theme-name]! Go to Theme Editor to customize."
   - **Error**: Specific messages with recovery steps
     - Generation failed: "Generation failed. Try simplifying your prompt or choose a template."
     - Save failed: "Failed to save section. Check that theme exists and try again."

5. **Preserve Existing Behavior**
   - All current functionality works (generate, save)
   - Loading states prevent duplicate submissions
   - Banners dismissible

### Non-Functional Requirements

1. **Performance**: Copy/download operations instant (<100ms)
2. **Accessibility**: Copy/download buttons keyboard accessible, screen reader friendly
3. **Code Quality**: Components under 200 lines, TypeScript strict
4. **Mobile-Friendly**: Buttons stack vertically on small screens, code scrollable

---

## Architecture

### Component Structure

```
app/
├── routes/
│   └── app.generate.tsx                      # Update feedback banners
└── components/
    └── generate/
        ├── GeneratePreviewColumn.tsx         # MODIFIED: Use enhanced preview, loading state
        ├── CodePreview.tsx                   # MODIFIED: Add copy/download buttons
        ├── LoadingState.tsx                  # NEW: Spinner + progress message
        ├── EmptyState.tsx                    # NEW: Empty preview guidance
        └── shared/
            ├── Banner.tsx                    # MODIFIED: Enhanced messaging (optional)
            └── CopyButton.tsx                # NEW: Reusable copy-to-clipboard button
```

### Component APIs

**CodePreview.tsx (Enhanced)**:
```typescript
interface CodePreviewProps {
  code: string;
  maxHeight?: string;
  onCopy?: () => void; // Optional callback after copy
  onDownload?: () => void; // Optional callback after download
  fileName?: string; // For download filename
}
```

**LoadingState.tsx**:
```typescript
interface LoadingStateProps {
  message: string; // e.g., "Generating section code..."
  size?: 'small' | 'large';
}
```

**EmptyState.tsx**:
```typescript
interface EmptyStateProps {
  heading: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}
```

---

## Related Code Files

**Modified**:
- `app/components/generate/CodePreview.tsx` - Add copy/download buttons
- `app/components/generate/GeneratePreviewColumn.tsx` - Use LoadingState, EmptyState
- `app/routes/app.generate.tsx` - Enhanced banner messages

**New**:
- `app/components/generate/LoadingState.tsx` - Spinner + message
- `app/components/generate/EmptyState.tsx` - Empty preview guidance
- `app/components/shared/CopyButton.tsx` - Reusable copy button (optional)

**Unchanged**:
- Input column components (PromptInput, Templates, etc.)
- Other shared components

---

## Implementation Steps

### Step 1: Create LoadingState Component

**File**: `app/components/generate/LoadingState.tsx`

```typescript
export interface LoadingStateProps {
  message: string;
  subMessage?: string;
  size?: 'small' | 'large';
}

/**
 * Loading state with spinner and message
 * Used during generation or save operations
 *
 * Design decision: V1 shows progress indicator for long-running generations
 * (no timeout handling - users wait with visual feedback)
 */
export function LoadingState({
  message,
  subMessage = 'This may take a moment...',
  size = 'large'
}: LoadingStateProps) {
  return (
    <s-stack gap="400" vertical align="center">
      <s-spinner size={size} />
      <s-text variant="bodyMd" tone="subdued" alignment="center">
        {message}
      </s-text>
      {subMessage && (
        <s-text variant="bodySm" tone="subdued" alignment="center">
          {subMessage}
        </s-text>
      )}
    </s-stack>
  );
}
```

**Notes**:
- Centered spinner and message
- Size prop for flexibility (large for main loading, small for inline)
- SubMessage for long-running operations (V1: no timeout, show encouragement)
- Typical generation: 3-10s; AI may take longer for complex prompts

---

### Step 2: Create EmptyState Component

**File**: `app/components/generate/EmptyState.tsx`

```typescript
export interface EmptyStateProps {
  heading: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Empty state for preview column
 * Displayed when no code generated yet
 */
export function EmptyState({
  heading,
  message,
  action
}: EmptyStateProps) {
  return (
    <s-stack gap="400" vertical align="center" style={{ padding: 'var(--p-space-800)' }}>
      {/* Optional icon/illustration */}
      <div style={{ fontSize: '48px', opacity: 0.5 }}>📝</div>

      <s-text variant="headingMd" as="h3" alignment="center">
        {heading}
      </s-text>

      <s-text variant="bodyMd" tone="subdued" alignment="center">
        {message}
      </s-text>

      {action && (
        <s-button onClick={action.onClick} variant="secondary">
          {action.label}
        </s-button>
      )}
    </s-stack>
  );
}
```

**Notes**:
- Icon (emoji) adds visual interest (can replace with illustration later)
- Optional action button for quick next step
- Centered alignment for better UX

---

### Step 3: Enhance CodePreview Component

**File**: `app/components/generate/CodePreview.tsx` (Modified)

```typescript
import { useState } from 'react';

export interface CodePreviewProps {
  code: string;
  maxHeight?: string;
  fileName?: string;
  onCopy?: () => void;
  onDownload?: () => void;
}

/**
 * Enhanced code preview with copy and download buttons
 */
export function CodePreview({
  code,
  maxHeight = '500px',
  fileName = 'section',
  onCopy,
  onDownload
}: CodePreviewProps) {
  const [copySuccess, setCopySuccess] = useState(false);

  if (!code) {
    return null;
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopySuccess(true);
      onCopy?.();

      // Reset success state after 2 seconds
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleDownload = () => {
    // Create blob and download link
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}.liquid`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    onDownload?.();
  };

  return (
    <s-stack gap="300" vertical>
      {/* Action buttons */}
      <s-stack gap="200" distribution="trailing">
        <s-button
          onClick={handleCopy}
          size="slim"
          variant="secondary"
          icon={copySuccess ? 'check' : 'clipboard'}
        >
          {copySuccess ? 'Copied!' : 'Copy Code'}
        </s-button>

        <s-button
          onClick={handleDownload}
          size="slim"
          variant="secondary"
          icon="download"
        >
          Download
        </s-button>
      </s-stack>

      {/* Code display */}
      <s-box padding="400" background="bg-surface-secondary" border-radius="200">
        <pre
          style={{
            overflowX: 'auto',
            overflowY: 'auto',
            maxHeight,
            margin: 0,
            fontFamily: 'Monaco, Courier, monospace',
            fontSize: '13px',
            lineHeight: '1.6',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}
        >
          {code}
        </pre>
      </s-box>
    </s-stack>
  );
}
```

**Notes**:
- Copy uses Clipboard API (modern browsers)
- Download creates blob and triggers download
- Success feedback ("Copied!") for 2 seconds
- Buttons aligned to right (distribution="trailing")
- Icons: clipboard, check, download (Polaris built-in icons)

**Future Enhancement**:
- Syntax highlighting (use library like `prism-react-renderer` or CSS classes)
- Line numbers (optional, adds complexity)

---

### Step 4: Update GeneratePreviewColumn Component

**File**: `app/components/generate/GeneratePreviewColumn.tsx` (Modified)

```typescript
import { CodePreview } from './CodePreview';
import { LoadingState } from './LoadingState';
import { EmptyState } from './EmptyState';
import { ThemeSelector } from './ThemeSelector';
import { SectionNameInput } from './SectionNameInput';
import type { Theme } from '../../types';

export interface GeneratePreviewColumnProps {
  generatedCode: string;
  themes: Theme[];
  selectedTheme: string;
  onThemeChange: (themeId: string) => void;
  fileName: string;
  onFileNameChange: (name: string) => void;
  onSave: () => void;
  isSaving: boolean;
  isGenerating: boolean;
  canSave: boolean;
}

export function GeneratePreviewColumn({
  generatedCode,
  themes,
  selectedTheme,
  onThemeChange,
  fileName,
  onFileNameChange,
  onSave,
  isSaving,
  isGenerating,
  canSave
}: GeneratePreviewColumnProps) {
  // Show loading state during generation
  if (isGenerating) {
    return (
      <s-card>
        <LoadingState message="Generating section code... This may take 10-15 seconds" />
      </s-card>
    );
  }

  // Show empty state if no code generated yet
  if (!generatedCode) {
    return (
      <s-card>
        <EmptyState
          heading="Preview"
          message="Generated code will appear here after you click 'Generate Code'. Enter a prompt or choose a template to get started."
        />
      </s-card>
    );
  }

  // Show code preview and save controls
  return (
    <s-stack gap="400" vertical>
      <s-card>
        <s-stack gap="400" vertical>
          <s-text variant="headingMd" as="h2">
            Preview & Save
          </s-text>

          <CodePreview
            code={generatedCode}
            fileName={fileName}
          />

          {/* Separator */}
          <s-divider />

          <ThemeSelector
            themes={themes}
            selectedThemeId={selectedTheme}
            onChange={onThemeChange}
            disabled={isSaving}
          />

          <SectionNameInput
            value={fileName}
            onChange={onFileNameChange}
            disabled={isSaving}
          />

          <s-button
            variant="primary"
            onClick={onSave}
            loading={isSaving ? "true" : undefined}
            disabled={!canSave || isSaving}
          >
            {isSaving ? 'Saving...' : 'Save to Theme'}
          </s-button>
        </s-stack>
      </s-card>
    </s-stack>
  );
}
```

**Notes**:
- Three states: Loading, Empty, Content
- Loading state shows during generation (isGenerating prop)
- Empty state guides user to next action
- Divider separates preview from save controls

---

### Step 5: Update app.generate.tsx Route

**File**: `app/routes/app.generate.tsx` (Modified)

Update banners with enhanced messaging:

```typescript
export default function GeneratePage() {
  // ... existing code ...

  // Get theme name for success message
  const selectedThemeName = themes.find((t: Theme) => t.id === selectedTheme)?.name || 'theme';

  return (
    <>
      <s-page title="Generate Section">
        <s-stack gap="400" vertical>
          {/* Enhanced feedback banners */}

          {/* Info banner during generation */}
          {isGenerating && (
            <s-banner tone="info" heading="Generating">
              Generating your section code... This may take 10-15 seconds. Please wait.
            </s-banner>
          )}

          {/* Success banner after save */}
          {actionData?.success && (
            <s-banner tone="success" heading="Success" dismissible>
              Section saved successfully to {selectedThemeName}! Visit the Theme Editor to customize your new section.
            </s-banner>
          )}

          {/* Error banner with recovery guidance */}
          {actionData?.success === false && (
            <s-banner tone="critical" heading="Error">
              {actionData.message}
              {actionData.message.includes('generate') && (
                <s-text variant="bodySm" as="p" tone="subdued">
                  Try simplifying your prompt or choose a pre-built template.
                </s-text>
              )}
              {actionData.message.includes('save') && (
                <s-text variant="bodySm" as="p" tone="subdued">
                  Verify that the selected theme exists and you have permission to modify it.
                </s-text>
              )}
            </s-banner>
          )}

          {/* Two-column layout */}
          <GenerateLayout
            inputColumn={
              <GenerateInputColumn
                prompt={prompt}
                onPromptChange={setPrompt}
                disabled={isGenerating || isSaving}
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
              />
            }
            previewColumn={
              <GeneratePreviewColumn
                generatedCode={generatedCode}
                themes={themes}
                selectedTheme={selectedTheme}
                onThemeChange={setSelectedTheme}
                fileName={fileName}
                onFileNameChange={setFileName}
                onSave={handleSave}
                isSaving={isSaving}
                isGenerating={isGenerating} // NEW: Pass to preview column
                canSave={canSave}
              />
            }
          />
        </s-stack>
      </s-page>

      <ServiceModeIndicator {...serviceMode} />
    </>
  );
}
```

**Notes**:
- Info banner shows during generation (isGenerating state)
- Success banner includes theme name and next step guidance
- Error banner provides context-specific recovery tips
- Pass isGenerating to preview column for loading state

---

### Step 6: Update Component Barrel Export

**File**: `app/components/index.ts`

```typescript
// Generate feature components
export { LoadingState } from './generate/LoadingState';
export { EmptyState } from './generate/EmptyState';
// ... existing exports ...
```

---

### Step 7: Manual Testing

**Test Scenarios**:

1. **Empty State**
   - ✅ Shows when page first loads (no code)
   - ✅ Message clear: "Enter prompt or choose template"
   - ✅ Icon/illustration visible

2. **Loading State (Generate)**
   - ✅ Spinner shows in preview column during generation
   - ✅ Message: "Generating section code... 10-15 seconds"
   - ✅ Info banner shows at top
   - ✅ Input fields disabled during generation

3. **Code Preview**
   - ✅ Copy button copies code to clipboard
   - ✅ "Copied!" feedback shows for 2 seconds
   - ✅ Download button downloads .liquid file
   - ✅ Code scrollable (horizontal and vertical)
   - ✅ Max height enforced (~500px)

4. **Loading State (Save)**
   - ✅ Save button shows spinner during save
   - ✅ Button text changes to "Saving..."
   - ✅ All inputs disabled during save

5. **Success Banner**
   - ✅ Shows after successful save
   - ✅ Includes theme name
   - ✅ Guidance: "Visit Theme Editor to customize"
   - ✅ Dismissible

6. **Error Banner**
   - ✅ Shows after failed operation
   - ✅ Specific message displayed
   - ✅ Recovery tips shown (context-specific)
   - ✅ Generation error: "Try simplifying prompt"
   - ✅ Save error: "Verify theme exists"

7. **Mobile Responsiveness**
   - ✅ Copy/download buttons stack on small screens
   - ✅ Code preview scrollable horizontally
   - ✅ Empty/loading states centered

8. **Accessibility**
   - ✅ Copy/download buttons keyboard accessible
   - ✅ Screen reader announces button actions
   - ✅ Loading state announced to screen reader
   - ✅ Focus management during state changes

---

## Todo List

- [x] Create `LoadingState.tsx` component
- [x] Create `EmptyState.tsx` component
- [x] Enhance `CodePreview.tsx` with copy/download buttons
- [x] Update `GeneratePreviewColumn.tsx` with loading/empty states
- [x] Update `app.generate.tsx` with enhanced banner messages
- [x] Update `app/components/index.ts` barrel export
- [x] Test empty state (page load)
- [x] Test loading state during generation
- [x] Test copy to clipboard functionality
- [x] Test download functionality (check filename)
- [x] Test loading state during save
- [x] Test success banner (includes theme name, guidance)
- [x] Test error banner (recovery tips)
- [x] Test mobile responsiveness (buttons, scrolling)
- [x] Test accessibility (keyboard nav, screen reader)
- [x] Code review and cleanup

---

## Success Criteria

**Functional**:
- ✅ Empty state displays when no code generated
- ✅ Loading state shows during generation/save
- ✅ Copy button copies code to clipboard with feedback
- ✅ Download button downloads .liquid file
- ✅ Success banner includes theme name and next steps
- ✅ Error banner provides context-specific recovery tips

**Non-Functional**:
- ✅ Components under 200 lines each
- ✅ Copy/download instant (<100ms)
- ✅ Mobile-responsive (buttons stack, code scrolls)
- ✅ Accessibility (keyboard, screen reader)
- ✅ TypeScript strict mode compliant

---

## Risk Assessment

**Low Risk**:
- Loading/empty states (simple UI components)
- Copy to clipboard (well-supported API)
- Download functionality (standard blob approach)

**Medium Risk**:
- Clipboard API support in older browsers (fallback: select + copy command)
- Download filename edge cases (special characters in fileName)

**Mitigation**:
- Test copy in multiple browsers (Chrome, Firefox, Safari)
- Sanitize fileName before download (replace special chars with dashes)
- Provide user feedback if copy/download fails

---

## Security Considerations

**No New Security Concerns**:
- Copy/download operate on existing generated code (no new data sources)
- No new API calls or data persistence
- Clipboard API is browser-native (secure)
- Download creates local file (no server interaction)

**Existing Security Maintained**:
- Code sanitization still handled by AI service
- Filename validation still handled by SectionNameInput component

---

## Next Steps

**After Phase 03 Completion**:
1. Code review and approval
2. Merge to main branch
3. Evaluate Phase 04 (Advanced Features) necessity
   - If yes: Begin Phase 04 (templates library, brand kit, history)
   - If no: Mark redesign complete, update documentation

**Future Enhancements (Post-Phase 03)**:
- Syntax highlighting for code preview (use Prism.js or similar)
- Line numbers in code preview
- Code diff view (compare versions)
- Copy individual sections of code (schema, CSS, Liquid separately)
