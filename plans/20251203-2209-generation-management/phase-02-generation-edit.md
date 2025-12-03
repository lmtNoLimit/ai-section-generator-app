# Phase 2: Generation Edit Page

**Parent Plan**: [plan.md](./plan.md)
**Phase**: 2 of 3
**Date**: 2025-12-03
**Effort**: 4-5 hours
**Priority**: P1 (High)
**Status**: Ready for Implementation
**Dependencies**: [Phase 1: Generations Index](./phase-01-generations-index.md)

## Overview

Create `/app/generations/:id` route allowing merchants to view, regenerate, and save existing generations. Reuses 100% of existing generate page components (GenerateLayout, input/preview columns) with minimal wrapper logic for data loading.

## Key Insights from Research

**From [React Router CRUD Research](./research/researcher-02-react-router-crud.md)**:
- Use `$id` param convention for detail routes
- Loader fetches resource by ID with 404 handling
- Actions handle PUT (update) and DELETE (remove) methods
- Reuse form components with pre-filled defaultValue props
- Error boundary catches 404s for graceful fallback

**From [Shopify Index UX Research](./research/researcher-01-shopify-index-ux.md)**:
- Detail pages need breadcrumb navigation back to index
- Use Page component with fullWidth={false} for detail views
- Secondary actions for destructive operations (Delete)
- Confirmation dialogs for irreversible actions

## Requirements

### Functional Requirements

1. **Data Loading**
   - Load generation by ID from GenerationHistory
   - 404 page if generation not found or wrong shop
   - Pre-populate all fields: prompt, code, tone, style, theme, fileName

2. **Form Functionality**
   - Edit prompt and regenerate (creates NEW history entry)
   - Change theme/fileName and save
   - Update existing code (manual edit in preview)
   - Save changes to different theme than original

3. **Actions**
   - **Regenerate**: Calls AI with updated prompt, creates new GenerationHistory entry
   - **Save**: Saves to theme (updates existing history entry status)
   - **Delete**: Removes generation, redirects to index
   - **Save as Template**: Same as generate page

4. **Navigation**
   - Breadcrumb: Generations > [Truncated Prompt]
   - Back button: Returns to /app/generations with preserved filters
   - Success save: Show banner, stay on page

5. **Visual Distinction**
   - Page heading shows: "Edit Generation"
   - Banner shows: Original creation date, status
   - Info callout: "Regenerating creates a new history entry"

### Non-Functional Requirements

- Load time < 1s for single generation
- Code preview renders large files (10k+ chars) without lag
- Optimistic UI for save/regenerate actions
- Mobile responsive (same as generate page)

## Architecture

### Route Structure

```
app/routes/
└── app.generations.$id.tsx    # New route file
```

### Component Reuse Map

| Component | Source | Usage in Edit Page |
|-----------|--------|-------------------|
| GenerateLayout | app/components/generate/GenerateLayout.tsx | Main layout wrapper (two-column) |
| GenerateInputColumn | app/components/generate/GenerateInputColumn.tsx | Prompt input + advanced options |
| GeneratePreviewColumn | app/components/generate/GeneratePreviewColumn.tsx | Code preview + save controls |
| SaveTemplateModal | app/components/generate/SaveTemplateModal.tsx | Save as template dialog |
| PromptInput | app/components/generate/PromptInput.tsx | Text input for prompt |
| AdvancedOptions | app/components/generate/AdvancedOptions.tsx | Tone/style selectors |
| CodePreview | app/components/generate/CodePreview.tsx | Syntax-highlighted code display |
| ThemeSelector | app/components/generate/ThemeSelector.tsx | Theme dropdown |
| SectionNameInput | app/components/generate/SectionNameInput.tsx | File name input |

**New Components**: 0 (100% reuse)

### Data Flow

1. **Loader**: Fetch generation by ID
   - Input: `params.id`, `session.shop`
   - Call: `historyService.getById(id, shop)`
   - Return: `{ generation, themes }`
   - Error: Throw 404 if not found

2. **Actions**:
   - **generate**: Same as generate page (creates new entry)
   - **save**: Same as generate page (updates current entry)
   - **delete**: Remove generation, redirect to index
   - **saveAsTemplate**: Same as generate page

3. **Client State**:
   - `prompt`: Pre-filled from generation.prompt
   - `generatedCode`: Pre-filled from generation.code
   - `selectedTheme`: Pre-filled from generation.themeId or default
   - `fileName`: Pre-filled from generation.fileName or "ai-section"
   - `currentHistoryId`: Set to params.id initially, updates on regenerate

## Related Code Files

### Files to Create

1. **`app/routes/app.generations.$id.tsx`** (~200 lines)
   - Loader fetching generation + themes
   - Actions: generate, save, delete, saveAsTemplate
   - Page component wrapping existing generate components
   - Breadcrumb navigation
   - Info banner showing original metadata

### Files to Modify

None (all reuse existing components as-is)

### Files to Reference

- `app/routes/app.generate.tsx` - Template for actions/handlers
- `app/services/history.server.ts` - getById(), delete() methods
- `app/components/generate/*` - All reusable components

## Implementation Steps

### Step 1: Create Route with Loader (20 min)
Create `app/routes/app.generations.$id.tsx`:
- Extract `params.id` from route
- Call historyService.getById(id, shop)
- Throw 404 Response if not found or wrong shop
- Fetch themes via themeAdapter.getThemes()
- Return JSON: { generation, themes }

