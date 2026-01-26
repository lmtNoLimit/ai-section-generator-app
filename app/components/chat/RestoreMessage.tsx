/**
 * RestoreMessage component - System message for version restore operations
 * Shows the restore source version and confirms the action was completed
 * Styled as a system message (distinct from user/AI)
 */
import { memo } from 'react';

export interface RestoreMessageProps {
  restoredFromVersion: number;
  newVersion: number;
  timestamp: Date;
}

/**
 * Get relative time string from date
 */
function getRelativeTime(date: Date): string {
  const now = new Date();
  const d = date instanceof Date ? date : new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} min ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

/**
 * RestoreMessage - Displays restore confirmation in chat
 * Shows as a centered system message with subtle styling
 */
export const RestoreMessage = memo(function RestoreMessage({
  restoredFromVersion,
  newVersion,
  timestamp,
}: RestoreMessageProps) {
  const relativeTime = getRelativeTime(timestamp);

  return (
    <s-box padding="small base">
      <s-stack direction="block" gap="small" alignItems="center">
        {/* System message indicator */}
        <s-stack direction="inline" gap="small" alignItems="center">
          <s-icon type="reset" />
          <s-text color="subdued">
            Restored to version {restoredFromVersion} as v{newVersion}
          </s-text>
          <s-text color="subdued">{relativeTime}</s-text>
        </s-stack>
      </s-stack>
    </s-box>
  );
});
