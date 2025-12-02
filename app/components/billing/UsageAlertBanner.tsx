/**
 * Warning banner when approaching quota cap (>= 75%)
 * Shows upgrade CTA at 90% threshold
 * Dismissible with local storage persistence
 */

import { useState, useEffect } from "react";
import type { QuotaCheck } from "../../types/billing";

interface UsageAlertBannerProps {
  quota: QuotaCheck;
  onUpgradeClick: () => void;
}

export function UsageAlertBanner({ quota, onUpgradeClick }: UsageAlertBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  // Load dismissed state from localStorage
  useEffect(() => {
    const key = `usage-alert-dismissed-${quota.percentUsed}`;
    const isDismissed = localStorage.getItem(key) === "true";
    setDismissed(isDismissed);
  }, [quota.percentUsed]);

  // Don't show if <75% or already dismissed
  if (quota.percentUsed < 75 || dismissed) return null;

  const isCritical = quota.percentUsed >= 90;

  const handleDismiss = () => {
    setDismissed(true);
    const key = `usage-alert-dismissed-${quota.percentUsed}`;
    localStorage.setItem(key, "true");
  };

  return (
    <s-banner
      tone={isCritical ? "critical" : "warning"}
      onDismiss={handleDismiss}
    >
      <s-grid gap="small-200">
        <s-paragraph>
          {isCritical
            ? `⚠️ You've used ${Math.round(quota.percentUsed)}% of your monthly quota. Consider upgrading to avoid hitting your cap.`
            : `You've used ${Math.round(quota.percentUsed)}% of your monthly quota.`
          }
        </s-paragraph>
        {isCritical && (
          <s-stack direction="inline" gap="small-200">
            <s-button
              variant="primary"
              onClick={onUpgradeClick}
              accessibilityLabel="Upgrade your plan"
            >
              Upgrade Plan
            </s-button>
            <s-button variant="tertiary" href="/docs/billing">
              Learn more
            </s-button>
          </s-stack>
        )}
      </s-grid>
    </s-banner>
  );
}
