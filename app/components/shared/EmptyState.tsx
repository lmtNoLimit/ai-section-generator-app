interface EmptyStateProps {
  heading: string;
  description: string;
  primaryAction: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  image?: string;
}

/**
 * Reusable empty state component following Polaris patterns
 */
export function EmptyState({
  heading,
  description,
  primaryAction,
  secondaryAction,
  image
}: EmptyStateProps) {
  return (
    <s-grid gap="base" justifyItems="center" paddingBlock="large-400">
      {image && (
        <s-box maxInlineSize="200px" maxBlockSize="200px">
          <s-image aspectRatio="1/0.5" src={image} alt="" />
        </s-box>
      )}
      <s-grid justifyItems="center" maxInlineSize="450px" gap="base">
        <s-stack alignItems="center">
          <s-heading>{heading}</s-heading>
          <s-paragraph>{description}</s-paragraph>
        </s-stack>
        <s-button-group>
          {secondaryAction && (
            <s-button onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </s-button>
          )}
          <s-button variant="primary" onClick={primaryAction.onClick}>
            {primaryAction.label}
          </s-button>
        </s-button-group>
      </s-grid>
    </s-grid>
  );
}
