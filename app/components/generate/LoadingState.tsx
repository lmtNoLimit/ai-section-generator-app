export interface LoadingStateProps {
  message: string;
  subMessage?: string;
  size?: 'small' | 'large';
}

/**
 * Loading state with spinner and message
 * Used during generation or save operations
 */
export function LoadingState({
  message,
  subMessage,
  size = 'large'
}: LoadingStateProps) {
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
      <s-spinner size={size} />
      <s-text variant="bodyMd" tone="subdued">
        {message}
      </s-text>
      {subMessage && (
        <s-text variant="bodySm" tone="subdued">
          {subMessage}
        </s-text>
      )}
    </div>
  );
}
