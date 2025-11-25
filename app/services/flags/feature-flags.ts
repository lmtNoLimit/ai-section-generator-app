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
  // Service Mode Flags
  USE_MOCK_THEMES = 'use_mock_themes',
  USE_MOCK_AI = 'use_mock_ai',

  // Feature Flags
  ENABLE_SECTION_HISTORY = 'enable_section_history',
  ENABLE_TEMPLATE_LIBRARY = 'enable_template_library',
  ENABLE_AI_SETTINGS = 'enable_ai_settings',

  // Performance Flags
  SIMULATE_API_LATENCY = 'simulate_api_latency',
  CACHE_THEME_LIST = 'cache_theme_list',

  // Debug Flags
  VERBOSE_LOGGING = 'verbose_logging',
  SHOW_SERVICE_MODE = 'show_service_mode',
}

export const featureFlags: Record<FeatureFlagKey, FeatureFlag> = {
  [FeatureFlagKey.USE_MOCK_THEMES]: {
    key: FeatureFlagKey.USE_MOCK_THEMES,
    description: 'Use mock theme service instead of Shopify API',
    defaultValue: true // Default to mock until write_themes approved
  },
  [FeatureFlagKey.USE_MOCK_AI]: {
    key: FeatureFlagKey.USE_MOCK_AI,
    description: 'Use mock AI service instead of Google Gemini',
    defaultValue: false // Use real Gemini if API key available
  },
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
  [FeatureFlagKey.SIMULATE_API_LATENCY]: {
    key: FeatureFlagKey.SIMULATE_API_LATENCY,
    description: 'Simulate API latency in mock services',
    defaultValue: false
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
  },
  [FeatureFlagKey.SHOW_SERVICE_MODE]: {
    key: FeatureFlagKey.SHOW_SERVICE_MODE,
    description: 'Show service mode indicator in UI',
    defaultValue: process.env.NODE_ENV !== 'production'
  }
};
