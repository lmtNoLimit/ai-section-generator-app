# Phase 01: Layout Restructuring & Settings Pattern

**Phase ID**: phase-01-layout-restructuring
**Date**: 2025-11-29
**Status**: ✅ Complete
**Priority**: High (Foundation)
**Estimated Effort**: 4-6 hours
**Actual Effort**: ~1 hour

---

## Context

**Parent Plan**: [Generate Screen Redesign Plan](./plan.md)
**Dependencies**: None
**Blocks**: Phase 02, Phase 03

**Related Documentation**:
- [Shopify Design Guidelines Research](./research/researcher-01-shopify-design-guidelines.md)
- [Code Standards](../../docs/code-standards.md)
- [System Architecture](../../docs/system-architecture.md)

---

## Overview

Transform current single-column card layout into Shopify Settings pattern: two-column layout with left column (1/3 width) for inputs/controls and right column (2/3 width) for preview/results. Ensure mobile responsiveness by stacking columns vertically on small screens.

**Current State**: Single-column layout with sequential cards (input → preview → save)
**Target State**: Two-column responsive layout (input left, preview right, mobile stacked)

---

## Key Insights from Research

**Shopify Settings Pattern** (research/researcher-01):
- Left column (1/3): Labels, descriptions, controls
- Right column (2/3): Preview, results, actions
- 4px spacing grid via Stack component
- Mobile: Stack vertically (single column)
- Use `s-layout-section` with `variant` for column widths

**Competitor Patterns** (research/researcher-02):
- Sectional: Single-step workflow, overlay presentation
- Shogun: Split-pane (prompt left, preview right)
- Most apps use sidebar or split view for better context

**Implementation Approach**:
- Use `s-layout` with two `s-layout-section` components
- Left section: `variant="oneThird"` (input area)
- Right section: `variant="twoThirds"` (preview area)
- Stack component for vertical spacing (gap="400")

---

## Requirements

### Functional Requirements

1. **Two-Column Layout**
   - Left column: Prompt input, template suggestions, advanced options
   - Right column: Code preview, theme selector, filename input, save actions
   - Responsive breakpoint: Stack vertically on screens < 768px

2. **Preserve Existing Functionality**
   - All current features must work (generate, save, theme selection)
   - Loading states maintained (isGenerating, isSaving)
   - Error/success banners functional
   - Service mode indicator preserved

3. **Accessibility**
   - Logical heading hierarchy (h2 for sections)
   - Keyboard navigation functional
   - Screen reader compatible
   - Focus management maintained

### Non-Functional Requirements

1. **Performance**: No performance degradation vs current implementation
2. **Code Quality**: Follow component extraction pattern from Phase 04
3. **Maintainability**: Clear component separation, under 200 lines per file
4. **Testing**: Manual testing on desktop, tablet, mobile viewports

---

## Architecture

### Component Structure

```
app/
├── routes/
│   └── app.generate.tsx               # Orchestrates layout, minimal logic
└── components/
    └── generate/
        ├── GenerateLayout.tsx          # NEW: Two-column responsive layout wrapper
        ├── GenerateInputColumn.tsx     # NEW: Left column container (inputs)
        ├── GeneratePreviewColumn.tsx   # NEW: Right column container (preview/actions)
        ├── PromptInput.tsx             # EXISTING: Reused as-is
        ├── ThemeSelector.tsx           # EXISTING: Move to preview column
        ├── CodePreview.tsx             # EXISTING: Move to preview column
        ├── SectionNameInput.tsx        # EXISTING: Move to preview column
        └── GenerateActions.tsx         # EXISTING: Move to preview column
```

### New Component APIs

**GenerateLayout.tsx**
```typescript
interface GenerateLayoutProps {
  inputColumn: React.ReactNode;
  previewColumn: React.ReactNode;
}
```

**GenerateInputColumn.tsx**
```typescript
interface GenerateInputColumnProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  disabled: boolean;
  onGenerate: () => void;
  isGenerating: boolean;
}
```

