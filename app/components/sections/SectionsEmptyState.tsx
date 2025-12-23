interface SectionsEmptyStateProps {
  onCreateNew: () => void;
}

/**
 * Empty state component for sections page when no sections exist at all.
 * Shows the initial onboarding experience to create the first section.
 */
export function SectionsEmptyState({ onCreateNew }: SectionsEmptyStateProps) {
  return (
    <s-section accessibilityLabel="Empty state section">
      <s-grid gap="base" justifyItems="center" paddingBlock="large-400">
        <s-box maxInlineSize="200px" maxBlockSize="200px">
          <s-image
            aspectRatio="1/0.5"
            src="https://cdn.shopify.com/static/images/polaris/patterns/callout.png"
            alt="A stylized graphic representing AI section creation"
          />
        </s-box>
        <s-grid justifyItems="center" maxInlineSize="450px" gap="base">
          <s-stack alignItems="center">
            <s-heading>Create your first section</s-heading>
            <s-paragraph>
              Create AI-powered Liquid sections for your Shopify theme. Describe what you want
              and let AI generate production-ready code.
            </s-paragraph>
          </s-stack>
          <s-button-group>
            <s-button
              slot="secondary-actions"
              accessibilityLabel="Learn more about AI section creation"
              href="/app"
            >
              Learn more
            </s-button>
            <s-button
              slot="primary-action"
              variant="primary"
              accessibilityLabel="Create your first AI section"
              onClick={onCreateNew}
            >
              Create Section
            </s-button>
          </s-button-group>
        </s-grid>
      </s-grid>
    </s-section>
  );
}
