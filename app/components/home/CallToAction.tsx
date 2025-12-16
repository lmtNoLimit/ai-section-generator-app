import { useFetcher, useNavigate } from "react-router";
import type { CTAState, CTAConfig } from "../../types/dashboard.types";

interface CallToActionProps {
  cta: CTAState;
  config?: CTAConfig;
}

// Default CTA configuration
const DEFAULT_CTA: CTAConfig = {
  id: "templates-promo",
  type: "feature",
  title: "Save Time with Templates",
  description:
    "Create reusable prompt templates to generate consistent sections faster. Perfect for building your design system.",
  primaryAction: {
    label: "Explore Templates",
    href: "/app/templates",
  },
  secondaryAction: {
    label: "Maybe Later",
    onClick: "dismiss",
  },
  tone: "info",
};

export function CallToAction({ cta, config = DEFAULT_CTA }: CallToActionProps) {
  const fetcher = useFetcher({ key: "cta-dismiss" });
  const navigate = useNavigate();
  const isDismissing = fetcher.state !== "idle";

  // Don't show if dismissed or currently dismissing
  if (cta.isDismissed || isDismissing) return null;

  const handleDismiss = () => {
    fetcher.submit({ intent: "dismissCTA" }, { method: "post" });
  };

  const handlePrimaryAction = () => {
    navigate(config.primaryAction.href);
  };

  const handleSecondaryAction = () => {
    if (config.secondaryAction?.onClick === "dismiss") {
      handleDismiss();
    } else if (config.secondaryAction?.href) {
      navigate(config.secondaryAction.href);
    }
  };

  return (
    <s-section>
      <s-banner
        tone={config.tone || "info"}
        heading={config.title}
        dismissible
        onAfterHide={handleDismiss}
      >
        <s-stack gap="base" direction="block">
          <s-paragraph>{config.description}</s-paragraph>
          <s-stack gap="small-200" direction="inline">
            <s-button variant="primary" onClick={handlePrimaryAction}>
              {config.primaryAction.label}
            </s-button>
            {config.secondaryAction && (
              <s-button variant="tertiary" onClick={handleSecondaryAction}>
                {config.secondaryAction.label}
              </s-button>
            )}
          </s-stack>
        </s-stack>
      </s-banner>
    </s-section>
  );
}