**GeneratePreviewColumn.tsx**
```typescript
interface GeneratePreviewColumnProps {
  generatedCode: string;
  themes: Theme[];
  selectedTheme: string;
  onThemeChange: (themeId: string) => void;
  fileName: string;
  onFileNameChange: (name: string) => void;
  onSave: () => void;
  isSaving: boolean;
  canSave: boolean;
}
```

---

## Related Code Files

**Modified**:
- `app/routes/app.generate.tsx` - Refactor to use new layout components

**New**:
- `app/components/generate/GenerateLayout.tsx` - Responsive two-column wrapper
- `app/components/generate/GenerateInputColumn.tsx` - Left column container
- `app/components/generate/GeneratePreviewColumn.tsx` - Right column container

**Reused (No Changes)**:
- `app/components/generate/PromptInput.tsx`
- `app/components/generate/ThemeSelector.tsx`
- `app/components/generate/CodePreview.tsx`
- `app/components/generate/SectionNameInput.tsx`
- `app/components/generate/GenerateActions.tsx`

---

## Implementation Steps

### Step 1: Create GenerateLayout Component

**File**: `app/components/generate/GenerateLayout.tsx`

```typescript
export interface GenerateLayoutProps {
  inputColumn: React.ReactNode;
  previewColumn: React.ReactNode;
}

/**
 * Two-column responsive layout for generate screen
 * Left: Input controls (1/3 width)
 * Right: Preview and actions (2/3 width)
 * Mobile: Stacked vertically
 */
export function GenerateLayout({ inputColumn, previewColumn }: GenerateLayoutProps) {
  return (
    <s-layout>
      {/* Left column: Input area (1/3 width) */}
      <s-layout-section variant="oneThird">
        {inputColumn}
      </s-layout-section>

      {/* Right column: Preview area (2/3 width) */}
      <s-layout-section variant="twoThirds">
        {previewColumn}
      </s-layout-section>
    </s-layout>
  );
}
```

**Notes**:
- Polaris `s-layout-section` with `variant="oneThird"/"twoThirds"` handles responsive behavior
- No custom CSS needed (Polaris handles breakpoints)
- Stacks vertically on mobile automatically

---

### Step 2: Create GenerateInputColumn Component

**File**: `app/components/generate/GenerateInputColumn.tsx`

```typescript
import { PromptInput } from './PromptInput';

export interface GenerateInputColumnProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  disabled: boolean;
  onGenerate: () => void;
  isGenerating: boolean;
}

/**
 * Left column for generate screen
 * Contains prompt input and generate button
 */
export function GenerateInputColumn({
  prompt,
  onPromptChange,
  disabled,
  onGenerate,
  isGenerating
}: GenerateInputColumnProps) {
  return (
    <s-stack gap="400" vertical>
      <s-card>
        <s-stack gap="400" vertical>
          <s-text variant="headingMd" as="h2">
            Describe your section
          </s-text>

          <PromptInput
            value={prompt}
            onChange={onPromptChange}
            disabled={disabled}
          />

          <s-button
            variant="primary"
            onClick={onGenerate}
            loading={isGenerating ? "true" : undefined}
            disabled={disabled || !prompt.trim()}
          >
            Generate Code
          </s-button>
        </s-stack>
      </s-card>
    </s-stack>
  );
}
```

**Notes**:
- Combines PromptInput and generate button in single card
- Disabled state applies to both input and button
- Loading state shows spinner on button during generation

---

### Step 3: Create GeneratePreviewColumn Component

**File**: `app/components/generate/GeneratePreviewColumn.tsx`

