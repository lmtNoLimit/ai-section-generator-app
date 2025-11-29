# Implementation Plan: Templates & History UI Fixes

**Date:** 2025-11-29
**Task:** Fix UI/UX issues on Templates and History screens
**Status:** COMPLETED

---

## Executive Summary

The Templates and History pages have multiple UI/UX issues stemming from improper Polaris web component usage. This plan provides two approaches: **Approach A (Incremental)** focuses on quick fixes with existing structure, while **Approach B (Comprehensive)** redesigns both pages following Polaris best practices.

**Recommendation:** Approach B - delivers professional Shopify-native experience with moderate additional effort.

---

## Current State Analysis

### Identified Issues

#### Templates Page (`app.templates.tsx`)
| Issue | Severity | Root Cause |
|-------|----------|------------|
| Empty state uses emoji (📋) instead of proper illustration | High | Non-Polaris pattern |
| Filter buttons are individual `<s-button>` without grouping | Medium | Missing `<s-button-group>` |
| Grid uses custom `div` with inline styles | Medium | Should use `<s-grid>` |
| Template cards lack visual hierarchy | Medium | Inconsistent spacing/structure |
| Modal uses custom overlay instead of `<s-modal>` | Medium | Non-native implementation |
| Missing page-level primary action slot | Low | Button inside card instead of header |

#### History Page (`app.history.tsx`)
| Issue | Severity | Root Cause |
|-------|----------|------------|
| History items use custom `div` styling | High | Should use `<s-table>` |
| Status shown as text, not badges | High | Missing `<s-badge>` component |
| Metadata (tone/style) shown as plain text | Medium | Should use `<s-badge>` or `<s-chip>` |
| Pagination uses plain buttons | Medium | No grouping, poor visual hierarchy |
| Empty state minimal design | Medium | Missing illustration/proper structure |
| Preview modal uses custom overlay | Medium | Should use `<s-modal>` |

#### Component Issues
| Component | Issue |
|-----------|-------|
| `TemplateCard.tsx` | Emoji icons, inconsistent action button styling |
| `TemplateEditor.tsx` | Custom modal overlay, native HTML inputs |
| `HistoryItem.tsx` | Custom div container, plain text status |
| `HistoryPreview.tsx` | Custom modal overlay, inconsistent styling |
| `TemplateGrid.tsx` | Inline style grid layout |
| `HistoryList.tsx` | No visual structure for list items |

---

## Approach A: Incremental Fixes (Quick Wins)

### Overview
Fix critical visual issues while maintaining existing component structure. Minimal refactoring, faster delivery.

**Estimated Effort:** 4-6 hours
**Risk Level:** Low
**Quality Level:** Acceptable

### Changes Required

#### Phase A1: Templates Page Fixes (2 hours)

1. **Fix empty state** - Replace emoji with proper structure
```tsx
// Before
<div style={{ fontSize: '48px', opacity: 0.5 }}>📋</div>

// After
<s-grid gap="base" justifyItems="center" paddingBlock="large-400">
  <s-box maxInlineSize="200px" maxBlockSize="200px">
    <s-image
      aspectRatio="1/0.5"
      src="https://cdn.shopify.com/static/images/polaris/patterns/callout.png"
      alt="Templates illustration"
    />
  </s-box>
  <s-grid justifyItems="center" maxInlineSize="450px" gap="base">
    <s-stack alignItems="center">
      <s-heading>No templates yet</s-heading>
      <s-paragraph>Create your first template or save one from Generate.</s-paragraph>
    </s-stack>
    <s-button variant="primary" onClick={() => setShowEditor(true)}>
      Create Template
    </s-button>
  </s-grid>
</s-grid>
```

2. **Group filter buttons** - Add `<s-button-group>`
```tsx
// Before
<s-stack gap="small" direction="inline">
  {CATEGORIES.map(...)}
</s-stack>

// After
<s-button-group gap="none">
  {CATEGORIES.map((cat) => (
    <s-button
      key={cat.value}
      variant={currentCategory === cat.value ? "primary" : "secondary"}
      onClick={() => handleCategoryFilter(cat.value)}
    >
      {cat.label}
    </s-button>
  ))}
</s-button-group>
```

