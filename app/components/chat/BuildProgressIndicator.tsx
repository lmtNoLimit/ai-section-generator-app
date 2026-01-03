/**
 * BuildProgressIndicator component - Visual progress display during AI generation
 * Shows phase checklist with checkmarks and spinner for current phase
 * Uses Polaris web components for consistent styling
 */
import { memo } from 'react';
import type { BuildPhase } from './hooks/useStreamingProgress';

export interface BuildProgressIndicatorProps {
  phases: BuildPhase[];
  currentPhase: string;
  percentage: number;
  isComplete: boolean;
}

/**
 * Phase item with icon (check, spinner, or empty circle)
 */
function PhaseItem({
  phase,
  isCurrent,
}: {
  phase: BuildPhase;
  isCurrent: boolean;
}) {
  return (
    <s-stack direction="inline" gap="small" alignItems="center">
      {/* Phase status icon */}
      {phase.completed ? (
        <span className="build-progress-icon build-progress-icon--complete">
          <s-icon type="check" />
        </span>
      ) : isCurrent ? (
        <span className="build-progress-icon build-progress-icon--current">
          <s-spinner size="base" />
        </span>
      ) : (
        <span className="build-progress-icon build-progress-icon--pending">
          <s-icon type="circle" />
        </span>
      )}

      {/* Phase label */}
      <s-text
        type={isCurrent ? 'strong' : undefined}
        color={phase.completed ? undefined : isCurrent ? undefined : 'subdued'}
      >
        {phase.label}
      </s-text>
    </s-stack>
  );
}

/**
 * BuildProgressIndicator - Main component
 * Renders progress bar and phase checklist
 */
export const BuildProgressIndicator = memo(function BuildProgressIndicator({
  phases,
  currentPhase,
  percentage,
  isComplete,
}: BuildProgressIndicatorProps) {
  // Filter out 'analyzing' phase if no content yet
  const visiblePhases = phases.filter(p => p.id !== 'analyzing' || p.completed);

  return (
    <div
      className={`build-progress ${isComplete ? 'build-progress--complete' : ''}`}
      role="progressbar"
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Section generation progress"
    >
      <s-box
        padding="base"
        background="subdued"
        borderRadius="base"
        borderWidth="small"
        borderColor="subdued"
      >
        <s-stack direction="block" gap="small">
          {/* Progress bar header */}
          <s-stack direction="inline" justifyContent="space-between" alignItems="center">
            <s-text type="strong">
              {isComplete ? 'Generation complete' : 'Generating section...'}
            </s-text>
            <s-text color="subdued">
              {percentage}%
            </s-text>
          </s-stack>

          {/* Progress bar */}
          <div className="build-progress-bar">
            <div
              className="build-progress-bar__fill"
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Phase checklist */}
          <s-stack direction="block" gap="small-100">
            {visiblePhases.map((phase) => (
              <PhaseItem
                key={phase.id}
                phase={phase}
                isCurrent={phase.id === currentPhase}
              />
            ))}
          </s-stack>
        </s-stack>
      </s-box>
    </div>
  );
});
