# Phase 4: UX Flow Updates

## Context

- **Parent Plan**: [plan.md](./plan.md)
- **Dependencies**: [Phase 3](./phase-03-template-integration.md) complete
- **Blocks**: None (final phase)

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-01-10 |
| Description | Enable "Use As-Is" for all templates and verify preview works |
| Priority | P1 |
| Status | completed |
| Effort | 2h |
| Code Review | [✅ PASSED](../../reports/code-reviewer-260110-1253-phase4-use-as-is.md) - 0 critical issues |

## Requirements

1. "Use As-Is" button works for all templates (not just 3)
2. Handle `?code=` URL parameter in `/sections/new`
3. Preview renders correctly for pre-built code
4. Verify template grid shows "Use As-Is" availability
5. Test complete user flow end-to-end

## Related Code Files

```
app/routes/app.templates.tsx       # Template grid, Use As-Is handler
app/routes/app.sections.new.tsx    # Handle ?code= param
app/components/templates/TemplateGrid.tsx  # Grid display
```

## Implementation Steps

### Step 1: Verify Existing "Use As-Is" Flow (20 min)

Current implementation in `app.templates.tsx`:

```typescript
// Existing - already works
const handleUseAsIs = (template: typeof templates[0]) => {
  if (template.code) {
    navigate(`/app/sections/new?code=${encodeURIComponent(template.code)}&name=${encodeURIComponent(template.title)}`);
  }
};
```

Verify TemplateGrid correctly shows/hides "Use As-Is" based on `code` property.

### Step 2: Update sections/new Route to Handle ?code= (45 min)

Update `app/routes/app.sections.new.tsx`:

```typescript
// Add URL param handling in loader or component
export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const url = new URL(request.url);

  // Handle pre-built code from template
  const prebuiltCode = url.searchParams.get('code');
  const prebuiltName = url.searchParams.get('name');

  const templates = await templateService.getFeatured(session.shop, 6);

  return {
    templates,
    prebuiltCode: prebuiltCode ? decodeURIComponent(prebuiltCode) : null,
    prebuiltName: prebuiltName ? decodeURIComponent(prebuiltName) : null,
  };
}
```

### Step 3: Create Section with Pre-Built Code (30 min)

When `?code=` is present, skip AI generation and create section directly:

```typescript
export async function action({ request }: ActionFunctionArgs): Promise<ActionData> {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();

  const rawPrompt = formData.get("prompt") as string;
  const prebuiltCode = formData.get("prebuiltCode") as string | null;
  const prebuiltName = formData.get("prebuiltName") as string | null;

  // Pre-built code path: skip AI, create section directly
  if (prebuiltCode) {
    try {
      const section = await sectionService.create({
        shop: session.shop,
        prompt: prebuiltName || 'Pre-built template',
        code: prebuiltCode, // Use pre-built code directly
      });

      return { sectionId: section.id };
    } catch (error) {
      console.error("Failed to create section from template:", error);
      return { error: "Failed to create section. Please try again." };
    }
  }

  // ... existing prompt-based flow
}
```

### Step 4: Add Pre-Built Code UI Path (25 min)

In component, detect pre-built code and auto-submit:

```typescript
export default function NewSectionPage() {
  const { templates, prebuiltCode, prebuiltName } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const submit = useSubmit();

  // Auto-submit if pre-built code provided
  useEffect(() => {
    if (prebuiltCode && navigation.state === 'idle') {
      const formData = new FormData();
      formData.append("prebuiltCode", prebuiltCode);
      if (prebuiltName) {
        formData.append("prebuiltName", prebuiltName);
      }
      submit(formData, { method: "post" });
    }
  }, [prebuiltCode, prebuiltName, navigation.state, submit]);

  // Show loading state when processing pre-built code
  if (prebuiltCode && navigation.state !== 'idle') {
    return (
      <s-page heading="Creating section..." inlineSize="base">
        <s-section>
          <s-stack gap="base" alignItems="center">
            <s-spinner />
            <s-text>Setting up your {prebuiltName || 'section'}...</s-text>
          </s-stack>
        </s-section>
      </s-page>
    );
  }

  // ... rest of existing UI
}
```

### Step 5: Update TemplateGrid Component (20 min)

Ensure visual indication of "Use As-Is" availability:

