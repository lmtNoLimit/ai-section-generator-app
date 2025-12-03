# Phase 01: Implement Cancel Subscription Modal

**Phase:** 01/01
**Status:** Ready for Implementation
**File:** `app/routes/app.billing.tsx`

---

## Objective

Replace browser `confirm()` with Polaris `<s-modal>`, add conditional rendering, follow destructive action patterns.

---

## Pre-Implementation Checklist

- [ ] Read `docs/code-standards.md` Polaris web components section
- [ ] Review research: `research/researcher-01-polaris-web-component-modals.md`
- [ ] Review research: `research/researcher-02-cancel-ux-best-practices.md`
- [ ] Understand current code: `app/routes/app.billing.tsx:247-260`
- [ ] Verify loader data structure: `subscription`, `quota` objects

---

## Step-by-Step Implementation

### Step 1: Add Cancel Confirmation Handler

**Location:** After `handleUpgradeClick()` function (around line 129)

**Action:** Add new handler function for modal primary button

```tsx
// Handle cancel subscription confirmation from modal
const handleCancelConfirm = () => {
  const formData = new FormData();
  formData.append("action", "cancel");
  submit(formData, { method: "post" });
  // Modal auto-closes on navigation (form submission triggers state change)
};
```

**Rationale:**
- Extracts form submission logic from inline handler
- Named function improves readability vs inline arrow function
- Follows React Router pattern (FormData + useSubmit hook)
- Auto-close via navigation state change (no manual modal control needed)

---

### Step 2: Update Cancel Button (Conditional + Command-Based)

**Location:** Line 247-260 (current cancel button)

**Current Code:**
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

**Replace With:**
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

**Changes:**
- ✅ Add conditional wrapper: `{subscription && ...}`
- ✅ Remove `onClick` with `confirm()` logic
- ✅ Add `commandFor="cancel-subscription-modal"` (targets modal by ID)
- ✅ Add `command="--show"` (opens modal)
- ✅ Keep existing props: `variant`, `tone`, `accessibilityLabel`

**Conditional Rendering Logic:**
- `subscription` is null/undefined for free plan users → button hidden
- `subscription` exists for paid plans → button shown
- Prevents "cancel subscription" button for users with nothing to cancel

---

### Step 3: Add Modal Component

**Location:** Immediately after cancel button (before `</s-stack>` closing tag, around line 261)

**Action:** Insert modal component with slots

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

**Component Breakdown:**

#### Modal Container
```tsx
<s-modal id="cancel-subscription-modal" heading="Cancel your subscription?">
```
- `id` - Unique identifier for `commandFor` targeting
- `heading` - Modal title (screen reader accessible)
- No `size` prop - uses default "base" size (appropriate for confirmations)

#### Content Section (Default Slot)
```tsx
<s-stack gap="base" direction="block">
```
- Vertical stack layout (`direction="block"`)
- Base gap spacing (Polaris standard)
- Contains 3 subsections: plan info, features lost, warning

#### Plan Information
```tsx
<s-paragraph>
  You're currently on the <s-text type="strong">{planName}</s-text> plan...
</s-paragraph>
```
- Shows current plan name (conditional display based on `subscription.planName`)
- Shows base price from `subscription.basePrice`
- Uses `<s-text type="strong">` for emphasis

#### Features Lost
```tsx
<s-box>
  <s-paragraph>Canceling will remove access to:</s-paragraph>
  <s-stack gap="small-100" direction="block">
    <s-text>• {quota.includedQuota} generations per month</s-text>
    ...
  </s-stack>
</s-box>
```
- Bullet list of features (uses Unicode bullet `•`)
- Dynamic quota display from `quota.includedQuota`
- Small gap between list items (`gap="small-100"`)

#### Warning Message
```tsx
<s-paragraph tone="caution">
  Your subscription will end immediately. This action cannot be undone.
</s-paragraph>
```
- `tone="caution"` - Applies warning styling (yellow/orange text)
- Clear consequences: "immediately" + "cannot be undone"
- Follows UX best practice: explicit about action permanence

#### Primary Action Button (Destructive)
```tsx
<s-button
  slot="primary-action"
  variant="primary"
  tone="critical"
  onClick={handleCancelConfirm}
>
  Yes, cancel subscription
</s-button>
```
- `slot="primary-action"` - Polaris modal slot (right-aligned position)
- `variant="primary"` - Filled button style (main action)
- `tone="critical"` - Red destructive styling
- `onClick={handleCancelConfirm}` - Triggers form submission
- Label: "Yes, cancel subscription" - Explicit confirmation + action

#### Secondary Action Button (Safe)
```tsx
<s-button
  slot="secondary-actions"
  variant="secondary"
  commandFor="cancel-subscription-modal"
  command="--hide"
>
  Keep my subscription
</s-button>
```
- `slot="secondary-actions"` - Left-aligned position
- `variant="secondary"` - Outlined button style (less prominent)
- `commandFor` + `command="--hide"` - Closes modal (no action taken)
- Label: "Keep my subscription" - Positive phrasing, clear intent

---

### Step 4: Handle Loading State (Optional Enhancement)

