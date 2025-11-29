// Mock the config to use mock mode
jest.mock('../../config.server', () => ({
  serviceConfig: {
    themeMode: 'mock',
    aiMode: 'mock',
    enableLogging: false,
    simulateLatency: false,
  },
  logServiceConfig: jest.fn(),
}));

// Mock the real theme service to avoid importing shopify.server
jest.mock('../../theme.server', () => ({
  themeService: {
    getThemes: jest.fn(),
    createSection: jest.fn(),
  },
}));

import { themeAdapter } from '../theme-adapter';

describe('ThemeAdapter', () => {
  describe('getThemes', () => {
    it('delegates to underlying service', async () => {
      const themes = await themeAdapter.getThemes({} as Request);

      expect(themes).toHaveLength(3);
      expect(themes[0].name).toBe('Dawn');
    });

    it('returns themes with all required fields', async () => {
      const themes = await themeAdapter.getThemes({} as Request);

      themes.forEach(theme => {
        expect(theme).toHaveProperty('id');
        expect(theme).toHaveProperty('name');
        expect(theme).toHaveProperty('role');
      });
    });
  });

  describe('createSection', () => {
    it('delegates to underlying service', async () => {
      const result = await themeAdapter.createSection(
        {} as Request,
        'gid://shopify/Theme/123456789',
        'test',
        'content'
      );

      expect(result.filename).toBe('sections/test.liquid');
      expect(result.contentType).toBe('text/liquid');
    });

    it('handles filename normalization', async () => {
      const result = await themeAdapter.createSection(
        {} as Request,
        'gid://shopify/Theme/123456789',
        'my-section',
        'test content'
      );

      expect(result.filename).toBe('sections/my-section.liquid');
    });
  });

  describe('getCurrentMode', () => {
    it('returns current mode', () => {
      expect(themeAdapter.getCurrentMode()).toBe('mock');
    });
  });
});
