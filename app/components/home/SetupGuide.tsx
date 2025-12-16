import { Fragment, useEffect, useState } from "react";
import { useFetcher, useNavigate } from "react-router";

interface OnboardingState {
  hasGeneratedSection: boolean;
  hasSavedTemplate: boolean;
  hasViewedHistory: boolean;
  isDismissed: boolean;
}

interface SetupGuideProps {
  onboarding: OnboardingState;
}

const SETUP_STEPS = [
  {
    id: "generate",
    title: "Create your first section",
    description:
      "Describe what you want in natural language and get production-ready Liquid code for your Shopify theme.",
    href: "/app/sections/new",
    completionKey: "hasGeneratedSection" as const,
    actionLabel: "Create section",
    image: "/images/onboarding/generate-section.svg",
    imageAlt: "AI code generation illustration",
  },
  {
    id: "template",
    title: "Save a template for reuse",
    description:
      "Save your best prompts as templates so you can quickly generate similar sections in the future.",
    href: "/app/templates",
    completionKey: "hasSavedTemplate" as const,
    actionLabel: "View templates",
    image: "/images/onboarding/save-template.svg",
    imageAlt: "Template saving illustration",
  },
  {
    id: "history",
    title: "Check your section history",
    description:
      "View all the sections you've created, mark favorites, and quickly access previous work.",
    href: "/app/sections",
    completionKey: "hasViewedHistory" as const,
    actionLabel: "View sections",
    image: "/images/onboarding/view-history.svg",
    imageAlt: "History review illustration",
  },
];

export function SetupGuide({ onboarding }: SetupGuideProps) {
  const fetcher = useFetcher();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({
    generate: true,
  });
  const [showCelebration, setShowCelebration] = useState(false);

  // Calculate completion
  const completedCount = SETUP_STEPS.filter(
    (s) => onboarding[s.completionKey]
  ).length;
  const allComplete = completedCount === SETUP_STEPS.length;
  const progressPercentage = (completedCount / SETUP_STEPS.length) * 100;

  // Celebration effect: show banner briefly before auto-dismiss
  useEffect(() => {
    if (allComplete && !onboarding.isDismissed && !showCelebration) {
      setShowCelebration(true);
      const timer = setTimeout(() => {
        fetcher.submit({ intent: "dismissOnboarding" }, { method: "post" });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [allComplete, onboarding.isDismissed, showCelebration, fetcher]);

  // Don't show if dismissed
  if (onboarding.isDismissed) return null;

  // Show celebration banner when all complete
  if (showCelebration) {
    return (
      <s-section>
        <s-banner tone="success" heading="Setup Complete!">
          <s-paragraph>
            Great job! You&apos;ve completed all setup steps. You&apos;re ready to create
            amazing sections!
          </s-paragraph>
        </s-banner>
      </s-section>
    );
  }

  const handleDismiss = () => {
    fetcher.submit({ intent: "dismissOnboarding" }, { method: "post" });
  };

  const toggleStep = (stepId: string) => {
    setExpandedSteps((prev) => ({
      ...prev,
      [stepId]: !prev[stepId],
    }));
  };

  return (
    <s-section>
      <s-grid gap="base">
        {/* Header */}
        <s-grid gap="small-200">
          <s-grid
            gridTemplateColumns="1fr auto auto"
            gap="small-300"
            alignItems="center"
          >
            <s-heading>Setup Guide</s-heading>
            <s-button
              accessibilityLabel="Dismiss setup guide"
              onClick={handleDismiss}
              variant="tertiary"
              tone="neutral"
              icon="x"
            />
            <s-button
              accessibilityLabel={isExpanded ? "Collapse setup guide" : "Expand setup guide"}
              onClick={() => setIsExpanded(!isExpanded)}
              variant="tertiary"
              tone="neutral"
              icon={isExpanded ? "chevron-up" : "chevron-down"}
            />
          </s-grid>
          <s-paragraph>
            Complete these steps to get the most out of AI Section Generator.
          </s-paragraph>
          <s-stack direction="inline" gap="small-200" alignItems="center">
            <s-paragraph color="subdued">
              {completedCount} of {SETUP_STEPS.length} steps completed
            </s-paragraph>
          </s-stack>
          {/* Progress Bar */}
          <s-box background="subdued" borderRadius="base" overflow="hidden">
            <s-box
              background="strong"
              minBlockSize="4px"
              inlineSize={`${progressPercentage}%`}
            />
          </s-box>
        </s-grid>

        {/* Steps Container */}
        <s-box
          borderRadius="base"
          border="base"
          background="base"
          display={isExpanded ? "auto" : "none"}
        >
          {SETUP_STEPS.map((step, i) => {
            const completed = onboarding[step.completionKey];
            const stepExpanded = expandedSteps[step.id];

            return (
              <Fragment key={step.id}>
                <s-box>
                  {/* Step Header */}
                  <s-grid
                    gridTemplateColumns="1fr auto"
                    gap="base"
                    padding="small"
                    alignItems="center"
                  >
                    <s-stack direction="inline" gap="small-200" alignItems="center">
                      {completed ? (
                        <s-badge tone="success" icon="check">Done</s-badge>
                      ) : (
                        <s-badge tone="caution">To do</s-badge>
                      )}
                      <s-text type="strong">{step.title}</s-text>
                    </s-stack>
                    <s-button
                      accessibilityLabel={`${stepExpanded ? "Collapse" : "Expand"} ${step.title} details`}
                      onClick={() => toggleStep(step.id)}
                      variant="tertiary"
                      icon={stepExpanded ? "chevron-up" : "chevron-down"}
                    />
                  </s-grid>

                  {/* Step Details (Expandable) */}
                  <s-box
                    padding="small"
                    paddingBlockStart="none"
                    display={stepExpanded ? "auto" : "none"}
                  >
                    <s-box padding="base" background="subdued" borderRadius="base">
                      <s-grid
                        gridTemplateColumns="1fr auto"
                        gap="base"
                        alignItems="center"
                      >
                        <s-grid gap="small-200">
                          <s-paragraph>{step.description}</s-paragraph>
                          <s-stack direction="inline" gap="small-200">
                            <s-button
                              variant={completed ? "secondary" : "primary"}
                              accessibilityLabel={`${completed ? "Revisit" : "Start"}: ${step.title}`}
                              onClick={() => navigate(step.href)}
                            >
                              {completed ? "Revisit" : step.actionLabel}
                            </s-button>
                          </s-stack>
                        </s-grid>
                        <s-box minInlineSize="100px" maxInlineSize="100px">
                          <s-image
                            src={step.image}
                            alt={step.imageAlt}
                          />
                        </s-box>
                      </s-grid>
                    </s-box>
                  </s-box>
                </s-box>

                {/* Divider between steps */}
                {i < SETUP_STEPS.length - 1 && <s-divider />}
              </Fragment>
            );
          })}
        </s-box>
      </s-grid>
    </s-section>
  );
}
