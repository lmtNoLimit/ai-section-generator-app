# Shopify Admin Index/List Views UX Patterns & Best Practices
**Research Date**: 2025-12-03
**Status**: Complete
**Target**: Generations Management Feature for AI Section Generator

---

## Executive Summary

For the Generations management feature, use Shopify's **Table component** (Polaris web components) with **Index pattern**. This provides the most robust experience for managing collections with sorting, filtering, pagination, and bulk actions—matching Shopify's native Products/Orders/Customers UX.

---

## 1. Component Choice: Table vs ResourceList

### Recommendation: Use `<s-table>` (Table Component)

**Table Component** (`s-table`):
- Best for tabular data requiring sorting, column headers, structured layouts
- Supports: pagination, filtering slot, bulk actions via checkboxes, responsive list mode on mobile
- Recommended for admin interfaces managing collections
- Includes: `hasNextPage`, `hasPreviousPage`, `paginate`, `variant` (auto/list/table)
- Mobile-responsive: Automatically renders as list on small screens

**ResourceList** (Legacy):
- Deprecated in favor of newer Polaris patterns
- Simpler, list-only display without advanced table features
- Not recommended for new features

**Source**: [Shopify Polaris Index Table Pattern](https://shopify.dev/docs/api/app-home/patterns/compositions/index-table), [Table Component Docs](https://shopify.dev/docs/api/app-home/polaris-web-components/structure/table)

---

## 2. Pagination & Cursoring Strategy

### Implementation Pattern:
- Use **cursor-based pagination** (not page numbers)
- Shopify Admin uses 50 items per page default
- Table supports: `paginate`, `hasNextPage`, `hasPreviousPage`, `nextpage`/`previouspage` events

### Best Practices:
- Store cursor position (last ID from previous page)
- Avoid "jump to page" functionality—use relative cursors instead
- Hide previous/next buttons when not applicable

**Reference**: [Shopify Pagination Documentation](https://shopify.engineering/pagination-relative-cursors), [Table Pagination Properties](https://shopify.dev/docs/api/app-home/polaris-web-components/structure/table)

---

## 3. Filtering & Sorting

### Filtering:
- Use **horizontal toolbar** above table for ≤4 filters (works for your use case)
- Include search field + filter button with popover menu
- Show applied filters clearly, allow clearing individual filters
- Avoid dead ends: show result count with each filter option

### Sorting:
- Expose via dropdown/popover menu (not direct column headers initially)
- Sort order doesn't persist across navigation (reset on page reload)
- Support: sort-by + order-direction (A-Z, Z-A, newest, oldest, etc.)
- Apply via: ChoiceList in popover menu (example in pattern)

**Pattern Example**:
```jsx
<s-grid slot="filters" gap="small-200" gridTemplateColumns="1fr auto">
  <s-text-field icon="search" placeholder="Search generations..." />
  <s-button icon="sort" variant="secondary" />
  <s-popover id="sort-actions">
    <s-choice-list>
      <s-choice value="name" selected>Name</s-choice>
      <s-choice value="created">Created</s-choice>
      <s-choice value="status">Status</s-choice>
    </s-choice-list>
  </s-popover>
</s-grid>
```

**Source**: [Index Table Composition Example](https://shopify.dev/docs/api/app-home/patterns/compositions/index-table), [Storefront Filtering UX Guidelines](https://shopify.dev/docs/storefronts/themes/navigation-search/filtering/storefront-filtering/storefront-filtering-ux)

---

## 4. Bulk Actions Pattern

### Design:
- Add **checkbox in first column** for row selection (use `clickDelegate` for target)
- Show **contextual bulk action bar** when rows selected
- Common actions: Delete, Archive, Publish, Export
- Include "select all" checkbox in header row (with subheader support for batch selection)

### Implementation:
- Row `clickDelegate="checkbox-id"` delegates row clicks to checkbox
- Track selected IDs in state
- Use Button components for bulk action triggers (primary/secondary variants)
- Provide confirmation dialogs for destructive actions

**Reference**: [Index Table Example](https://shopify.dev/docs/api/app-home/patterns/compositions/index-table), [Table Component Docs](https://shopify.dev/docs/api/app-home/polaris-web-components/structure/table)

---

## 5. Empty States & Loading States

### Empty State:
- Show **centered illustration + heading + CTA** when no generations exist
- Use Grid layout with `justifyItems="center"`, centered Stack
- Include "Create Generation" button as primary action
- Pattern: Image (optional) → Heading → Description → Button group

### Loading State:
- Table property: `loading="true"` (prevents interaction during fetch)
- Use Spinner component for initial load
- Show skeleton or fade effect during pagination

**Pattern Example** (from Polaris Index Pattern):
```jsx
{/* Empty state */}
<s-section accessibilityLabel="Empty state">
  <s-grid gap="base" justifyItems="center" paddingBlock="large-400">
    <s-image src="..." alt="..." />
    <s-stack alignItems="center">
      <s-heading>Start creating generations</s-heading>
      <s-paragraph>Create and manage your AI-generated sections</s-paragraph>
    </s-stack>
    <s-button slot="primary-action">Create Generation</s-button>
  </s-grid>
</s-section>
```

**Source**: [Index Pattern Documentation](https://shopify.dev/docs/api/app-home/patterns/templates/index), [Table Loading Property](https://shopify.dev/docs/api/app-home/polaris-web-components/structure/table)

---

## 6. List → Detail Navigation

### Best Practice:
- Use **row as clickable primary action** via `clickDelegate` attribute
- Delegate row clicks to a Link element (wrapping generation name)
- Preserve session: Use React Router `<Link>` or `<a>` with `href`, NOT programmatic navigation
- Include breadcrumb on detail page for back navigation

### Implementation:
```jsx
<s-table-row clickDelegate="generation-name-link">
  <s-table-cell>
    <s-link id="generation-name-link" href="/app/generations/123">
      Gradient Hero Section
    </s-link>
  </s-table-cell>
  {/* Additional cells... */}
</s-table-row>
```

**Reference**: [Table clickDelegate Property](https://shopify.dev/docs/api/app-home/polaris-web-components/structure/table), [Embedded App Navigation Guidelines](https://shopify.dev/docs/apps/build/embedded-apps#navigation)

---

## 7. Responsive Design

### Breakpoints:
- **Desktop (large)**: Full table with all columns visible
- **Tablet/Mobile**: Automatic list variant (`variant="auto"`)
- Table `listSlot` property on headers controls mobile display:
  - `primary`: Most important (displayed prominently)
  - `secondary`: Secondary info (less prominent)
  - `labeled`: Displays as label-value pairs
  - `inline`: Inline display
  - `kicker`: Subtle prefix content

### Guidance:
- Use full-width page for index (maximizes space for data tables)
- Test with 3+ columns to ensure readability on mobile

**Source**: [Table Component Documentation](https://shopify.dev/docs/api/app-home/polaris-web-components/structure/table), [Index Pattern Layout Guidelines](https://shopify.dev/docs/api/app-home/patterns/templates/index)

---

## 8. Page Layout Structure

### Standard Index Page Template:
```jsx
<s-page heading="Generations">
  {/* Primary action: Create Generation */}
  <s-button slot="primary-action" variant="primary">
    Create Generation
  </s-button>

  {/* Secondary actions: Export, Import, etc. */}
  <s-button slot="secondary-actions" variant="secondary">
    Export
  </s-button>

  {/* Conditional: Empty state OR Table section */}
  {generations.length === 0 ? <EmptyState /> : <TableSection />}

  {/* Table with filters in slot */}
  <s-section padding="none" accessibilityLabel="Generations table">
    <s-table paginate={true} hasNextPage={...} hasPreviousPage={...}>
      <s-grid slot="filters" gap="small-200">
        {/* Search + Sort controls */}
      </s-grid>
      <s-table-header-row>
        {/* Header cells with listSlot designations */}
      </s-table-header-row>
      <s-table-body>
        {/* Row cells with clickDelegate for navigation */}
      </s-table-body>
    </s-table>
  </s-section>
</s-page>
```

**Source**: [Index Pattern Template](https://shopify.dev/docs/api/app-home/patterns/templates/index)

---

## 9. Accessibility & UX Standards

### Key Requirements:
- Use semantic HTML labels on filter controls
- Ensure checkboxes have accessible labels (even if visually hidden)
- Provide `accessibilityLabel` attributes on interactive elements
- Use ARIA roles where needed (e.g., table role)
- Keyboard navigation: Tab through filters, sort controls, rows
- Focus management: Clear focus indicators on interactive elements

**Best Practices**:
- Avoid cluttering rows with actions—reveal on hover (Shopify pattern)
- Use Badge component for status indicators (color-coded, semantic tones: success, warning, critical)
- Provide user feedback for bulk actions (toast notifications)

---

## 10. Recommended Tech Stack for Generations

### Components to Use:
- `<s-page>`: Page wrapper with heading, primary/secondary action slots
- `<s-table>`: Main data container with pagination/filter slots
- `<s-text-field>`: Search input in filters
- `<s-button>`: Sort, filter, bulk action triggers
- `<s-badge>`: Status (Active, Draft, Published, Failed)
- `<s-link>`: Row-level navigation to generation detail
- `<s-spinner>`: Loading indicator
- `<s-modal>` or `<s-popover>`: Confirmation dialogs, sort/filter menus
- `<s-grid>` + `<s-stack>`: Layout composition

### State Management:
- Track: `selectedGenerations`, `currentPage` (cursor), `filterCriteria`, `sortBy`, `sortDirection`
- Pagination: Store `hasNextPage`, `hasPreviousPage`, `afterCursor` from API response
- Filtering: Apply via URL query params (allows bookmarking filtered views)

---

## Unresolved Questions

1. **Bulk action types**: What specific bulk operations do users need? (Delete, Archive, Export, Regenerate?)
2. **Column preferences**: Should users be able to customize visible columns? (Not in initial pattern, but possible enhancement)
3. **Inline editing**: Can generations be edited from the table, or only via detail page?
4. **Real-time updates**: Do generations update in real-time if they're processing? (Polling strategy needed)
5. **Search scope**: Search all fields or just name/title?

---

## Sources

- [Shopify Polaris App Home Index Pattern](https://shopify.dev/docs/api/app-home/patterns/templates/index)
- [Shopify Polaris Index Table Composition](https://shopify.dev/docs/api/app-home/patterns/compositions/index-table)
- [Table Web Component Documentation](https://shopify.dev/docs/api/app-home/polaris-web-components/structure/table)
- [Pagination with Relative Cursors](https://shopify.engineering/pagination-relative-cursors)
- [Storefront Filtering UX Guidelines](https://shopify.dev/docs/storefronts/themes/navigation-search/filtering/storefront-filtering/storefront-filtering-ux)
- [Polaris React Resource Index Layout](https://polaris-react.shopify.com/patterns/resource-index-layout)
