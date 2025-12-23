interface EmptySearchResultProps {
  /** Main heading text (e.g., "No draft sections") */
  title: string;
  /** Description text explaining the empty state */
  description?: string;
}

/**
 * Reusable empty search result component following Shopify's pattern.
 * Used when filters/tabs return no results but data exists elsewhere.
 * Uses s-icon with "search" type as shown in Shopify admin.
 */
export function EmptySearchResult({ title, description }: EmptySearchResultProps) {
  return (
    <s-box paddingBlock="large-400">
      <s-stack direction="block" gap="small-200" alignItems="center">
        <s-icon type="search" />
        <s-text type="strong">{title}</s-text>
        {description && <s-text color="subdued">{description}</s-text>}
      </s-stack>
    </s-box>
  );
}
