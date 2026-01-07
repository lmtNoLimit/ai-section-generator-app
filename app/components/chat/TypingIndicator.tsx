/**
 * TypingIndicator component - Shows AI is thinking animation
 * Uses pure Polaris Web Components with minimal inline CSS for dot animation
 */

// Inline styles for typing dots animation
const typingStyles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 0',
  },
  dot: (delay: number) => ({
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: 'var(--p-color-text-secondary)',
    animation: 'typing-bounce 1.4s infinite ease-in-out',
    animationDelay: `${delay}s`,
  }),
  bubbleRadius: {
    borderRadius: '16px 16px 16px 4px',
  },
} as const;

export function TypingIndicator() {
  return (
    <s-box padding="small" accessibilityRole="status" accessibilityLabel="AI is thinking">
      <s-stack direction="inline" gap="small" alignItems="center">
        <s-avatar initials="AI" size="small" />
        <div style={{ ...typingStyles.bubbleRadius }}>
          <s-box
            background="subdued"
            border="small"
            borderColor="subdued"
            padding="small base"
          >
            <div style={typingStyles.container}>
            <span style={typingStyles.dot(0)} />
            <span style={typingStyles.dot(0.16)} />
            <span style={typingStyles.dot(0.32)} />
            </div>
          </s-box>
        </div>
      </s-stack>
    </s-box>
  );
}
