import type { AIServiceInterface } from '../../types/service.types';
import { aiService } from '../ai.server';

/**
 * AI Service Adapter
 * Provides a consistent interface to the AI service
 */
class AIAdapter implements AIServiceInterface {
  private service: AIServiceInterface;

  constructor() {
    this.service = aiService;
  }

  async generateSection(prompt: string): Promise<string> {
    return this.service.generateSection(prompt);
  }

  getMockSection(prompt: string): string {
    return this.service.getMockSection(prompt);
  }
}

export const aiAdapter = new AIAdapter();
