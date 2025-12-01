# Shopify Interstitial Nav Composition Pattern Research

**Research Date:** 2025-12-01
**Source:** Shopify App Home Patterns Documentation
**Pattern Type:** Composition Pattern

---

## Overview

Interstitial navigation connects merchants to deeper pages—such as settings, features, or resources—within app sections. Primary purpose: avoid multiple nested navigation items while keeping navigation structure clean and focused.

---

## Use Cases

| Context | Example |
|---------|---------|
| Individual settings pages | Navigate from settings overview to product settings or notification preferences |
| Feature-specific pages | Direct merchants from campaign overview to reporting or automation setup |
| Supporting resources | Link to help documentation or integration guides from central section |
| Navigation simplification | Reduce clutter by providing access to deeper pages without multi-level menus |

---

## Component Structure

### HTML Element Hierarchy

```
s-section (heading="...")
  └── s-box (border="base", borderRadius="base")
      ├── s-clickable (href="#", accessibilityLabel="...")
      │   └── s-grid (gridTemplateColumns="1fr auto", alignItems="center", gap="base")
      │       ├── s-box
      │       │   ├── s-heading
      │       │   └── s-paragraph (color="subdued")
      │       └── s-icon (type="chevron-right")
      ├── s-box (paddingInline="small-100")
      │   └── s-divider
      ├── s-clickable (...)
      └── [repeat for additional items]
```

### Core Components Used

1. **s-section** - Top-level container with section heading
2. **s-box** - Container with border and border radius styling
3. **s-clickable** - Interactive navigation element (replaces traditional link)
   - Props: `padding`, `href`, `accessibilityLabel`
4. **s-grid** - Two-column layout (content | icon)
   - Props: `gridTemplateColumns="1fr auto"`, `alignItems="center"`, `gap="base"`
5. **s-heading** - Section title within item
6. **s-paragraph** - Descriptive text with `color="subdued"`
7. **s-icon** - Chevron-right indicator
   - Type: `chevron-right` for navigation direction indicator
8. **s-divider** - Visual separator between items

---

## Configuration Options

### s-clickable Props

| Prop | Type | Purpose | Example |
|------|------|---------|---------|
| `href` | string | Navigation destination URL | `"#"` or `/settings/shipping` |
| `padding` | enum | Internal spacing | `"small-100"` |
| `accessibilityLabel` | string | ARIA label for screen readers | `"Configure shipping methods, rates, and fulfillment options"` |

### s-box Container Props

| Prop | Type | Purpose | Example |
|------|------|---------|---------|
| `border` | enum | Border style | `"base"` |
| `borderRadius` | enum | Corner radius | `"base"` |
| `paddingInline` | enum | Horizontal padding (divider wrapper) | `"small-100"` |

### Grid Layout Props

| Prop | Type | Purpose | Example |
|------|------|---------|---------|
| `gridTemplateColumns` | string | Column distribution | `"1fr auto"` (content, then icon) |
| `alignItems` | enum | Vertical alignment | `"center"` |
| `gap` | enum | Spacing between columns | `"base"` |

### Styling Values

**Padding:** `small-100`, `small`, `base`, `large` (etc.)
**Border radius:** `small`, `base`, `large`
**Gap:** `small`, `base`, `large`

---

## Implementation Pattern

### Full Example Structure

```jsx
<s-section heading="Preferences">
  <s-box border="base" borderRadius="base">
    {/* Navigation item 1 */}
    <s-clickable
      padding="small-100"
      href="/settings/shipping"
      accessibilityLabel="Configure shipping methods, rates, and fulfillment options"
    >
      <s-grid gridTemplateColumns="1fr auto" alignItems="center" gap="base">
        <s-box>
          <s-heading>Shipping & fulfillment</s-heading>
          <s-paragraph color="subdued">
            Shipping methods, rates, zones, and fulfillment preferences.
          </s-paragraph>
        </s-box>
        <s-icon type="chevron-right" />
      </s-grid>
    </s-clickable>

    {/* Divider */}
    <s-box paddingInline="small-100">
      <s-divider />
    </s-box>

    {/* Navigation item 2 */}
    <s-clickable
      padding="small-100"
      href="/settings/products"
      accessibilityLabel="Configure product defaults, customer experience, and catalog settings"
    >
      <s-grid gridTemplateColumns="1fr auto" alignItems="center" gap="base">
        <s-box>
          <s-heading>Products & catalog</s-heading>
          <s-paragraph color="subdued">
            Product defaults, customer experience, and catalog display options.
          </s-paragraph>
        </s-box>
        <s-icon type="chevron-right" />
      </s-grid>
    </s-clickable>
  </s-box>
</s-section>
```

---

## Design Patterns

### Visual Hierarchy

- **s-heading**: Primary action name (bold, larger)
- **s-paragraph**: Secondary descriptive text (subdued color)
- **s-icon**: Visual affordance (chevron-right) indicating navigation

### Spacing Logic

1. Each `s-clickable` has `padding="small-100"` for internal item spacing
2. Dividers wrapped in `s-box` with `paddingInline="small-100"` to align with clickable items
3. Gap between heading/description and icon: `gap="base"`

### Responsive Considerations

Grid layout with `1fr auto` ensures:
- Content expands to fill available space
- Icon remains fixed-size on right edge
- Works on mobile (stacks appropriately with fixed sizing)

---

## Integration Guidelines

### When to Use Interstitial Nav

✓ Connecting to dedicated settings pages
✓ Grouping related configuration options
✓ Simplifying shallow navigation hierarchies
✓ Providing clear visual affordances for navigation

### When NOT to Use

✗ For primary app-level navigation (use s-app-nav instead)
✗ For simple link lists (consider resource-list pattern)
✗ For nested hierarchies (limit to single level)

---

## Accessibility Features

- **accessibilityLabel** on s-clickable: Describes destination for screen readers
- **Semantic structure**: Heading + paragraph + icon provides clear context
- **Visual affordance**: Chevron icon reinforces clickability
- **Color contrast**: "subdued" text maintains minimum contrast ratios

---

## Key Takeaways

1. **Composite pattern**: Combines multiple Polaris components (clickable, grid, divider)
2. **Two-column layout**: Content on left, chevron icon on right
3. **Grouped navigation**: Container-based structure allows multiple items with dividers
4. **Accessibility first**: Includes proper labels and semantic structure
5. **Reusable**: Pattern can be repeated for multiple navigation sections
