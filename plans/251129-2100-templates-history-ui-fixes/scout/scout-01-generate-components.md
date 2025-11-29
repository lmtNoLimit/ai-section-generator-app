# Scout Report: Generate Page Components & Patterns

**Objective:** Document well-designed Generate page components for reference patterns
**Date:** 2025-11-29
**Scout:** Codebase Scout

---

## File Inventory

### Core Layout Components
1. `/Users/lmtnolimit/working/ai-section-generator/app/routes/app.generate.tsx` - Main page route
2. `/Users/lmtnolimit/working/ai-section-generator/app/components/generate/GenerateLayout.tsx` - Two-column layout
3. `/Users/lmtnolimit/working/ai-section-generator/app/components/generate/GenerateInputColumn.tsx` - Left column
4. `/Users/lmtnolimit/working/ai-section-generator/app/components/generate/GeneratePreviewColumn.tsx` - Right column

### Form Input Components
5. `/Users/lmtnolimit/working/ai-section-generator/app/components/generate/PromptInput.tsx` - Text area with validation
6. `/Users/lmtnolimit/working/ai-section-generator/app/components/generate/ThemeSelector.tsx` - Theme dropdown
7. `/Users/lmtnolimit/working/ai-section-generator/app/components/generate/SectionNameInput.tsx` - Text field with suffix
8. `/Users/lmtnolimit/working/ai-section-generator/app/components/generate/AdvancedOptions.tsx` - Collapsible options

### Modal Components
9. `/Users/lmtnolimit/working/ai-section-generator/app/components/generate/SaveTemplateModal.tsx` - Modal form

### Supporting Components
10. `/Users/lmtnolimit/working/ai-section-generator/app/components/generate/CodePreview.tsx`
11. `/Users/lmtnolimit/working/ai-section-generator/app/components/generate/LoadingState.tsx`
12. `/Users/lmtnolimit/working/ai-section-generator/app/components/generate/EmptyState.tsx`
13. `/Users/lmtnolimit/working/ai-section-generator/app/components/generate/TemplateSuggestions.tsx`
14. `/Users/lmtnolimit/working/ai-section-generator/app/components/generate/PromptExamples.tsx`
15. `/Users/lmtnolimit/working/ai-section-generator/app/components/generate/GenerateActions.tsx`

---

## Key Patterns Identified

### 1. Two-Column Layout Pattern

**Component:** `GenerateLayout.tsx`

```tsx
<s-grid
  gap="large"
  gridTemplateColumns="1fr 2fr"
>
  {/* Primary column: Main creation content */}
  <s-stack gap="large" direction="block">
    {inputColumn}
  </s-stack>

  {/* Secondary column: Preview and save */}
  <s-stack gap="large" direction="block">
    {previewColumn}
  </s-stack>
</s-grid>
```

**Key insights:**
- Uses `s-grid` with `gridTemplateColumns="1fr 2fr"` for 1/3 + 2/3 split
- Each column wrapped in `s-stack gap="large" direction="block"`
- Left column (1fr) = input controls
- Right column (2fr) = preview/output

---

### 2. Card + Section Pattern

**Component:** `GenerateInputColumn.tsx`

```tsx
<s-card>
  <s-section heading="Describe your section">
    <s-stack gap="large" direction="block">
      <PromptInput />
      <AdvancedOptions />
      <s-button variant="primary">
        Generate Code
      </s-button>
    </s-stack>
  </s-section>
</s-card>
```

**Key insights:**
- Each content group = `<s-card>` with `<s-section heading="...">`
- Content inside section wrapped in `<s-stack gap="large" direction="block">`
- Multiple cards stacked vertically with gap

---

### 3. Text Area Input Pattern

**Component:** `PromptInput.tsx`

```tsx
<s-text-area
  label="Prompt"
  value={value}
  onInput={handleInput}
  placeholder={placeholder}
  disabled={disabled || undefined}
  rows={6}
  maxLength={maxLength}
  error={error || validationError}
  details={displayDetails}
/>
```

