export interface EmptyStateProps {
  heading: string;
  message: string;
  icon?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Empty state for preview column
 * Displayed when no code generated yet
 */
export function EmptyState({
  heading,
  message,
  icon = '📝',
  action
}: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--p-space-800)',
        gap: 'var(--p-space-400)'
      }}
    >
      <div style={{ fontSize: '48px', opacity: 0.5 }}>{icon}</div>

      <s-text variant="headingMd" as="h3">
        {heading}
      </s-text>

      <s-text variant="bodyMd" tone="subdued">
        {message}
      </s-text>

      {action && (
        <s-button onClick={action.onClick} variant="secondary">
          {action.label}
        </s-button>
      )}
    </div>
  );
}
