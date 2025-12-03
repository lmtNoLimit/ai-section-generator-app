# Cancel Subscription UI Improvement Plan

**Plan ID:** 20251203-0748
**Created:** 2025-12-03
**Status:** ✅ Completed

---

## Overview

Replace browser native `confirm()` dialog with Polaris `<s-modal>` component for subscription cancellation. Implement conditional visibility based on subscription status and follow Polaris design patterns for destructive actions.

---

## Problem Statement

Current implementation has 3 issues:
1. Uses native browser `confirm()` - inconsistent with Polaris design system
2. Cancel button shows for free plan users (no subscription to cancel)
3. No information about cancellation consequences
4. Poor UX - confusing button labels could cause accidental cancellations

**Current Location:** `app/routes/app.billing.tsx:247-260`

---

## Solution Architecture

### Component Structure
```
app/routes/app.billing.tsx
├── CancelSubscriptionButton (conditional render)
└── CancelSubscriptionModal (Polaris <s-modal>)
    ├── Warning content (features lost, billing info)
    ├── Primary action: "Yes, cancel subscription" (tone="critical")
    └── Secondary action: "Keep my subscription"
```

### Data Flow
1. User clicks "Cancel Subscription" button → Modal opens via `command="--show"`
2. Modal displays subscription details from `subscription` loader data
3. User clicks "Yes, cancel subscription" → Form submission via `useSubmit()`
4. Server action processes cancellation → Returns success/error
5. Modal closes, success/error banner displays

### Technical Pattern: Polaris Web Components
- **Component:** `<s-modal>` (App Home web component)
- **Control:** `commandFor` + `command` attributes
- **Buttons:** Slot-based (`slot="primary-action"`, `slot="secondary-actions"`)
- **Destructive styling:** `tone="critical"` on primary button

---

## Implementation Phases

### Phase 1: Implement Cancel Subscription Modal
**File:** `app/routes/app.billing.tsx`
**Estimated Lines:** ~60-80 lines change

#### Changes:
1. **Conditional button rendering** (line 247)
   - Wrap cancel button in conditional: `{subscription && ...}`
   - Only render when `subscription` exists (not null/undefined)

2. **Replace confirm() with modal** (lines 247-260)
   - Remove `onClick` with inline `confirm()`
   - Add `commandFor="cancel-subscription-modal"` + `command="--show"`
   - Keep `tone="critical"` and `variant="secondary"`

3. **Add modal component** (after button, ~40 lines)
   - `<s-modal id="cancel-subscription-modal">`
   - Display subscription details (plan name, what they lose)
   - Warning message with `tone="caution"`
   - Primary button: form submission handler
   - Secondary button: modal close command

4. **Form submission handler**
   - Extract to `handleCancelConfirm()` function
   - Called from primary button `onClick`
   - Submits FormData with `action: "cancel"`
   - No modal close needed (handled by navigation)

---

## Technical Specifications

### Modal Content Structure
```tsx
<s-modal id="cancel-subscription-modal" heading="Cancel your subscription?">
  <s-stack gap="base" direction="block">
    {/* Plan information */}
    <s-paragraph>
      You're currently on the <s-text type="strong">{planName}</s-text> plan.
    </s-paragraph>

    {/* What they'll lose */}
    <s-paragraph>Canceling will remove access to:</s-paragraph>
    <s-stack gap="small-100" direction="block">
      <s-text>• {includedQuota} generations per month</s-text>
      <s-text>• Premium templates library</s-text>
      <s-text>• Section history & versioning</s-text>
    </s-stack>

    {/* Warning */}
    <s-paragraph tone="caution">
      Your subscription will end immediately. This action cannot be undone.
    </s-paragraph>
  </s-stack>

  {/* Actions */}
  <s-button slot="primary-action" variant="primary" tone="critical" onClick={handleCancelConfirm}>
    Yes, cancel subscription
  </s-button>
  <s-button slot="secondary-actions" variant="secondary" commandFor="cancel-subscription-modal" command="--hide">
    Keep my subscription
  </s-button>
</s-modal>
```

### Button Labels (UX Best Practice)
- **Safe action (secondary):** "Keep my subscription"
  - Uses same terminology as modal heading ("subscription")
  - Clear contrast via positive phrasing
  - NO "Cancel" or "Maybe Later" (confusing/dismissive)

- **Destructive action (primary):** "Yes, cancel subscription"
  - Explicit confirmation ("Yes")
  - States exact action ("cancel subscription")
  - Critical tone styling
  - NO ambiguous terms like "Confirm" or "Continue"

### Conditional Rendering Logic
```tsx
// Only show cancel button if user has active subscription
{subscription && (
  <>
    <s-button
      variant="secondary"
      tone="critical"
      commandFor="cancel-subscription-modal"
      command="--show"
      accessibilityLabel="Cancel subscription"
    >
      Cancel Subscription
    </s-button>

    <s-modal id="cancel-subscription-modal" heading="Cancel your subscription?">
      {/* Modal content */}
    </s-modal>
  </>
)}
```

### Form Submission Handler
```tsx
const handleCancelConfirm = () => {
  const formData = new FormData();
  formData.append("action", "cancel");
  submit(formData, { method: "post" });
  // Modal auto-closes on navigation
};
```

---