**Key insights:**
- Uses `s-text-area` for multi-line
- Character counter: `${charCount}/${maxLength} characters`
- Validation errors shown in `error` prop
- Help text + char count combined in `details` prop
- Disabled logic: `disabled || undefined` (avoids false as string)

---

### 4. Select Input Pattern

**Component:** `ThemeSelector.tsx`

```tsx
<s-select
  label="Select Theme"
  value={selectedThemeId}
  onChange={handleChange}
  disabled={disabled || undefined}
>
  {themes.map((theme) => (
    <option key={theme.id} value={theme.id}>
      {theme.name} ({theme.role})
    </option>
  ))}
</s-select>
```

**Key insights:**
- Uses `s-select` with native `<option>` elements
- onChange handler: `const target = e.target as HTMLSelectElement`
- Display format: `{name} ({role})`

---

### 5. Text Field Input Pattern

**Component:** `SectionNameInput.tsx`

```tsx
<s-text-field
  label="Section Filename"
  value={value}
  onInput={handleInput}
  autoComplete="off"
  suffix=".liquid"
  error={error}
/>
```

**Key insights:**
- Uses `s-text-field` for single-line
- `suffix` prop shows `.liquid` extension
- `onInput` handler: `const target = e.target as HTMLInputElement`
- `autoComplete="off"` prevents browser autocomplete

---

### 6. Collapsible Options Pattern

**Component:** `AdvancedOptions.tsx`

```tsx
<s-stack gap="base" direction="block">
  <s-button
    onClick={() => setIsExpanded(!isExpanded)}
    variant="tertiary"
    icon={isExpanded ? 'chevron-up' : 'chevron-down'}
    accessibilityLabel={isExpanded ? 'Collapse...' : 'Expand...'}
  >
    Advanced Options
  </s-button>

  {isExpanded && (
    <s-stack gap="base" direction="block">
      <s-select label="Tone" ... />
      <s-select label="Style" ... />
      <s-switch label="Include schema" ... />
    </s-stack>
  )}
</s-stack>
```

**Key insights:**
- Toggle state with `useState(false)`
- Button with dynamic icon based on state
- Conditional render: `{isExpanded && <content />}`
- Proper accessibility labels

---

### 7. Modal Pattern

**Component:** `SaveTemplateModal.tsx`

```tsx
<div
  style={{
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px'
  }}
  onClick={onClose}  // Close on backdrop click
>
  <div
    style={{
      backgroundColor: 'var(--p-color-bg-surface)',
      borderRadius: '12px',
      width: '100%',
      maxWidth: '600px',
      maxHeight: '90vh',
      overflow: 'auto'
    }}
    onClick={(e) => e.stopPropagation()}  // Prevent close on content click
  >
    <s-card>
      <s-stack gap="large" direction="block">
        {/* Header with close button */}
        <s-stack gap="small" distribution="equalSpacing">
          <s-text variant="headingLg">Save as Template</s-text>
          <s-button variant="tertiary" onClick={onClose}>✕</s-button>
        </s-stack>

        {/* Form fields */}
        <s-stack gap="large" direction="block">
          <input type="text" ... />
          <select ... />
          <textarea ... />
        </s-stack>

        {/* Actions */}
        <s-stack gap="small" distribution="trailing">
          <s-button variant="secondary" onClick={onClose}>Cancel</s-button>
          <s-button variant="primary" onClick={handleSubmit}>Save</s-button>
        </s-stack>
      </s-stack>
    </s-card>
  </div>
</div>
```

**Key insights:**
- Fixed overlay with semi-transparent backdrop
- Center modal with flexbox
- `onClick={onClose}` on backdrop
- `onClick={(e) => e.stopPropagation()}` on content
- Uses CSS variables: `var(--p-color-bg-surface)`
- Actions aligned right: `distribution="trailing"`

