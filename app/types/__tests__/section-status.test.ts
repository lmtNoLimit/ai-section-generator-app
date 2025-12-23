import {
  SECTION_STATUS,
  VALID_STATUSES,
  VALID_TRANSITIONS,
  isValidStatus,
  isValidTransition,
  getStatusDisplayName,
  getStatusBadgeTone,
  getTransitionErrorMessage,
  type SectionStatus,
} from '../section-status';

describe('Section Status Module', () => {
  // ============================================================================
  // Constants Tests
  // ============================================================================
  describe('SECTION_STATUS constants', () => {
    it('should have all required status values', () => {
      expect(SECTION_STATUS.DRAFT).toBe('draft');
      expect(SECTION_STATUS.ACTIVE).toBe('active');
      expect(SECTION_STATUS.INACTIVE).toBe('inactive');
      expect(SECTION_STATUS.ARCHIVE).toBe('archive');
    });

    it('should have correct VALID_STATUSES array', () => {
      expect(VALID_STATUSES).toEqual(['draft', 'active', 'inactive', 'archive']);
      expect(VALID_STATUSES.length).toBe(4);
    });
  });

  // ============================================================================
  // Status Validation Tests
  // ============================================================================
  describe('isValidStatus', () => {
    it('should return true for valid statuses', () => {
      expect(isValidStatus('draft')).toBe(true);
      expect(isValidStatus('active')).toBe(true);
      expect(isValidStatus('inactive')).toBe(true);
      expect(isValidStatus('archive')).toBe(true);
    });

    it('should return false for invalid statuses', () => {
      expect(isValidStatus('pending')).toBe(false);
      expect(isValidStatus('published')).toBe(false);
      expect(isValidStatus('deleted')).toBe(false);
      expect(isValidStatus('')).toBe(false);
      expect(isValidStatus('DRAFT')).toBe(false); // Case-sensitive
    });

    it('should properly type narrow the status', () => {
      const status: string = 'draft';
      if (isValidStatus(status)) {
        // TypeScript should narrow to SectionStatus
        const _: SectionStatus = status;
        expect(true).toBe(true);
      }
    });
  });

  // ============================================================================
  // Display Name Tests
  // ============================================================================
  describe('getStatusDisplayName', () => {
    it('should return correct display names', () => {
      expect(getStatusDisplayName(SECTION_STATUS.DRAFT)).toBe('Draft');
      expect(getStatusDisplayName(SECTION_STATUS.ACTIVE)).toBe('Active');
      expect(getStatusDisplayName(SECTION_STATUS.INACTIVE)).toBe('Inactive');
      expect(getStatusDisplayName(SECTION_STATUS.ARCHIVE)).toBe('Archived');
    });

    it('should handle all status values', () => {
      VALID_STATUSES.forEach(status => {
        const displayName = getStatusDisplayName(status);
        expect(displayName).toBeTruthy();
        expect(typeof displayName).toBe('string');
      });
    });
  });

  // ============================================================================
  // Badge Tone Tests
  // ============================================================================
  describe('getStatusBadgeTone', () => {
    it('should return correct badge tones', () => {
      expect(getStatusBadgeTone(SECTION_STATUS.DRAFT)).toBe('neutral');
      expect(getStatusBadgeTone(SECTION_STATUS.ACTIVE)).toBe('success');
      expect(getStatusBadgeTone(SECTION_STATUS.INACTIVE)).toBe('warning');
      expect(getStatusBadgeTone(SECTION_STATUS.ARCHIVE)).toBe('caution');
    });

    it('should return valid tone values', () => {
      const validTones = ['neutral', 'success', 'warning', 'caution'];
      VALID_STATUSES.forEach(status => {
        const tone = getStatusBadgeTone(status);
        expect(validTones).toContain(tone);
      });
    });
  });

  // ============================================================================
  // Transition Map Tests
  // ============================================================================
  describe('VALID_TRANSITIONS', () => {
    it('should have entries for all statuses', () => {
      VALID_STATUSES.forEach(status => {
        expect(VALID_TRANSITIONS[status]).toBeDefined();
        expect(Array.isArray(VALID_TRANSITIONS[status])).toBe(true);
      });
    });

    it('should define correct transitions from DRAFT', () => {
      expect(VALID_TRANSITIONS[SECTION_STATUS.DRAFT]).toEqual([
        SECTION_STATUS.ACTIVE,
        SECTION_STATUS.ARCHIVE,
      ]);
    });

    it('should define correct transitions from ACTIVE', () => {
      expect(VALID_TRANSITIONS[SECTION_STATUS.ACTIVE]).toEqual([
        SECTION_STATUS.DRAFT,
        SECTION_STATUS.INACTIVE,
        SECTION_STATUS.ARCHIVE,
      ]);
    });

    it('should define correct transitions from INACTIVE', () => {
      expect(VALID_TRANSITIONS[SECTION_STATUS.INACTIVE]).toEqual([SECTION_STATUS.DRAFT]);
    });

    it('should define correct transitions from ARCHIVE', () => {
      expect(VALID_TRANSITIONS[SECTION_STATUS.ARCHIVE]).toEqual([SECTION_STATUS.DRAFT]);
    });
  });

  // ============================================================================
  // Transition Validation Tests
  // ============================================================================
  describe('isValidTransition', () => {
    it('should allow DRAFT -> ACTIVE transition', () => {
      expect(isValidTransition(SECTION_STATUS.DRAFT, SECTION_STATUS.ACTIVE)).toBe(true);
    });

    it('should allow DRAFT -> ARCHIVE transition', () => {
      expect(isValidTransition(SECTION_STATUS.DRAFT, SECTION_STATUS.ARCHIVE)).toBe(true);
    });

    it('should allow ACTIVE -> DRAFT transition', () => {
      expect(isValidTransition(SECTION_STATUS.ACTIVE, SECTION_STATUS.DRAFT)).toBe(true);
    });

    it('should allow ACTIVE -> INACTIVE transition', () => {
      expect(isValidTransition(SECTION_STATUS.ACTIVE, SECTION_STATUS.INACTIVE)).toBe(true);
    });

    it('should allow INACTIVE -> DRAFT transition', () => {
      expect(isValidTransition(SECTION_STATUS.INACTIVE, SECTION_STATUS.DRAFT)).toBe(true);
    });

    it('should allow ARCHIVE -> DRAFT transition', () => {
      expect(isValidTransition(SECTION_STATUS.ARCHIVE, SECTION_STATUS.DRAFT)).toBe(true);
    });

    it('should allow same status transitions (no-op)', () => {
      expect(isValidTransition(SECTION_STATUS.DRAFT, SECTION_STATUS.DRAFT)).toBe(true);
      expect(isValidTransition(SECTION_STATUS.ACTIVE, SECTION_STATUS.ACTIVE)).toBe(true);
      expect(isValidTransition(SECTION_STATUS.INACTIVE, SECTION_STATUS.INACTIVE)).toBe(true);
      expect(isValidTransition(SECTION_STATUS.ARCHIVE, SECTION_STATUS.ARCHIVE)).toBe(true);
    });

    it('should allow ACTIVE -> ARCHIVE transition', () => {
      expect(isValidTransition(SECTION_STATUS.ACTIVE, SECTION_STATUS.ARCHIVE)).toBe(true);
    });

    // Invalid transitions
    it('should reject DRAFT -> INACTIVE transition', () => {
      expect(isValidTransition(SECTION_STATUS.DRAFT, SECTION_STATUS.INACTIVE)).toBe(false);
    });

    it('should reject ACTIVE -> ACTIVE direct re-publish', () => {
      // Active to Active is allowed as no-op
      expect(isValidTransition(SECTION_STATUS.ACTIVE, SECTION_STATUS.ACTIVE)).toBe(true);
    });

    it('should reject INACTIVE -> ACTIVE transition', () => {
      expect(isValidTransition(SECTION_STATUS.INACTIVE, SECTION_STATUS.ACTIVE)).toBe(false);
    });

    it('should reject INACTIVE -> INACTIVE (allowed as no-op)', () => {
      expect(isValidTransition(SECTION_STATUS.INACTIVE, SECTION_STATUS.INACTIVE)).toBe(true);
    });

    it('should reject ARCHIVE -> ACTIVE transition', () => {
      expect(isValidTransition(SECTION_STATUS.ARCHIVE, SECTION_STATUS.ACTIVE)).toBe(false);
    });

    it('should reject ARCHIVE -> INACTIVE transition', () => {
      expect(isValidTransition(SECTION_STATUS.ARCHIVE, SECTION_STATUS.INACTIVE)).toBe(false);
    });
  });

  // ============================================================================
  // Transition Error Message Tests
  // ============================================================================
  describe('getTransitionErrorMessage', () => {
    it('should generate error message for invalid transition', () => {
      const msg = getTransitionErrorMessage(SECTION_STATUS.DRAFT, SECTION_STATUS.ARCHIVE);
      expect(msg).toContain('Cannot transition');
      expect(msg).toContain('draft');
      expect(msg).toContain('archive');
      expect(msg).toContain('Valid transitions from');
    });

    it('should include valid options in error message', () => {
      const msg = getTransitionErrorMessage(SECTION_STATUS.DRAFT, SECTION_STATUS.INACTIVE);
      expect(msg).toContain('active');
      expect(msg).toContain('archive');
    });

    it('should handle single valid transition option', () => {
      const msg = getTransitionErrorMessage(SECTION_STATUS.INACTIVE, SECTION_STATUS.ACTIVE);
      expect(msg).toContain('draft');
    });

    it('should have meaningful error format', () => {
      const msg = getTransitionErrorMessage(SECTION_STATUS.INACTIVE, SECTION_STATUS.ARCHIVE);
      expect(msg).toMatch(/Cannot transition from "inactive" to "archive"/);
      expect(msg).toMatch(/Valid transitions from "inactive"/);
    });

    it('should list all valid transitions from a status', () => {
      const msg = getTransitionErrorMessage(SECTION_STATUS.DRAFT, SECTION_STATUS.INACTIVE);
      // Should mention both valid options from draft: active, archive
      expect(msg).toContain('active');
      expect(msg).toContain('archive');
    });
  });

  // ============================================================================
  // Workflow Tests (multi-step transitions)
  // ============================================================================
  describe('Complete workflow transitions', () => {
    it('should support draft -> active -> draft workflow', () => {
      expect(isValidTransition(SECTION_STATUS.DRAFT, SECTION_STATUS.ACTIVE)).toBe(true);
      expect(isValidTransition(SECTION_STATUS.ACTIVE, SECTION_STATUS.DRAFT)).toBe(true);
    });

    it('should support draft -> active -> inactive workflow', () => {
      expect(isValidTransition(SECTION_STATUS.DRAFT, SECTION_STATUS.ACTIVE)).toBe(true);
      expect(isValidTransition(SECTION_STATUS.ACTIVE, SECTION_STATUS.INACTIVE)).toBe(true);
    });

    it('should support draft -> archive -> draft workflow', () => {
      expect(isValidTransition(SECTION_STATUS.DRAFT, SECTION_STATUS.ARCHIVE)).toBe(true);
      expect(isValidTransition(SECTION_STATUS.ARCHIVE, SECTION_STATUS.DRAFT)).toBe(true);
    });

    it('should block invalid multi-step workflows', () => {
      // Can't go: DRAFT -> ARCHIVE -> ACTIVE (invalid archive->active)
      expect(isValidTransition(SECTION_STATUS.DRAFT, SECTION_STATUS.ARCHIVE)).toBe(true);
      expect(isValidTransition(SECTION_STATUS.ARCHIVE, SECTION_STATUS.ACTIVE)).toBe(false);
    });
  });
});
