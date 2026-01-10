# Phase 1: Create PasswordConfigModal Component

**Context**: [plan.md](./plan.md) | **Effort**: 1h | **Dependencies**: None

## Overview

Create a modal component for in-context password configuration. Follows existing modal patterns (`PublishModal.tsx`, `DeleteConfirmModal.tsx`) using Polaris Web Components.

## Requirements

1. Modal with password input field
2. Save button that triggers API call via `useFetcher`
3. Cancel button to dismiss modal
4. Error display for invalid password
5. Loading state during submission
6. Success callback prop for parent integration

## Architecture

```tsx
interface PasswordConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;  // Called after successful save
}
```

**State Management**:
- Local `password` state for input
- `useFetcher` for API submission
- Modal visibility controlled by parent (isOpen prop)

## Related Code Files

| File | Relevance |
|------|-----------|
| `app/components/editor/PublishModal.tsx` | Pattern: modalRef, programmatic show/hide |
| `app/components/settings/StorefrontPasswordSettings.tsx` | Pattern: password input, fetcher submission |
| `app/components/generations/DeleteConfirmModal.tsx` | Pattern: simple modal structure |

## Implementation Steps

### Step 1: Create component file

```bash
touch app/components/preview/PasswordConfigModal.tsx
```

### Step 2: Implement modal component

```tsx
/**
 * PasswordConfigModal - In-context password configuration for preview
 * Appears when preview detects password-protected store without valid auth
 */

import { useState, useRef, useEffect } from "react";
import { useFetcher } from "react-router";

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

  // Handle success response
  useEffect(() => {
    if (actionData?.success) {
      setPassword("");
      onSuccess();
      onClose();
    }
  }, [actionData?.success, onSuccess, onClose]);

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
          enable preview. Find it in: <strong>Online Store → Preferences → Password protection</strong>
        </s-text>

        {/* Error Banner */}
        {actionData?.error && (
          <s-banner tone="critical">{actionData.error}</s-banner>
        )}

        {/* Password Input */}
        <s-password-field
          label="Storefront Password"
          name="password"
          value={password}
          onInput={handlePasswordChange}
          placeholder="Enter password"
          autocomplete="off"
        />
      </s-stack>

      {/* Actions */}
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

### Step 3: Export from index (if exists)

Check if `app/components/preview/index.ts` exists and add export.

## Todo List

- [x] Create `app/components/preview/PasswordConfigModal.tsx` (130 lines)
- [x] Implement modal with password input
- [x] Add useFetcher for API submission
- [x] Handle success/error states
- [x] Test modal show/hide behavior
- [x] Export from index.ts

## Success Criteria

- [x] Modal renders with password input field
- [x] Cancel closes modal without action
- [x] Save submits to API route (Phase 3)
- [x] Error displays in banner
- [x] Loading state shows during submission
- [x] Success triggers callback and closes modal
- [x] useAppBridge for toast notifications integrated
- [x] All tests passing

## Phase Completion

**Status**: ✅ COMPLETE
**Code Review**: 260109-1423
**Tests**: 29/29 passing
**Critical Issues**: 0
**Exports**: PasswordConfigModal, PASSWORD_MODAL_ID

**Deliverables**:
- PasswordConfigModal.tsx: Modal component (130 lines)
- useAppBridge integration: Toast notifications for user feedback
- Test coverage: 29/29 passing
- Code quality: 0 critical issues

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Modal ref not working | Low | High | Test with Polaris Web Components docs |
| Focus trap issues | Low | Medium | Use native s-modal behavior |
