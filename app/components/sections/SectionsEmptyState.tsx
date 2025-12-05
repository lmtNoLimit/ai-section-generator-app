interface SectionsEmptyStateProps {
  hasFilters: boolean;
  onClearFilters: () => void;
  onCreateNew: () => void;
}

/**
 * Empty state component for sections page following Shopify Index pattern
 */
export function SectionsEmptyState({
  hasFilters,
  onClearFilters,
  onCreateNew
}: SectionsEmptyStateProps) {
  if (hasFilters) {
    return (
      <s-section accessibilityLabel="Empty state section">
        <s-grid gap="base" justifyItems="center" paddingBlock="large-400">
          <s-grid justifyItems="center" maxInlineSize="450px" gap="base">
            <s-stack alignItems="center">
              <s-heading>No matching sections</s-heading>
              <s-paragraph>
                No sections match your current filters. Try adjusting or clearing your filters.
              </s-paragraph>
            </s-stack>
            <s-button-group>
              <s-button slot="secondary-actions" onClick={onClearFilters}>
                Clear filters
              </s-button>
              <s-button slot="primary-action" variant="primary" onClick={onCreateNew}>
                Create new section
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
