# Research Report: Shopify Design Guidelines & Polaris Patterns for AI Generation Screens

**Research Date**: November 29, 2025
**Focus**: Embedded app design patterns, Polaris web components, form design best practices

---

## Executive Summary

Shopify Polaris has transitioned to web components (Oct 2025), providing framework-agnostic design system for embedded apps. Key findings: use Page + Stack for responsive layouts, prefer multi-card forms over single containers, leverage Settings pattern for configuration flows, and follow 4px spacing grid. For AI generation screens, recommend: Section-based layout with progressive disclosure, TextField/Textarea for prompts, Spinner for generation states, Banner for feedback, and minimize large modal forms.

---

## Key Design Principles

**Official Polaris Web Components**: Modern, CDN-delivered, auto-updating design system
- Framework-agnostic HTML elements
- Consistent APIs across Admin/Checkout/Customer Account surfaces
- Automatic styling inheritance; minimal custom CSS needed
- Built on 4px spacing grid throughout Shopify admin

**Page Structure Philosophy**: Consistency builds merchant trust
- Match Shopify admin appearance and behaviors
- Apps evolved when Polaris updates automatically
- Mobile-first design approach required
- Follow accessibility best practices (WCAG)

---

## Component Recommendations for AI Generation Screens

### Layout Structure (High Priority)
- **Page**: Main container with responsive `inlineSize` (small/base/large)
- **Stack**: Organizes elements horizontally/vertically with consistent spacing
- **Section**: Groups related content with automatic heading hierarchy
- **Grid**: For responsive multi-column layouts beyond Stack capability

### Form Components (Critical for Generation)
- **TextField**: Single-line prompts and inputs; supports icon slot
- **Textarea**: Multi-line section descriptions with auto-expansion
- **Select**: Theme/collection selection dropdowns
- **Button**: Primary action (variant="primary"), secondary alternatives
- **Checkbox/Switch**: Toggle features (e.g., "Include schema")

### Feedback Components
- **Spinner** (size="large"): Loading state during generation
- **Banner** (tone="info|success|critical"): Generation results/errors
- **Modal** (size="base"): Preview code before saving (avoid large forms)

### Text & Status
- **Heading**: Section titles (nesting auto-manages sizes)
- **Text**: Descriptions with tone support (info/success/warning/critical)
- **Badge**: Status badges for generation state

---

## Form Design Best Practices

**Organization**:
- 5+ inputs = Multiple cards with headers OR sections within one card
- Use Stack component for consistent field spacing
- Group related fields logically by context
- Never place large forms inside modals with max-height/max-width

**Settings Pattern** (Ideal for Config/Generation Options):
- Two-column: Left ⅓ for labels/descriptions, right ⅔ for controls
- Applies to any configuration interface
- Maintains consistent Shopify admin appearance
- See: https://shopify.dev/docs/api/app-home/patterns/settings

**Progressive Disclosure**:
- Show/hide form sections based on input values
- Prevents form overwhelm for complex generation options
- Example: Show "Schema options" only when "Include schema" checked

**Save Behavior**:
- Use Polaris Data Save Bar (not auto-save)
- Continuous validation incompatible with standard Shopify UX
- Forms = dedicated pages, not modals

---

## Layout Options for Generation Flow

### Recommended: Single-Column Primary + Sidebar (Settings Pattern)
```
Page (heading="Generate Liquid Section")
├─ Stack (direction="block", gap="base")
│  ├─ Section (heading="Section Description")
│  │  └─ Textarea label="What do you want to create?"
│  ├─ Section (heading="Options")
│  │  ├─ Select label="Select Theme"
│  │  ├─ Checkbox label="Include schema"
│  │  ├─ Checkbox label="Preview in sidebar"
│  └─ ButtonGroup
│     ├─ Button variant="primary" Generate
│     └─ Button variant="secondary" Clear
├─ aside slot: Loading/Preview Card
│  └─ When generating: Spinner + Status
│  └─ After generation: Code preview + Save/Copy buttons
```

---

## Specific Component Props for AI Screens

**TextField/Textarea**:
- `label`: Required, clear prompt
- `placeholder`: Helpful examples
- `error`: Show validation feedback
- `disabled`: Disable during generation
- `required`: Mark mandatory fields

**Button States During Generation**:
- Set `disabled={true}` during API calls
- Set `loading={true}` for async operations
- Use `variant="primary"` for main action (generate)
- Use `variant="secondary"` for secondary actions

**Banner for Results**:
- **Info** (tone="info"): Generation started
- **Success** (tone="success"): Section saved
- **Critical** (tone="critical"): Error with clear remediation
- Use `dismissible={true}` for non-critical messages

---

## Spacing & Information Density

**4px Grid**: All spacing uses 4px multiples (8px, 12px, 16px, 24px, etc.)
- Stack component handles this automatically
- Use padding enum: "base", "large", "small", "none"
- Avoid custom CSS for spacing

**Density Trade-off**:
- Keep generation interface **low-density** (loose spacing)
- Code preview can be **high-density** (compact)
- Don't mix densities within single page

---

## Accessibility Requirements

**Polaris Web Components Auto-Include**:
- ARIA attributes appropriate to component type
- Keyboard navigation (Tab, Enter, Arrow keys)
- Color contrast compliance (WCAG AA minimum)
- Screen reader support for complex components

**App Responsibilities**:
- Logical heading hierarchy (no skipped levels)
- Meaningful form labels (not placeholder-only)
- Error messages linked to fields (`error` prop)
- Focus management in modals/overlays

---

## Loading & Error States

**Loading State Pattern**:
```
During generation:
- Show Spinner (size="large")
- Disable input fields & buttons
- Display info Banner: "Generating section..."
- Disable save/discard actions
```

**Error Pattern**:
```
On generation failure:
- Show critical Banner with error message
- Include troubleshooting link
- Enable retry button
- Show original input for correction
```

**Success Pattern**:
```
After successful generation:
- Show success Banner: "Section generated!"
- Display code preview in sidebar/modal
- Enable "Save to Theme" + "Copy Code" buttons
- Allow new generation or editing
```

---

## Component Usage References

**Latest Official Docs**:
- [Polaris Web Components](https://shopify.dev/docs/api/app-home/polaris-web-components)
- [App Design Guidelines](https://shopify.dev/docs/apps/design)
- [Layout Patterns](https://shopify.dev/docs/apps/design/layout)
- [Form Design](https://shopify.dev/docs/apps/design/user-experience/forms)

**Key Takeaway**: Polaris web components auto-load from CDN and update automatically. No npm dependency management needed. Load via `<script>` tag and use standard DOM/framework event handlers.

---

## Resolved Questions

1. **Code preview location**: Use dedicated Page route (not Modal) for code review
2. **Textarea height**: 250px for prompt input
3. **Batch generation**: Yes, but defer to version 2
4. **Long-running generations**: V1 - let users wait with progress indicator; no timeout handling needed
