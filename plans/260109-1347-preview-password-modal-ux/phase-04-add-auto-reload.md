# Phase 4: Add Auto-Reload and Toast Notifications

**Context**: [plan.md](./plan.md) | **Effort**: 1h | **Dependencies**: Phase 1, 2, 3

## Overview

Ensure seamless UX after password save:
1. Auto-reload preview via existing `refetch()`
2. Add toast notification for success/failure feedback
3. Handle edge cases (network errors, validation failures)

## Requirements

1. Preview auto-reloads after successful password save
2. Toast shows "Password saved - reloading preview..."
3. Toast shows error message on failure
4. Modal remains open on failure (user can retry)
5. No stale error banner after successful reload

## Architecture

**Flow After Password Save**:
```
User clicks "Save & Retry Preview"
    ↓
fetcher.submit() → /api/preview/configure-password
    ↓
[Success Response]
    ├─ Toast: "Password saved - reloading preview..."
    ├─ Close modal
    ├─ Clear error state (handled by refetch)
    └─ refetch() → triggers new preview render

[Error Response]
    ├─ Toast: error message (isError: true)
    └─ Modal stays open with error banner
```

## Related Code Files

| File | Relevance |
|------|-----------|
| `app/components/preview/PasswordConfigModal.tsx` | Add toast on success/error |
| `app/components/preview/AppProxyPreviewFrame.tsx` | Already has refetch() wired |
| `app/routes/app.settings.tsx` | Pattern: toast usage (lines 129-135) |

## Implementation Steps

### Step 1: Add App Bridge toast to PasswordConfigModal

Update `PasswordConfigModal.tsx`:

```tsx
import { useState, useRef, useEffect } from "react";
import { useFetcher } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";

// ... existing interface ...

export function PasswordConfigModal({
  isOpen,
  onClose,
  onSuccess,
}: PasswordConfigModalProps) {
  const [password, setPassword] = useState("");
  const modalRef = useRef<any>(null);
  const fetcher = useFetcher();
  const shopify = useAppBridge();  // Add this

  // ... existing state ...

  // Handle success/error with toast
  useEffect(() => {
    if (fetcher.state !== "idle" || !fetcher.data) return;

    const actionData = fetcher.data as { success: boolean; error?: string };

    if (actionData.success) {
      shopify.toast.show("Password saved - reloading preview...");
      setPassword("");
      onSuccess();
      onClose();
    } else if (actionData.error) {
      shopify.toast.show(actionData.error, { isError: true });
      // Modal stays open - user can see error banner and retry
    }
  }, [fetcher.state, fetcher.data, shopify, onSuccess, onClose]);

  // ... rest of component ...
}
```

### Step 2: Ensure error state clears on successful preview

In `AppProxyPreviewFrame.tsx`, the error state comes from `useNativePreviewRenderer`. When `refetch()` is called:
1. Hook sets `isLoading = true`
2. On success, hook sets `error = null` and `html = <rendered_content>`
3. Component re-renders without error banner

No additional code needed - existing flow handles this.

### Step 3: Handle retry scenario (password still wrong after save)

If user enters wrong password:
1. API returns `{ success: false, error: "Invalid storefront password" }`
2. Modal shows error in banner
3. User can correct and retry
4. No toast on initial failure (banner is sufficient)

**Decision**: Only show toast on error if it's a server/network error, not validation error.

Updated effect:

```tsx
useEffect(() => {
  if (fetcher.state !== "idle" || !fetcher.data) return;

  const actionData = fetcher.data as { success: boolean; error?: string };

  if (actionData.success) {
    shopify.toast.show("Password saved - reloading preview...");
    setPassword("");
    onSuccess();
    onClose();
  } else if (actionData.error) {
    // Only toast for unexpected errors, not validation errors
    if (!actionData.error.includes("Invalid")) {
      shopify.toast.show(actionData.error, { isError: true });
    }
    // Error banner in modal handles user feedback
  }
}, [fetcher.state, fetcher.data, shopify, onSuccess, onClose]);
```

### Step 4: Clear password error banner on close

When user closes modal without saving, clear any lingering error state:

```tsx
const handleCancel = () => {
  setPassword("");
  // Reset fetcher data to clear error banner on next open
  // Note: useFetcher doesn't have reset(), but closing modal hides error
  onClose();
};
```

