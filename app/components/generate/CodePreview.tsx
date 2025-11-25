export interface CodePreviewProps {
  code: string;
  maxHeight?: string;
}

/**
 * Code preview display
 * Shows generated Liquid code in a formatted, scrollable container
 */
export function CodePreview({
  code,
  maxHeight = '400px'
}: CodePreviewProps) {
  if (!code) {
    return null;
  }

  return (
    <s-box padding="400" background="bg-surface-secondary" border-radius="200">
      <pre
        style={{
          overflowX: 'auto',
          maxHeight,
          margin: 0,
          fontFamily: 'Monaco, Courier, monospace',
          fontSize: '14px',
          lineHeight: '1.5'
        }}
      >
        {code}
      </pre>
    </s-box>
  );
}
