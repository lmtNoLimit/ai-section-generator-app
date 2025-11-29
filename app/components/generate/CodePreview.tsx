import { useState } from 'react';

export interface CodePreviewProps {
  code: string;
  maxHeight?: string;
  fileName?: string;
  onCopy?: () => void;
  onDownload?: () => void;
}

/**
 * Enhanced code preview with copy and download buttons
 * Shows generated Liquid code in a formatted, scrollable container
 */
export function CodePreview({
  code,
  maxHeight = '500px',
  fileName = 'section',
  onCopy,
  onDownload
}: CodePreviewProps) {
  const [copySuccess, setCopySuccess] = useState(false);

  if (!code) {
    return null;
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopySuccess(true);
      onCopy?.();

      // Reset success state after 2 seconds
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleDownload = () => {
    // Sanitize filename (replace special chars with dashes)
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9-_]/g, '-');

    // Create blob and download link
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${sanitizedName}.liquid`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    onDownload?.();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--p-space-300)' }}>
      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 'var(--p-space-200)', justifyContent: 'flex-end' }}>
        <s-button
          onClick={handleCopy}
          size="slim"
          variant="secondary"
        >
          {copySuccess ? '✓ Copied!' : 'Copy Code'}
        </s-button>

        <s-button
          onClick={handleDownload}
          size="slim"
          variant="secondary"
        >
          Download
        </s-button>
      </div>

      {/* Code display */}
      <s-box padding="400" background="bg-surface-secondary" border-radius="200">
        <pre
          style={{
            overflowX: 'auto',
            overflowY: 'auto',
            maxHeight,
            margin: 0,
            fontFamily: 'Monaco, Courier, monospace',
            fontSize: '13px',
            lineHeight: '1.6',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}
        >
          {code}
        </pre>
      </s-box>
    </div>
  );
}
