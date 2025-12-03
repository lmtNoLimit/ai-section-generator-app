/**
 * Individual plan card component
 * Displays pricing, features, and selection CTA
 */

import { useState } from "react";
import type { PlanConfig } from "../../types/billing";

interface PlanCardProps {
  plan: PlanConfig;
  isCurrentPlan: boolean;
  onSelect: () => void;
}

export function PlanCard({ plan, isCurrentPlan, onSelect }: PlanCardProps) {
  const [expanded, setExpanded] = useState(false);

  // Determine badge tone
  const badgeTone =
    plan.badge === "Popular"
      ? "success"
      : plan.badge === "Best Value"
        ? "warning"
        : "info";

  return (
    <s-box
      border="base"
      borderRadius="base"
      padding="base"
      background={plan.badge ? "subdued" : "base"}
    >
      <s-grid gap="base">
        <s-stack direction="inline" gap="large small-300">
          {/* Plan Name */}
          <s-heading>{plan.displayName}</s-heading>
          {/* Badge (Popular/Best Value) */}
          {plan.badge && <s-badge tone={badgeTone}>{plan.badge}</s-badge>}
        </s-stack>

        {/* Pricing */}
        <s-grid gap="small-100">
          <s-text type="strong" fontVariantNumeric="tabular-nums">
            ${plan.basePrice}/month
          </s-text>
        </s-grid>

        {/* Features List */}
        <s-grid gap="small-100">
          {plan.features.slice(0, 3).map((feature, i) => (
            <s-grid
              key={i}
              gridTemplateColumns="auto 1fr"
              gap="small-100"
              alignItems="center"
            >
              <s-text>✓ {feature}</s-text>
            </s-grid>
          ))}

          {/* Progressive Disclosure: More Features */}
          {plan.features.length > 3 && (
            <>
              <s-box display={expanded ? "auto" : "none"}>
                <s-grid gap="small-100">
                  {plan.features.slice(3).map((feature, i) => (
                    <s-grid
                      key={i}
                      gridTemplateColumns="auto 1fr"
                      gap="small-100"
                      alignItems="center"
                    >
                      <s-text>✓ {feature}</s-text>
                    </s-grid>
                  ))}
                </s-grid>
              </s-box>
              <s-button
                variant="tertiary"
                onClick={() => setExpanded(!expanded)}
                accessibilityLabel={
                  expanded
                    ? "Show less features"
                    : `Show ${plan.features.length - 3} more features`
                }
              >
                {expanded
                  ? "Show less"
                  : `Show ${plan.features.length - 3} more`}
              </s-button>
            </>
          )}
        </s-grid>

        {/* CTA Button */}
        <s-box>
          <s-button
            variant={plan.badge ? "primary" : "secondary"}
            onClick={onSelect}
            disabled={isCurrentPlan}
            accessibilityLabel={
              isCurrentPlan
                ? `Current plan: ${plan.displayName}`
                : `Select ${plan.displayName} plan`
            }
          >
            {isCurrentPlan ? "Current Plan" : `Select ${plan.displayName}`}
          </s-button>
        </s-box>
      </s-grid>
    </s-box>
  );
}
