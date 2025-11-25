/**
 * Service Configuration
 * Controls which service implementations to use (mock vs real)
 */

export type ServiceMode = 'mock' | 'real';

export interface ServiceConfig {
  mode: ServiceMode;
  enableLogging: boolean;
  simulateLatency: boolean;
}

function getServiceMode(): ServiceMode {
  const mode = process.env.SERVICE_MODE?.toLowerCase();
  if (mode === 'real') {
    return 'real';
  }
  return 'mock'; // Default to mock
}

export const serviceConfig: ServiceConfig = {
  mode: getServiceMode(),
  enableLogging: process.env.NODE_ENV !== 'production',
  simulateLatency: process.env.SIMULATE_LATENCY === 'true'
};

export function isUsingMocks(): boolean {
  return serviceConfig.mode === 'mock';
}

export function logServiceMode(): void {
  if (serviceConfig.enableLogging) {
    console.log(`[SERVICE CONFIG] Mode: ${serviceConfig.mode}`);
    console.log(`[SERVICE CONFIG] Simulate Latency: ${serviceConfig.simulateLatency}`);
  }
}
