import { mockAIService } from '../mocks/mock-ai.server';
import { mockThemeService } from '../mocks/mock-theme.server';
import { mockStore } from '../mocks/mock-store';

// Mock the config to disable latency for accurate performance measurement
jest.mock('../config.server', () => ({
  serviceConfig: {
    aiMode: 'mock',
    themeMode: 'mock',
    enableLogging: false,
    simulateLatency: false,
  },
  logServiceConfig: jest.fn(),
}));

describe('Performance Benchmarks', () => {
  beforeEach(() => {
    mockStore.reset();
  });

  describe('MockAIService Performance', () => {
    it('generates section in < 100ms (without latency)', async () => {
      const start = Date.now();

      await mockAIService.generateSection('test prompt');

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100);
    });

    it('handles 10 concurrent generations efficiently', async () => {
      const start = Date.now();

      const promises = Array.from({ length: 10 }, (_, i) =>
        mockAIService.generateSection(`prompt ${i}`)
      );

      await Promise.all(promises);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(500);
    });
  });

  describe('MockThemeService Performance', () => {
    it('fetches themes in < 50ms (without latency)', async () => {
      const start = Date.now();

      await mockThemeService.getThemes({} as Request);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(50);
    });

    it('saves section in < 50ms (without latency)', async () => {
      const start = Date.now();

      await mockThemeService.createSection(
        {} as Request,
        'gid://shopify/Theme/123456789',
        'test',
        'content'
      );

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(50);
    });

    it('handles 50 concurrent section saves efficiently', async () => {
      const themeId = 'gid://shopify/Theme/123456789';
      const start = Date.now();

      const promises = Array.from({ length: 50 }, (_, i) =>
        mockThemeService.createSection(
          {} as Request,
          themeId,
          `section-${i}`,
          `content ${i}`
        )
      );

      await Promise.all(promises);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(500);
    });
  });

  describe('MockStore Performance', () => {
    it('handles 1000 section saves in < 200ms', () => {
      const start = Date.now();

      for (let i = 0; i < 1000; i++) {
        mockStore.saveSection(`theme${i}`, `section${i}.liquid`, `content${i}`);
      }

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(200);
    });

    it('retrieves sections efficiently', () => {
      // Save 100 sections for a theme
      for (let i = 0; i < 100; i++) {
        mockStore.saveSection('theme1', `section${i}.liquid`, `content${i}`);
      }

      const start = Date.now();

      const sections = mockStore.getSections('theme1');

      const duration = Date.now() - start;
      expect(sections).toHaveLength(100);
      expect(duration).toBeLessThan(20);
    });
  });
});
