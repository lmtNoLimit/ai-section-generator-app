import { featureFlags, FeatureFlagKey, type FlagValue } from './feature-flags';

// Re-export for convenience
export { FeatureFlagKey } from './feature-flags';

class FeatureFlagManager {
  private overrides: Map<string, FlagValue> = new Map();

  /**
   * Get flag value with environment variable override
   */
  getFlag(key: FeatureFlagKey): FlagValue {
    // Check for override first
    if (this.overrides.has(key)) {
      return this.overrides.get(key)!;
    }

    // Check environment variable
    const envKey = `FLAG_${key.toUpperCase()}`;
    const envValue = process.env[envKey];
    if (envValue !== undefined) {
      return this.parseEnvValue(envValue);
    }

    // Return default
    return featureFlags[key].defaultValue;
  }

  /**
   * Check if flag is enabled (boolean flags only)
   */
  isEnabled(key: FeatureFlagKey): boolean {
    const value = this.getFlag(key);
    return value === true || value === 'true';
  }

  /**
   * Override flag value at runtime (for testing)
   */
  setOverride(key: FeatureFlagKey, value: FlagValue): void {
    this.overrides.set(key, value);
  }

  /**
   * Clear all overrides
   */
  clearOverrides(): void {
    this.overrides.clear();
  }

  /**
   * Get all flags with current values
   */
  getAllFlags(): Record<string, FlagValue> {
    const result: Record<string, FlagValue> = {};
    Object.keys(featureFlags).forEach((key) => {
      result[key] = this.getFlag(key as FeatureFlagKey);
    });
    return result;
  }

  /**
   * Log all active flags
   */
  logFlags(): void {
    if (!this.isEnabled(FeatureFlagKey.VERBOSE_LOGGING)) {
      return;
    }

    console.log('=== Feature Flags ===');
    Object.entries(featureFlags).forEach(([key, flag]) => {
      const value = this.getFlag(key as FeatureFlagKey);
      const isDefault = value === flag.defaultValue;
      console.log(`  ${flag.key}: ${value} ${isDefault ? '(default)' : '(overridden)'}`);
    });
    console.log('====================');
  }

  private parseEnvValue(value: string): FlagValue {
    // Parse boolean
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;

    // Parse number
    const num = Number(value);
    if (!isNaN(num)) return num;

    // Return as string
    return value;
  }
}

export const flagManager = new FeatureFlagManager();

/**
 * Convenience function to check if a boolean flag is enabled
 * @param key - The feature flag key to check
 * @returns true if the flag is enabled, false otherwise
 */
export const isEnabled = (key: FeatureFlagKey) => flagManager.isEnabled(key);

/**
 * Convenience function to get a flag value
 * @param key - The feature flag key to retrieve
 * @returns The current value of the flag (boolean, string, or number)
 */
export const getFlag = (key: FeatureFlagKey) => flagManager.getFlag(key);
