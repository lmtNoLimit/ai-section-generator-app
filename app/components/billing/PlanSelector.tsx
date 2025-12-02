/**
 * Plan Selector Component
 * 3-tier pricing cards with responsive grid layout
 */

import { PlanCard } from "./PlanCard";
import type { PlanConfig, PlanTier } from "../../types/billing";

interface PlanSelectorProps {
  plans: PlanConfig[];
  currentPlan: PlanTier | null;
  onSelect: (planName: PlanTier) => void;
}

export function PlanSelector({ plans, currentPlan, onSelect }: PlanSelectorProps) {
  return (
    <s-section heading="Choose Your Plan" id="plan-selector">
      <s-grid gap="base">
        <s-paragraph color="subdued">
          All plans include unlimited themes, priority support, and 14-day free trial
        </s-paragraph>

        {/* Responsive 3-column grid */}
        <s-grid
          gridTemplateColumns="repeat(auto-fit, minmax(280px, 1fr))"
          gap="base"
        >
          {plans.map(plan => (
            <PlanCard
              key={plan.planName}
              plan={plan}
              isCurrentPlan={currentPlan === plan.planName}
              onSelect={() => onSelect(plan.planName)}
            />
          ))}
        </s-grid>

        {/* Pricing Details */}
        <s-box border="base" borderRadius="base" padding="base" background="subdued">
          <s-grid gap="small-200">
            <s-text type="strong">Pricing Details</s-text>
            <s-paragraph color="subdued">
              • Base price charged monthly, usage charges billed at end of cycle
            </s-paragraph>
            <s-paragraph color="subdued">
              • Overage charges apply beyond included sections
            </s-paragraph>
            <s-paragraph color="subdued">
              • Usage caps prevent unexpected charges
            </s-paragraph>
            <s-paragraph color="subdued">
              • Cancel anytime, no refunds for partial months
            </s-paragraph>
          </s-grid>
        </s-box>
      </s-grid>
    </s-section>
  );
}
