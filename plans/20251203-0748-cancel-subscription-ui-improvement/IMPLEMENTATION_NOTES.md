# Implementation Notes & Quick Reference

**For:** Developers implementing the cancel subscription modal
**Quick Reference:** Copy-paste code snippets with annotations

---

## Component Flow Diagram

```
User Flow:
┌─────────────────────────────────────────────────────────────┐
│ 1. User on Billing Page                                    │
│    ├─ Free plan? → Cancel button HIDDEN (subscription=null)│
│    └─ Paid plan? → Cancel button VISIBLE                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. User clicks "Cancel Subscription"                        │
│    → Modal opens (command="--show")                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Modal displays:                                          │
│    - Plan name & price                                      │
│    - Features they'll lose                                  │
│    - Warning (tone="caution")                               │
│    - Two buttons (primary/secondary)                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
        ┌───────────────────┴───────────────────┐
        ↓                                       ↓
┌───────────────────────┐           ┌───────────────────────┐
│ 4a. "Keep my          │           │ 4b. "Yes, cancel      │
│     subscription"     │           │      subscription"    │
│  → Modal closes       │           │  → handleCancelConfirm│
│  → No action taken    │           │  → Form submission    │
└───────────────────────┘           └───────────────────────┘
                                                ↓
                              ┌─────────────────┴─────────────────┐
                              ↓                                   ↓
                    ┌─────────────────────┐          ┌─────────────────────┐
                    │ 5a. Success         │          │ 5b. Error           │
                    │  → Modal closes     │          │  → Error banner     │
                    │  → Success banner   │          │  → Modal stays open │
                    │  → Button disappears│          │  → User can retry   │
                    └─────────────────────┘          └─────────────────────┘
```

---

## Data Flow

```
Loader (server) → Component (client) → Action (server)
                                                │
┌───────────────────────────────────────────────┤
│ useLoaderData<typeof loader>()               │
├──────────────────────────────────────────────┤
│ - plans: PlanConfig[]                        │
│ - subscription: Subscription | null  ←────── Used for conditional
│ - quota: QuotaCheck              ←────────── Used in modal content
│ - approvalStatus: string | null             │
│ - chargeId: string | null                   │
└──────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────┐
│ Conditional Rendering Logic                 │
│                                              │
│ {subscription && (                           │
│   <button> + <modal>                         │
│ )}                                           │
│                                              │
│ If subscription is null → nothing renders   │
│ If subscription exists → button + modal      │
└──────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────┐
│ handleCancelConfirm()                        │
│  → FormData { action: "cancel" }             │
│  → submit(formData, { method: "post" })      │
└──────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────┐
│ Action Handler (server)                     │
│  → cancelSubscription(admin, shop)           │
│  → Returns { success: true } or { error }    │
└──────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────┐
│ useActionData<typeof action>()               │
│  → Triggers banner display                   │
│  → Modal auto-closes on navigation           │
└──────────────────────────────────────────────┘
```

---

## Code Snippets (Ready to Copy)

### 1. Handler Function (Add after line ~129)

```tsx
// Handle cancel subscription confirmation from modal
const handleCancelConfirm = () => {
  const formData = new FormData();
  formData.append("action", "cancel");
  submit(formData, { method: "post" });
  // Modal auto-closes on navigation
};
```

---

### 2. Cancel Button (Replace lines 247-260)

**REMOVE THIS:**
```tsx
<s-button
  variant="secondary"
  tone="critical"
  onClick={() => {
    if (confirm("Are you sure you want to cancel your subscription?")) {
      const formData = new FormData();
      formData.append("action", "cancel");
      submit(formData, { method: "post" });
    }
  }}
  accessibilityLabel="Cancel subscription"
>
  Cancel Subscription
</s-button>
```

**REPLACE WITH:**
```tsx
{subscription && (
  <s-button
    variant="secondary"
    tone="critical"
    commandFor="cancel-subscription-modal"
    command="--show"
    accessibilityLabel="Cancel subscription"
  >
    Cancel Subscription
  </s-button>
)}
```

---

### 3. Modal Component (Add after button, before `</s-stack>`)

