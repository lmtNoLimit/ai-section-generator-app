# Phase 1: Generations Index Page

**Parent Plan**: [plan.md](./plan.md)
**Phase**: 1 of 3
**Date**: 2025-12-03
**Effort**: 6-8 hours
**Priority**: P1 (High)
**Status**: Ready for Implementation
**Dependencies**: None

## Overview

Create `/app/generations` route displaying all section generations in Shopify-style index table. Supports pagination, filtering by status, search, sorting, and bulk delete. Provides primary navigation to edit view.

## Key Insights from Research

**From [Shopify Index UX Research](./research/researcher-01-shopify-index-ux.md)**:
- Use `<s-table>` with `variant="auto"` for responsive mobile support
- Cursor-based pagination (not page numbers) matching Shopify patterns
- Filters in table slot with horizontal toolbar (≤4 filters works for this use case)
- Bulk actions via checkbox in first column with `clickDelegate`
- Empty state uses centered Grid layout with CTA
- Row clicks delegate to Link element for navigation

**From [React Router CRUD Research](./research/researcher-02-react-router-crud.md)**:
- URL = state: Use search params for filters/sort/page
- Loader fetches data based on URL params
- No useState for pagination/filters (all URL-driven)
- useFetcher for bulk actions without full page reload

## Requirements

### Functional Requirements

1. **Index Table Display**
   - Show: Prompt (truncated), Status badge, Theme name, Created date, Actions
   - 20 items per page default
   - Sort by: Date (newest/oldest)
   - Filter by: Status (all/generated/saved), Favorites
   - Search: Text search on prompt field
   - Bulk select with "select all" checkbox

2. **Pagination**
   - Cursor-based navigation (Previous/Next)
   - Display current range (e.g., "1-20 of 150")
   - Hide Previous/Next when not applicable

3. **Actions**
   - Row click → Navigate to `/app/generations/:id` (edit view)
   - Bulk delete with confirmation modal
   - Individual delete from row actions (hover menu)
   - Toggle favorite (star icon)

4. **Empty State**
   - Show when no generations exist
   - CTA: "Create Generation" → Navigate to `/app/generate`
   - Clear messaging for first-time users

5. **Loading States**
   - Skeleton on initial load
   - Table `loading="true"` during pagination/filter changes
   - Optimistic UI for favorite toggle

### Non-Functional Requirements

- Mobile responsive (table → list variant on small screens)
- Accessible (keyboard navigation, screen reader support)
- Page load < 2s for 1000+ generations (cursor pagination)
- URL bookmarkable (filters persist via search params)

## Architecture

### Route Structure

```
app/routes/
└── app.generations.tsx       # New route file
```

### Component Structure

```
app/components/generations/
├── GenerationsTable.tsx       # Main table wrapper
├── GenerationRow.tsx          # Individual row with actions
├── GenerationsEmptyState.tsx  # Empty state view
└── GenerationsFilters.tsx     # Search + filter + sort toolbar
```

### Data Flow

1. **Loader**: Fetch generations via historyService.getByShop()
   - Extract search params: page, limit, status, sort, search, favoritesOnly
   - Return: { items, total, page, totalPages, hasNext, hasPrev }

2. **Action**: Handle bulk delete
   - Method: DELETE
   - Body: { generationIds: string[] }
   - Response: Redirect to refresh page

3. **Client State**: None (all state in URL)

4. **Optimistic UI**: useFetcher for favorite toggle

## Related Code Files

### Files to Create

1. **`app/routes/app.generations.tsx`** (~150 lines)
   - Loader with pagination logic
   - Action for bulk delete
   - Page component with table + filters + empty state

2. **`app/components/generations/GenerationsTable.tsx`** (~120 lines)
   - `<s-table>` wrapper with pagination controls
   - Column headers with listSlot designations
   - Bulk selection state management

3. **`app/components/generations/GenerationRow.tsx`** (~80 lines)
   - Table row with clickDelegate for navigation
   - Status badge component
   - Favorite toggle button
   - Delete action (hover menu)

4. **`app/components/generations/GenerationsEmptyState.tsx`** (~40 lines)
   - Centered Grid layout
   - Heading + description
   - Primary CTA button to /app/generate

5. **`app/components/generations/GenerationsFilters.tsx`** (~100 lines)
   - Search text field (icon="search")
   - Status filter (ChoiceList in Popover)
   - Sort dropdown (Date: newest/oldest)
   - Favorites toggle checkbox

### Files to Reference (No Changes)

- `app/services/history.server.ts` - Use existing getByShop() method
- `app/services/history.server.ts` - Use existing delete() method
- `app/routes/app.generate.tsx` - Reference for navigation link

## Implementation Steps

### Step 1: Create Route with Loader (30 min)
Create `app/routes/app.generations.tsx`:
- Add loader extracting URL search params
- Call historyService.getByShop() with pagination options
- Calculate hasNext/hasPrev for pagination UI
- Return JSON with items + metadata

### Step 2: Create Empty State Component (20 min)
Create `app/components/generations/GenerationsEmptyState.tsx`:
- Use `<s-section>` with centered Grid layout
- Heading: "Start generating sections"
- Description: "Create AI-powered Liquid sections..."
- Primary button linking to /app/generate