---

### 8. Form Input Styling Pattern

**Applies to text inputs, selects, textareas in modal:**

```tsx
style={{
  width: '100%',
  padding: '8px 12px',
  border: '1px solid var(--p-color-border)',
  borderRadius: '8px',
  fontSize: '14px',
  backgroundColor: 'var(--p-color-bg-surface)' // for selects
}}
```

**Key insights:**
- Consistent padding: `8px 12px`
- Border radius: `8px`
- Font size: `14px`
- Uses Polaris CSS variables for theming

---

### 9. Button Patterns

**Primary action:**
```tsx
<s-button
  variant="primary"
  onClick={onGenerate}
  loading={isGenerating || undefined}
  disabled={disabled || !isValid}
>
  Generate Code
</s-button>
```

**Secondary action:**
```tsx
<s-button
  variant="secondary"
  onClick={onSaveAsTemplate}
  disabled={!generatedCode || isSaving}
>
  Save as Template
</s-button>
```

**Tertiary (minimal):**
```tsx
<s-button variant="tertiary" onClick={onClose}>
  ✕
</s-button>
```

**Key insights:**
- Loading state: `loading={isLoading || undefined}` (avoids false as string)
- Disabled logic: compound conditions
- Variants: `primary` | `secondary` | `tertiary`

---

### 10. Icon Picker Pattern

**Component:** `SaveTemplateModal.tsx`

```tsx
<s-stack gap="small" wrap>
  {ICONS.map((emoji) => (
    <button
      key={emoji}
      type="button"
      onClick={() => setIcon(emoji)}
      style={{
        width: '40px',
        height: '40px',
        fontSize: '20px',
        border: icon === emoji
          ? '2px solid var(--p-color-border-interactive)'
          : '1px solid var(--p-color-border)',
        borderRadius: '8px',
        backgroundColor: icon === emoji
          ? 'var(--p-color-bg-surface-secondary)'
          : 'transparent',
        cursor: 'pointer'
      }}
    >
      {emoji}
    </button>
  ))}
</s-stack>
```

**Key insights:**
- Grid of clickable buttons with emojis
- Selected state changes border + background
- Uses `wrap` on s-stack for multi-row layout

---

### 11. Conditional Rendering Pattern

**Component:** `GeneratePreviewColumn.tsx`

```tsx
// Loading state
if (isGenerating) {
  return (
    <s-card>
      <s-section heading="Preview">
        <LoadingState message="Generating..." />
      </s-section>
    </s-card>
  );
}

// Empty state
if (!generatedCode) {
  return (
    <s-card>
      <s-section heading="Preview">
        <EmptyState heading="No code yet" />
      </s-section>
    </s-card>
  );
}

// Actual content
return (
  <>
    <s-card>...</s-card>
    <s-card>...</s-card>
  </>
);
```

**Key insights:**
- Early returns for loading/empty states
- Maintains consistent structure (card + section)
- Multiple cards in fragment for actual content

---

### 12. Page Layout Pattern

**Component:** `app.generate.tsx`

```tsx
<s-page heading="Generate Section" inlineSize="large">
  <s-stack gap="large" direction="block">
    {/* Banners */}
    {actionData?.success && (
      <s-banner tone="success" dismissible>
        Success message
      </s-banner>
    )}

    {/* Two-column layout */}
    <GenerateLayout
      inputColumn={<GenerateInputColumn ... />}
      previewColumn={<GeneratePreviewColumn ... />}
    />
  </s-stack>
</s-page>
```

**Key insights:**
- Uses `s-page` with `inlineSize="large"` for max width
- Banners at top (before layout)
- Main content in `s-stack gap="large" direction="block"`
- Banner tones: `success` | `critical`
- `dismissible` prop adds close button

---

## Unresolved Questions

None. All components documented successfully.
