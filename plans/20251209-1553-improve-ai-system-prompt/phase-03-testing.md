# Phase 3: Testing & Validation

**Effort**: Low
**Depends On**: Phase 1, Phase 2

## Objective

Verify improved prompt produces valid Shopify sections without schema errors.

## Test Cases

### 3.1 Basic Section Tests

| Test | Prompt | Expected Validation |
|------|--------|---------------------|
| Hero | "Hero section with image and CTA button" | url has default, image_picker no default |
| Features | "Features grid with 3 columns" | range has min/max/step, number default is int |
| Testimonials | "Testimonials carousel with richtext" | richtext default wrapped in `<p>` |
| Newsletter | "Newsletter signup with color options" | color default is hex format |
| Product Grid | "Product grid with collection picker" | collection has no default |

### 3.2 Edge Case Tests

| Test | Prompt | Expected Validation |
|------|--------|---------------------|
| Video | "Video section with YouTube embed" | video_url has accept array |
| Multi-block | "FAQ accordion with blocks" | blocks have unique types |
| Select options | "Layout selector dropdown" | select has options array |
| Range slider | "Spacing control with slider" | range has min, max, step |

### 3.3 Validation Checklist

For each generated section, verify:

**Schema Structure**:
- [ ] Single `{% schema %}` tag at root level
- [ ] Valid JSON (no trailing commas, proper quotes)
- [ ] `name` property present, under 25 chars
- [ ] `presets` array present with matching name

**Settings Validation**:
- [ ] All settings have type, id, label
- [ ] number defaults are numbers (not strings)
- [ ] range has min, max, step properties
- [ ] select/radio have options array
- [ ] richtext defaults wrapped in `<p>` or `<ul>`
- [ ] url settings have default value
- [ ] No translation keys (t:...) in labels

**Block Validation** (if present):
- [ ] Each block has unique type
- [ ] Each block has name property
- [ ] Block settings follow same rules as section settings

**CSS Validation**:
- [ ] Wrapped in `{% style %}` tags
- [ ] Uses `#shopify-section-{{ section.id }}` scoping
- [ ] Custom classes prefixed with "ai-"

**Markup Validation**:
- [ ] Semantic HTML elements used
- [ ] Responsive (no fixed widths)
- [ ] No global CSS resets

## Test Execution Plan

### Manual Testing

1. Generate 5+ sections with different prompts
2. Copy generated code to Shopify theme
3. Open theme editor and verify no errors
4. Check section appears in "Add section" picker
5. Verify all settings render correctly

### Automated Validation (Future)

Consider adding schema validation in `ai.server.ts`:
```typescript
function validateSchema(liquidCode: string): ValidationResult {
  // Extract schema JSON
  // Validate required properties
  // Validate input type rules
  // Return errors/warnings
}
```

## Success Criteria

- [ ] All 5 basic test cases pass validation
- [ ] All 4 edge case tests pass validation
- [ ] No schema errors in Shopify theme editor
- [ ] Section preview works correctly
- [ ] Settings are editable without errors

## Documentation

After successful testing, update:
- `README.md` - Note improved AI generation quality
- `docs/codebase-summary.md` - Document SYSTEM_PROMPT changes

## Rollback Criteria

Revert to previous prompt if:
- More than 30% of generated sections have errors
- Critical validation rules are ignored by AI
- Token usage increases significantly (>2x)
