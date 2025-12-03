# Research Report: Polaris Web Component Modals for Confirmation Dialogs

**Date:** 2025-12-03
**Focus:** Polaris web components for modal/dialog confirmations (NOT React Polaris)
**Context:** App uses web components like `<s-button>`, `<s-card>`, `<s-banner>`

---

## 1. Polaris Web Components for Modals (2025 Update)

### Two Modal Systems Available:

1. **`<s-modal>`** - Polaris App Home web component (in-app modals)
2. **`<ui-modal>`** - App Bridge web component (admin-level modals)

### Key 2025 Changes:
- Shopify unified Polaris across all surfaces
- New `s-` prefix components replace old patterns
- Modal component overhauled: removed additional iframe, simpler & faster
- Components loaded via CDN script: `https://cdn.shopify.com/shopifycloud/polaris.js`
- Framework-agnostic, works with any stack

**Sources:**
- [Polaris Goes Stable (2025)](https://www.shopify.com/partners/blog/polaris-goes-stable-the-future-of-shopify-app-development-is-here)
- [Polaris Unified](https://www.shopify.com/partners/blog/polaris-unified-and-for-the-web)

---

## 2. `<s-modal>` - Polaris App Home Component

**Tag:** `<s-modal>`
**Best for:** In-app confirmation dialogs, simple overlays

### Properties:
```typescript
- heading: string           // Modal title
- id: string               // Unique identifier
- padding: "base" | "none" // Content padding (default: "base")
- size: "small" | "small-100" | "base" | "large" | "large-100"
```

### Slots:
- `primary-action` - Primary button (tone defines modal tone)
- `secondary-actions` - Secondary/cancel buttons
- Default slot - Modal content

### Events:
- `show` - Fired when modal shown
- `hide` - Fired when modal hidden
- `aftershow` - After show animation complete
- `afterhide` - After hide animation complete

### Control Methods:
```javascript
<s-button command="--show" commandFor="modal-id">Open</s-button>
<s-button command="--hide" commandFor="modal-id">Close</s-button>
```

### Basic Example:
```html
<s-button commandFor="modal" command="--show">Open modal</s-button>

<s-modal id="modal" heading="Changes could not be saved">
  Please check your internet connection and try again.
  <s-button slot="primary-action">OK</s-button>
</s-modal>
```

**Source:** [App Home Modal Docs](https://shopify.dev/docs/api/app-home/polaris-web-components/overlays/modal)

---

## 3. Destructive Action Pattern with `<s-modal>`

### Key: Primary Button Tone Determines Modal Tone

For destructive actions (delete, cancel subscription), use `tone="critical"` on primary button:

```html
<s-button tone="critical" commandFor="delete-modal" command="--show">
  Cancel Subscription
</s-button>

<s-modal id="delete-modal" heading="Cancel subscription?">
  <s-stack gap="base">
    <s-text>Are you sure you want to cancel your subscription?</s-text>
    <s-text tone="caution">This action cannot be undone.</s-text>
  </s-stack>

  <s-button
    slot="primary-action"
    variant="primary"
    tone="critical"
    commandFor="delete-modal"
    command="--hide"
  >
    Cancel subscription
  </s-button>
  <s-button
    slot="secondary-actions"
    variant="secondary"
    commandFor="delete-modal"
    command="--hide"
  >
    Keep subscription
  </s-button>
</s-modal>
```

### Button Tone Options:
- `tone="critical"` - Red destructive style (delete, cancel, remove)
- `tone="auto"` - Default tone
- `tone="neutral"` - Neutral tone

### Button Variant Options:
- `variant="primary"` - Filled button (main action)
- `variant="secondary"` - Outlined button (cancel/back)
- `variant="tertiary"` - Plain button (minimal)

**Source:** [Modal Component Examples](https://shopify.dev/docs/api/app-home/polaris-web-components/overlays/modal)

---

## 4. `<ui-modal>` - App Bridge Alternative

**Tag:** `<ui-modal>`
**Best for:** Admin-level modals, complex content, external URLs

### Properties:
```typescript
- id: string
- src: string              // URL to load in modal iframe
- variant: "small" | "base" | "large" | "max"
```

### Control:
```javascript
// Via instance methods
document.getElementById('my-modal').show()
document.getElementById('my-modal').hide()

// Via App Bridge API
shopify.modal.show('modal-id')
shopify.modal.hide('modal-id')
```

### Destructive Action Example:
```html
<ui-modal id="my-modal">
  <p>If you delete this resource, it can't be undone.</p>
  <ui-title-bar title="Delete this resource">
    <button variant="primary" tone="critical" onclick="console.log('Deleting')">
      Delete
    </button>
    <button onclick="console.log('Cancelling')">Cancel</button>
  </ui-title-bar>
</ui-modal>

<button onclick="document.getElementById('my-modal').show()">Open Modal</button>
```

**Sources:**
- [ui-modal Docs](https://shopify.dev/docs/api/app-home/app-bridge-web-components/ui-modal)
- [Using Modals Guide](https://shopify.dev/docs/api/app-bridge/using-modals-in-your-app)

---

## 5. Comparison: `<s-modal>` vs `<ui-modal>`

| Feature | `<s-modal>` | `<ui-modal>` |
|---------|------------|-------------|
| **Use case** | In-app confirmations | Admin-level overlays |
| **Control** | `command` + `commandFor` | Instance methods / API |
| **Content** | Direct HTML children | HTML or `src` URL |
| **Buttons** | Slots (primary/secondary) | `<ui-title-bar>` children |
| **Destructive style** | `tone="critical"` on button | `tone="critical"` on button |
| **Framework** | Polaris App Home | App Bridge |
| **Best for subscription cancel** | ✅ Yes - simpler | Maybe - if need iframe |

**Recommendation:** Use `<s-modal>` for subscription cancellation confirmation - simpler, no iframe, direct content control.

---

## 6. Implementation Pattern for Subscription Cancel

### Recommended Structure:
```html
<!-- Trigger button -->
<s-button
  tone="critical"
  commandFor="cancel-subscription-modal"
  command="--show"
>
  Cancel subscription
</s-button>

<!-- Modal -->
<s-modal
  id="cancel-subscription-modal"
  heading="Cancel your subscription?"
>
  <s-stack gap="base">
    <s-paragraph>
      Are you sure you want to cancel your subscription? You'll lose access to all premium features.
    </s-paragraph>
    <s-paragraph tone="caution">
      This action will take effect immediately and cannot be undone.
    </s-paragraph>
  </s-stack>

  <!-- Primary destructive action -->
  <s-button
    slot="primary-action"
    variant="primary"
    tone="critical"
    onclick="handleCancelSubscription()"
  >
    Yes, cancel subscription
  </s-button>

  <!-- Secondary safe action -->
  <s-button
    slot="secondary-actions"
    variant="secondary"
    commandFor="cancel-subscription-modal"
    command="--hide"
  >
    Keep my subscription
  </s-button>
</s-modal>

<script>
async function handleCancelSubscription() {
  // Close modal first
  document.getElementById('cancel-subscription-modal').hide();

  // Make API call
  const response = await fetch('/api/subscription/cancel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });

  if (response.ok) {
    // Show success toast/banner
    shopify.toast.show('Subscription cancelled successfully');
  } else {
    // Show error
    shopify.toast.show('Failed to cancel subscription', { isError: true });
  }
}
</script>
```

---

## 7. Best Practices

### Modal Usage:
- Use for confirmations, critical info, or focused tasks requiring attention
- Keep content focused - limit to essential info & actions
- Provide secondary actions (Cancel, Go Back) for flexibility
- Don't stack multiple modals

### Destructive Actions:
- **Always** use `tone="critical"` on primary button for destructive actions
- Include warning text with `tone="caution"` in content
- Make consequences clear ("cannot be undone", "immediate effect")
- Label buttons clearly ("Yes, cancel subscription" > "Confirm")
- Secondary action should be safe option ("Keep subscription")

### Button Patterns:
```html
<!-- Destructive primary -->
<s-button slot="primary-action" variant="primary" tone="critical">
  Delete
</s-button>

<!-- Safe secondary -->
<s-button slot="secondary-actions" variant="secondary">
  Cancel
</s-button>
```

**Source:** [Modal Best Practices](https://shopify.dev/docs/api/app-home/polaris-web-components/overlays/modal)

---

## 8. Event Handling

### Modal Lifecycle:
```html
<s-modal id="my-modal">
  <p>Content</p>
  <s-button slot="primary-action">OK</s-button>
</s-modal>

<script>
const modal = document.getElementById('my-modal');

// Before show/hide
modal.addEventListener('show', (e) => {
  console.log('Modal showing', e.currentTarget);
});

modal.addEventListener('hide', (e) => {
  console.log('Modal hiding', e.currentTarget);
});

// After animations complete
modal.addEventListener('aftershow', () => {
  console.log('Modal fully shown');
});

modal.addEventListener('afterhide', () => {
  console.log('Modal fully hidden');
});
</script>
```

---

## 9. No Native Polaris Web Component for Dialogs

**Important Finding:** Polaris web components do NOT have a separate `<s-dialog>` or `<s-confirmation-dialog>` component.

**Modal is the pattern** for all overlay confirmations, including:
- Destructive action confirmations
- Warning dialogs
- Simple alerts
- Complex forms

**Sources:**
- [App Home Components](https://shopify.dev/docs/api/app-home/polaris-web-components)
- [POS UI Components](https://shopify.dev/docs/api/pos-ui-extensions/latest/polaris-web-components)

---

## 10. Summary & Recommendations

### For Subscription Cancellation UI:

**Use:** `<s-modal>` (Polaris App Home)

**Why:**
- Simpler implementation (no iframe)
- Direct HTML content control
- Built-in destructive action styling via `tone="critical"`
- Automatic focus management
- Better performance (2025 overhaul removed iframe)

**Pattern:**
1. Trigger: `<s-button tone="critical" commandFor="modal-id" command="--show">`
2. Modal: `<s-modal id="modal-id" heading="...">`
3. Primary: `<s-button slot="primary-action" variant="primary" tone="critical">`
4. Secondary: `<s-button slot="secondary-actions" variant="secondary">`

**Alternative:** `<ui-modal>` only if:
- Need to load external URL in modal
- Require App Bridge-specific features
- Building admin-level functionality

---

## References

### Documentation:
- [Polaris App Home Modal](https://shopify.dev/docs/api/app-home/polaris-web-components/overlays/modal)
- [App Bridge ui-modal](https://shopify.dev/docs/api/app-home/app-bridge-web-components/ui-modal)
- [Using Modals Guide](https://shopify.dev/docs/api/app-bridge/using-modals-in-your-app)
- [Modal Best Practices](https://shopify.dev/docs/api/app-home/polaris-web-components/overlays/modal#best-practices)

### Articles:
- [Polaris Goes Stable](https://www.shopify.com/partners/blog/polaris-goes-stable-the-future-of-shopify-app-development-is-here)
- [Polaris Unified](https://www.shopify.com/partners/blog/polaris-unified-and-for-the-web)
- [Modal Component Docs](https://shopify.dev/docs/api/app-bridge-library/react-components/modal-component)

### Key Findings:
- Polaris web components modernized in 2025 with `s-` prefix
- `<s-modal>` is primary pattern for confirmations
- No separate dialog/confirmation components
- Destructive actions styled via `tone="critical"` on buttons
- Button tone determines overall modal tone

---

**End of Report**
