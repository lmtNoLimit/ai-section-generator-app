# Scout Report: AI Section Generator Codebase Structure

**Date**: 2025-12-01  
**Focus**: App route structure, Polaris usage, index/home page, layout components, navigation patterns

---

## 1. ROUTE STRUCTURE

### Current Routes (`/app/routes/`)

**Core Routes:**
- `/app/routes/app.tsx` - Main app layout wrapper (authenticated root)
- `/app/routes/app._index.tsx` - Current homepage (template-style with product generation example)
- `/app/routes/_index/route.tsx` - Public landing page (before auth)
- `/app/routes/app.generate.tsx` - AI section generation page
- `/app/routes/app.templates.tsx` - Template library management
- `/app/routes/app.history.tsx` - Generation history viewer

**Auth Routes:**
- `/app/routes/auth.login/route.tsx` - Login page
- `/app/routes/auth.$.tsx` - Auth catch-all route

**Webhooks:**
- `/app/routes/webhooks.app.scopes_update.tsx`
- `/app/routes/webhooks.app.uninstalled.tsx`

### Route Files Detail

**`/app/routes/app.tsx`** (Layout Root)
```tsx
// Main app wrapper - all routes under /app/* inherit this
// Uses AppProvider with Polaris
// Navigation: ui-nav-menu with links to Generate, Templates, History
// Structure: AppProvider > ui-nav-menu > <Outlet />
```

**`/app/routes/app._index.tsx`** (Current Homepage)
- Uses Polaris web components (`s-page`, `s-section`, `s-button`, `s-stack`, etc.)
- Template-style demo content (product generation example)
- Location: `/app`
- **ISSUE**: Not app-focused; needs redesign for AI Section Generator

**`/app/routes/_index/route.tsx`** (Public Landing)
- Plain HTML login page before auth
- Not using Polaris
- Basic marketing copy (template)

---

## 2. POLARIS COMPONENT USAGE

### Web Components Pattern (NOT React Components)
App uses **Polaris Web Components** (`s-*` tags), NOT `@shopify/polaris` React library.
- Dependencies: `@shopify/polaris@13.9.5`, `@shopify/app-bridge-react@4.2.4`
- Renders as HTML custom elements (e.g., `<s-page>`, `<s-button>`)

### Common Polaris Web Components Used

**Layout Components:**
- `<s-page>` - Page container with heading and slots
- `<s-section>` - Content section with optional aside slot
- `<s-grid>` - Responsive grid layout (columns, gaps)
- `<s-stack>` - Flexbox-based stacking (gap, direction, alignment)
- `<s-box>` - Container with padding, border, background

**Content Components:**
- `<s-heading>` - Section headings
- `<s-paragraph>` - Text content
- `<s-text>` - Inline text with optional color
- `<s-button>` - Primary/secondary buttons
- `<s-button-group>` - Button grouping
- `<s-banner>` - Info/success/warning/critical notifications
- `<s-link>` - Links (for embedded apps, use from Polaris)
- `<s-image>` - Responsive images

**Form Components:**
- `<s-select>` - Dropdown selects
- Input fields via Form elements

**Navigation:**
- `<ui-nav-menu>` - Top-level navigation menu (custom Shopify element)

### Existing Custom Components Wrapping Polaris

**Shared Components** (`/app/components/shared/`):
- `Banner.tsx` - Wrapper for `s-banner` with presets (success, error)
- `EmptyState.tsx` - Polaris pattern using grid, image, buttons
- `FilterButtonGroup.tsx` - Button-based filter controls
- `Card.tsx` - Container component
- `Button.tsx` - Custom button wrapper

**Generate Page Components** (`/app/components/generate/`):
- `GenerateLayout.tsx` - Two-column layout (1fr 2fr grid)
- `GenerateInputColumn.tsx` - Prompt input, advanced options
- `GeneratePreviewColumn.tsx` - Code preview, save, theme selector
- `PromptInput.tsx`, `PromptExamples.tsx`
- `ThemeSelector.tsx`, `SectionNameInput.tsx`
- `SaveTemplateModal.tsx`, `AdvancedOptions.tsx`
- `CodePreview.tsx`, `LoadingState.tsx`, `EmptyState.tsx`
- `TemplateSuggestions.tsx`, `GenerateActions.tsx`