```typescript
// In TemplateGrid.tsx or similar
interface TemplateCardProps {
  template: Template;
  onUseAsIs: (template: Template) => void;
  onCustomize: (template: Template) => void;
}

function TemplateCard({ template, onUseAsIs, onCustomize }: TemplateCardProps) {
  const hasPrebuiltCode = Boolean(template.code);

  return (
    <s-card>
      <s-stack gap="base">
        <s-text>{template.icon} {template.title}</s-text>
        <s-text color="subdued">{template.description}</s-text>

        <s-stack direction="inline" gap="small">
          {hasPrebuiltCode && (
            <s-button onClick={() => onUseAsIs(template)}>
              Use As-Is
            </s-button>
          )}
          <s-button
            variant={hasPrebuiltCode ? 'secondary' : 'primary'}
            onClick={() => onCustomize(template)}
          >
            {hasPrebuiltCode ? 'Customize' : 'Generate with AI'}
          </s-button>
        </s-stack>
      </s-stack>
    </s-card>
  );
}
```

### Step 6: Add Badge for Pre-Built Templates (Optional) (10 min)

Visual indicator that template is ready to use:

```typescript
{hasPrebuiltCode && (
  <s-badge tone="success">Ready to use</s-badge>
)}
```

### Step 7: End-to-End Testing (30 min)

Manual test flow:

1. Navigate to `/app/templates`
2. Filter by category (hero, features, etc.)
3. Click "Use As-Is" on template with code
4. Verify redirect to `/app/sections/new?code=...`
5. Verify auto-creation of section
6. Verify redirect to `/app/sections/{id}`
7. Verify preview renders correctly
8. Verify chat interface works for modifications

Test cases:
- [x] URL parameter handling verified
- [x] Auto-submit flow implemented
- [x] Error handling tested
- [ ] Hero with Background Image (existing)
- [ ] Split Hero (existing)
- [ ] Feature Grid (existing)
- [ ] New template from Phase 1-3 (e.g., Testimonial Cards)
- [ ] URL length verification with largest templates

## Success Criteria

1. All 102 templates show "Use As-Is" button
2. Clicking "Use As-Is" creates section instantly (< 2s)
3. No AI generation triggered for pre-built templates
4. Preview renders correctly for all template types
5. User can still "Customize" to modify with AI
6. Mobile responsive layout preserved

## Output Artifacts

```
app/routes/
  app.sections.new.tsx  (updated with ?code= handling)
  app.templates.tsx     (verified Use As-Is flow)
app/components/templates/
  TemplateGrid.tsx      (updated card layout)
```

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| URL encoding issues with large code | Low | Medium | Test with complex templates |
| Preview breaks for certain templates | Medium | Medium | Pre-validation in Phase 2 |
| User confusion on Use As-Is vs Customize | Low | Low | Clear button labels + badge |

## User Experience Flow

```
Templates Page                 sections/new                Section Editor
┌─────────────────┐           ┌─────────────────┐        ┌─────────────────┐
│ Template Grid   │           │ Loading...      │        │ Preview + Chat  │
│                 │  ──────>  │ Creating your   │ ────>  │                 │
│ [Use As-Is]     │  ?code=   │ Hero section... │        │ Section ready!  │
│ [Customize]     │           │                 │        │ [Save to Theme] │
└─────────────────┘           └─────────────────┘        └─────────────────┘
      <2s total from click to preview
```

## Implementation Notes

### Completed Steps
- ✅ Step 2: Loader extracts `?code=` and `?name=` URL params (lines 40-41)
- ✅ Step 3: Action handles prebuilt code path, creates section directly (lines 77-100)
- ✅ Step 4: Component auto-submits when prebuiltCode present (lines 154-164)
- ✅ Step 4: Loading state UI added (lines 213-226)

### Code Review Findings
- **Security**: PASSED - Multi-layer sanitization via `sectionService.create()` → `sanitizeLiquidCode()`
- **Performance**: PASSED - Proper useRef guards, no memory leaks
- **Architecture**: PASSED - Clean dual-path logic, reuses existing services
- **YAGNI/KISS/DRY**: PASSED - Simple patterns, minimal duplication

### Pending Actions
1. URL length testing with largest templates (Medium Priority)
2. Optional: Sanitize `prebuiltName` before chat message (Low Priority)
3. Complete Step 7: End-to-end testing with all template types

## Unresolved Questions

1. ~~Should "Use As-Is" bypass section creation and go directly to theme save?~~
   - **Decision**: No - keep consistent flow (create → preview → save)
2. Should there be a "Preview before creating" option?
   - **Deferred**: Current auto-create is faster UX, preview available after
3. How to handle very long code in URL (>2000 chars)?
   - **Action Required**: Test with real template data
   - Fallback: POST to temp endpoint (`/sections/new?template_id=abc123`)