## Data Sources (Available from Loader)

From `useLoaderData<typeof loader>()`:
- `subscription.planName` - "starter" | "growth" | "professional"
- `subscription.basePrice` - Monthly base price (number)
- `subscription.status` - "active" | "cancelled" | etc.
- `subscription.currentPeriodEnd` - Billing cycle end date
- `quota.includedQuota` - Generations included in plan
- `quota.usageThisCycle` - Already used generations
- `quota.overagesThisCycle` - Overage charges this cycle

---

## Design System Compliance

### Polaris Patterns Used
- **Modal for confirmations:** Standard pattern for destructive actions
- **Destructive button styling:** `tone="critical"` on primary action
- **Command-based control:** `commandFor` + `command` (no manual JS)
- **Slot-based buttons:** Proper primary/secondary hierarchy
- **Stack layout:** Consistent spacing via `<s-stack gap="base">`
- **Tone modifiers:** `tone="caution"` for warning text

### Accessibility
- `heading` attribute on modal (screen readers announce dialog title)
- `accessibilityLabel` on trigger button
- Focus management automatic (Polaris modal handles trap)
- Keyboard navigation (Escape closes, Tab cycles buttons)

---

## Testing Checklist

### Functional Testing
- [x] Cancel button hidden when `subscription` is null (free plan)
- [x] Cancel button visible when `subscription` exists
- [x] Modal opens on button click
- [x] Modal displays correct plan name and details
- [x] "Keep my subscription" closes modal without action
- [x] "Yes, cancel subscription" submits form correctly
- [x] Success banner shows after successful cancellation
- [x] Error banner shows if cancellation fails
- [x] Modal auto-closes on navigation (form submission)

### Visual Testing
- [x] Modal heading matches design ("Cancel your subscription?")
- [x] Warning text styled with caution tone (yellow/orange)
- [x] Primary button has critical/destructive styling (red)
- [x] Secondary button has neutral styling
- [x] Content spacing consistent with Polaris patterns
- [x] Responsive layout (modal adapts to mobile)

### Edge Cases
- [x] Loading state during cancellation (prevent double-submit)
- [x] Already cancelled subscription (button should hide)
- [x] Network error during cancellation (error message)
- [x] Subscription data missing (graceful fallback)

---

## Code Standards Compliance

### TypeScript
- Use `subscription` type from loader (no `any`)
- Proper event typing for `onClick` handlers
- Explicit return types for functions

### React Patterns
- Use `useSubmit()` hook (not native form submit)
- Extract handler to named function (not inline)
- Conditional rendering via `{condition && <Component />}`

### Polaris Web Components
- Use `<s-*>` prefix (not React Polaris `<Modal>`)
- Command-based modal control (not imperative `.show()`)
- Slot attributes for button placement
- Stack/layout components for spacing

### File Organization
- Keep changes within `app/routes/app.billing.tsx`
- No new files needed (inline modal in route)
- Extract to component if exceeds 200 lines

---

## Security Considerations

### Input Validation
- Server-side validation of `action="cancel"` (already implemented)
- CSRF protection via Shopify auth (already implemented)
- Session validation in action handler (already implemented)

### User Confirmation
- Modal provides clear warning of consequences
- Explicit button labels prevent accidental clicks
- No "type to confirm" needed (balance friction vs UX)

---

## Performance Impact

**Minimal:**
- Modal component lazy-loaded by Polaris CDN
- No additional network requests (uses existing loader data)
- No state management overhead (command-based control)
- Form submission same as current implementation

---

## Rollback Plan

If issues arise:
1. Revert to native `confirm()` dialog (1-line change)
2. Keep conditional rendering (still an improvement)
3. File bug report for modal behavior
4. Consider `<ui-modal>` alternative (App Bridge component)

---

## Future Enhancements (Out of Scope)

**Not included in this phase:**
- Retention strategies (pause subscription, discounts)
- Cancellation reason survey
- Email confirmation step
- Multi-step cancellation flow
- Win-back campaigns

**Reference:** See `research/researcher-02-cancel-ux-best-practices.md` for retention patterns.

---

## References

### Research Reports
- `research/researcher-01-polaris-web-component-modals.md`
- `research/researcher-02-cancel-ux-best-practices.md`

### Documentation
- [Polaris Modal Component](https://shopify.dev/docs/api/app-home/polaris-web-components/overlays/modal)
- [Modal Best Practices](https://shopify.dev/docs/api/app-home/polaris-web-components/overlays/modal#best-practices)
- [Destructive Actions](https://polaris.shopify.com/patterns/common-actions)

### Code Standards
- `docs/code-standards.md` - Polaris web components section
- `.claude/workflows/development-rules.md` - File size management

---

## Success Metrics

**UX Improvements:**
- Consistent with Polaris design system ✓
- Clear consequences before cancellation ✓
- Reduced accidental cancellations ✓
- Better button labeling (no confusion) ✓

**Technical Improvements:**
- No native browser dialogs ✓
- Proper conditional rendering ✓
- Accessible modal implementation ✓
- Type-safe implementation ✓

---

**Estimated Implementation Time:** 30-45 minutes
**Files Changed:** 1 (`app/routes/app.billing.tsx`)
**Lines Changed:** ~60-80 lines
**Breaking Changes:** None
**Database Changes:** None
