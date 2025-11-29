# Polaris Web Components Best Practices Research

**Focus**: Embedded app UI patterns for templates history page
**Date**: 2025-11-29

---

## 1. Page Layout Patterns

### `<s-page>` Component
- **Primary container** for all app pages - adds global padding, background, internal layout
- **Two sizes**:
  - `inlineSize="large"` - full width for tables/data visualization (USE THIS for index pages)
  - `inlineSize="base"` - narrow for forms with sidebar (default)
- **Built-in slots**:
  - `slot="aside"` - sidebar content (responsive, auto-collapses on mobile)
  - `slot="breadcrumb-actions"` - back navigation
  - `slot="primary-action"` - main CTA button
  - `slot="secondary-actions"` - additional actions
- **Auto-spacing** between `<s-section>` and `<s-banner>` children

### Layout Best Practices
- Single-column for simple tasks, scanning top-to-bottom
- Full-width (`inlineSize="large"`) required for resource index pages with tables
- 4px spacing grid - use `<s-page>` and `<s-stack>` to maintain rhythm
- Avoid changing information density mid-page
- Majority of content should live in containers (sections/cards)

**Example Structure**:
```jsx
<s-page heading="Templates" inlineSize="large">
  <s-button slot="primary-action" variant="primary">Create template</s-button>
  {/* Content here */}
</s-page>
```

---

## 2. Section/Card Patterns

### `<s-section>` Component
- **Card-like container** with proper spacing
- **Props**:
  - `heading` - section title (auto-adjusts size based on nesting)
  - `padding` - "base" (default) or "none" (for tables)
  - `accessibilityLabel` - required for accessibility
- **Auto-spacing** between children (no need for `<s-stack>` unless complex layout)
- **Nesting** changes heading hierarchy and appearance
- Top-level sections render card appearance

**When to Use**:
- Group related content
- Create visual structure/rhythm
- Most content should be in sections

**Example**:
```jsx
<s-section heading="Recent Templates" padding="none" accessibilityLabel="Templates table">
  <s-table>{/* ... */}</s-table>
</s-section>
```

### Cards vs Sections
- NO separate `<s-card>` component - use `<s-section>` instead
- Interactive cards (CTAs/buttons) should have **max 1 primary action**
- Use `<s-box>` for custom containers only when `<s-section>` insufficient

---

## 3. Empty State Design

### Pattern Components
Uses: `<s-section>`, `<s-grid>`, `<s-box>`, `<s-image>`, `<s-heading>`, `<s-paragraph>`, `<s-button-group>`

### Design Guidelines
- **Centered layout** with vertical padding (`paddingBlock="large-400"`)
- **Image**: Max 200px × 200px, use Shopify CDN images
- **Content**: Max width 450px, center-aligned
- **No emojis** - use proper images/illustrations
- **CTA structure**: Primary + secondary actions in button group

**Example**:
```jsx
<s-section accessibilityLabel="Empty state section">
  <s-grid gap="base" justifyItems="center" paddingBlock="large-400">
    <s-box maxInlineSize="200px" maxBlockSize="200px">
      <s-image
        aspectRatio="1/0.5"
        src="https://cdn.shopify.com/static/images/polaris/patterns/callout.png"
        alt="Descriptive alt text"
      />
    </s-box>
    <s-grid justifyItems="center" maxInlineSize="450px" gap="base">
      <s-stack alignItems="center">
        <s-heading>Start creating templates</s-heading>
        <s-paragraph>Brief explanation of what to do next</s-paragraph>
      </s-stack>
      <s-button-group>
        <s-button slot="secondary-actions">Learn more</s-button>
        <s-button slot="primary-action">Create template</s-button>
      </s-button-group>
    </s-grid>
  </s-grid>
</s-section>
```

---

## 4. Filter/Segmented Controls

### NO Native Segmented Control
Polaris web components **do not have** a segmented button group component.

### Alternatives
1. **`<s-button-group>`** with `gap="none"` for visual grouping
2. **`<s-choice-list>`** for radio button groups (accessible)
3. **`<s-select>`** for dropdown filters
4. **Custom with `<s-clickable>`** - escape hatch (use sparingly)

**Button Group Example**:
```jsx
<s-button-group gap="none">
  <s-button variant={active === 'all' ? 'primary' : 'secondary'}>All</s-button>
  <s-button variant={active === 'active' ? 'primary' : 'secondary'}>Active</s-button>
  <s-button variant={active === 'draft' ? 'primary' : 'secondary'}>Draft</s-button>
</s-button-group>
```

**Choice List Example** (more accessible):
```jsx
<s-choice-list name="status" label="Filter by status" onChange={handleFilter}>
  <s-choice value="all" selected>All templates</s-choice>
  <s-choice value="active">Active</s-choice>
  <s-choice value="draft">Draft</s-choice>
</s-choice-list>
```

---

## 5. List/Resource List Patterns

### `<s-table>` Component
For resource index pages displaying collections of objects.

**Structure**:
- `<s-table-header-row>` with `<s-table-header>`
- `<s-table-body>` with `<s-table-row>` and `<s-table-cell>`
- Wrap in `<s-section padding="none">`

**Key Props**:
- `listSlot="primary"` - first column header (main identifier)
- `format="numeric"` - right-align numbers
- `paginate`, `hasNextPage`, `hasPreviousPage` - for pagination (>100 rows)
- `variant="list"` - alternative list-style rendering