```tsx
{subscription && (
  <s-modal
    id="cancel-subscription-modal"
    heading="Cancel your subscription?"
  >
    <s-stack gap="base" direction="block">
      {/* Current plan info */}
      <s-paragraph>
        You're currently on the{" "}
        <s-text type="strong">
          {subscription.planName === "starter" && "Starter"}
          {subscription.planName === "growth" && "Growth"}
          {subscription.planName === "professional" && "Professional"}
        </s-text>{" "}
        plan (${subscription.basePrice}/month).
      </s-paragraph>

      {/* What they'll lose */}
      <s-box>
        <s-paragraph>Canceling will remove access to:</s-paragraph>
        <s-stack gap="small-100" direction="block">
          <s-text>• {quota.includedQuota} generations per month</s-text>
          <s-text>• Premium templates library</s-text>
          <s-text>• Section history and versioning</s-text>
          <s-text>• Priority support</s-text>
        </s-stack>
      </s-box>

      {/* Warning message */}
      <s-paragraph tone="caution">
        Your subscription will end immediately. This action cannot be undone.
      </s-paragraph>
    </s-stack>

    {/* Primary action: destructive */}
    <s-button
      slot="primary-action"
      variant="primary"
      tone="critical"
      onClick={handleCancelConfirm}
    >
      Yes, cancel subscription
    </s-button>

    {/* Secondary action: safe */}
    <s-button
      slot="secondary-actions"
      variant="secondary"
      commandFor="cancel-subscription-modal"
      command="--hide"
    >
      Keep my subscription
    </s-button>
  </s-modal>
)}
```

---

## Common Mistakes to Avoid

### ❌ DON'T: Use React Polaris Components
```tsx
import { Modal } from "@shopify/polaris"; // WRONG - React component
<Modal open={isOpen}>...</Modal>
```

### ✅ DO: Use Polaris Web Components
```tsx
// No import needed - loaded via CDN
<s-modal id="my-modal">...</s-modal>
```

---

### ❌ DON'T: Imperative Modal Control
```tsx
const modalRef = useRef();
modalRef.current?.show(); // WRONG - imperative
```

### ✅ DO: Declarative Command-Based Control
```tsx
<s-button commandFor="modal-id" command="--show">Open</s-button>
```

---

### ❌ DON'T: Confusing Button Labels
```tsx
<s-button slot="primary-action">Cancel</s-button>
<s-button slot="secondary-actions">Cancel</s-button>
// User: "Which Cancel cancels the subscription?!"
```

### ✅ DO: Clear, Explicit Labels
```tsx
<s-button slot="primary-action" tone="critical">
  Yes, cancel subscription
</s-button>
<s-button slot="secondary-actions">
  Keep my subscription
</s-button>
```

---

### ❌ DON'T: Show Button for Free Plan Users
```tsx
<s-button onClick={() => {
  if (!subscription) {
    alert("You don't have a subscription!");
    return;
  }
  // Open modal
}}>
  Cancel Subscription
</s-button>
```

### ✅ DO: Conditional Rendering
```tsx
{subscription && (
  <s-button>Cancel Subscription</s-button>
)}
```

---

### ❌ DON'T: Manual Modal Close in Handler
```tsx
const handleCancelConfirm = () => {
  document.getElementById("cancel-subscription-modal").hide(); // Unnecessary
  submit(formData, { method: "post" });
};
```

### ✅ DO: Let Navigation State Handle Close
```tsx
const handleCancelConfirm = () => {
  submit(formData, { method: "post" });
  // Modal auto-closes on navigation state change
};
```

---

## Polaris Component Cheat Sheet

### Modal Sizes
```tsx
<s-modal size="small">     // Small modal (400px)
<s-modal size="base">      // Default (560px) - RECOMMENDED
<s-modal size="large">     // Large (720px)
<s-modal size="large-100"> // Extra large (880px)
```

### Button Variants & Tones
```tsx
// Variants (visual hierarchy)
variant="primary"   // Filled button (main action)
variant="secondary" // Outlined button (less emphasis)
variant="tertiary"  // Plain button (minimal)

// Tones (semantic meaning)
tone="critical"  // Red destructive (delete, cancel)
tone="caution"   // Yellow warning (be careful)
tone="neutral"   // Default gray
tone="auto"      // Inherits from context
```

### Stack Gaps
```tsx
gap="small-100"  // 4px - Tight spacing (list items)
gap="base"       // 16px - Standard spacing (sections)
gap="large"      // 24px - Wide spacing (major sections)
```

### Text Tones
```tsx
tone="caution"   // Warning text (yellow/orange)
tone="critical"  // Error text (red)
tone="subdued"   // Muted text (gray)
```

