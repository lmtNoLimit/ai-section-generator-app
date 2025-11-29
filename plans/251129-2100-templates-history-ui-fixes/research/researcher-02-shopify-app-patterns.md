# Shopify Embedded App UI Research: Templates History Page

## Research Summary

Analyzed Shopify Admin Extensions patterns, Polaris components, and embedded app design guidelines for templates history page UI.

---

## 1. List/Grid Page Structures

### Index Pattern (Resource List)
- **Full-width layout** for tables with many columns
- **Table component** (`s-table`) for data-heavy lists
- **Section with padding="none"** for table containers
- Primary column uses `listSlot="primary"` for main identifier

**Code Pattern:**
```jsx
<s-section padding="none" accessibilityLabel="Templates table">
  <s-table>
    <s-table-header-row>
      <s-table-header listSlot="primary">Template Name</s-table-header>
      <s-table-header>Created</s-table-header>
      <s-table-header>Status</s-table-header>
    </s-table-header-row>
    <s-table-body>
      {/* rows */}
    </s-table-body>
  </s-table>
</s-section>
```

**Key Requirements:**
- Table rows link to detail pages via `s-link` or `s-clickable`
- Thumbnails use 40x40px dimensions with `objectFit="cover"`
- Status badges use `tone` prop (success/neutral/critical)

---

## 2. Empty State Patterns

### Composition Structure
**Container:** `s-section` with centered grid layout
**Image:** Max 200x200px, aspect ratio preserved
**Content:** Heading + paragraph + button group

**Code Pattern:**
```jsx
<s-section accessibilityLabel="Empty state section">
  <s-grid gap="base" justifyItems="center" paddingBlock="large-400">
    <s-box maxInlineSize="200px" maxBlockSize="200px">
      <s-image aspectRatio="1/0.5" src="..." alt="..." />
    </s-box>
    <s-grid justifyItems="center" maxInlineSize="450px" gap="base">
      <s-stack alignItems="center">
        <s-heading>Start creating templates</s-heading>
        <s-paragraph>
          Create and manage your AI section templates.
        </s-paragraph>
      </s-stack>
      <s-button-group>
        <s-button slot="secondary-actions">Learn more</s-button>
        <s-button slot="primary-action">Create template</s-button>
      </s-button-group>
    </s-grid>
  </s-grid>
</s-section>
```

**Guidelines:**
- Only show when merchant has NO items
- Clear next step (primary action)
- Optional secondary action for help/docs
- Background image should be illustrative, not literal

---

## 3. Filter Tab UI

### Not in Polaris Web Components
**Finding:** Polaris Admin Extensions lack filter tab components seen in Shopify admin.

**Recommendation:** Use standard button approach for status filters:
```jsx
<s-button-group gap="none">
  <s-button slot="secondary-actions">All</s-button>
  <s-button slot="secondary-actions">Active</s-button>
  <s-button slot="secondary-actions">Draft</s-button>
</s-button-group>
```

**Alternative:** Server-side filtering with URL params, no client tabs.

---

## 4. Action Button Placement

### Page-level Actions
**Primary:** Single primary button in `slot="primary-action"`
**Secondary:** Multiple secondary in `slot="secondary-actions"`

```jsx
<s-page heading="Templates">
  <s-button slot="primary-action" variant="primary">
    Create template
  </s-button>
  <s-button slot="secondary-actions">Export</s-button>
  <s-button slot="secondary-actions">Import</s-button>
</s-page>
```

### Row-level Actions
**Avoid:** Primary buttons in tables
**Use:** Links, secondary buttons, or icon buttons
**Pattern:** Duplicate/Archive/Delete as secondary actions

**Code:**
```jsx
<s-table-cell>
  <s-stack direction="inline" gap="small">
    <s-button icon="duplicate">Duplicate</s-button>
    <s-button icon="edit">Edit</s-button>
    <s-button icon="delete" tone="critical">Delete</s-button>
  </s-stack>
</s-table-cell>
```

