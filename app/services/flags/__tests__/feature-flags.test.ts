import { featureFlags, FeatureFlagKey } from '../feature-flags';

describe('Feature Flags', () => {
  it('defines all expected flag keys', () => {
    expect(featureFlags).toHaveProperty(FeatureFlagKey.USE_MOCK_THEMES);
    expect(featureFlags).toHaveProperty(FeatureFlagKey.USE_MOCK_AI);
    expect(featureFlags).toHaveProperty(FeatureFlagKey.VERBOSE_LOGGING);
    expect(featureFlags).toHaveProperty(FeatureFlagKey.SHOW_SERVICE_MODE);
  });

  it('has correct structure for each flag', () => {
    Object.values(featureFlags).forEach(flag => {
      expect(flag).toHaveProperty('key');
      expect(flag).toHaveProperty('description');
      expect(flag).toHaveProperty('defaultValue');
    });
  });

  it('USE_MOCK_THEMES defaults to true', () => {
    expect(featureFlags[FeatureFlagKey.USE_MOCK_THEMES].defaultValue).toBe(true);
  });

  it('USE_MOCK_AI defaults to false', () => {
    expect(featureFlags[FeatureFlagKey.USE_MOCK_AI].defaultValue).toBe(false);
  });

  it('SIMULATE_API_LATENCY defaults to false', () => {
    expect(featureFlags[FeatureFlagKey.SIMULATE_API_LATENCY].defaultValue).toBe(false);
  });

  it('all flags have valid keys', () => {
    const validKeys = Object.values(FeatureFlagKey);
    Object.values(featureFlags).forEach(flag => {
      expect(validKeys).toContain(flag.key);
    });
  });
});
