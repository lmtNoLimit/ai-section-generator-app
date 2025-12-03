# Cancel Subscription UI Improvement

**Plan ID:** 20251203-0748
**Created:** 2025-12-03
**Type:** UI Enhancement
**Priority:** Medium
**Complexity:** Low

---

## Quick Summary

Replace browser native `confirm()` dialog with Polaris `<s-modal>` component for subscription cancellation. Add conditional rendering to hide cancel button for free plan users.

**Files Changed:** 1 (`app/routes/app.billing.tsx`)
**Lines Changed:** ~60-80 lines
**Time Estimate:** 30-45 minutes

---

## Problem

Current implementation (lines 247-260 in `app.billing.tsx`):
1. Uses native browser `confirm()` - not Polaris design system
2. Button shows for free plan users (nothing to cancel)
3. No information about cancellation consequences
4. Poor button labels could cause accidental cancellations

---

## Solution

**Pattern:** Polaris `<s-modal>` with command-based control
**UX:** Show what user loses, clear button labels, destructive styling
**Logic:** Conditional render based on `subscription` existence

### Before
```tsx
<s-button onClick={() => {
  if (confirm("Are you sure?")) {
    // submit cancellation
  }
}}>
  Cancel Subscription
</s-button>
```

### After
```tsx
{subscription && (
  <>
    <s-button commandFor="cancel-subscription-modal" command="--show">
      Cancel Subscription
    </s-button>

    <s-modal id="cancel-subscription-modal" heading="Cancel your subscription?">
      <s-stack gap="base">
        <s-paragraph>Current plan: {planName} (${basePrice}/month)</s-paragraph>
        <s-paragraph>You'll lose: {quota} generations, premium features...</s-paragraph>
        <s-paragraph tone="caution">Immediate effect, cannot be undone.</s-paragraph>
      </s-stack>

      <s-button slot="primary-action" tone="critical" onClick={handleCancelConfirm}>
        Yes, cancel subscription
      </s-button>
      <s-button slot="secondary-actions" commandFor="..." command="--hide">
        Keep my subscription
      </s-button>
    </s-modal>
  </>
)}
```

---

## Documentation Structure

```
plans/20251203-0748-cancel-subscription-ui-improvement/
├── README.md (this file)
├── plan.md (overview, architecture, specs)
├── phase-01-implement-cancel-modal.md (detailed implementation)
└── research/
    ├── researcher-01-polaris-web-component-modals.md
    └── researcher-02-cancel-ux-best-practices.md
```

### Reading Order
1. **Start:** `README.md` (quick context)
2. **Plan:** `plan.md` (architecture & design decisions)
3. **Implementation:** `phase-01-implement-cancel-modal.md` (step-by-step code)
4. **Research:** `research/*.md` (background & rationale)

---

## Key Design Decisions

### 1. Use `<s-modal>` (NOT `<ui-modal>`)
**Why:** Simpler, no iframe, direct HTML content, better performance (2025 overhaul)
**Source:** `research/researcher-01-polaris-web-component-modals.md`

### 2. Button Labels
- **Primary (destructive):** "Yes, cancel subscription"
- **Secondary (safe):** "Keep my subscription"

**Why:** Avoids confusion with ambiguous "Cancel" label, uses same terminology as modal heading
**Source:** `research/researcher-02-cancel-ux-best-practices.md` section 1.3

### 3. Conditional Rendering (`{subscription && ...}`)
**Why:** Free plan users have nothing to cancel, button would error
**Pattern:** Simple existence check, no complex logic

### 4. What to Show in Modal
- Current plan name & price
- Features user will lose (specific, not generic)
- Warning about immediate effect
- NO retention offers (out of scope for v1)

**Why:** Balance information vs simplicity, avoid feeling like trap
**Source:** `research/researcher-02-cancel-ux-best-practices.md` section 1.2

---

## Technical Highlights

### Polaris Patterns Used
- Command-based modal control (`commandFor` + `command`)
- Slot-based button placement (`slot="primary-action"`)
- Destructive action styling (`tone="critical"`)
- Layout components (`<s-stack>`, `<s-box>`)

### React Router Patterns
- `useSubmit()` hook for form submission
- FormData API for action payloads
- Automatic modal close on navigation state change

### TypeScript Safety
- Typed loader data (`subscription`, `quota`)
- Null handling via conditional rendering
- No type assertions needed (`as`, `!`)

---

## Testing Strategy

### Manual Tests
1. Free plan user → button hidden
2. Paid plan user → button visible, modal opens
3. "Keep my subscription" → modal closes, no action
4. "Yes, cancel subscription" → form submits, success banner
5. Network error → error banner

### Keyboard/A11y Tests
1. Tab navigation works
2. Escape closes modal
3. Screen reader announces heading & warning
4. Focus trap in modal

---

## Out of Scope (Future)

**Not included in this phase:**
- Retention offers (pause, discount, downgrade)
- Cancellation reason survey
- Email confirmation
- Multi-step flow
- Win-back campaigns

**Reference:** `research/researcher-02-cancel-ux-best-practices.md` for retention patterns if needed in future.

---

## Success Metrics

**UX:**
- ✅ Polaris design system consistency
- ✅ Clear consequences before cancellation
- ✅ Reduced accidental cancellations
- ✅ No confusing button labels

**Technical:**
- ✅ No native browser dialogs
- ✅ Type-safe implementation
- ✅ Accessible modal
- ✅ Clean conditional rendering

---

## Implementation Phases

### Phase 1: Implement Cancel Modal (ONLY PHASE)
**File:** `app/routes/app.billing.tsx`
**Steps:**
1. Add `handleCancelConfirm()` handler
2. Update cancel button (conditional + command-based)
3. Add `<s-modal>` component
4. Add loading state (optional)

**Details:** See `phase-01-implement-cancel-modal.md`

---

## References

### Code Standards
- `docs/code-standards.md` - Polaris web components, TypeScript, React patterns
- `.claude/workflows/development-rules.md` - File size, quality guidelines

### Polaris Documentation
- [Modal Component](https://shopify.dev/docs/api/app-home/polaris-web-components/overlays/modal)
- [Modal Best Practices](https://shopify.dev/docs/api/app-home/polaris-web-components/overlays/modal#best-practices)
- [Destructive Actions](https://polaris.shopify.com/patterns/common-actions)

### Current Implementation
- File: `app/routes/app.billing.tsx`
- Lines: 247-260 (current cancel button)
- Loader data: `subscription`, `quota` objects

---

## Status

**Current:** Ready for Implementation
**Blocked By:** None
**Blocks:** None

---

## Quick Start for Implementer

1. Read `phase-01-implement-cancel-modal.md`
2. Open `app/routes/app.billing.tsx`
3. Follow steps 1-4 in sequence
4. Test all scenarios (free plan, paid plan, errors)
5. Commit with message: `feat(billing): replace confirm() with Polaris modal for subscription cancellation`

**Estimated Time:** 30-45 minutes

---

**Created By:** Planning Agent
**Last Updated:** 2025-12-03
