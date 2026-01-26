/**
 * AIResponseCard component - Unified display for AI responses
 * Handles BOTH streaming and completed states with smooth CSS transitions
 * Replaces split between MessageItem streaming display and completed state
 *
 * Features:
 * - Phase indicators during streaming (Analyzing -> Schema -> Styling -> Finalizing)
 * - Change bullets after completion (extracted from AI response)
 * - Collapsible code accordion (collapsed by default)
 * - Smooth CSS transitions between states
 * - Version badge in header
 */
import { memo, useState, useCallback } from 'react';
import { CodeBlock } from './CodeBlock';
import { VersionCard } from './VersionCard';

// Phase definitions for streaming progress
const PHASES = [
  { id: 'analyzing', label: 'Analyzing your request', icon: 'search' },
  { id: 'schema', label: 'Building section schema', icon: 'code' },
  { id: 'styling', label: 'Adding styles', icon: 'paint' },
  { id: 'finalizing', label: 'Finalizing code', icon: 'check' },
] as const;

export type StreamingPhase = typeof PHASES[number]['id'];

export interface AIResponseCardProps {
  // State
  isStreaming: boolean;
  streamingPhase?: StreamingPhase;
  phaseContext?: string; // "Adding 3 customizable settings"

  // Content
  message: string; // AI response text (displayed during streaming)
  changes?: string[]; // ["Added hero banner", "Changed colors"]
  code?: string;
  versionNumber?: number;
  createdAt?: Date;

  // Version actions (passed through)
  isActive?: boolean;
  isSelected?: boolean;
  onPreview?: () => void;
  onRestore?: () => void;
}

// Inline styles for features not in Polaris scale
const styles = {
  card: {
    borderRadius: '16px 16px 16px 4px',
  },
  cursor: {
    display: 'inline-block',
    width: '2px',
    height: '1em',
    background: 'currentColor',
    marginLeft: '2px',
    animation: 'cursor-blink 1s ease-in-out infinite',
  },
  codeToggle: {
    cursor: 'pointer',
    userSelect: 'none' as const,
  },
} as const;

/**
 * Phase indicator item - shows completed/current/pending status
 */
function PhaseIndicator({
  phase,
  isCompleted,
  isCurrent,
  context,
}: {
  phase: typeof PHASES[number];
  isCompleted: boolean;
  isCurrent: boolean;
  context?: string;
}) {
  return (
    <s-stack direction="block" gap="small-100">
      <s-stack direction="inline" gap="small" alignItems="center">
        {/* Status icon */}
        {isCompleted ? (
          <s-icon type="check" />
        ) : isCurrent ? (
          <s-spinner size="base" />
        ) : (
          <s-icon type="circle" />
        )}
        {/* Phase label */}
        <s-text
          type={isCurrent ? 'strong' : undefined}
          color={!isCompleted && !isCurrent ? 'subdued' : undefined}
        >
          {phase.label}{isCurrent && '...'}
        </s-text>
      </s-stack>
      {/* Phase context (shown below current phase) */}
      {isCurrent && context && (
        <s-box paddingInlineStart="large">
          <s-text color="subdued">
            → {context}
          </s-text>
        </s-box>
      )}
    </s-stack>
  );
}

/**
 * Change bullet item for completed state
 */
function ChangeBullet({ change }: { change: string }) {
  return (
    <s-stack direction="inline" gap="small" alignItems="start">
      <s-text>•</s-text>
      <s-text>{change}</s-text>
    </s-stack>
  );
}

/**
 * AIResponseCard - Main component
 * Renders streaming phase indicators OR completed change bullets
 * with smooth CSS transitions between states
 */
