import type { AIServiceInterface } from '../../types/service.types';
import { generateMockSection, mockSections } from './mock-data';
import { mockStore } from './mock-store';

export class MockAIService implements AIServiceInterface {
  async generateSection(prompt: string): Promise<string> {
    // Simulate AI processing time
    await this.simulateLatency(800);

    mockStore.incrementGeneration();
    const count = mockStore.getGenerationCount();

    console.log(`[MOCK] Generating section (count: ${count}) for prompt: "${prompt}"`);

    // Check for predefined sections
    const promptLower = prompt.toLowerCase();
    if (promptLower.includes('hero')) {
      return mockSections['hero-section'];
    }
    if (promptLower.includes('product') && promptLower.includes('grid')) {
      return mockSections['product-grid'];
    }

    // Generate dynamic mock section
    return this.getMockSection(prompt);
  }

  getMockSection(prompt: string): string {
    return generateMockSection(prompt);
  }

  private async simulateLatency(ms: number): Promise<void> {
    const { simulateLatency } = await import('../config.server').then(m => m.serviceConfig);
    if (simulateLatency) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
  }
}

export const mockAIService = new MockAIService();