3. **Move primary action to page header**
```tsx
<s-page heading="Section Templates">
  <s-button slot="primary-action" variant="primary" onClick={() => setShowEditor(true)}>
    Create Template
  </s-button>
  {/* ... */}
</s-page>
```

#### Phase A2: History Page Fixes (2 hours)

1. **Add badges for status and metadata**
```tsx
// In HistoryItem.tsx
{isSaved ? (
  <s-badge tone="success">Saved</s-badge>
) : (
  <s-badge tone="neutral">Generated</s-badge>
)}

{item.tone && <s-badge>{item.tone}</s-badge>}
{item.style && <s-badge>{item.style}</s-badge>}
```

2. **Fix empty state structure** - Same pattern as Templates

3. **Group pagination buttons**
```tsx
<s-button-group>
  <s-button disabled={currentPage <= 1} onClick={() => handlePageChange(currentPage - 1)}>
    Previous
  </s-button>
  <s-button disabled={currentPage >= history.totalPages} onClick={() => handlePageChange(currentPage + 1)}>
    Next
  </s-button>
</s-button-group>
```

#### Phase A3: Component Styling (1-2 hours)

1. **TemplateCard.tsx** - Replace emoji favorite with proper icon, add card hover state
2. **HistoryItem.tsx** - Better visual structure with borders
3. **Modals** - Keep custom overlay but improve styling consistency

### Pros & Cons

**Pros:**
- Fast implementation (4-6 hours)
- Low risk of breaking existing functionality
- Immediate visual improvement
- Minimal testing required

**Cons:**
- Technical debt remains (custom components)
- Not fully Polaris-compliant
- Custom modals won't match Shopify admin style
- History items still not using proper table component

---

## Approach B: Comprehensive Redesign (Recommended)

### Overview
Complete redesign following Polaris web component patterns, matching Shopify admin UX standards.

**Estimated Effort:** 10-14 hours
**Risk Level:** Medium
**Quality Level:** High (Production-ready)

### Architecture

```
app/routes/
├── app.templates.tsx       # Refactored with proper layout
└── app.history.tsx         # Refactored with table component

app/components/
├── templates/
│   ├── TemplateGrid.tsx    # Use s-grid with proper cards
│   ├── TemplateCard.tsx    # Redesigned with Polaris patterns
│   ├── TemplateEditor.tsx  # Replace with s-modal
│   └── TemplateEmptyState.tsx  # New: proper empty state
├── history/
│   ├── HistoryTable.tsx    # New: replace list with s-table
│   ├── HistoryPreview.tsx  # Replace with s-modal
│   └── HistoryEmptyState.tsx  # New: proper empty state
└── shared/
    └── FilterButtonGroup.tsx  # Reusable filter component
```

### Phase B1: Shared Components (2 hours)

**File:** `app/components/shared/FilterButtonGroup.tsx`
```tsx
interface FilterOption {
  value: string;
  label: string;
}

interface FilterButtonGroupProps {
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
}

export function FilterButtonGroup({ options, value, onChange }: FilterButtonGroupProps) {
  return (
    <s-button-group gap="none">
      {options.map((opt) => (
        <s-button
          key={opt.value}
          variant={value === opt.value ? "primary" : "secondary"}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </s-button>
      ))}
    </s-button-group>
  );
}
```

**File:** `app/components/shared/EmptyState.tsx`
```tsx
interface EmptyStateProps {
  heading: string;
  description: string;
  primaryAction: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  image?: string;
}

export function EmptyState({ heading, description, primaryAction, secondaryAction, image }: EmptyStateProps) {
  return (
    <s-grid gap="base" justifyItems="center" paddingBlock="large-400">
      {image && (
        <s-box maxInlineSize="200px" maxBlockSize="200px">
          <s-image aspectRatio="1/0.5" src={image} alt="" />
        </s-box>
      )}
      <s-grid justifyItems="center" maxInlineSize="450px" gap="base">
        <s-stack alignItems="center">
          <s-heading>{heading}</s-heading>
          <s-paragraph>{description}</s-paragraph>
        </s-stack>
        <s-button-group>
          {secondaryAction && (
            <s-button onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </s-button>
          )}
          <s-button variant="primary" onClick={primaryAction.onClick}>
            {primaryAction.label}
          </s-button>
        </s-button-group>
      </s-grid>
    </s-grid>
  );
}
```

