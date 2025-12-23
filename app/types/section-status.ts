/**
 * Section status constants and utilities
 *
 * Status Workflow:
 * - draft: Created/edited, never published to theme
 * - active: Currently published to a Shopify theme
 * - inactive: Was active, now unpublished from theme
 * - archive: Soft-deleted, hidden from normal views, recoverable
 */

export const SECTION_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ARCHIVE: 'archive',
} as const;

export type SectionStatus = typeof SECTION_STATUS[keyof typeof SECTION_STATUS];

// All valid status values (for validation)
export const VALID_STATUSES: SectionStatus[] = [
  SECTION_STATUS.DRAFT,
  SECTION_STATUS.ACTIVE,
  SECTION_STATUS.INACTIVE,
  SECTION_STATUS.ARCHIVE,
];

/**
 * Check if a string is a valid section status
 */
export function isValidStatus(status: string): status is SectionStatus {
  return VALID_STATUSES.includes(status as SectionStatus);
}

/**
 * Get display name for status (used in UI badges)
 */
export function getStatusDisplayName(status: SectionStatus): string {
  const displayNames: Record<SectionStatus, string> = {
    [SECTION_STATUS.DRAFT]: 'Draft',
    [SECTION_STATUS.ACTIVE]: 'Active',
    [SECTION_STATUS.INACTIVE]: 'Inactive',
    [SECTION_STATUS.ARCHIVE]: 'Archived',
  };
  return displayNames[status] || status;
}

/**
 * Get badge tone for status (compatible with s-badge tones)
 * Valid s-badge tones: info, success, auto, neutral, warning, caution, critical
 */
export function getStatusBadgeTone(status: SectionStatus): 'neutral' | 'success' | 'warning' | 'caution' {
  const tones: Record<SectionStatus, 'neutral' | 'success' | 'warning' | 'caution'> = {
    [SECTION_STATUS.DRAFT]: 'neutral',
    [SECTION_STATUS.ACTIVE]: 'success',
    [SECTION_STATUS.INACTIVE]: 'warning',
    [SECTION_STATUS.ARCHIVE]: 'caution',
  };
  return tones[status] || 'neutral';
}

/**
 * Valid status transitions map
 * Key: current status, Value: array of allowed next statuses
 *
 * Transition Rules:
 * - draft -> active (publish)
 * - draft -> archive (soft delete)
 * - active -> draft (unpublish, revert to draft)
 * - active -> inactive (deactivate)
 * - active -> archive (soft delete)
 * - inactive -> draft (restore)
 * - archive -> draft (restore from archive)
 */
export const VALID_TRANSITIONS: Record<SectionStatus, SectionStatus[]> = {
  [SECTION_STATUS.DRAFT]: [SECTION_STATUS.ACTIVE, SECTION_STATUS.ARCHIVE],
  [SECTION_STATUS.ACTIVE]: [SECTION_STATUS.DRAFT, SECTION_STATUS.INACTIVE, SECTION_STATUS.ARCHIVE],
  [SECTION_STATUS.INACTIVE]: [SECTION_STATUS.DRAFT],
  [SECTION_STATUS.ARCHIVE]: [SECTION_STATUS.DRAFT],
};

/**
 * Check if a status transition is valid
 */
export function isValidTransition(from: SectionStatus, to: SectionStatus): boolean {
  // Same status is always valid (no change)
  if (from === to) return true;
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Get human-readable transition error message
 */
export function getTransitionErrorMessage(from: SectionStatus, to: SectionStatus): string {
  const validOptions = VALID_TRANSITIONS[from];
  const validStr = validOptions?.length ? validOptions.join(', ') : 'none';
  return `Cannot transition from "${from}" to "${to}". Valid transitions from "${from}": ${validStr}`;
}
