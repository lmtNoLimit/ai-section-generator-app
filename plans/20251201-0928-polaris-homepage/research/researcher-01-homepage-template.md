# Shopify App Homepage Template - Research Findings

**Date**: 2025-12-01
**Research Focus**: Shopify Polaris App Home Homepage Patterns & Web Components Integration

---

## 1. Homepage Template Structure

### Primary Purpose
The homepage is the first page merchants see after app installation. It must provide:
- Daily value through status updates and actionable information
- Quick statistics and relevant, timely data
- Clear navigation to app features
- Onboarding guidance (when applicable)

### Common Use Cases
| Use Case | Examples |
|----------|----------|
| **Teaching** | Onboarding, how-to guides |
| **Display** | Call-to-actions, feature tables |
| **Updates** | Status banners, company news |

---

## 2. Required Components & Layout

### Core Components Used (from Shopify docs)
`Badge`, `Banner`, `Box`, `Button`, `Checkbox`, `Clickable`, `Divider`, `Grid`, `Heading`, `Image`, `Link`, `Paragraph`, `Section`, `Stack`, `Text`

### Foundational Layout Components
1. **`s-page`** - Main container with global padding and background
   - Provides opinionated spacing for `s-section` and `s-banner`
   - Supports two sizes: `large` (full-width for tables/charts) and `base` (narrow for forms with sidebar)
   - Sidebar support via `aside` slot

2. **`s-section`** - Structured content areas
   - Provides default vertical whitespace between children
   - Top-level sections render as cards
   - Nesting automatically adjusts heading levels

3. **`s-stack`** / **`s-grid`** - Layout builders
   - Use when custom layouts needed beyond `s-page`/`s-section`
   - Gap property controls spacing (default: none; use `gap="base"` for standard spacing)

### Data Presentation Compositions (Reusable Patterns)
- **Metrics Card** - Highlight important numbers and statistics
- **Media Card** - Present visual information
- **Setup Guide** - Interactive checklist for onboarding
- **Callout Card** - Encourage actions for new features
- **Empty State** - Display when no data available
- **Resource List** - Show collections (products, customers, etc.)

---

## 3. Best Practices for App Homepages

### Onboarding Guidelines
- Keep onboarding brief and direct with clear instructions
- Request only essential information
- Make non-critical onboarding dismissible to avoid workflow interruption
- **Maximum 5 steps** - avoids user drop-off
- Provide self-guided experience

### Visual Design Standards
- **Responsive design** - Adapt to all screen sizes and devices
- **Spacing strategy**:
  - Low-density layouts: use looser spacing
  - High-density layouts: use tighter spacing
- **Imagery**: Use high-resolution photos for professional quality
- Follow Polaris design system for consistency

### Whitespace Alignment
- Use `s-page` and `s-section` for opinionated spacing (preferred)
- Avoid manual vertical spacing with custom layouts
- All spacing uses Polaris scale tokens: `small-300` through `large-300`

---

## 4. Polaris Web Components Integration

### Script Loading
```html
<head>
  <meta name="shopify-api-key" content="%SHOPIFY_API_KEY%" />
  <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js"></script>
  <script src="https://cdn.shopify.com/shopifycloud/polaris.js"></script>
</head>
```

### Framework-Specific Usage

#### React (Recommended for App Home)
- Use JSX with web components seamlessly
- Apply props as documented (framework auto-converts to properties/attributes)
- Handle events with camelCase (`onClick`, `onChange`, etc.)
- Use controlled/uncontrolled patterns as needed

#### Basic Example
```jsx
<s-page>
  <s-banner tone="critical" heading="Media upload failed">
    File extension doesn't match the format
  </s-banner>
  <s-section>
    <s-text-field label="Title" required />
    <s-text-area label="Description" />
  </s-section>
  <s-section heading="Status" slot="aside">
    <s-select>
      <s-option value="active">Active</s-option>
      <s-option value="draft">Draft</s-option>
    </s-select>
  </s-section>
</s-page>
```

### Component Properties & Event Handling

**Form Components Support**:
- `onInput` - Fires on every keystroke (real-time validation)
- `onChange` - Fires on blur or Enter (final value commit)
- All form values return strings (convert if needed for numbers)
- Multi-select returns `values` array

**Interactive Elements**:
- `s-button` / `s-link` / `s-clickable` for interactivity
- `target="auto"` - Auto-selects `_self` (internal) or `_blank` (external)
- Cannot nest interactive elements (HTML spec compliance)

### Styling & Theming
- Components come with built-in styling following Shopify Admin design
- Automatic style application based on properties and context
- Avoid custom CSS unless absolutely necessary
- Built-in responsive support via `@container` queries

---

## 5. Responsive Design Patterns

### Query Container for Responsive Values
Use `s-query-container` with responsive syntax:

**Basic Example**:
```html
<s-query-container>
  <s-box padding="@container (inline-size < 500px) small, large">
    Content adapts: small padding on mobile, large on desktop
  </s-box>
</s-query-container>
```

**Advanced Examples**:
- Compound conditions: `(300px < inline-size < 500px)`
- Or logic: `(inline-size < 500px) or (inline-size > 1000px)`
- Nested conditions: Multiple breakpoints

---

## 6. Required File Structure & Deployment

### App Home Entry Point
The homepage URL specified in Partner Dashboard should:
- Point to your app's main entry point
- Load Polaris web components via CDN script
- Implement responsive layout using `s-page`
- Include proper accessibility labels

### Accessibility Standards
- Always provide labels for form elements
- Use appropriate heading hierarchies
- Ensure sufficient color contrast
- Support keyboard navigation (built-in)
- Use `labelAccessibilityVisibility` to hide visual labels while keeping them accessible

---

## Key Takeaways

1. **Use opinionated components first**: Prefer `s-page`/`s-section` over custom `s-stack`/`s-grid` layouts
2. **Leverage composition patterns**: Use Metrics Cards, Setup Guides, etc. for consistent UX
3. **Keep onboarding lean**: Max 5 steps, dismissible when not critical
4. **Responsive by default**: All Polaris components respond to container sizes
5. **Framework-agnostic**: Works with React, Preact, vanilla JS
6. **No custom CSS needed**: Let Polaris handle styling for consistency
7. **Accessibility built-in**: Components follow WCAG standards automatically

---

## Unresolved Questions
None - comprehensive documentation provided by Shopify covering structure, components, patterns, and best practices.
