# Generations Management - Quick Start Guide

**For Developers**: Fast track implementation guide

---

## 🎯 What You're Building

Two new routes:
1. **Index**: `/app/generations` - List all generations
2. **Edit**: `/app/generations/:id` - Edit/regenerate one generation

**Key insight**: Edit page reuses 100% of generate page components. Only the index page needs new components.

---

## 📋 Implementation Order

### Day 1: Index Page (6-8 hours)
**Goal**: Working list view with pagination

1. **Create route** (30 min)
   ```bash
   touch app/routes/app.generations.tsx
   ```
   - Copy loader pattern from `app.generate.tsx`
   - Call `historyService.getByShop()` with page param
   - Return `{ items, total, page, totalPages }`

2. **Create empty state** (20 min)
   ```bash
   touch app/components/generations/GenerationsEmptyState.tsx
   ```
   - Copy pattern from generate page EmptyState
   - Button links to `/app/generate`

3. **Create filters** (45 min)
   ```bash
   touch app/components/generations/GenerationsFilters.tsx
   ```
   - Search TextField
   - Status ChoiceList (All/Generated/Saved)
   - Sort Popover (Newest/Oldest)
   - Use `<Form method="get">` for URL updates

4. **Create table** (60 min)
   ```bash
   touch app/components/generations/GenerationsTable.tsx
   ```
   - `<s-table paginate={true}>`
   - Columns: Checkbox, Prompt, Status, Theme, Created, Actions
   - Pagination controls with nextpage/previouspage events

5. **Create row** (50 min)
   ```bash
   touch app/components/generations/GenerationRow.tsx
   ```
   - `clickDelegate` linking to edit page
   - Status badge (generated=info, saved=success)
   - Favorite toggle with useFetcher
   - Delete button

6. **Wire together** (30 min)
   - Conditional: Empty state if no items
   - Otherwise: Filters + Table
   - Add bulk delete action

7. **Test** (90 min)
   - Pagination with 100+ items
   - Mobile responsive
   - Bulk delete

### Day 2: Edit Page (4-5 hours)
**Goal**: Working edit view with regenerate

1. **Create route** (40 min)
   ```bash
   touch app/routes/app.generations.$id.tsx
   ```
   - Loader: `historyService.getById(params.id, shop)`
   - Throw 404 if not found
   - Copy all actions from `app.generate.tsx`

2. **Create page component** (60 min)
   - Import GenerateLayout + columns from generate page
   - Pre-fill state from loader data
   - Same structure as app.generate.tsx

3. **Add delete action** (30 min)
   - Handle DELETE method in action
   - Add confirmation modal
   - Redirect to index after delete

4. **Test** (90 min)
   - Load existing generation
   - Regenerate (creates new entry)
   - Save to theme
   - Delete

### Day 3: Navigation & Polish (2-3 hours)
**Goal**: Integration complete

1. **Update nav menu** (10 min)
   ```typescript
   // app/routes/app.tsx
   <a href="/app/generations">Generations</a>
   ```

2. **Add links** (50 min)
   - Generate page: "View all generations" after save
   - Edit page: Breadcrumb to index
   - Success banners: Link to generations

3. **Test all flows** (90 min)
   - Home → Generations
   - Generate → Save → View generations
   - Generations → Edit → Back
   - Mobile navigation

---

## 🔑 Key Code Patterns

### Loader with Pagination
```typescript
export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const status = url.searchParams.get('status') || undefined;

  const data = await historyService.getByShop(session.shop, {
    page,
    limit: 20,
    status,
  });

  return json(data);
}
```

### Table with Pagination
```tsx
<s-table
  paginate={true}
  hasNextPage={data.page < data.totalPages}
  hasPreviousPage={data.page > 1}
  onNextpage={() => navigate(`?page=${data.page + 1}`)}
  onPreviouspage={() => navigate(`?page=${data.page - 1}`)}
>
  {/* table content */}
</s-table>
```

### Row with Click Navigation
```tsx
<s-table-row clickDelegate="prompt-link">
  <s-table-cell>
    <s-link id="prompt-link" href={`/app/generations/${item.id}`}>
      {item.prompt.substring(0, 60)}...
    </s-link>
  </s-table-cell>
  {/* other cells */}
</s-table-row>
```