### Phase B2: Templates Page Redesign (4 hours)

**File:** `app/routes/app.templates.tsx`
```tsx
export default function TemplatesPage() {
  // ... existing state/handlers ...

  return (
    <>
      <s-page heading="Section Templates" inlineSize="large">
        <s-button slot="primary-action" variant="primary" onClick={() => setShowEditor(true)}>
          Create Template
        </s-button>

        <s-stack gap="large" direction="block">
          {/* Success banners */}
          {actionData?.action === "create" && (
            <s-banner tone="success" dismissible>Template created successfully.</s-banner>
          )}

          <s-section padding={templates.length > 0 ? "base" : "none"}>
            {/* Filters */}
            <s-stack gap="base" direction="block">
              <FilterButtonGroup
                options={CATEGORIES}
                value={currentCategory}
                onChange={handleCategoryFilter}
              />

              {/* Grid or Empty State */}
              {templates.length > 0 ? (
                <TemplateGrid
                  templates={templates}
                  onUse={handleUseTemplate}
                  onEdit={handleEdit}
                  onToggleFavorite={handleToggleFavorite}
                  onDuplicate={handleDuplicate}
                  onDelete={handleDelete}
                />
              ) : (
                <EmptyState
                  heading="No templates yet"
                  description="Create your first template or save one from the Generate page."
                  image="https://cdn.shopify.com/static/images/polaris/patterns/callout.png"
                  primaryAction={{ label: "Create Template", onClick: () => setShowEditor(true) }}
                />
              )}
            </s-stack>
          </s-section>
        </s-stack>
      </s-page>

      {/* Modal using s-modal */}
      {showEditor && (
        <TemplateEditorModal
          template={editingTemplate}
          onSave={handleSaveTemplate}
          onClose={() => { setShowEditor(false); setEditingTemplate(null); }}
        />
      )}
    </>
  );
}
```

**File:** `app/components/templates/TemplateGrid.tsx` (Redesigned)
```tsx
export function TemplateGrid({ templates, ...handlers }: TemplateGridProps) {
  return (
    <s-grid
      gap="base"
      gridTemplateColumns="repeat(auto-fill, minmax(280px, 1fr))"
    >
      {templates.map((template) => (
        <TemplateCard key={template.id} template={template} {...handlers} />
      ))}
    </s-grid>
  );
}
```

**File:** `app/components/templates/TemplateCard.tsx` (Redesigned)
```tsx
export function TemplateCard({ template, onUse, onEdit, onToggleFavorite, onDuplicate, onDelete }: TemplateCardProps) {
  return (
    <s-card>
      <s-stack gap="base" direction="block">
        {/* Header */}
        <s-stack gap="small" direction="inline" justifyContent="space-between" alignItems="center">
          <s-stack gap="small" direction="inline" alignItems="center">
            <span style={{ fontSize: '24px' }}>{template.icon}</span>
            <s-text type="strong">{template.title}</s-text>
          </s-stack>
          <s-button
            variant="plain"
            onClick={() => onToggleFavorite(template.id)}
            accessibilityLabel={template.isFavorite ? "Remove from favorites" : "Add to favorites"}
            icon={template.isFavorite ? "star-filled" : "star"}
          />
        </s-stack>

        {/* Description */}
        <s-paragraph color="subdued">{template.description}</s-paragraph>

        {/* Category badge */}
        <s-badge tone="neutral">{template.category}</s-badge>

        {/* Prompt preview */}
        <s-box
          padding="small"
          backgroundColor="surface-secondary"
          borderRadius="base"
        >
          <s-text variant="bodySm" color="subdued" lineClamp={2}>
            {template.prompt}
          </s-text>
        </s-box>

        {/* Actions */}
        <s-stack gap="small" direction="inline">
          <s-button variant="primary" onClick={() => onUse(template)}>
            Use Template
          </s-button>
          <s-button onClick={() => onEdit(template)}>Edit</s-button>
          <s-button onClick={() => onDuplicate(template.id)}>Duplicate</s-button>
          <s-button tone="critical" onClick={() => onDelete(template.id)}>Delete</s-button>
        </s-stack>
      </s-stack>
    </s-card>
  );
}
```

