/**
 * CodeDiffView - Visual diff component for code changes
 * Shows color-coded additions (green) and deletions (red) with line numbers
 */

import type { DiffResult, DiffHunk, DiffLine } from './diff/diff-types';

interface CodeDiffViewProps {
  diff: DiffResult;
  fileName: string;
  maxHeight?: string;
}

/**
 * Main diff view component with stats header and hunks
 */
export function CodeDiffView({
  diff,
  fileName,
  maxHeight = '100%',
}: CodeDiffViewProps) {
  return (
    <s-box blockSize="100%" overflow="hidden" display="auto">
      {/* Stats header */}
      <s-box
        padding="small"
        background="subdued"
        borderWidth="none none small none"
        borderColor="base"
      >
        <s-stack direction="inline" gap="base" alignItems="center">
          <s-text>
            <code style={{ fontFamily: 'monospace', fontSize: '13px' }}>
              {fileName}
            </code>
          </s-text>
          {diff.hasDiff ? (
            <>
              <s-badge tone="success">+{diff.stats.additions}</s-badge>
              <s-badge tone="critical">-{diff.stats.deletions}</s-badge>
            </>
          ) : (
            <s-badge tone="info">No changes</s-badge>
          )}
        </s-stack>
      </s-box>

      {/* Diff content */}
      <div style={{ maxHeight, overflowY: 'auto' }}>
        {diff.hunks.length === 0 ? (
          <s-box padding="large">
            <s-stack direction="block" gap="small" alignItems="center">
              <s-icon type="check" tone="success" />
              <s-text color="subdued">No changes to display</s-text>
            </s-stack>
          </s-box>
        ) : (
          diff.hunks.map((hunk, index) => (
            <DiffHunkView key={index} hunk={hunk} />
          ))
        )}
      </div>
    </s-box>
  );
}

/**
 * Individual hunk view with header and lines
 */
function DiffHunkView({ hunk }: { hunk: DiffHunk }) {
  return (
    <div style={{ borderBottom: '1px solid var(--p-color-border-subdued)' }}>
      {/* Hunk header - git style */}
      <div
        style={{
          padding: '4px 12px',
          backgroundColor: 'var(--p-color-bg-surface-secondary)',
          fontFamily:
            'ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, monospace',
          fontSize: '12px',
          color: 'var(--p-color-text-subdued)',
        }}
      >
        @@ -{hunk.oldStart},{hunk.oldCount} +{hunk.newStart},{hunk.newCount} @@
      </div>

      {/* Lines */}
      <pre
        style={{
          margin: 0,
          fontFamily:
            'ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, monospace',
          fontSize: '12px',
          lineHeight: '1.5',
        }}
      >
        {hunk.lines.map((line, index) => (
          <DiffLineView key={index} line={line} />
        ))}
      </pre>
    </div>
  );
}

/**
 * Individual line view with color coding and line numbers
 */
function DiffLineView({ line }: { line: DiffLine }) {
  const styles = getDiffLineStyles(line.type);

  const lineNum =
    line.type === 'remove' ? line.oldLineNumber : line.newLineNumber;

  return (
    <div
      style={{
        backgroundColor: styles.bgColor,
        padding: '0 8px',
        display: 'flex',
        alignItems: 'flex-start',
      }}
    >
      {/* Line number */}
      <span
        style={{
          color: 'var(--p-color-text-subdued)',
          width: '40px',
          flexShrink: 0,
          textAlign: 'right',
          paddingRight: '8px',
          userSelect: 'none',
        }}
      >
        {lineNum || ''}
      </span>

      {/* Prefix (+/-/space) */}
      <span
        style={{
          color: styles.textColor,
          width: '16px',
          flexShrink: 0,
          userSelect: 'none',
          fontWeight: line.type !== 'unchanged' ? 600 : 400,
        }}
      >
        {styles.prefix}
      </span>

      {/* Content */}
      <span
        style={{
          color: styles.textColor,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          flex: 1,
        }}
      >
        {line.content}
      </span>
    </div>
  );
}

/**
 * Get styling for diff line based on type
 */
function getDiffLineStyles(type: DiffLine['type']) {
  switch (type) {
    case 'add':
      return {
        bgColor: 'rgba(46, 160, 67, 0.15)',
        textColor: '#1a7f37',
        prefix: '+',
      };
    case 'remove':
      return {
        bgColor: 'rgba(248, 81, 73, 0.15)',
        textColor: '#cf222e',
        prefix: '-',
      };
    default:
      return {
        bgColor: 'transparent',
        textColor: 'inherit',
        prefix: ' ',
      };
  }
}
