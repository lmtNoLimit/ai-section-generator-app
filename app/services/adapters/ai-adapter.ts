import type { AIServiceInterface } from '../../types/service.types';
import { serviceConfig, logServiceConfig } from '../config.server';
import { aiService } from '../ai.server';
import { mockAIService } from '../mocks/mock-ai.server';

/**
 * AI Service Adapter
 * Routes requests to mock or real implementation based on configuration
 */
class AIAdapter implements AIServiceInterface {
  private service: AIServiceInterface;

  constructor() {
    logServiceConfig();
    this.service = serviceConfig.aiMode === 'mock'
      ? mockAIService
      : aiService;
  }

  async generateSection(prompt: string): Promise<string> {
    return this.service.generateSection(prompt);
  }

  getMockSection(prompt: string): string {
    return this.service.getMockSection(prompt);
  }

  getCurrentMode(): 'mock' | 'real' {
    return serviceConfig.aiMode;
  }
}

export const aiAdapter = new AIAdapter();
