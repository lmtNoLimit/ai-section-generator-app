/**
 * Feature Flag System
 * Controls which features are enabled/disabled at runtime
 */

export type FlagValue = boolean | string | number;

export interface FeatureFlag {
  key: string;
  description: string;
  defaultValue: FlagValue;
  currentValue?: FlagValue;
}

export enum FeatureFlagKey {
  // Feature Flags
  ENABLE_SECTION_HISTORY = 'enable_section_history',
  ENABLE_TEMPLATE_LIBRARY = 'enable_template_library',
  ENABLE_AI_SETTINGS = 'enable_ai_settings',

  // Performance Flags
  CACHE_THEME_LIST = 'cache_theme_list',

  // Debug Flags
  VERBOSE_LOGGING = 'verbose_logging',
}

export const featureFlags: Record<FeatureFlagKey, FeatureFlag> = {
  [FeatureFlagKey.ENABLE_SECTION_HISTORY]: {
    key: FeatureFlagKey.ENABLE_SECTION_HISTORY,
    description: 'Enable section generation history feature',
    defaultValue: false // Not implemented yet
  },
  [FeatureFlagKey.ENABLE_TEMPLATE_LIBRARY]: {
    key: FeatureFlagKey.ENABLE_TEMPLATE_LIBRARY,
    description: 'Enable section template library',
    defaultValue: false // Not implemented yet
  },
  [FeatureFlagKey.ENABLE_AI_SETTINGS]: {
    key: FeatureFlagKey.ENABLE_AI_SETTINGS,
    description: 'Enable AI configuration settings (model, temperature)',
    defaultValue: false // Not implemented yet
  },
  [FeatureFlagKey.CACHE_THEME_LIST]: {
    key: FeatureFlagKey.CACHE_THEME_LIST,
    description: 'Cache theme list to reduce API calls',
    defaultValue: false // Future performance enhancement
  },
  [FeatureFlagKey.VERBOSE_LOGGING]: {
    key: FeatureFlagKey.VERBOSE_LOGGING,
    description: 'Enable detailed service logging',
    defaultValue: process.env.NODE_ENV !== 'production'
  }
};
