import { aiAdapter } from '../ai-adapter';

// Mock the config to use mock mode
jest.mock('../../config.server', () => ({
  serviceConfig: {
    aiMode: 'mock',
    themeMode: 'mock',
    enableLogging: false,
    simulateLatency: false,
  },
  logServiceConfig: jest.fn(),
}));

describe('AIAdapter', () => {
  describe('generateSection', () => {
    it('delegates to underlying service', async () => {
      const code = await aiAdapter.generateSection('hero section');

      expect(code).toBeTruthy();
      expect(code).toContain('{% schema %}');
      expect(code).toContain('{% endschema %}');
    });

    it('generates valid Liquid code', async () => {
      const code = await aiAdapter.generateSection('custom section');

      expect(code).toContain('<style>');
      expect(code).toContain('</style>');
      expect(code).toContain('#shopify-section-{{ section.id }}');
    });
  });

  describe('getMockSection', () => {
    it('returns mock section structure', () => {
      const code = aiAdapter.getMockSection('test');

      expect(code).toContain('{% schema %}');
      expect(code).toContain('Generated test');
    });
  });

  describe('getCurrentMode', () => {
    it('returns current mode', () => {
      expect(aiAdapter.getCurrentMode()).toBe('mock');
    });
  });
});