---

## 5. Card-Based Layouts

### Section Component
**Purpose:** Group related content
**Usage:** Containers for static or interactive content
**Properties:**
- `heading`: Section title
- `padding`: "base" (default) or "none" (for tables)
- `accessibilityLabel`: Required if no heading

**Interactive Cards:**
- Max 1 primary action per card
- Secondary actions as links or secondary buttons
- Avoid visual clutter

**Code:**
```jsx
<s-section heading="Template Details">
  <s-grid gap="base">
    <s-text-field label="Name" />
    <s-text-area label="Description" />
  </s-grid>
</s-section>
```

---

## 6. Best Practices Synthesis

### Layout
- **Full-width** for resource index pages
- **Default-width** for detail/edit pages
- **4px spacing grid** using `gap` props
- **Responsive** via `s-grid` component

### Content Density
- **Looser spacing** for low-density (forms)
- **Tighter spacing** for high-density (tables)
- **Don't mix** density within single page

### Navigation
- **Breadcrumbs** or back button required
- **Clear action labels** (verbs + nouns)
- **Predictable** behavior

### Actions
- **1 primary** button per context
- **Secondary before destructive**
- **Icons supplement** text, don't replace

### Tables
- **Secondary styling** for row actions
- **Badge** for status (not buttons)
- **Link** primary identifier to detail page
- **40x40px** thumbnails with border

### Empty States
- **Show only** when 0 items
- **Center-aligned** content
- **Primary action** = create item
- **Max 450px** content width

---

## 7. Actionable Recommendations

### For Templates History Page

1. **Layout Structure:**
   ```
   s-page (full-width)
   └── s-section (empty state OR table)
       └── s-table (if items exist)
   ```

2. **Status Display:**
   - Use `s-badge` with `tone="success"` for Published
   - Use `s-badge` with `tone="neutral"` for Draft

3. **Row Actions:**
   - Link template name to edit page
   - Add 40x40px thumbnail if templates have preview images
   - Group actions: Edit, Duplicate, Delete (secondary buttons)

4. **Filter Implementation:**
   - Skip filter tabs (not in component library)
   - OR use segmented button group for All/Published/Draft
   - OR implement server-side filtering with URL params

5. **Empty State:**
   - Heading: "Create your first template"
   - Description: "Build reusable AI section templates for your store."
   - Primary action: "Create template"
   - Secondary action: "View documentation"

6. **Page Actions:**
   - Primary: "Create template" (variant="primary")
   - Secondary: "Export all" (if needed)

---

## 8. Component References

**Used:**
- `s-page` - Page container with title/actions
- `s-section` - Content grouping
- `s-table` - Data table
- `s-badge` - Status indicators
- `s-button` - Actions
- `s-button-group` - Action groups
- `s-link` - Navigation
- `s-clickable` - Custom clickable areas
- `s-grid` - Responsive layouts
- `s-stack` - Vertical/horizontal stacking
- `s-image` - Images with aspect ratio
- `s-heading` - Headings
- `s-paragraph` - Body text

**Not Available:**
- Filter tabs component
- IndexTable (use `s-table` instead)
- ResourceList (use `s-table` instead)

---

## 9. Unresolved Questions

1. **Pagination:** Does `s-table` support pagination attributes? (Yes: `paginate`, `hasNextPage`, `hasPreviousPage`)
2. **Bulk actions:** How to implement checkbox selection for bulk operations? (Not in standard components)
3. **Search:** Does `s-search-field` integrate with table filtering? (Manual implementation required)
4. **Mobile view:** Table behavior on small screens? (Responsive by default, but may need custom handling)

---

## Sources
- Shopify Admin Extensions: Index Pattern
- Shopify Admin Extensions: Empty State Pattern
- Shopify App Design Guidelines: Layout
- Polaris Web Components: Button, ButtonGroup, Section, Table