---

## TypeScript Hints

### Available Types from Loader
```tsx
const { subscription, quota } = useLoaderData<typeof loader>();

// subscription: Subscription | null
subscription?.planName       // "starter" | "growth" | "professional"
subscription?.basePrice      // number
subscription?.status         // "active" | "cancelled" | etc.
subscription?.currentPeriodEnd // string (ISO date)

// quota: QuotaCheck
quota.includedQuota          // number
quota.usageThisCycle         // number
quota.percentUsed            // number (0-100)
```

### Null Safety Pattern
```tsx
// Inside conditional block, TypeScript knows subscription is non-null
{subscription && (
  <s-paragraph>
    {subscription.planName} {/* No error - TS infers non-null */}
  </s-paragraph>
)}
```

---

## Testing Checklist (Quick)

```bash
# Test 1: Free Plan User
✓ Navigate to /app/billing
✓ Verify cancel button NOT visible

# Test 2: Paid Plan User
✓ Navigate to /app/billing
✓ Verify cancel button visible
✓ Click button → modal opens
✓ Verify plan details correct
✓ Click "Keep my subscription" → modal closes
✓ Click cancel button again → modal opens
✓ Click "Yes, cancel subscription" → form submits
✓ Verify success banner shows
✓ Verify cancel button disappears

# Test 3: Error Handling
✓ Simulate network error
✓ Click "Yes, cancel subscription"
✓ Verify error banner shows

# Test 4: Keyboard Navigation
✓ Tab to cancel button
✓ Press Enter → modal opens
✓ Press Escape → modal closes
✓ Tab through modal buttons
✓ Press Enter on "Keep my subscription"
```

---

## Git Commit Message

```bash
feat(billing): replace confirm() with Polaris modal for subscription cancellation

- Replace browser native confirm() with <s-modal> web component
- Add conditional rendering (hide button for free plan users)
- Display plan details and cancellation consequences in modal
- Implement destructive action pattern (tone="critical")
- Follow Polaris design system patterns for confirmations

Closes #[ISSUE_NUMBER]
```

---

## Debugging Tips

### Modal Not Opening?
```tsx
// Check 1: ID matches
<s-button commandFor="cancel-subscription-modal" command="--show">
<s-modal id="cancel-subscription-modal">
// IDs must match exactly (case-sensitive)

// Check 2: Modal inside conditional
{subscription && (
  <>
    <s-button commandFor="..."> {/* Button */}
    <s-modal id="...">          {/* Modal MUST be here too */}
  </>
)}
```

### Button Not Showing?
```tsx
// Check: subscription exists in loader data
console.log({ subscription }); // Should be object, not null

// Check: conditional wrapper correct
{subscription && (
  <s-button>...</s-button>
)}
// NOT: {subscription ? <s-button> : null}
```

### Form Not Submitting?
```tsx
// Check 1: Handler called
const handleCancelConfirm = () => {
  console.log("Handler called"); // Add this
  const formData = new FormData();
  formData.append("action", "cancel");
  submit(formData, { method: "post" });
};

// Check 2: Action handler running
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const action = formData.get("action");
  console.log("Action:", action); // Should log "cancel"

  if (action === "cancel") {
    // Cancellation logic
  }
}
```

---

## Performance Notes

**Modal Lazy Loading:**
- Polaris web components loaded via CDN (`polaris.js`)
- Components lazy-load on first use
- Modal markup only rendered when `subscription` exists
- No performance impact on free plan users

**Navigation State:**
- Modal auto-closes on `navigation.state` change
- No manual event listeners needed
- Polaris handles cleanup automatically

---

## Accessibility Quick Check

```bash
# Screen Reader Test
✓ Focus on cancel button
✓ Announces: "Cancel subscription, button"
✓ Activate → Modal opens
✓ Announces: "Cancel your subscription? dialog"
✓ Announces modal content
✓ Announces: "Warning: Your subscription will end immediately..."

# Keyboard Test
✓ Tab navigates between buttons
✓ Escape closes modal
✓ Enter activates focused button
✓ Focus trap works (can't tab outside modal)

# Color Contrast
✓ Critical button has sufficient contrast (WCAG AA)
✓ Caution text readable (Polaris ensures this)
```

---

**Last Updated:** 2025-12-03
**For Questions:** See `plan.md` or `phase-01-implement-cancel-modal.md`
