/**
 * VersionTimeline component - dropdown for quick version navigation
 * Shows all versions with timestamps for easy selection
 */
import { memo } from 'react';
import type { CodeVersion } from '../../types';

export interface VersionTimelineProps {
  versions: CodeVersion[];
  selectedVersionId: string | null;
  onSelect: (versionId: string | null) => void;
}

/**
 * Dropdown showing all versions for quick navigation
 * "Current draft" option clears selection
 */
export const VersionTimeline = memo(function VersionTimeline({
  versions,
  selectedVersionId,
  onSelect,
}: VersionTimelineProps) {
  if (versions.length === 0) return null;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onSelect(value || null);
  };

  return (
    <div className="version-timeline">
      <select
        value={selectedVersionId || ''}
        onChange={handleChange}
        aria-label="Select version"
      >
        <option value="">Current draft</option>
        {versions.map((v) => (
          <option key={v.id} value={v.id}>
            v{v.versionNumber} - {formatTime(v.createdAt)}
          </option>
        ))}
      </select>
    </div>
  );
});

/**
 * Format date to short time string
 */
function formatTime(date: Date): string {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
