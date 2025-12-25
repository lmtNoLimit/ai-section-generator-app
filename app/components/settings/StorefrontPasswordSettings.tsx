/**
 * StorefrontPasswordSettings - UI for configuring storefront password
 * Enables native Liquid preview on password-protected development stores
 */

import { useState } from "react";
import { useFetcher } from "react-router";

interface Props {
  hasPassword: boolean;
  verifiedAt: string | null;
}

export function StorefrontPasswordSettings({ hasPassword, verifiedAt }: Props) {
  const [password, setPassword] = useState("");
  const fetcher = useFetcher();

  const isSubmitting = fetcher.state === "submitting";
  const actionData = fetcher.data as
    | { success: boolean; error?: string; message?: string }
    | undefined;

  const verifiedTime = verifiedAt ? formatRelativeTime(verifiedAt) : null;

  const handlePasswordChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    setPassword(target.value);
  };

  const handleSavePassword = () => {
    const formData = new FormData();
    formData.append("intent", "saveStorefrontPassword");
    formData.append("password", password);
    fetcher.submit(formData, { method: "post" });
    setPassword(""); // Clear input after submit
  };

  const handleClearPassword = () => {
    const formData = new FormData();
    formData.append("intent", "clearStorefrontPassword");
    fetcher.submit(formData, { method: "post" });
  };

  return (
    <s-section heading="Native Preview">
      <s-stack gap="base" direction="block">
        <s-text>
          Enter your storefront password to enable native Liquid preview on
          password-protected stores. Find this in: <strong>Online Store → Preferences → Password protection</strong>
        </s-text>

        {/* Status Banner */}
        {hasPassword && (
          <s-banner tone="success">
            Storefront password configured
            {verifiedTime && ` (verified ${verifiedTime})`}
          </s-banner>
        )}

        {!hasPassword && (
          <s-banner tone="warning">
            No storefront password configured. Native preview disabled on
            password-protected stores.
          </s-banner>
        )}

        {/* Action Feedback */}
        {actionData?.error && (
          <s-banner tone="critical">
            {actionData.error}
          </s-banner>
        )}

        {actionData?.success && actionData?.message && (
          <s-banner tone="success">
            {actionData.message}
          </s-banner>
        )}

        {/* Password Input Form */}
        <s-stack direction="inline" gap="small" alignItems="end">
          <div style={{ flex: 1, minWidth: "200px" }}>
            <s-password-field
              label="Storefront Password"
              name="password"
              value={password}
              onInput={handlePasswordChange}
              placeholder={hasPassword ? "••••••••" : "Enter password"}
              autocomplete="off"
            />
          </div>

          <s-button
            variant="primary"
            onClick={handleSavePassword}
            loading={isSubmitting || undefined}
            disabled={!password || isSubmitting || undefined}
          >
            {hasPassword ? "Update" : "Save"}
          </s-button>
        </s-stack>

        {/* Clear Password */}
        {hasPassword && (
          <s-button
            variant="tertiary"
            tone="critical"
            onClick={handleClearPassword}
            disabled={isSubmitting || undefined}
          >
            Clear stored password
          </s-button>
        )}
      </s-stack>
    </s-section>
  );
}

/**
 * Format ISO timestamp as relative time (e.g., "5 min ago")
 */
function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins} min ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
}