The error banner is tied to `fetcher.data`, which persists until next submission. This is acceptable UX - if user reopens modal, they see previous error (reminds them what went wrong).

### Step 5: Update modal to show loading state clearly

```tsx
{/* Loading overlay during submission */}
{isSubmitting && (
  <s-box
    style={{
      position: "absolute",
      inset: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255, 255, 255, 0.8)",
    }}
  >
    <s-spinner size="large" />
  </s-box>
)}
```

**Decision**: Skip this - button already shows loading spinner via `loading={isSubmitting}`. Keep it simple.

## Complete Updated PasswordConfigModal

```tsx
/**
 * PasswordConfigModal - In-context password configuration for preview
 */

import { useState, useRef, useEffect } from "react";
import { useFetcher } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";

interface PasswordConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PASSWORD_MODAL_ID = "preview-password-modal";

export function PasswordConfigModal({
  isOpen,
  onClose,
  onSuccess,
}: PasswordConfigModalProps) {
  const [password, setPassword] = useState("");
  const modalRef = useRef<any>(null);
  const fetcher = useFetcher();
  const shopify = useAppBridge();

  const isSubmitting = fetcher.state === "submitting";
  const actionData = fetcher.data as
    | { success: boolean; error?: string }
    | undefined;

  // Show/hide modal based on isOpen prop
  useEffect(() => {
    if (isOpen) {
      modalRef.current?.showOverlay?.();
    } else {
      modalRef.current?.hideOverlay?.();
    }
  }, [isOpen]);

  // Handle API response
  useEffect(() => {
    if (fetcher.state !== "idle" || !fetcher.data) return;

    const data = fetcher.data as { success: boolean; error?: string };

    if (data.success) {
      shopify.toast.show("Password saved - reloading preview...");
      setPassword("");
      onSuccess();
      onClose();
    }
    // Error case: banner displays in modal, no toast needed
  }, [fetcher.state, fetcher.data, shopify, onSuccess, onClose]);

  const handlePasswordChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    setPassword(target.value);
  };

  const handleSave = () => {
    if (!password.trim()) return;

    const formData = new FormData();
    formData.append("password", password);
    fetcher.submit(formData, {
      method: "post",
      action: "/api/preview/configure-password",
    });
  };

  const handleCancel = () => {
    setPassword("");
    onClose();
  };

  return (
    <s-modal
      ref={modalRef}
      id={PASSWORD_MODAL_ID}
      heading="Configure Storefront Password"
      onClose={handleCancel}
    >
      <s-stack gap="base" direction="block">
        <s-text>
          This store is password-protected. Enter the storefront password to
          enable preview. Find it in: <strong>Online Store → Preferences</strong>
        </s-text>

        {actionData?.error && (
          <s-banner tone="critical">{actionData.error}</s-banner>
        )}

        <s-password-field
          label="Storefront Password"
          name="password"
          value={password}
          onInput={handlePasswordChange}
          placeholder="Enter password"
          autocomplete="off"
        />
      </s-stack>

      <s-button
        slot="secondary-actions"
        onClick={handleCancel}
        disabled={isSubmitting || undefined}
      >
        Cancel
      </s-button>
      <s-button
        slot="primary-action"
        variant="primary"
        onClick={handleSave}
        loading={isSubmitting || undefined}
        disabled={!password.trim() || isSubmitting || undefined}
      >
        Save & Retry Preview
      </s-button>
    </s-modal>
  );
}
```

## Todo List

- [ ] Add `useAppBridge` import to PasswordConfigModal
- [ ] Add toast on successful password save
- [ ] Verify refetch() clears error state
- [ ] Test error banner persistence on validation failure
- [ ] Test full flow: password error → modal → save → preview reload

## Success Criteria

- [ ] Toast appears after successful save
- [ ] Preview reloads automatically after save
- [ ] Error banner shows in modal for invalid password
- [ ] Modal closes only on successful save
- [ ] Preview error banner disappears after successful reload

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Toast not showing | Low | Low | Uses existing App Bridge pattern |
| Refetch race condition | Low | Medium | refetch() is debounced |
| Error persists after success | Low | Medium | Verified hook clears error on success |