### Step 3: Create Filters Component (45 min)
Create `app/components/generations/GenerationsFilters.tsx`:
- Search TextField with debounced submission
- Status ChoiceList (All, Generated, Saved)
- Sort Popover (Date: Newest, Date: Oldest)
- Favorites checkbox filter
- Use `<Form method="get">` for URL state updates

### Step 4: Create Table Component (60 min)
Create `app/components/generations/GenerationsTable.tsx`:
- `<s-table paginate={true}>` with conditional hasNext/hasPrev
- Header row: Checkbox, Prompt, Status, Theme, Created, Actions
- listSlot designations: primary (Prompt), secondary (Status), labeled (Theme, Created)
- Pagination event handlers (nextpage/previouspage)
- Bulk selection state (track selected IDs)

### Step 5: Create Row Component (50 min)
Create `app/components/generations/GenerationRow.tsx`:
- clickDelegate linking to /app/generations/:id
- Truncate prompt text (max 60 chars)
- Status badge with tone mapping (generated=info, saved=success)
- Format createdAt with relative time (Today, Yesterday, Dec 1)
- Favorite toggle with useFetcher
- Delete button with confirmation

### Step 6: Wire Components in Route (30 min)
Update `app/routes/app.generations.tsx`:
- Conditional render: Empty state if items.length === 0
- Otherwise: Filters + Table
- Add bulk delete action handler
- Add error boundary for failed loads

### Step 7: Add Delete Action (30 min)
Update route action to handle DELETE method:
- Parse generationIds from request body
- Loop and call historyService.delete() for each ID
- Return success/error response
- Show toast notification on client

### Step 8: Testing & Polish (90 min)
- Test pagination with large datasets (100+ items)
- Test mobile responsive behavior (table → list)
- Test keyboard navigation
- Test bulk select (select all, select none)
- Test filters (URL state persistence)
- Test empty state → generate flow
- Edge case: Delete last item on page (should go to prev page)

## Todo List

- [ ] Create `app/routes/app.generations.tsx` with loader
- [ ] Add loader logic extracting URL search params
- [ ] Implement pagination cursor calculation
- [ ] Create `GenerationsEmptyState.tsx` component
- [ ] Create `GenerationsFilters.tsx` with search/filter/sort
- [ ] Create `GenerationsTable.tsx` with pagination
- [ ] Create `GenerationRow.tsx` with actions
- [ ] Add bulk delete action handler to route
- [ ] Wire components together in route page
- [ ] Add confirmation modal for bulk delete
- [ ] Test pagination with 100+ items
- [ ] Test mobile responsive layout
- [ ] Test keyboard navigation
- [ ] Test bulk selection functionality
- [ ] Test filter persistence via URL
- [ ] Test empty state navigation
- [ ] Add loading states and skeletons
- [ ] Add error boundaries

## Success Criteria

✅ **Functional**:
- Generations display in paginated table (20 per page)
- Search filters by prompt text
- Status filter shows only selected statuses
- Sort by date works (newest/oldest)
- Pagination Previous/Next navigate correctly
- Bulk delete removes selected items
- Row click navigates to edit view
- Empty state shows for new users
- Favorite toggle updates instantly (optimistic UI)

✅ **Non-Functional**:
- Page loads < 2s with 1000+ generations
- Mobile view renders as list (not broken table)
- Keyboard Tab/Enter navigation works
- Screen reader announces table structure
- URL params persist filters (bookmarkable)

✅ **Code Quality**:
- TypeScript strict mode passes
- No linting errors
- Components < 200 lines each
- Reusable table component for future use

## Risk Assessment

**Medium Risk Items**:
1. **Cursor pagination calculation**: May need iteration to get edge cases right
   - Mitigation: Use lastId strategy, test with small datasets first

2. **Mobile responsive table**: Complex layout with many columns
   - Mitigation: Use listSlot property correctly, test on real devices

3. **Bulk delete performance**: Deleting 50+ items may be slow
   - Mitigation: Use Promise.all() for parallel deletes, show progress indicator

**Low Risk Items**:
- Empty state (simple component)
- Filters (standard Form component patterns)
- Row click navigation (clickDelegate handles this)

## Security Considerations

1. **Authorization**: Loader must verify shop ownership
   - Check: `authenticate.admin(request)` required in loader
   - Verify: historyService.getByShop() filters by session.shop

2. **Input Validation**: Search query sanitization
   - Escape special characters in search param
   - Limit search query length (max 500 chars)

3. **Bulk Delete**: Prevent deleting other shops' generations
   - Verify: historyService.delete() checks shop ownership
   - Rate limit: Max 50 deletes per request

4. **XSS Prevention**: Prompt text rendering
   - Escape HTML in prompt display
   - Use textContent, not innerHTML

## Next Steps

After Phase 1 completion:
1. Manual QA testing with real shop data
2. Stakeholder demo of index page
3. Proceed to [Phase 2: Generation Edit Page](./phase-02-generation-edit.md)
4. Integration testing: Index → Edit → Back navigation

## Unresolved Questions

1. **Real-time updates**: Should table auto-refresh if generation status changes? (Polling strategy?)
2. **Column customization**: Should users customize visible columns? (Not in v1, defer to v2)
3. **Export functionality**: Should users export generations as CSV? (Not in requirements, add later if needed)
4. **Filter presets**: Should we have saved filter views? (Defer to v2)
