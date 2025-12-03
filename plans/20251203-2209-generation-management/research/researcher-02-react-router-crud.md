# React Router 7 CRUD Patterns Research Report

**Date:** 2025-12-03
**Research Focus:** File-based routing, loaders, actions, optimistic UI, pagination for Shopify generations management

## Key Findings

### 1. File-Based Routing Conventions

Use `@react-router/fs-routes` for automatic route generation from file structure:

```
app/routes/
├── app.generations.tsx          # List: /app/generations
├── app.generations.$id.tsx       # Detail/Edit: /app/generations/:id
├── app.generations.$id.delete.tsx # Delete: /app/generations/:id/delete
└── app.generations.new.tsx       # Create: /app/generations/new
```

**Naming conventions:**
- Dots (`.`) create URL segments: `generations.trending.tsx` → `/generations/trending`
- Dollar sign (`$`) captures params: `$id.tsx` → `params.id` in loaders/actions
- Underscore prefix (`_`) creates layout nesting without URL segments
- Trailing underscore bypasses layout nesting: `generations_.mine.tsx`

### 2. Loader Patterns (Data Fetching)

**List page with pagination:**
```typescript
// app/generations.tsx
export async function loader({ request }) {
  const url = new URL(request.url);
  const page = url.searchParams.get('page') || '1';
  const limit = url.searchParams.get('limit') || '20';

  const data = await fetchGenerations({ page, limit });
  return json(data);
}

export default function GenerationsList() {
  const { items, total, page } = useLoaderData();
  // Component uses URL params for pagination state
}
```

**Detail page with resource loading:**
```typescript
// app/generations.$id.tsx
export async function loader({ params }) {
  const generation = await fetchGeneration(params.id);
  if (!generation) throw new Response('Not Found', { status: 404 });
  return json(generation);
}
```

### 3. Action Patterns (Mutations)

**Update/Delete operations:**
```typescript
// app/generations.$id.tsx
export async function action({ request, params }) {
  switch (request.method) {
    case 'PUT':
      return updateGeneration(params.id, await request.json());
    case 'DELETE':
      await deleteGeneration(params.id);
      return redirect('/app/generations');
  }
}
```

**Philosophy:** URL = state, form = API call, route = data boundary. No useState/useEffect for CRUD flow.

### 4. Optimistic UI with useFetcher

```typescript
export default function GenerationForm() {
  const fetcher = useFetcher();
  const [optimisticData, setOptimisticData] = useState(initialData);

  // Immediate UI update based on formData
  const isSubmitting = fetcher.state === 'submitting';
  const displayData = fetcher.formData
    ? { ...optimisticData, name: fetcher.formData.get('name') }
    : optimisticData;

  return (
    <fetcher.Form method="put">
      <input name="name" defaultValue={displayData.name} disabled={isSubmitting} />
      <button disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Save'}
      </button>
    </fetcher.Form>
  );
}
```

**States:** `idle` | `loading` | `submitting`

### 5. URL State Management

**Filters/Sorting via search params (no useState needed):**
```typescript
// Pagination: /app/generations?page=2&limit=50
// Filtering: /app/generations?status=active&sort=created
const url = new URL(request.url);
const params = new URLSearchParams(url.search);

export async function loader({ request }) {
  const filters = {
    status: request.url.searchParams?.get('status'),
    sort: request.url.searchParams?.get('sort') || 'created',
    page: parseInt(request.url.searchParams?.get('page') || '1'),
  };
  return json(await fetchGenerations(filters));
}
```

**Client-side:** Use `<Form method="get">` to update URL params without page reload.

### 6. Shared Fetcher State Across Components

```typescript
const { useFetchers } = require('react-router');

// In any component, access in-flight fetchers
const fetchers = useFetchers();
const isAnySaving = fetchers.some(f => f.state === 'submitting');

// Or use keyed fetchers for specific operations
const deleteFetcher = useFetcher({ key: 'delete-generation' });
```

## Recommended Patterns for Generations Feature

1. **List page:** Use loader with URL search params for filters/pagination
2. **Detail page:** Load via `$id` param with error boundary for 404
3. **Create/Edit:** Use `app.generations.new.tsx` + shared form action
4. **Delete:** Nested route or inline fetcher with optimistic state
5. **Error handling:** Add `ErrorBoundary` per route for graceful failures
6. **Type safety:** Generate types from loader/action signatures

## Architecture Summary

```
generations/
├── route.tsx (parent layout)
├── index.tsx (list with pagination/filters)
├── new.tsx (create form)
├── $id/
│   ├── route.tsx (detail layout)
│   ├── edit.tsx (edit form)
│   └── delete.tsx (confirmation)
└── _shared (utilities, not a route)
```

## Unresolved Questions

1. **SSR considerations:** How to optimize loader execution during SSR for Shopify API calls (rate limits)?
2. **Concurrent mutations:** Best practice for handling simultaneous PUT/DELETE on same resource?
3. **Revalidation strategy:** Should we use server cache (Redis) or rely on client-side revalidation?
4. **Polling/WebSocket:** React Router patterns for real-time generation status updates?

---

**Sources:**
- [React Router File Route Conventions](https://reactrouter.com/how-to/file-route-conventions)
- [React Router Routing Guide](https://reactrouter.com/start/framework/routing)
- [useFetcher Hook Reference](https://reactrouter.com/en/main/hooks/use-fetcher)
- [DEV: React Router V7 Crash Course](https://dev.to/pedrotech/react-router-v7-a-crash-course-2m86)
- [DEV: Optimistic UI with useFetcher](https://dev.to/kevinccbsg/react-router-data-mode-parte-9-optimistic-ui-con-usefetcher-dmb)
- [NetJSTech: CRUD Example with Loaders and Actions](https://www.netjstech.com/2025/06/crud-example-with-react-router-loader.html)