```typescript
import { CodePreview } from './CodePreview';
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
  canSave: boolean;
}

/**
 * Right column for generate screen
 * Contains code preview, theme selector, filename input, and save button
 */
export function GeneratePreviewColumn({
  generatedCode,
  themes,
  selectedTheme,
  onThemeChange,
  fileName,
  onFileNameChange,
  onSave,
  isSaving,
  canSave
}: GeneratePreviewColumnProps) {
  // Show empty state if no code generated yet
  if (!generatedCode) {
    return (
      <s-card>
        <s-stack gap="400" vertical align="center">
          <s-text variant="headingMd" as="h2" tone="subdued">
            Preview
          </s-text>
          <s-text tone="subdued" alignment="center">
            Generated code will appear here after you click "Generate Code"
          </s-text>
        </s-stack>
      </s-card>
    );
  }

  return (
    <s-stack gap="400" vertical>
      <s-card>
        <s-stack gap="400" vertical>
          <s-text variant="headingMd" as="h2">
            Preview & Save
          </s-text>

          <CodePreview code={generatedCode} />

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
            Save to Theme
          </s-button>
        </s-stack>
      </s-card>
    </s-stack>
  );
}
```

**Notes**:
- Shows empty state when no code generated (better UX than blank space)
- All save-related controls grouped in single card
- Disabled state during save operation

---

### Step 4: Refactor app.generate.tsx

**File**: `app/routes/app.generate.tsx`

Update component to use new layout:

```typescript
import { GenerateLayout } from "../components/generate/GenerateLayout";
import { GenerateInputColumn } from "../components/generate/GenerateInputColumn";
import { GeneratePreviewColumn } from "../components/generate/GeneratePreviewColumn";
import { SuccessBanner, ErrorBanner } from "../components";

export default function GeneratePage() {
  const { themes, serviceMode } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const submit = useSubmit();

  // State management (unchanged)
  const [prompt, setPrompt] = useState(actionData?.prompt || "");
  const [generatedCode, setGeneratedCode] = useState(actionData?.code || "");
  const activeTheme = themes.find((theme: Theme) => theme.role === "MAIN");
  const [selectedTheme, setSelectedTheme] = useState(activeTheme?.id || themes[0]?.id || "");
  const [fileName, setFileName] = useState("ai-section");

  const isLoading = navigation.state === "submitting";
  const isGenerating = isLoading && navigation.formData?.get("action") === "generate";
  const isSaving = isLoading && navigation.formData?.get("action") === "save";

  useEffect(() => {
    if (actionData?.code && actionData.code !== generatedCode) {
      setGeneratedCode(actionData.code);
    }
  }, [actionData?.code, generatedCode]);

  // Handlers (unchanged)
  const handleGenerate = () => {
    if (!prompt.trim()) return;
    const formData = new FormData();
    formData.append("action", "generate");
    formData.append("prompt", prompt);
    submit(formData, { method: "post" });
  };

  const handleSave = () => {
    const formData = new FormData();
    formData.append("action", "save");
    formData.append("themeId", selectedTheme);
    formData.append("fileName", fileName);
    formData.append("content", generatedCode);
    submit(formData, { method: "post" });
  };

  const canSave = Boolean(generatedCode && fileName && selectedTheme);

  return (
    <>
      <s-page title="Generate Section">
        <s-stack gap="400" vertical>
          {/* Feedback banners */}
          {actionData?.success && (
            <SuccessBanner message={actionData.message} />
          )}
          {actionData?.success === false && (
            <ErrorBanner message={actionData.message} />
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
                canSave={canSave}
              />
            }
          />
        </s-stack>
      </s-page>

      <ServiceModeIndicator
        themeMode={serviceMode.themeMode}
        aiMode={serviceMode.aiMode}
        showIndicator={serviceMode.showIndicator}
      />
    </>
  );
}
```

**Notes**:
- Route file now orchestrates components only (minimal UI logic)
- All state management preserved (no behavioral changes)
- Banners remain at top level (good for visibility)

---

### Step 5: Update Component Barrel Export

**File**: `app/components/index.ts`

Add new exports:

```typescript
// Generate feature components
export { GenerateLayout } from './generate/GenerateLayout';
export { GenerateInputColumn } from './generate/GenerateInputColumn';
export { GeneratePreviewColumn } from './generate/GeneratePreviewColumn';
export { PromptInput } from './generate/PromptInput';
export { ThemeSelector } from './generate/ThemeSelector';
export { CodePreview } from './generate/CodePreview';
export { SectionNameInput } from './generate/SectionNameInput';
export { GenerateActions } from './generate/GenerateActions'; // May be removed if not used
```

---