**Actions in Tables**:
- Use **secondary styling** (text button, icon, dropdown)
- Avoid primary buttons in tables
- Right-align action columns with `<s-stack alignItems="end">`

**Example**:
```jsx
<s-section padding="none" accessibilityLabel="Templates table">
  <s-table>
    <s-table-header-row>
      <s-table-header listSlot="primary">Name</s-table-header>
      <s-table-header format="numeric">Uses</s-table-header>
      <s-table-header>Status</s-table-header>
      <s-table-header>Date</s-table-header>
    </s-table-header-row>
    <s-table-body>
      <s-table-row>
        <s-table-cell>
          <s-stack direction="inline" gap="small" alignItems="center">
            <s-clickable href="/template/123">
              <s-thumbnail src="..." alt="..." />
            </s-clickable>
            <s-link href="/template/123">Template Name</s-link>
          </s-stack>
        </s-table-cell>
        <s-table-cell>42</s-table-cell>
        <s-table-cell>
          <s-badge tone="success">Active</s-badge>
        </s-table-cell>
        <s-table-cell>Nov 29, 2025</s-table-cell>
      </s-table-row>
    </s-table-body>
  </s-table>
</s-section>
```

---

## 6. Badge/Tag Components

### `<s-badge>` Component
Status indicators with semantic meaning.

**Props**:
- `tone` - "info" | "success" | "warning" | "critical" | "neutral" | "caution" | "auto"
- `color` - "base" | "strong" (intensity)
- `size` - "base" | "large" | "large-100"
- `icon` - optional Polaris icon name

**Usage**:
- Product deleted: `<s-badge icon="alert-diamond" tone="critical">Deleted</s-badge>`
- Active status: `<s-badge tone="success">Active</s-badge>`
- Draft: `<s-badge tone="neutral">Draft</s-badge>`

**Chips** (`<s-chip>`, `<s-clickable-chip>`):
- Use for tags/removable items
- `<s-clickable-chip>` has `removable` prop
- `slot="graphic"` for custom icons

---

## 7. Modal/Dialog Patterns

### `<s-modal>` Component
For edit forms, previews, confirmations.

**Props**:
- `heading` - modal title
- `size` - "small" | "small-100" | "base" | "large" | "large-100"
- `padding` - "base" | "none"
- `accessibilityLabel` - required
- Methods: `showOverlay()`, `hideOverlay()`, `toggleOverlay()`

**Events**:
- `aftershow`, `afterhide` - listen for open/close

**Slots**:
- `slot="primary-action"` - main button
- `slot="secondary-actions"` - cancel/other buttons
- Default slot - modal content

**Example**:
```jsx
<s-modal heading="Edit Template" size="large" accessibilityLabel="Edit template modal">
  <s-stack gap="base">
    <s-text-field label="Template name" name="name" />
    <s-text-area label="Description" name="description" />
  </s-stack>

  <s-button slot="secondary-actions">Cancel</s-button>
  <s-button slot="primary-action" variant="primary">Save</s-button>
</s-modal>
```

**App Bridge `<ui-modal>`**:
- Alternative for iframe-based modals
- Props: `src`, `variant` (size)
- Methods: `show()`, `hide()`, `toggle()`

---

## 8. Spacing & Typography

### Spacing Scale (Middle-Out)
```
small-300 < small-200 < small-100 (= small) < base < large-100 (= large) < large-200 < large-300
```

**Usage**:
- `gap="base"` - default spacing in `<s-stack>`, `<s-grid>`
- `padding="base"` - default section padding
- `paddingBlock="large-400"` - vertical padding for empty states

### Typography Hierarchy

**`<s-heading>`**:
- Auto-sizes based on nesting depth in sections
- Use `accessibilityRole="heading"` (default) or `"none"`, `"presentation"`
- `lineClamp` prop for truncation

**`<s-paragraph>`**:
- Body text, auto-styled
- Props: `color` ("base" | "subdued"), `tone`, `lineClamp`, `fontVariantNumeric`

**`<s-text>`**:
- Inline text with variants
- `type="strong"` for bold, `type="redundant"` for de-emphasized

### Auto-Spacing
- `<s-page>` and `<s-section>` provide default vertical spacing
- Only use `<s-stack>`/`<s-grid>` for custom layouts
- Avoid manual vertical spacing - rely on opinionated components

---

## Key Takeaways

1. **Use opinionated components first**: `<s-page>`, `<s-section>` handle spacing automatically
2. **No separate card component**: Use `<s-section>` for cards
3. **Full-width pages for tables**: `<s-page inlineSize="large">` required
4. **Empty states need images**: Use Shopify CDN, not emojis
5. **No segmented controls**: Use `<s-button-group>` or `<s-choice-list>`
6. **Table actions = secondary style**: No primary buttons in tables
7. **Badge tones are semantic**: Match status meaning (success/critical/neutral)
8. **Modals for complex interactions**: Edit forms, previews
9. **Spacing scale is middle-out**: `base` is center, grow outward
10. **Typography auto-adjusts**: Headings size based on section nesting

---

## Questions/Limitations

1. **Date formatting**: No built-in date component - format manually or use library
2. **Search/filter UI**: No dedicated filter bar component - build with `<s-search-field>` + custom layout
3. **Pagination controls**: Table has props but no built-in UI - implement custom controls
4. **Bulk actions**: No checkbox selection API - handle manually
5. **Toast notifications**: Use App Bridge `<ui-toast>`, not in Polaris web components
