interface GenerationsEmptyStateProps {
  hasFilters: boolean;
  onClearFilters: () => void;
  onCreateNew: () => void;
}

/**
 * Empty state component for generations page following Shopify Index pattern
 */
export function GenerationsEmptyState({
  hasFilters,
  onClearFilters,
  onCreateNew
}: GenerationsEmptyStateProps) {
  if (hasFilters) {
    return (
      <s-section accessibilityLabel="Empty state section">
        <s-grid gap="base" justifyItems="center" paddingBlock="large-400">
          <s-grid justifyItems="center" maxInlineSize="450px" gap="base">
            <s-stack alignItems="center">
              <s-heading>No matching generations</s-heading>
              <s-paragraph>
                No generations match your current filters. Try adjusting or clearing your filters.
              </s-paragraph>
            </s-stack>
            <s-button-group>
              <s-button slot="secondary-actions" onClick={onClearFilters}>
                Clear filters
              </s-button>
              <s-button slot="primary-action" variant="primary" onClick={onCreateNew}>
                Create new generation
              </s-button>
            </s-button-group>
          </s-grid>
        </s-grid>
      </s-section>
    );
  }

  return (
    <s-section accessibilityLabel="Empty state section">
      <s-grid gap="base" justifyItems="center" paddingBlock="large-400">
        <s-box maxInlineSize="200px" maxBlockSize="200px">
          <s-image
            aspectRatio="1/0.5"
            src="https://cdn.shopify.com/static/images/polaris/patterns/callout.png"
            alt="A stylized graphic representing AI section generation"
          />
        </s-box>
        <s-grid justifyItems="center" maxInlineSize="450px" gap="base">
          <s-stack alignItems="center">
            <s-heading>Start generating sections</s-heading>
            <s-paragraph>
              Create AI-powered Liquid sections for your Shopify theme. Describe what you want
              and let AI generate production-ready code.
            </s-paragraph>
          </s-stack>
          <s-button-group>
            <s-button
              slot="secondary-actions"
              accessibilityLabel="Learn more about AI section generation"
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
              Generate Section
            </s-button>
          </s-button-group>
        </s-grid>
      </s-grid>
    </s-section>
  );
}
