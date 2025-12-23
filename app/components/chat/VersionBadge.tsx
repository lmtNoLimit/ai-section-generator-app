/**
 * VersionBadge component - displays version number with selection state
 * Clickable badge that selects version for preview
 */
import { memo } from 'react';

export interface VersionBadgeProps {
  versionNumber: number;
  isSelected: boolean;
  isLatest: boolean;
  onClick: () => void;
}

/**
 * Small badge showing version number
 * Shows "latest" tag for most recent version
 */
export const VersionBadge = memo(function VersionBadge({
  versionNumber,
  isSelected,
  isLatest,
  onClick,
}: VersionBadgeProps) {
  return (
    <button
      type="button"
      className={`version-badge ${isSelected ? 'version-badge--selected' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={`Version ${versionNumber}${isLatest ? ' (latest)' : ''}${isSelected ? ', selected' : ''}`}
      aria-pressed={isSelected}
    >
      <span className="version-badge__number">v{versionNumber}</span>
      {isLatest && <span className="version-badge__latest">latest</span>}
    </button>
  );
});