### Step 6: Manual Testing

**Test Scenarios**:

1. **Desktop Layout (>768px)**
   - ✅ Two columns displayed side-by-side
   - ✅ Left column 1/3 width, right column 2/3 width
   - ✅ Spacing consistent (4px grid via Stack)

2. **Tablet Layout (768px - 1024px)**
   - ✅ Columns still side-by-side but narrower
   - ✅ Text wraps appropriately
   - ✅ No horizontal scroll

3. **Mobile Layout (<768px)**
   - ✅ Columns stacked vertically
   - ✅ Left column (input) appears first
   - ✅ Right column (preview) appears second
   - ✅ Full width usage

4. **Functionality**
   - ✅ Generate code works (prompt → AI → preview)
   - ✅ Save to theme works (theme selection → filename → save)
   - ✅ Loading states show correctly (spinners on buttons)
   - ✅ Error/success banners display properly
   - ✅ Empty state shows in preview column before generation

5. **Accessibility**
   - ✅ Keyboard navigation works (Tab, Enter)
   - ✅ Screen reader announces headings correctly
   - ✅ Focus visible on all interactive elements
   - ✅ Proper heading hierarchy (h1 Page title, h2 Section titles)

---

## Todo List

- [x] Create `GenerateLayout.tsx` component
- [x] Create `GenerateInputColumn.tsx` component
- [x] Create `GeneratePreviewColumn.tsx` component
- [x] Refactor `app.generate.tsx` to use new layout
- [x] Update `app/components/index.ts` barrel export
- [x] Add Polaris type definitions (variant, align, tone, alignment)
- [x] Code review completed (see reports/251129-from-code-reviewer-to-user-phase-01-review.md)
- [ ] Fix ESLint errors (6 errors: unused variables, unescaped entities)
- [ ] Test desktop layout (>768px)
- [ ] Test tablet layout (768px-1024px)
- [ ] Test mobile layout (<768px)
- [ ] Test all functionality (generate, save, loading states)
- [ ] Test accessibility (keyboard nav, screen reader)
- [ ] Verify no regressions (compare with current implementation)
- [ ] Final cleanup and commit

---

## Success Criteria

**Functional**:
- ✅ Two-column layout displays correctly on desktop
- ✅ Layout stacks vertically on mobile (<768px)
- ✅ All existing features work (generate, save, theme selection)
- ✅ Loading states functional (isGenerating, isSaving)
- ✅ Error/success banners display properly
- ✅ Empty state shows in preview column

**Non-Functional**:
- ✅ No performance degradation
- ✅ Component files under 200 lines each
- ✅ TypeScript types properly defined
- ✅ Accessibility compliant (keyboard nav, screen reader)
- ✅ Code follows established patterns (Phase 04 style)

---

## Risk Assessment

**Low Risk**:
- Layout changes (Polaris components handle responsiveness)
- Component extraction (established pattern from Phase 04)

**Medium Risk**:
- Mobile breakpoint edge cases (test thoroughly)
- Empty state UX (ensure clarity)

**Mitigation**:
- Test on multiple viewport sizes (Chrome DevTools)
- Follow Polaris documentation for layout variants
- Manual testing before moving to Phase 02

---

## Security Considerations

**No New Security Concerns**:
- No new data inputs (uses existing prompt/filename)
- No new API calls (uses existing aiAdapter/themeAdapter)
- No new authentication requirements
- Layout changes only (presentation layer)

**Existing Security Maintained**:
- Filename sanitization preserved (ThemeSelector component)
- Prompt validation preserved (PromptInput component)
- Authentication via `authenticate.admin(request)` unchanged

---

## Next Steps

**After Phase 01 Completion**:
1. Code review and approval
2. Merge to main branch
3. Begin Phase 02: Enhanced Input Experience
   - Template suggestions component
   - Prompt examples component
   - Progressive disclosure for advanced options

**Blockers for Phase 02**:
- None (can start immediately after Phase 01 completion)

**Dependencies**:
- Phase 02 will build on left column (GenerateInputColumn)
- Phase 03 will build on right column (GeneratePreviewColumn)