**File:** `app/components/templates/TemplateEditorModal.tsx` (New - using s-modal)
```tsx
export function TemplateEditorModal({ template, onSave, onClose }: TemplateEditorProps) {
  const [title, setTitle] = useState(template?.title || "");
  const [description, setDescription] = useState(template?.description || "");
  const [category, setCategory] = useState(template?.category || "marketing");
  const [icon, setIcon] = useState(template?.icon || "📋");
  const [prompt, setPrompt] = useState(template?.prompt || "");

  const isValid = title.trim() && description.trim() && prompt.trim();

  return (
    <s-modal
      heading={template ? "Edit Template" : "Create Template"}
      size="large"
      open
      onClose={onClose}
      accessibilityLabel={template ? "Edit template modal" : "Create template modal"}
    >
      <s-stack gap="large" direction="block">
        <s-text-field
          label="Title"
          value={title}
          onInput={(e) => setTitle((e.target as HTMLInputElement).value)}
          placeholder="e.g., Hero Banner"
        />

        <s-text-field
          label="Description"
          value={description}
          onInput={(e) => setDescription((e.target as HTMLInputElement).value)}
          placeholder="Brief description of the template"
        />

        <s-select
          label="Category"
          value={category}
          onChange={(e) => setCategory((e.target as HTMLSelectElement).value)}
        >
          {CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </s-select>

        {/* Icon picker */}
        <s-stack gap="small" direction="block">
          <s-text type="strong">Icon</s-text>
          <s-stack gap="small" wrap>
            {ICONS.map((emoji) => (
              <s-button
                key={emoji}
                variant={icon === emoji ? "primary" : "secondary"}
                onClick={() => setIcon(emoji)}
              >
                {emoji}
              </s-button>
            ))}
          </s-stack>
        </s-stack>

        <s-text-area
          label="Prompt"
          value={prompt}
          onInput={(e) => setPrompt((e.target as HTMLTextAreaElement).value)}
          placeholder="Describe what this template generates..."
          rows={4}
        />
      </s-stack>

      <s-button slot="secondary-actions" onClick={onClose}>Cancel</s-button>
      <s-button
        slot="primary-action"
        variant="primary"
        onClick={() => onSave({ title, description, category, icon, prompt })}
        disabled={!isValid}
      >
        {template ? "Save Changes" : "Create Template"}
      </s-button>
    </s-modal>
  );
}
```

### Phase B3: History Page Redesign (4 hours)