### Pre-filled Edit Form
```typescript
export default function EditGeneration() {
  const { generation, themes } = useLoaderData<typeof loader>();
  const [prompt, setPrompt] = useState(generation.prompt);
  const [code, setCode] = useState(generation.code);

  // Rest same as generate page
}
```

---

## 📁 File Checklist

### Phase 1: Index Page
- [ ] `app/routes/app.generations.tsx`
- [ ] `app/components/generations/GenerationsTable.tsx`
- [ ] `app/components/generations/GenerationRow.tsx`
- [ ] `app/components/generations/GenerationsEmptyState.tsx`
- [ ] `app/components/generations/GenerationsFilters.tsx`

### Phase 2: Edit Page
- [ ] `app/routes/app.generations.$id.tsx`

### Phase 3: Navigation
- [ ] Modify: `app/routes/app.tsx` (nav menu)
- [ ] Modify: `app/routes/app.generate.tsx` (add link)
- [ ] Modify: `app/routes/app.history.tsx` (redirect)

---

## 🧪 Testing Checklist

### Manual Testing
- [ ] Index page loads with items
- [ ] Pagination works (next/previous)
- [ ] Search filters by prompt
- [ ] Status filter works
- [ ] Sort by date works
- [ ] Bulk delete removes items
- [ ] Row click opens edit page
- [ ] Edit page loads with pre-filled data
- [ ] Regenerate creates new entry
- [ ] Save to theme works
- [ ] Delete redirects to index
- [ ] Mobile responsive layout
- [ ] Keyboard navigation

### Load Testing
- [ ] 1000+ generations load < 2s
- [ ] Pagination handles large datasets
- [ ] Bulk delete 50+ items completes

### Browser Testing
- [ ] Chrome (desktop + mobile)
- [ ] Safari (desktop + iOS)
- [ ] Firefox
- [ ] Edge

---

## 🚨 Common Issues & Fixes

### Issue: Pagination doesn't work
**Fix**: Check URL search params extraction
```typescript
const page = parseInt(url.searchParams.get('page') || '1');
```

### Issue: Row click doesn't navigate
**Fix**: Ensure clickDelegate matches link ID
```tsx
<s-table-row clickDelegate="link-id">
  <s-link id="link-id" href="...">Text</s-link>
</s-table-row>
```

### Issue: Edit page shows 404
**Fix**: Verify shop ownership in loader
```typescript
const generation = await historyService.getById(params.id, session.shop);
if (!generation) throw new Response('Not Found', { status: 404 });
```

### Issue: Mobile table broken
**Fix**: Add listSlot attributes to headers
```tsx
<s-table-header-cell listSlot="primary">Prompt</s-table-header-cell>
<s-table-header-cell listSlot="secondary">Status</s-table-header-cell>
```

---

## 📚 Reference Files

**Copy patterns from**:
- `app/routes/app.generate.tsx` - Loader/action structure
- `app/routes/app.templates.tsx` - Table patterns (if exists)
- `app/components/generate/*` - All reusable components

**Research docs**:
- [research/researcher-01-shopify-index-ux.md](./research/researcher-01-shopify-index-ux.md)
- [research/researcher-02-react-router-crud.md](./research/researcher-02-react-router-crud.md)

**Detailed plans**:
- [phase-01-generations-index.md](./phase-01-generations-index.md)
- [phase-02-generation-edit.md](./phase-02-generation-edit.md)
- [phase-03-navigation-polish.md](./phase-03-navigation-polish.md)

---

## 🎓 Learning Resources

**Shopify Polaris Table**:
- Docs: https://shopify.dev/docs/api/app-home/polaris-web-components/structure/table
- Pattern: https://shopify.dev/docs/api/app-home/patterns/templates/index

**React Router 7**:
- File routing: https://reactrouter.com/how-to/file-route-conventions
- Loaders: https://reactrouter.com/start/framework/routing
- useFetcher: https://reactrouter.com/en/main/hooks/use-fetcher

---

## ✅ Definition of Done

- [ ] All files created/modified per checklist
- [ ] TypeScript strict mode passes
- [ ] No linting errors
- [ ] All manual tests pass
- [ ] Mobile responsive verified
- [ ] Load tested with 1000+ items
- [ ] Code reviewed
- [ ] User documentation updated
- [ ] Deployed to staging
- [ ] Stakeholder approval
- [ ] Deployed to production

---

**Ready to code!** Start with Phase 1, test thoroughly, then move to Phase 2. 🚀
