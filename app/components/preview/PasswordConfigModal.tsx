/**
 * PasswordConfigModal - In-context password configuration for preview
 * Appears when preview detects password-protected store without valid auth
 */

import { useState, useRef, useEffect } from "react";
import { useFetcher } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";

interface PasswordConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

/** Modal ID for programmatic control */
export const PASSWORD_MODAL_ID = "preview-password-modal";

export function PasswordConfigModal({
  isOpen,
  onClose,
  onSuccess,
}: PasswordConfigModalProps) {
  const [password, setPassword] = useState("");
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const modalRef = useRef<any>(null);
  /* eslint-enable @typescript-eslint/no-explicit-any */
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  // Track if success was already handled to prevent infinite loops
  const successHandledRef = useRef(false);

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

  // Reset success handled flag when submitting new request
  useEffect(() => {
    if (fetcher.state === "submitting") {
      successHandledRef.current = false;
    }
  }, [fetcher.state]);

  // Handle API response with toast notification (once per submission)
  useEffect(() => {
    if (fetcher.state !== "idle" || !fetcher.data) return;
    // Prevent handling the same success response multiple times
    if (successHandledRef.current) return;

    const data = fetcher.data as { success: boolean; error?: string };

    if (data.success) {
      successHandledRef.current = true;
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
    >
      <s-stack gap="base" direction="block">
        <s-text>
          This store is password-protected. Enter the storefront password to
          enable preview. Find it in:{" "}
          <strong>Online Store → Preferences → Password protection</strong>
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
