# Generations Management - Architecture Diagram

## User Flow Map

```
┌─────────────────────────────────────────────────────────────────┐
│                         App Navigation                           │
│  [Home] [Generate Section] [Generations] [Templates] [Billing]  │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    /app/generations (INDEX)                      │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Filters: [Search] [Status▼] [Sort▼] [⭐ Favorites]   │    │
│  └────────────────────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  ☐  Prompt          Status    Theme      Created       │    │
│  │  ☐  Hero section... ✅ Saved  Dawn      2 hours ago    │ ◄─ Click row
│  │  ☐  Product grid... ⚙️ Generated -       Yesterday     │
│  │  ☐  Footer block... ✅ Saved  Debut     Dec 1         │
│  └────────────────────────────────────────────────────────┘    │
│  [◀ Previous]                            [Next ▶]               │
│  [🗑️ Delete Selected (3)]                                       │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│               /app/generations/:id (EDIT/DETAIL)                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Breadcrumb: Generations > Hero section with...        │    │
│  └────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────┬──────────────────────────────────┐   │
│  │  INPUT COLUMN       │  PREVIEW COLUMN                  │   │
│  │                     │                                  │   │
│  │  Prompt:            │  Generated Code:                 │   │
│  │  ┌───────────────┐  │  ┌────────────────────────────┐ │   │
│  │  │ [Pre-filled]  │  │  │ <section>                  │ │   │
│  │  │ Hero section  │  │  │   <div class="hero">...    │ │   │
│  │  │ with CTA...   │  │  │ </section>                 │ │   │
│  │  └───────────────┘  │  └────────────────────────────┘ │   │
│  │                     │                                  │   │
│  │  Advanced Options:  │  Theme: [Dropdown▼]             │   │
│  │  Tone: Professional │  File: [ai-hero-section]        │   │
│  │  Style: Minimal     │                                  │   │
│  │                     │  [🔄 Regenerate] [💾 Save]      │   │
│  │  [Generate]         │  [⭐ Save as Template]           │   │
│  └─────────────────────┴──────────────────────────────────┘   │
│  [🗑️ Delete Generation]                                        │
└─────────────────────────────────────────────────────────────────┘
```

## Route Structure

```
app/routes/
├── app.tsx                      # Nav menu (Modified)
├── app.generate.tsx              # Generate page (Modified - add link)
├── app.history.tsx               # Old route (Redirect to generations)
├── app.generations.tsx           # NEW: Index page
└── app.generations.$id.tsx       # NEW: Edit/detail page
```

## Component Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                    app.generations.tsx (INDEX)                  │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  GenerationsFilters                                       │ │
│  │  - Search input                                           │ │
│  │  - Status dropdown                                        │ │
│  │  - Sort popover                                           │ │
│  │  - Favorites toggle                                       │ │
│  └──────────────────────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  GenerationsTable                                         │ │
│  │  ├── GenerationRow (repeated for each item)              │ │
│  │  │   - Checkbox for bulk selection                       │ │
│  │  │   - Link to edit page (clickDelegate)                 │ │
│  │  │   - Status badge                                      │ │
│  │  │   - Favorite toggle button                            │ │
│  │  │   - Delete button                                     │ │
│  │  └── Pagination controls                                 │ │
│  └──────────────────────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  GenerationsEmptyState (if no items)                     │ │
│  │  - Centered illustration                                 │ │
│  │  - "Create Generation" CTA button                        │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│                app.generations.$id.tsx (EDIT)                   │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  GenerateLayout (REUSED from generate page)              │ │
│  │  ├── GenerateInputColumn (REUSED)                        │ │
│  │  │   ├── PromptInput (REUSED)                            │ │
│  │  │   └── AdvancedOptions (REUSED)                        │ │
│  │  └── GeneratePreviewColumn (REUSED)                      │ │
│  │      ├── CodePreview (REUSED)                            │ │
│  │      ├── ThemeSelector (REUSED)                          │ │
│  │      └── SectionNameInput (REUSED)                       │ │
│  └──────────────────────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  SaveTemplateModal (REUSED from generate page)           │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

## Data Flow

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ GET /app/generations?page=1&status=saved
       ▼
┌─────────────────────┐
│  Loader (Server)    │
│  - Extract URL params
│  - Auth check       │
│  - historyService   │
│    .getByShop()     │
└──────┬──────────────┘
       │ Return { items, total, page, hasNext, hasPrev }
       ▼
┌─────────────────────┐
│  React Component    │
│  - useLoaderData()  │
│  - Render table     │
│  - Client state:    │
│    selected items   │
└──────┬──────────────┘
       │ User clicks row
       ▼
┌─────────────────────┐
│  Navigation         │
│  /app/generations/  │
│  abc123             │
└──────┬──────────────┘
       │ GET /app/generations/abc123
       ▼
