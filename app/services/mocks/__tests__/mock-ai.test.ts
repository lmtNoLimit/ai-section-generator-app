import { mockAIService } from '../mock-ai.server';
import { mockStore } from '../mock-store';
import { mockSections } from '../mock-data';

// Mock the config to disable latency in tests
jest.mock('../../config.server', () => ({
  serviceConfig: {
    aiMode: 'mock',
    themeMode: 'mock',
    enableLogging: false,
    simulateLatency: false,
  },
  logServiceConfig: jest.fn(),
}));

describe('MockAIService', () => {
  beforeEach(() => {
    mockStore.reset();
  });

  describe('generateSection', () => {
    it('generates section from prompt', async () => {
      const code = await mockAIService.generateSection('custom section');

      expect(code).toBeTruthy();
      expect(code).toContain('{% schema %}');
      expect(code).toContain('{% endschema %}');
      expect(code).toContain('<style>');
      expect(code).toContain('</style>');
    });

    it('returns predefined hero section', async () => {
      const code = await mockAIService.generateSection('hero banner');

      expect(code).toBe(mockSections['hero-section']);
    });

    it('returns predefined product grid', async () => {
      const code = await mockAIService.generateSection('product grid layout');

      expect(code).toBe(mockSections['product-grid']);
    });

    it('increments generation count', async () => {
      const countBefore = mockStore.getGenerationCount();

      await mockAIService.generateSection('test');
      await mockAIService.generateSection('test2');

      const countAfter = mockStore.getGenerationCount();
      expect(countAfter).toBe(countBefore + 2);
    });

    it('generates unique sections for different prompts', async () => {
      const code1 = await mockAIService.generateSection('testimonial section');
      const code2 = await mockAIService.generateSection('contact form');

      expect(code1).not.toBe(code2);
      expect(code1).toContain('testimonial');
      expect(code2).toContain('contact form');
    });
  });

  describe('getMockSection', () => {
    it('returns valid Liquid structure', () => {
      const code = mockAIService.getMockSection('test prompt');

      expect(code).toContain('{% schema %}');
      expect(code).toContain('#shopify-section-{{ section.id }}');
    });

    it('includes prompt in section name', () => {
      const code = mockAIService.getMockSection('pricing table');

      expect(code).toContain('pricing table');
    });
  });
});