**Location:** After modal, before closing `</s-stack>` tag

**Action:** Disable cancel button during submission (prevent double-click)

**Current loading overlay logic** (lines 264-281):
```tsx
const isLoading = navigation.state === "submitting" || navigation.state === "loading";
```

**Add to cancel button:**
```tsx
{subscription && (
  <s-button
    variant="secondary"
    tone="critical"
    commandFor="cancel-subscription-modal"
    command="--show"
    loading={isLoading ? "true" : undefined}
    disabled={isLoading}
    accessibilityLabel="Cancel subscription"
  >
    Cancel Subscription
  </s-button>
)}
```

**Enhancement:**
- `loading={isLoading ? "true" : undefined}` - Spinner during submission
- `disabled={isLoading}` - Prevents multiple clicks
- Uses existing `isLoading` state from `useNavigation()` hook

**Note:** Modal automatically closes on navigation state change (form submission), so no manual close needed in handler.

---

## Code Organization

### File Structure After Changes
```tsx
export default function BillingPage() {
  // Hooks (lines 99-103) - unchanged
  const { plans, subscription, quota, ... } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const submit = useSubmit();

  // Effects (lines 106-112) - unchanged
  useEffect(() => { ... }, [actionData?.confirmationUrl]);

  // Handlers
  const handlePlanSelect = (planName: PlanTier) => { ... }; // unchanged
  const handleUpgradeClick = () => { ... }; // unchanged
  const handleCancelConfirm = () => {                       // NEW
    const formData = new FormData();
    formData.append("action", "cancel");
    submit(formData, { method: "post" });
  };

  // Loading state (unchanged)
  const isLoading = navigation.state === "submitting" || navigation.state === "loading";

  // Render
  return (
    <s-page heading="Billing & Usage" inlineSize="base">
      {/* Banners, subscription details, usage dashboard, plan selector - unchanged */}

      {/* Cancel button + modal - CHANGED */}
      {subscription && (
        <>
          <s-button ... commandFor="cancel-subscription-modal" command="--show">
            Cancel Subscription
          </s-button>

          <s-modal id="cancel-subscription-modal" heading="...">
            {/* Modal content */}
          </s-modal>
        </>
      )}
    </s-page>
  );
}
```

### Lines Changed Summary
- **Line 129:** Add `handleCancelConfirm()` function (~6 lines)
- **Lines 247-260:** Replace cancel button with conditional + command-based version (~10 lines)
- **Line 261:** Add modal component (~50 lines)
- **Total:** ~66 lines changed/added

### File Size Impact
- Current file: 285 lines
- After changes: ~335 lines
- Still under 200-line guideline violation (acceptable for route files)
- Future: Consider extracting to `<CancelSubscriptionModal>` component if file grows

---

## TypeScript Considerations

### Type Safety
All types available from loader:
```tsx
const { subscription, quota } = useLoaderData<typeof loader>();
// subscription: Subscription | null
// quota: QuotaCheck
```

### Null Handling
Conditional rendering handles null subscription:
```tsx
{subscription && (
  // subscription guaranteed non-null inside this block
  <s-paragraph>
    {subscription.planName} {/* TypeScript knows this exists */}
  </s-paragraph>
)}
```

### No Type Assertions Needed
- `subscription.planName` typed as `PlanTier` ("starter" | "growth" | "professional")
- `subscription.basePrice` typed as `number`
- `quota.includedQuota` typed as `number`
- No `as` casts or `!` assertions required

---

## Polaris Design System Compliance

### Components Used
- ✅ `<s-modal>` - Standard confirmation pattern
- ✅ `<s-button>` - Destructive action with `tone="critical"`
- ✅ `<s-stack>` - Layout with consistent spacing
- ✅ `<s-paragraph>` - Text with tone modifiers
- ✅ `<s-text>` - Inline text styling

### Design Tokens
- ✅ `gap="base"` - Standard spacing (16px)
- ✅ `gap="small-100"` - Small spacing (4px)
- ✅ `tone="critical"` - Destructive action color
- ✅ `tone="caution"` - Warning text color
- ✅ `variant="primary"` / `variant="secondary"` - Button hierarchy

### Accessibility
- ✅ `heading` attribute - Screen reader announcement
- ✅ `accessibilityLabel` on trigger button
- ✅ Focus trap (Polaris handles automatically)
- ✅ Keyboard navigation (Escape closes, Tab cycles)
- ✅ Color contrast (Polaris ensures WCAG AA)

---

## Testing Plan

### Manual Testing Steps

#### Test 1: Free Plan User (No Subscription)
1. Log in as shop with no active subscription (`subscription = null`)
2. Navigate to `/app/billing`
3. **Expected:** Cancel button NOT visible
4. **Verify:** No "Cancel Subscription" button rendered

#### Test 2: Paid Plan User (Active Subscription)
1. Log in as shop with active subscription
2. Navigate to `/app/billing`
3. **Expected:** Cancel button visible
4. Click "Cancel Subscription"
5. **Expected:** Modal opens with correct plan details
6. **Verify:**
   - Modal heading: "Cancel your subscription?"
   - Plan name matches current plan (Starter/Growth/Professional)
   - Base price displayed correctly
   - Included quota matches plan
   - Warning message visible with caution styling