**Template Components** (`/app/components/templates/`):
- `TemplateGrid.tsx` - Card-based grid display
- `TemplateCard.tsx` - Individual template card
- `TemplateEditorModal.tsx` - Modal form for create/edit

**History Components** (`/app/components/history/`):
- `HistoryTable.tsx` - Table display of history
- `HistoryPreviewModal.tsx` - Code preview modal

---

## 3. CURRENT INDEX/HOME PAGE IMPLEMENTATION

**File**: `/app/routes/app._index.tsx`  
**Status**: Template boilerplate, needs replacement

### Current Structure
```tsx
<s-page heading="Shopify app template">
  <s-button slot="primary-action" onClick={generateProduct}>
    Generate a product
  </s-button>
  
  <s-section heading="Congrats on creating a new Shopify app 🎉">
    <!-- Congratulations content -->
  </s-section>
  
  <s-section heading="Get started with products">
    <!-- Product generation demo -->
  </s-section>
  
  <s-section slot="aside" heading="App template specs">
    <!-- Tech stack info -->
  </s-section>
  
  <s-section slot="aside" heading="Next steps">
    <!-- Next steps links -->
  </s-section>
</s-page>
```

### Current Issues
- Generic template content (product demo)
- Not reflecting actual app purpose (AI Section Generator)
- Uses `aside` slots for secondary content
- No branding or app-specific messaging

---

## 4. LAYOUT COMPONENTS & PATTERNS

### Two-Column Layout Pattern
**File**: `/app/components/generate/GenerateLayout.tsx`
```tsx
<s-grid gap="large" gridTemplateColumns="1fr 2fr">
  <s-stack gap="large" direction="block">
    {/* Input column - 1/3 width */}
  </s-stack>
  <s-stack gap="large" direction="block">
    {/* Preview column - 2/3 width */}
  </s-stack>
</s-grid>
```

### Page Layout Pattern
All pages use consistent structure:
```tsx
<s-page heading="Page Title" inlineSize="large">
  <s-button slot="primary-action" variant="primary">
    Primary Action
  </s-button>
  
  <s-stack gap="large" direction="block">
    {/* Banners */}
    {/* Content sections */}
  </s-stack>
</s-page>
```

### Section Grouping Pattern
```tsx
<s-section padding="base">
  <s-stack gap="base" direction="block">
    {/* Related content grouped */}
  </s-stack>
</s-section>
```

### Grid/Stack Usage
- `<s-grid>` for multi-column layouts
- `<s-stack>` for vertical/horizontal grouping
- `gap` prop: "base", "small", "large", "large-400"
- `direction`: "block" (vertical), "inline" (horizontal)
- `justifyContent`, `alignItems` for flex alignment

---

## 5. NAVIGATION HANDLING

### Navigation Structure

**Primary Navigation** (`/app/routes/app.tsx`):
```tsx
<ui-nav-menu>
  <a href="/" rel="home">Home</a>
  <a href="/app/generate">Generate Section</a>
  <a href="/app/templates">Templates</a>
  <a href="/app/history">History</a>
</ui-nav-menu>
```

**Constraints**:
- Embedded Shopify app - must use Polaris links, not `<a>` directly
- Use `<Link>` from React Router within Polaris context
- `redirect()` from authenticate.admin() for auth redirects

**Client-Side Navigation**:
- Uses React Router: `useNavigate()`, `<Link>` (from react-router)
- Search params: `useSearchParams()` for filtering/pagination

**Links in Content**:
- External links use `<s-link href="url" target="_blank">`
- Internal navigation uses React Router patterns

### Navigation Patterns Used