export const AIResponseCard = memo(function AIResponseCard({
  isStreaming,
  streamingPhase = 'analyzing',
  phaseContext,
  message,
  changes = [],
  code,
  versionNumber,
  createdAt,
  isActive = false,
  isSelected = false,
  onPreview,
  onRestore,
}: AIResponseCardProps) {
  const [codeExpanded, setCodeExpanded] = useState(false);

  const handleCodeToggle = useCallback(() => {
    setCodeExpanded(prev => !prev);
  }, []);

  // Find current phase index for determining completed phases
  const currentPhaseIndex = PHASES.findIndex(p => p.id === streamingPhase);

  // Determine what to show: streaming phases or completion content
  const showStreamingPhases = isStreaming;
  const showChangeBullets = !isStreaming && changes.length > 0;
  const showDefaultMessage = !isStreaming && changes.length === 0;
  const showCode = code && !isStreaming;
  const showVersionCard = versionNumber && !isStreaming;

  return (
    <div style={styles.card} className="ai-response-card">
      <s-box
        background="subdued"
        border="small"
        borderColor="subdued"
        padding="base"
        borderRadius="large"
      >
        <s-stack direction="block" gap="base">
          {/* Header with AI label and version badge */}
          <s-stack direction="inline" justifyContent="space-between" alignItems="center">
            <s-stack direction="inline" gap="small" alignItems="center">
              <s-avatar initials="AI" size="small" />
              <s-text type="strong">AI Assistant</s-text>
            </s-stack>
            {versionNumber && (
              <s-badge tone={isActive ? 'success' : 'info'}>
                v{versionNumber}
              </s-badge>
            )}
          </s-stack>

          {/* Streaming: Phase indicators */}
          <div className={`ai-response-phases ${showStreamingPhases ? 'ai-response-phases--visible' : 'ai-response-phases--hidden'}`}>
            {showStreamingPhases && (
              <s-box padding="small" background="strong" borderRadius="base">
                <s-stack direction="block" gap="small">
                  {PHASES.map((phase, index) => (
                    <PhaseIndicator
                      key={phase.id}
                      phase={phase}
                      isCompleted={index < currentPhaseIndex}
                      isCurrent={index === currentPhaseIndex}
                      context={index === currentPhaseIndex ? phaseContext : undefined}
                    />
                  ))}
                </s-stack>
              </s-box>
            )}
          </div>

          {/* Streaming: Message with cursor */}
          {isStreaming && message && (
            <s-text>
              {message}
              <span style={styles.cursor} aria-hidden="true" />
            </s-text>
          )}

          {/* Completed: Change bullets */}
          <div className={`ai-response-changes ${showChangeBullets ? 'ai-response-changes--visible' : 'ai-response-changes--hidden'}`}>
            {showChangeBullets && (
              <s-stack direction="block" gap="small">
                {changes.map((change, index) => (
                  <ChangeBullet key={index} change={change} />
                ))}
              </s-stack>
            )}
          </div>

          {/* Completed: Default message if no changes */}
          {showDefaultMessage && (
            <s-text>Here&apos;s your section code. You can preview it in the panel on the right.</s-text>
          )}

          {/* Completed: Collapsible code accordion */}
          {showCode && (
            <s-stack direction="block" gap="small">
              {/* Code toggle button */}
              <div
                style={styles.codeToggle}
                onClick={handleCodeToggle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCodeToggle();
                  }
                }}
                role="button"
                tabIndex={0}
                aria-expanded={codeExpanded}
                aria-controls="ai-response-code"
              >
                <s-stack direction="inline" gap="small" alignItems="center">
                  <s-icon type={codeExpanded ? 'chevron-down' : 'chevron-right'} />
                  <s-text color="subdued">
                    {codeExpanded ? 'Hide code' : 'Show code'}
                  </s-text>
                </s-stack>
              </div>

              {/* Code block with accordion animation */}
              <div
                id="ai-response-code"
                className={`ai-response-code ${codeExpanded ? 'ai-response-code--expanded' : 'ai-response-code--collapsed'}`}
              >
                {codeExpanded && (
                  <CodeBlock code={code} language="liquid" />
                )}
              </div>
            </s-stack>
          )}

          {/* Version Card */}
          {showVersionCard && createdAt && (
            <VersionCard
              versionNumber={versionNumber}
              createdAt={createdAt}
              isActive={isActive}
              isSelected={isSelected}
              onPreview={onPreview || (() => {})}
              onRestore={onRestore || (() => {})}
            />
          )}
        </s-stack>
      </s-box>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for memoization
  // Check changes array equality (shallow compare)
  const prevChanges = prevProps.changes || [];
  const nextChanges = nextProps.changes || [];
  const changesEqual = prevChanges.length === nextChanges.length &&
    prevChanges.every((c, i) => c === nextChanges[i]);

  // Compare dates by time value
  const datesEqual = prevProps.createdAt?.getTime() === nextProps.createdAt?.getTime();

  return (
    prevProps.isStreaming === nextProps.isStreaming &&
    prevProps.streamingPhase === nextProps.streamingPhase &&
    prevProps.phaseContext === nextProps.phaseContext &&
    prevProps.message === nextProps.message &&
    prevProps.code === nextProps.code &&
    prevProps.versionNumber === nextProps.versionNumber &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.isSelected === nextProps.isSelected &&
    changesEqual &&
    datesEqual
  );
});