┌─────────────────────┐
│  Loader (Server)    │
│  - historyService   │
│    .getById(id)     │
│  - 404 if not found │
└──────┬──────────────┘
       │ Return { generation, themes }
       ▼
┌─────────────────────┐
│  React Component    │
│  - Pre-fill form    │
│  - Same layout as   │
│    generate page    │
└─────────────────────┘
```

## Database Schema (No Changes)

```
GenerationHistory
├── id: ObjectId (primary key)
├── shop: String (indexed)
├── prompt: String
├── code: String
├── themeId: String? (optional)
├── themeName: String? (optional)
├── fileName: String? (optional)
├── tone: String? (optional)
├── style: String? (optional)
├── status: String (generated/saved) (indexed)
├── isFavorite: Boolean (default: false)
└── createdAt: DateTime (indexed)

Indexes:
- [shop]
- [createdAt]
- [status]
```

## Service Layer (No Changes)

```
historyService (existing)
├── create(input) → GenerationHistory
├── update(id, shop, input) → GenerationHistory
├── getByShop(shop, options) → { items, total, page, totalPages }
│   options: { page, limit, status, favoritesOnly }
├── getById(id, shop) → GenerationHistory | null
├── delete(id, shop) → boolean
├── toggleFavorite(id, shop) → GenerationHistory
└── getMostRecent(shop) → GenerationHistory | null
```

## Actions & Mutations

```
INDEX PAGE ACTIONS:
├── DELETE (bulk delete)
│   Input: { generationIds: string[] }
│   Process: Loop historyService.delete()
│   Response: Redirect to refresh
└── PUT (toggle favorite)
    Input: { generationId: string }
    Process: historyService.toggleFavorite()
    Response: JSON { success, isFavorite }

EDIT PAGE ACTIONS:
├── POST "generate" (regenerate)
│   Input: { prompt, tone, style }
│   Process: aiAdapter.generateSection()
│   Process: historyService.create() (NEW entry)
│   Response: JSON { code, historyId }
├── POST "save" (save to theme)
│   Input: { themeId, fileName, content }
│   Process: themeAdapter.createSection()
│   Process: historyService.update() (status=saved)
│   Response: JSON { success, message }
├── POST "saveAsTemplate"
│   Input: { title, description, category }
│   Process: templateService.create()
│   Response: JSON { success, message }
└── DELETE (delete generation)
    Input: { id }
    Process: historyService.delete()
    Response: Redirect to /app/generations
```

## Mobile Responsive Behavior

```
DESKTOP (>768px):
┌──────────────────────────────────────────────┐
│  ☐  Prompt     Status  Theme    Created      │
│  ☐  Hero...    ✅      Dawn     2h ago       │
│  ☐  Product... ⚙️      -        Yesterday    │
└──────────────────────────────────────────────┘

MOBILE (<768px):
┌──────────────────────────────────────────────┐
│  ☐  Hero section with...             2h ago  │
│      ✅ Saved · Dawn                          │
│  ──────────────────────────────────────────  │
│  ☐  Product grid layout...       Yesterday   │
│      ⚙️ Generated                             │
└──────────────────────────────────────────────┘
```

## Integration Points

```
EXISTING PAGES:
├── app.tsx
│   └── Nav menu: Add "Generations" link
├── app.generate.tsx
│   └── After save: Add "View all generations" link
└── app.history.tsx
    └── Add redirect to /app/generations

NEW PAGES:
├── app.generations.tsx
│   └── Links to: app.generate, app.generations.$id
└── app.generations.$id.tsx
    └── Links to: app.generations (breadcrumb)
```

## Performance Considerations

```
INDEX PAGE:
- Cursor pagination (not offset) → O(1) lookup
- 20 items per page default → ~2KB response
- Search debounced (300ms) → Reduce server load
- Bulk actions batched → Single request

EDIT PAGE:
- Single generation fetch → <100ms
- Code preview lazy render → Avoid blocking
- Optimistic UI updates → Instant feedback
```

## Security Model

```
AUTHORIZATION:
├── All routes require: authenticate.admin(request)
├── historyService filters by: session.shop
├── Delete action verifies: shop ownership
└── No cross-shop data leakage

INPUT VALIDATION:
├── Search query: Max 500 chars, sanitized
├── Page number: Integer, min 1
├── Limit: Integer, min 1, max 100
└── Status filter: Whitelist ["generated", "saved"]
```

## Testing Strategy

```
UNIT TESTS:
├── Components render correctly
├── Filters update URL params
├── Pagination calculates cursors correctly
└── Actions validate inputs

INTEGRATION TESTS:
├── Index → Edit → Back navigation
├── Bulk delete removes items
├── Filter persistence via URL
└── 404 handling for invalid IDs

MANUAL QA:
├── Mobile responsive layout
├── Keyboard navigation (Tab, Enter)
├── Screen reader compatibility
└── Load time with 1000+ items
```