**File:** `app/routes/app.history.tsx` (Redesigned)
```tsx
export default function HistoryPage() {
  // ... existing state/handlers ...

  return (
    <>
      <s-page heading="Generation History" inlineSize="large">
        <s-stack gap="large" direction="block">
          {/* Banners */}
          {actionData?.action === "delete" && (
            <s-banner tone="success" dismissible>Entry deleted successfully.</s-banner>
          )}

          <s-section padding="none" accessibilityLabel="History table">
            {/* Filters */}
            <s-box padding="base">
              <FilterButtonGroup
                options={STATUS_OPTIONS}
                value={currentStatus || (favoritesOnly ? "favorites" : "")}
                onChange={(v) => {
                  if (v === "favorites") {
                    handleFavoritesFilter(true);
                  } else {
                    handleFavoritesFilter(false);
                    handleStatusFilter(v);
                  }
                }}
              />
            </s-box>

            {/* Table or Empty State */}
            {history.items.length > 0 ? (
              <HistoryTable
                items={history.items}
                onPreview={setPreviewItem}
                onToggleFavorite={handleToggleFavorite}
                onDelete={handleDelete}
              />
            ) : (
              <s-box padding="base">
                <EmptyState
                  heading="No history entries"
                  description="Generate some sections to see them here."
                  primaryAction={{ label: "Generate Section", onClick: () => navigate("/app/generate") }}
                />
              </s-box>
            )}

            {/* Pagination */}
            {history.totalPages > 1 && (
              <s-box padding="base">
                <s-stack gap="small" direction="inline" justifyContent="center" alignItems="center">
                  <s-button-group>
                    <s-button disabled={currentPage <= 1} onClick={() => handlePageChange(currentPage - 1)}>
                      Previous
                    </s-button>
                    <s-button disabled={currentPage >= history.totalPages} onClick={() => handlePageChange(currentPage + 1)}>
                      Next
                    </s-button>
                  </s-button-group>
                  <s-text variant="bodySm" color="subdued">
                    Page {history.page} of {history.totalPages}
                  </s-text>
                </s-stack>
              </s-box>
            )}
          </s-section>
        </s-stack>
      </s-page>

      {/* Preview Modal */}
      {previewItem && (
        <HistoryPreviewModal item={previewItem} onClose={() => setPreviewItem(null)} />
      )}
    </>
  );
}
```

**File:** `app/components/history/HistoryTable.tsx` (New)
```tsx
export function HistoryTable({ items, onPreview, onToggleFavorite, onDelete }: HistoryTableProps) {
  return (
    <s-table>
      <s-table-header-row>
        <s-table-header listSlot="primary">Prompt</s-table-header>
        <s-table-header>Status</s-table-header>
        <s-table-header>Options</s-table-header>
        <s-table-header>Date</s-table-header>
        <s-table-header>Actions</s-table-header>
      </s-table-header-row>
      <s-table-body>
        {items.map((item) => (
          <s-table-row key={item.id}>
            <s-table-cell>
              <s-stack gap="small" direction="inline" alignItems="center">
                {item.isFavorite && <s-badge tone="warning" icon="star">Fav</s-badge>}
                <s-text lineClamp={2}>{item.prompt.substring(0, 80)}...</s-text>
              </s-stack>
            </s-table-cell>
            <s-table-cell>
              {item.status === "saved" ? (
                <s-badge tone="success">Saved</s-badge>
              ) : (
                <s-badge tone="neutral">Generated</s-badge>
              )}
            </s-table-cell>
            <s-table-cell>
              <s-stack gap="small" direction="inline">
                {item.tone && <s-badge>{item.tone}</s-badge>}
                {item.style && <s-badge>{item.style}</s-badge>}
              </s-stack>
            </s-table-cell>
            <s-table-cell>
              <s-text variant="bodySm" color="subdued">
                {formatDate(item.createdAt)}
              </s-text>
            </s-table-cell>
            <s-table-cell>
              <s-stack gap="small" direction="inline" alignItems="end">
                <s-button onClick={() => onPreview(item)}>Preview</s-button>
                <s-button onClick={() => onToggleFavorite(item.id)}>
                  {item.isFavorite ? "Unfavorite" : "Favorite"}
                </s-button>
                <s-button tone="critical" onClick={() => onDelete(item.id)}>Delete</s-button>
              </s-stack>
            </s-table-cell>
          </s-table-row>
        ))}
      </s-table-body>
    </s-table>
  );
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
```

**File:** `app/components/history/HistoryPreviewModal.tsx` (New - using s-modal)
```tsx
export function HistoryPreviewModal({ item, onClose }: HistoryPreviewProps) {
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(item.code);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <s-modal
      heading="Code Preview"
      size="large"
      open
      onClose={onClose}
      accessibilityLabel="Code preview modal"
    >
      <s-stack gap="base" direction="block">
        {/* Prompt info */}
        <s-box padding="small" backgroundColor="surface-secondary" borderRadius="base">
          <s-text variant="bodySm" color="subdued">
            Prompt: {item.prompt.substring(0, 150)}{item.prompt.length > 150 ? '...' : ''}
          </s-text>
        </s-box>

        {/* Code */}
        <s-box padding="base" backgroundColor="surface-secondary" borderRadius="base" maxBlockSize="400px" overflow="auto">
          <pre style={{ margin: 0, fontFamily: 'Monaco, Courier, monospace', fontSize: '13px', lineHeight: '1.6' }}>
            {item.code}
          </pre>
        </s-box>
      </s-stack>

      <s-button slot="secondary-actions" onClick={onClose}>Close</s-button>
      <s-button slot="primary-action" onClick={handleCopy}>
        {copySuccess ? '✓ Copied!' : 'Copy Code'}
      </s-button>
    </s-modal>
  );
}
```

