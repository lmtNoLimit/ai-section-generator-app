import { flagManager, isEnabled, getFlag, FeatureFlagKey } from '../flag-utils';

describe('FeatureFlagManager', () => {
  beforeEach(() => {
    flagManager.clearOverrides();
    // Clear environment variables
    delete process.env.FLAG_VERBOSE_LOGGING;
    delete process.env.FLAG_USE_MOCK_THEMES;
    delete process.env.FLAG_USE_MOCK_AI;
  });

  describe('getFlag', () => {
    it('returns default value when no override or env var', () => {
      const value = flagManager.getFlag(FeatureFlagKey.USE_MOCK_THEMES);
      expect(value).toBe(true); // Default in feature-flags.ts
    });

    it('returns environment variable value over default', () => {
      process.env.FLAG_USE_MOCK_THEMES = 'false';
      const value = flagManager.getFlag(FeatureFlagKey.USE_MOCK_THEMES);
      expect(value).toBe(false);
    });

    it('returns override value over env var', () => {
      process.env.FLAG_USE_MOCK_THEMES = 'false';
      flagManager.setOverride(FeatureFlagKey.USE_MOCK_THEMES, true);
      const value = flagManager.getFlag(FeatureFlagKey.USE_MOCK_THEMES);
      expect(value).toBe(true);
    });

    it('parses boolean strings from env vars', () => {
      process.env.FLAG_VERBOSE_LOGGING = 'true';
      expect(flagManager.getFlag(FeatureFlagKey.VERBOSE_LOGGING)).toBe(true);

      process.env.FLAG_VERBOSE_LOGGING = 'false';
      expect(flagManager.getFlag(FeatureFlagKey.VERBOSE_LOGGING)).toBe(false);
    });

    it('parses number strings from env vars', () => {
      process.env.FLAG_SIMULATE_API_LATENCY = '500';
      expect(flagManager.getFlag(FeatureFlagKey.SIMULATE_API_LATENCY)).toBe(500);
    });

    it('returns string for non-boolean, non-number env vars', () => {
      process.env.FLAG_USE_MOCK_THEMES = 'custom_value';
      expect(flagManager.getFlag(FeatureFlagKey.USE_MOCK_THEMES)).toBe('custom_value');
    });
  });

  describe('isEnabled', () => {
    it('returns true for boolean true', () => {
      flagManager.setOverride(FeatureFlagKey.VERBOSE_LOGGING, true);
      expect(flagManager.isEnabled(FeatureFlagKey.VERBOSE_LOGGING)).toBe(true);
    });

    it('returns true for string "true"', () => {
      flagManager.setOverride(FeatureFlagKey.VERBOSE_LOGGING, 'true');
      expect(flagManager.isEnabled(FeatureFlagKey.VERBOSE_LOGGING)).toBe(true);
    });

    it('returns false for boolean false', () => {
      flagManager.setOverride(FeatureFlagKey.VERBOSE_LOGGING, false);
      expect(flagManager.isEnabled(FeatureFlagKey.VERBOSE_LOGGING)).toBe(false);
    });

    it('returns false for non-true values', () => {
      flagManager.setOverride(FeatureFlagKey.VERBOSE_LOGGING, 'false');
      expect(flagManager.isEnabled(FeatureFlagKey.VERBOSE_LOGGING)).toBe(false);
    });
  });

  describe('setOverride and clearOverrides', () => {
    it('sets override value', () => {
      flagManager.setOverride(FeatureFlagKey.USE_MOCK_AI, false);
      expect(flagManager.getFlag(FeatureFlagKey.USE_MOCK_AI)).toBe(false);
    });

    it('clears all overrides', () => {
      flagManager.setOverride(FeatureFlagKey.USE_MOCK_AI, false);
      flagManager.setOverride(FeatureFlagKey.USE_MOCK_THEMES, false);

      flagManager.clearOverrides();

      expect(flagManager.getFlag(FeatureFlagKey.USE_MOCK_AI)).toBe(false); // Default
      expect(flagManager.getFlag(FeatureFlagKey.USE_MOCK_THEMES)).toBe(true); // Default
    });
  });

  describe('getAllFlags', () => {
    it('returns all flags with current values', () => {
      const flags = flagManager.getAllFlags();

      expect(flags).toHaveProperty(FeatureFlagKey.USE_MOCK_THEMES);
      expect(flags).toHaveProperty(FeatureFlagKey.USE_MOCK_AI);
      expect(flags).toHaveProperty(FeatureFlagKey.VERBOSE_LOGGING);
    });

    it('reflects overridden values', () => {
      flagManager.setOverride(FeatureFlagKey.USE_MOCK_AI, true);
      const flags = flagManager.getAllFlags();

      expect(flags[FeatureFlagKey.USE_MOCK_AI]).toBe(true);
    });
  });

  describe('logFlags', () => {
    it('does not log when verbose logging disabled', () => {
      const consoleSpy = jest.spyOn(console, 'log');
      flagManager.setOverride(FeatureFlagKey.VERBOSE_LOGGING, false);

      flagManager.logFlags();

      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('logs flags when verbose logging enabled', () => {
      const consoleSpy = jest.spyOn(console, 'log');
      flagManager.setOverride(FeatureFlagKey.VERBOSE_LOGGING, true);

      flagManager.logFlags();

      expect(consoleSpy).toHaveBeenCalledWith('=== Feature Flags ===');
      expect(consoleSpy).toHaveBeenCalledWith('====================');
    });
  });

  describe('convenience functions', () => {
    it('isEnabled() delegates to flagManager', () => {
      flagManager.setOverride(FeatureFlagKey.VERBOSE_LOGGING, true);
      expect(isEnabled(FeatureFlagKey.VERBOSE_LOGGING)).toBe(true);
    });

    it('getFlag() delegates to flagManager', () => {
      flagManager.setOverride(FeatureFlagKey.USE_MOCK_THEMES, false);
      expect(getFlag(FeatureFlagKey.USE_MOCK_THEMES)).toBe(false);
    });
  });
});