**Route Navigation**:
```tsx
// Generate templates page
const handleUseTemplate = (template) => {
  navigate(`/app/generate?prompt=${encodeURIComponent(template.prompt)}`);
};
```

**Search Parameter Filters**:
```tsx
// Templates and History pages
const [searchParams, setSearchParams] = useSearchParams();
const currentCategory = searchParams.get("category") || "";
```

**Form Submission Navigation**:
```tsx
const handleSaveTemplate = (data) => {
  submit(formData, { method: "post" });
  // Reload data after action
};
```

---

## 6. KEY ARCHITECTURAL OBSERVATIONS

### State Management
- React Router loaders/actions for server data
- React local state (useState) for UI
- useActionData() for form responses
- useNavigation() for loading states

### Service Layer
- `/app/services/template.server.ts` - Template operations
- `/app/services/history.server.ts` - History operations
- `/app/services/adapters/` - External service adapters
  - `ai-adapter.ts` - Gemini AI calls
  - `theme-adapter.ts` - Shopify theme API

### Authentication
- All routes use `await authenticate.admin(request)` in loaders
- Session-based auth via Shopify middleware

### Data Flow
1. Loader: Fetch data from services
2. Component render: Display data
3. User action: Trigger form submission
4. Action: Server-side operation
5. Return: New data or redirect

---

## 7. FILE TREE SUMMARY

```
/app/routes/
├── _index/
│   └── route.tsx          (Public landing page)
├── auth.login/
│   ├── route.tsx          (Login form)
│   └── error.server.tsx   (Auth errors)
├── app.tsx                (Layout root)
├── app._index.tsx         (HOME - needs redesign)
├── app.additional.tsx     (Template example)
├── app.generate.tsx       (AI generation)
├── app.templates.tsx      (Template library)
├── app.history.tsx        (History viewer)
├── auth.$.tsx             (Catch-all)
├── webhooks.app.scopes_update.tsx
└── webhooks.app.uninstalled.tsx

/app/components/
├── shared/
│   ├── Banner.tsx
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── EmptyState.tsx
│   └── FilterButtonGroup.tsx
├── generate/
│   ├── GenerateLayout.tsx
│   ├── GenerateInputColumn.tsx
│   ├── GeneratePreviewColumn.tsx
│   ├── PromptInput.tsx
│   ├── PromptExamples.tsx
│   ├── AdvancedOptions.tsx
│   ├── ThemeSelector.tsx
│   ├── SectionNameInput.tsx
│   ├── CodePreview.tsx
│   ├── SaveTemplateModal.tsx
│   ├── TemplateSuggestions.tsx
│   ├── GenerateActions.tsx
│   ├── LoadingState.tsx
│   └── EmptyState.tsx
├── templates/
│   ├── TemplateGrid.tsx
│   ├── TemplateCard.tsx
│   └── TemplateEditorModal.tsx
└── history/
    ├── HistoryTable.tsx
    └── HistoryPreviewModal.tsx
```

---

## SUMMARY

### Current State
- **Route structure**: Flat with layout wrapper, all working routes exist
- **Polaris usage**: Web components (`s-*` tags), not React components
- **Homepage**: Generic template, needs brand-focused redesign
- **Layouts**: Two-column pattern for generate, full-width for templates/history
- **Navigation**: `ui-nav-menu` in layout, React Router for internal links

### Key Points for Homepage Redesign
1. Replace generic product demo with AI Section Generator focus
2. Use existing Polaris patterns (sections, stacks, grids)
3. Add onboarding/feature highlights
4. Link to Generate, Templates, and History
5. Show quick stats or recent activity
6. Keep navigation consistent with layout

### Polaris Web Component Reference
- `<s-page>` with heading, inlineSize, slots
- `<s-section>` with padding, aside slot
- `<s-stack>` for layout (gap, direction, alignment)
- `<s-grid>` for multi-column (gridTemplateColumns)
- `<s-button>`, `<s-banner>`, `<s-link>`, `<s-text>`

---

## Unresolved Questions

None at this time. Codebase structure is clear and consistent.