### Step 2: Copy Generate Page Actions (30 min)
Copy action logic from `app.generate.tsx`:
- Handle "generate" action (same logic, track new historyId)
- Handle "save" action (update generation status)
- Handle "saveAsTemplate" action (reuse exact logic)
- Add "delete" action handler:
  - Call historyService.delete(id, shop)
  - Redirect to /app/generations on success

### Step 3: Create Page Component (40 min)
Build page component structure:
- Import all existing generate components
- useLoaderData to extract generation + themes
- Pre-populate state with generation data
- Use same GenerateLayout as generate page
- Pass pre-filled values to input/preview columns

### Step 4: Add Breadcrumb Navigation (15 min)
Add breadcrumb to page:
- Use `<s-breadcrumbs>` component
- Items: "Generations" (link) > Truncated prompt (current)
- Position above page heading

### Step 5: Add Generation Info Banner (20 min)
Add info banner below heading:
- Show: Original creation date (formatted)
- Show: Current status badge
- Show: Original theme name (if saved)
- Tone: "info"

### Step 6: Add Delete Confirmation (30 min)
Add delete button with confirmation:
- Secondary action slot in Page component
- Button opens confirmation modal
- Modal: "Delete this generation?"
- Confirm → Submit delete action
- Cancel → Close modal

### Step 7: Handle Regenerate Flow (30 min)
Update generate action logic:
- When regenerating, create NEW history entry
- Update currentHistoryId state to new ID
- Show banner: "New generation created"
- Keep user on edit page (don't redirect)

### Step 8: Testing & Edge Cases (60 min)
- Test: Load existing generation (all fields pre-filled)
- Test: Regenerate (creates new entry, updates UI)
- Test: Save to different theme (preserves new theme)
- Test: Delete (redirects to index)
- Test: 404 handling (invalid ID)
- Test: Save as template (modal works)
- Test: Mobile responsive layout
- Test: Navigation breadcrumb click
- Edge case: Generation with no theme (never saved)
- Edge case: Theme no longer exists (show warning)

## Todo List

- [ ] Create `app/routes/app.generations.$id.tsx` file
- [ ] Add loader with getById() call
- [ ] Add 404 error handling for not found
- [ ] Copy generate/save/saveAsTemplate actions from generate page
- [ ] Add delete action handler
- [ ] Create page component with pre-filled state
- [ ] Add breadcrumb navigation component
- [ ] Add generation info banner
- [ ] Add delete button with confirmation modal
- [ ] Handle regenerate flow (new history entry)
- [ ] Test all actions (generate, save, delete)
- [ ] Test 404 error page
- [ ] Test breadcrumb navigation
- [ ] Test mobile responsive layout
- [ ] Test edge case: theme no longer exists
- [ ] Add loading/saving states
- [ ] Add error boundaries

## Success Criteria

✅ **Functional**:
- Edit page loads with all fields pre-filled
- Regenerate creates new history entry
- Save updates generation status to "saved"
- Delete removes generation and redirects
- 404 page shows for invalid ID
- Breadcrumb navigation returns to index
- Save as template works identically to generate page

✅ **Non-Functional**:
- Page loads < 1s
- Code preview renders 10k+ char files smoothly
- Mobile layout matches generate page
- No visual bugs or layout shifts

✅ **Code Quality**:
- Reuses 100% of existing components
- Route file < 200 lines
- TypeScript strict mode passes
- No duplicate code (DRY principle)

## Risk Assessment

**Low Risk Overall** (high component reuse = less new code):

1. **State initialization**: Pre-filling state from loader data
   - Mitigation: Use useEffect to sync state when loader data changes
   - Test: Refresh page after regenerate (state should update)

2. **History ID tracking**: Regenerate changes current history ID
   - Mitigation: Clear state update logic, track in separate state var
   - Test: Regenerate multiple times, verify correct ID tracked

3. **Breadcrumb with filters**: Returning to index with preserved filters
   - Mitigation: Use browser back button (simplest), OR pass filters in state
   - Decision: Use back button for v1, defer filter preservation to v2

**No Risk**:
- Component reuse (already battle-tested in generate page)
- Delete action (simple historyService call)
- 404 handling (standard React Router pattern)

## Security Considerations

1. **Authorization**: Verify generation ownership
   - Check: Loader calls historyService.getById(id, shop)
   - historyService filters by shop automatically

2. **Input Validation**: Same as generate page
   - Prompt length limits
   - File name sanitization
   - Theme ID validation

3. **Delete Protection**: Prevent accidental deletion
   - Require confirmation modal
   - Show warning: "This action cannot be undone"

4. **XSS Prevention**: Code preview rendering
   - Use syntax highlighter component (already handles escaping)
   - Never use dangerouslySetInnerHTML

## Next Steps

After Phase 2 completion:
1. Integration testing: Index → Edit → Back flow
2. Test regenerate → index shows new entry
3. Test delete → removes from index
4. Proceed to [Phase 3: Navigation & Polish](./phase-03-navigation-polish.md)
5. End-to-end testing: Full feature flow

## Unresolved Questions

1. **Filter preservation**: Should breadcrumb return with filters intact? (Use browser back for v1, defer to v2)
2. **Auto-save draft**: Should edits auto-save? (No, explicit save only for v1)
3. **Version history**: Should we show all regenerations of same prompt? (Defer to v2, future feature)
4. **Duplicate generation**: Should we have "Duplicate" action? (Not in requirements, can add if requested)
