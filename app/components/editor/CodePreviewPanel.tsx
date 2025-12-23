import { useState, useCallback } from 'react';
import { CodePreview } from '../generate/CodePreview';
import { SectionPreview, PreviewErrorBoundary } from '../preview';

interface CodePreviewPanelProps {
  code: string;
  fileName: string;
}

// Flex-based layout for proper scrolling
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
    minHeight: 0,
  },
  header: {
    flexShrink: 0,
  },
  content: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
    background: 'var(--p-color-bg-surface-secondary)',
    padding: '16px',
  },
  innerContent: {
    flex: 1,
    minHeight: 0,
    overflow: 'auto',
  },
} as const;

/**
 * Tabbed panel for code editor and live preview
 * Uses Polaris s-button-group for segmented control
 */
export function CodePreviewPanel({ code, fileName }: CodePreviewPanelProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [copied, setCopied] = useState(false);

  const handleCopyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [code]);

  return (
    <div style={styles.container}>
      {/* Header with segmented control */}
      <div style={styles.header}>
        <s-box
          padding="base"
          borderWidth="none none small none"
          borderColor="subdued"
          background="base"
        >
          <s-stack direction="inline" justifyContent="space-between" alignItems="center">
            {/* Segmented control for Preview/Code */}
            <s-button-group gap="none" accessibilityLabel="View mode">
              <s-button
                slot="secondary-actions"
                variant={activeTab === 'preview' ? 'primary' : 'secondary'}
                onClick={() => setActiveTab('preview')}
              >
                Preview
              </s-button>
              <s-button
                slot="secondary-actions"
                variant={activeTab === 'code' ? 'primary' : 'secondary'}
                onClick={() => setActiveTab('code')}
              >
                Code
              </s-button>
            </s-button-group>

            {/* Copy button (only in code view) */}
            {activeTab === 'code' && code && (
              <s-button
                onClick={handleCopyCode}
                variant="secondary"
              >
                {copied ? '✓ Copied' : 'Copy All'}
              </s-button>
            )}
          </s-stack>
        </s-box>
      </div>

      {/* Content area */}
      <div style={styles.content}>
        <div style={styles.innerContent}>
          {activeTab === 'preview' ? (
            <PreviewErrorBoundary onRetry={() => setActiveTab('preview')}>
              <SectionPreview liquidCode={code} />
            </PreviewErrorBoundary>
          ) : (
            <CodePreview code={code} fileName={fileName} />
          )}
        </div>
      </div>
    </div>
  );
}
