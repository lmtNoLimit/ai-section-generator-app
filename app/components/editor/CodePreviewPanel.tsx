import { useState, useCallback } from 'react';
import { CodePreview } from '../generate/CodePreview';
import { SectionPreview, PreviewErrorBoundary } from '../preview';

interface CodePreviewPanelProps {
  code: string;
  fileName: string;
}

/**
 * Tabbed panel for code editor and live preview
 * Uses Polaris-inspired segmented control pattern
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
    <div className="code-preview-panel">
      {/* Tab bar with segmented control */}
      <div className="code-preview-panel__tabs">
        <div className="code-preview-panel__tabs-left">
          {/* Segmented control container */}
          <div className="code-preview-panel__tab-group">
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`code-preview-panel__tab ${activeTab === 'preview' ? 'code-preview-panel__tab--active' : ''}`}
              aria-pressed={activeTab === 'preview'}
            >
              Preview
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('code')}
              className={`code-preview-panel__tab ${activeTab === 'code' ? 'code-preview-panel__tab--active' : ''}`}
              aria-pressed={activeTab === 'code'}
            >
              Code
            </button>
          </div>
        </div>

        {activeTab === 'code' && code && (
          <button
            type="button"
            onClick={handleCopyCode}
            className="code-preview-panel__copy-all"
            aria-label={copied ? 'Copied!' : 'Copy all code'}
          >
            {copied ? '✓ Copied' : 'Copy All'}
          </button>
        )}
      </div>

      {/* Tab content */}
      <div className="code-preview-panel__content">
        {activeTab === 'preview' ? (
          <PreviewErrorBoundary onRetry={() => setActiveTab('preview')}>
            <SectionPreview liquidCode={code} />
          </PreviewErrorBoundary>
        ) : (
          <CodePreview code={code} fileName={fileName} />
        )}
      </div>
    </div>
  );
}