#### Test 3: Modal Interaction - Keep Subscription
1. Open cancel modal
2. Click "Keep my subscription"
3. **Expected:** Modal closes, no form submission
4. **Verify:** Subscription still active, no banners

#### Test 4: Modal Interaction - Confirm Cancellation
1. Open cancel modal
2. Click "Yes, cancel subscription"
3. **Expected:**
   - Modal closes
   - Loading overlay appears
   - Form submits to server
   - Success banner shows (if successful)
4. **Verify:**
   - `actionData.success === true`
   - Subscription status updated
   - Cancel button disappears (subscription now null)

#### Test 5: Error Handling
1. Simulate server error (disconnect network)
2. Open modal, click "Yes, cancel subscription"
3. **Expected:** Error banner with message
4. **Verify:** `actionData.error` displayed

#### Test 6: Loading State
1. Open modal
2. Click "Yes, cancel subscription"
3. **Expected:**
   - Cancel button shows spinner (`loading="true"`)
   - Button disabled during submission
4. **Verify:** No double-submission possible

### Keyboard Navigation Testing
1. Tab to "Cancel Subscription" button
2. Press Enter → Modal opens
3. Tab through modal buttons
4. Press Escape → Modal closes
5. **Verify:** Focus returns to trigger button

### Screen Reader Testing
1. Navigate to cancel button with screen reader
2. **Verify:** "Cancel subscription" announced
3. Activate button → Modal opens
4. **Verify:** Modal heading announced
5. Navigate through content
6. **Verify:** Warning message announced with caution tone

---

## Edge Cases & Error Handling

### Edge Case 1: Subscription Null Mid-Session
**Scenario:** Subscription cancelled in another tab/window
**Handling:** Conditional render hides button after reload/navigation

### Edge Case 2: Network Failure During Cancellation
**Scenario:** Request fails mid-flight
**Handling:** Server action returns `{ error: "..." }`, banner displays

### Edge Case 3: Subscription Already Cancelled
**Scenario:** User clicks button twice (race condition)
**Handling:** Server validates subscription status, returns error if already cancelled

### Edge Case 4: Missing Quota Data
**Scenario:** `quota` undefined/null
**Handling:** Display fallback text: "Your plan's included generations"

```tsx
<s-text>• {quota?.includedQuota ?? "Plan's included"} generations per month</s-text>
```

---

## Rollback Strategy

### If Modal Doesn't Work
1. Revert modal component (delete lines 261-311)
2. Restore native `confirm()` in button `onClick`
3. Keep conditional rendering (still an improvement)
4. File issue: "s-modal component not working as expected"

### If Conditional Rendering Breaks
1. Remove `{subscription && ...}` wrapper
2. Add defensive check inside `onClick`:
```tsx
onClick={() => {
  if (!subscription) {
    alert("No active subscription to cancel");
    return;
  }
  // Continue with modal open
}}
```

---

## Success Criteria

### Functional Requirements
- ✅ Cancel button hidden for free plan users
- ✅ Cancel button visible for paid users
- ✅ Modal opens on button click
- ✅ Modal displays correct subscription details
- ✅ "Keep my subscription" closes modal without action
- ✅ "Yes, cancel subscription" submits form correctly
- ✅ Success/error feedback displayed

### UX Requirements
- ✅ No native browser `confirm()` dialog
- ✅ Polaris design system consistency
- ✅ Clear consequences shown before cancellation
- ✅ Unambiguous button labels (no confusion)
- ✅ Destructive action styling (critical tone)

### Technical Requirements
- ✅ TypeScript type safety (no `any` types)
- ✅ React Router patterns (useSubmit, FormData)
- ✅ Polaris web components (command-based control)
- ✅ Accessibility (ARIA labels, keyboard nav, focus management)
- ✅ File under 400 lines (within reasonable bounds)

---

## Post-Implementation Checklist

- [ ] All manual tests pass
- [ ] Keyboard navigation works
- [ ] Screen reader announces correctly
- [ ] Loading states display properly
- [ ] Error handling works
- [ ] No TypeScript errors
- [ ] No console errors/warnings
- [ ] Code follows `docs/code-standards.md`
- [ ] Git commit with conventional format: `feat(billing): replace confirm() with Polaris modal for subscription cancellation`

---

## Future Enhancements (Out of Scope)

**Not included in this phase:**
- Retention offers (discounts, pauses)
- Cancellation reason survey
- Email confirmation step
- Multi-step flow
- Analytics tracking

**Reference:** `research/researcher-02-cancel-ux-best-practices.md` sections 2-4 for retention patterns.

---

## Estimated Time

**Total:** 30-45 minutes

**Breakdown:**
- Step 1 (Handler): 5 min
- Step 2 (Button): 5 min
- Step 3 (Modal): 15-20 min
- Step 4 (Loading): 5 min
- Testing: 10 min

---

**Status:** Ready for implementation
**Blocked By:** None
**Blocks:** None