### Phase B4: Testing & Polish (2 hours)

1. **Verify all components render correctly**
2. **Test filter functionality**
3. **Test modal open/close behavior**
4. **Test pagination**
5. **Test CRUD operations**
6. **Verify responsive behavior**
7. **Check accessibility (labels, keyboard navigation)**

### Pros & Cons

**Pros:**
- Professional Shopify-native appearance
- Follows Polaris design guidelines
- Better accessibility with proper components
- Consistent with Generate page quality
- Maintainable and scalable
- Uses native `<s-modal>` instead of custom overlays

**Cons:**
- Larger effort (10-14 hours)
- Need to test all functionality
- Potential for regressions
- More files to maintain

---

## Comparison Table

| Criteria | Approach A | Approach B |
|----------|-----------|-----------|
| **Effort** | 4-6 hours | 10-14 hours |
| **Quality** | Acceptable | High |
| **Polaris Compliance** | Partial | Full |
| **Maintainability** | Medium | High |
| **Risk** | Low | Medium |
| **User Experience** | Improved | Excellent |
| **Technical Debt** | Remains | Resolved |
| **Accessibility** | Partial | Full |

---

## Recommendation

**Recommended: Approach B (Comprehensive Redesign)**

**Rationale:**
1. The Generate page already demonstrates high-quality Polaris implementation
2. Consistency across all app pages is important for user trust
3. Technical debt from Approach A will need to be addressed eventually
4. The extra 6-8 hours of effort yields significantly better UX
5. Using `<s-table>` for History provides better data density and scanning
6. Native `<s-modal>` provides better accessibility and behavior

**Implementation Order:**
1. Phase B1: Shared components (foundation)
2. Phase B2: Templates page (higher visibility)
3. Phase B3: History page
4. Phase B4: Testing & polish

---

## Files to Modify/Create

### Modify
- `app/routes/app.templates.tsx`
- `app/routes/app.history.tsx`
- `app/components/templates/TemplateGrid.tsx`
- `app/components/templates/TemplateCard.tsx`

### Create
- `app/components/shared/FilterButtonGroup.tsx`
- `app/components/shared/EmptyState.tsx`
- `app/components/templates/TemplateEditorModal.tsx`
- `app/components/history/HistoryTable.tsx`
- `app/components/history/HistoryPreviewModal.tsx`

### Delete (after migration)
- `app/components/templates/TemplateEditor.tsx` (replaced by modal)
- `app/components/history/HistoryItem.tsx` (replaced by table)
- `app/components/history/HistoryList.tsx` (replaced by table)
- `app/components/history/HistoryPreview.tsx` (replaced by modal)

---

## Research References

- `/plans/251129-2100-templates-history-ui-fixes/research/researcher-01-polaris-patterns.md`
- `/plans/251129-2100-templates-history-ui-fixes/research/researcher-02-shopify-app-patterns.md`
- `/plans/251129-2100-templates-history-ui-fixes/scout/scout-01-generate-components.md`

---

## Unresolved Questions

1. **s-modal availability**: Need to verify `<s-modal>` is available in current Polaris web components version. If not, keep custom modal but improve styling.

2. **Empty state image**: Should we create custom illustrations or use Shopify CDN defaults?

3. **Mobile responsiveness**: Should table convert to cards on mobile? (Current assumption: table remains but scrolls horizontally)

4. **Bulk actions**: Future consideration - do we need bulk delete/favorite functionality?
