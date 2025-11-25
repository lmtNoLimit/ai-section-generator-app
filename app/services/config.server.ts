/**
 * Service Configuration
 * Controls which service implementations to use (mock vs real)
 */

import { flagManager, FeatureFlagKey } from './flags/flag-utils';

export type ServiceMode = 'mock' | 'real';

export interface ServiceConfig {
  themeMode: ServiceMode;
  aiMode: ServiceMode;
  enableLogging: boolean;
  simulateLatency: boolean;
  showModeInUI: boolean;
}

function getThemeMode(): ServiceMode {
  // Flag takes precedence
  if (flagManager.isEnabled(FeatureFlagKey.USE_MOCK_THEMES)) {
    return 'mock';
  }

  // Fallback to SERVICE_MODE env var
  const mode = process.env.SERVICE_MODE?.toLowerCase();
  if (mode === 'real') {
    return 'real';
  }

  return 'mock'; // Safe default
}

function getAIMode(): ServiceMode {
  // Flag takes precedence
  if (flagManager.isEnabled(FeatureFlagKey.USE_MOCK_AI)) {
    return 'mock';
  }

  // Check if Gemini API key exists
  if (process.env.GEMINI_API_KEY) {
    return 'real';
  }

  return 'mock';
}

export const serviceConfig: ServiceConfig = {
  themeMode: getThemeMode(),
  aiMode: getAIMode(),
  enableLogging: flagManager.isEnabled(FeatureFlagKey.VERBOSE_LOGGING),
  simulateLatency: flagManager.isEnabled(FeatureFlagKey.SIMULATE_API_LATENCY),
  showModeInUI: flagManager.isEnabled(FeatureFlagKey.SHOW_SERVICE_MODE)
};

export function isUsingMockThemes(): boolean {
  return serviceConfig.themeMode === 'mock';
}

export function isUsingMockAI(): boolean {
  return serviceConfig.aiMode === 'mock';
}

// Track if config has been logged to avoid duplicates
let configLogged = false;

export function logServiceConfig(): void {
  if (!serviceConfig.enableLogging || configLogged) return;

  console.log('[SERVICE CONFIG] Theme Mode:', serviceConfig.themeMode);
  console.log('[SERVICE CONFIG] AI Mode:', serviceConfig.aiMode);
  console.log('[SERVICE CONFIG] Simulate Latency:', serviceConfig.simulateLatency);

  flagManager.logFlags();
  configLogged = true;
}
