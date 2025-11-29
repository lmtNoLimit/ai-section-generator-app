import { mockThemeService } from '../mock-theme.server';
import { mockStore } from '../mock-store';

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

describe('MockThemeService', () => {
  beforeEach(() => {
    mockStore.reset();
  });

  describe('getThemes', () => {
    it('returns all mock themes', async () => {
      const themes = await mockThemeService.getThemes({} as Request);

      expect(themes).toHaveLength(3);
      expect(themes[0].name).toBe('Dawn');
      expect(themes[0].role).toBe('MAIN');
    });

    it('returns independent copies', async () => {
      const themes1 = await mockThemeService.getThemes({} as Request);
      const themes2 = await mockThemeService.getThemes({} as Request);

      expect(themes1).not.toBe(themes2);
      expect(themes1).toEqual(themes2);
    });

    it('returns themes with all required fields', async () => {
      const themes = await mockThemeService.getThemes({} as Request);

      themes.forEach(theme => {
        expect(theme.id).toBeTruthy();
        expect(theme.name).toBeTruthy();
        expect(theme.role).toBeTruthy();
        expect(theme.createdAt).toBeTruthy();
        expect(theme.updatedAt).toBeTruthy();
      });
    });
  });

  describe('createSection', () => {
    const themeId = 'gid://shopify/Theme/123456789';

    it('saves section successfully', async () => {
      const result = await mockThemeService.createSection(
        {} as Request,
        themeId,
        'test-section',
        'test content'
      );

      expect(result.filename).toBe('sections/test-section.liquid');
      expect(result.size).toBeGreaterThan(0);
      expect(result.contentType).toBe('text/liquid');
      expect(result.checksum).toBeTruthy();
    });

    it('normalizes filename with sections prefix', async () => {
      const result = await mockThemeService.createSection(
        {} as Request,
        themeId,
        'my-section',
        'content'
      );

      expect(result.filename).toBe('sections/my-section.liquid');
    });

    it('adds liquid extension if missing', async () => {
      const result = await mockThemeService.createSection(
        {} as Request,
        themeId,
        'sections/my-section',
        'content'
      );

      expect(result.filename).toBe('sections/my-section.liquid');
    });

    it('preserves liquid extension if present', async () => {
      const result = await mockThemeService.createSection(
        {} as Request,
        themeId,
        'hero.liquid',
        'content'
      );

      expect(result.filename).toBe('sections/hero.liquid');
    });

    it('throws error for invalid theme', async () => {
      await expect(
        mockThemeService.createSection({} as Request, 'invalid-id', 'test', 'content')
      ).rejects.toThrow('Theme not found');
    });

    it('generates unique checksums for different content', async () => {
      const result1 = await mockThemeService.createSection(
        {} as Request,
        themeId,
        'section1',
        'content1'
      );

      const result2 = await mockThemeService.createSection(
        {} as Request,
        themeId,
        'section2',
        'content2'
      );

      expect(result1.checksum).not.toBe(result2.checksum);
    });

    it('returns correct file size', async () => {
      const content = 'This is test content with specific length';
      const result = await mockThemeService.createSection(
        {} as Request,
        themeId,
        'test',
        content
      );

      expect(result.size).toBe(content.length);
    });
  });
});
