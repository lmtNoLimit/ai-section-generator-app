import type { ThemeServiceInterface } from '../../types/service.types';
import { serviceConfig, logServiceConfig } from '../config.server';
import { themeService } from '../theme.server';
import { mockThemeService } from '../mocks/mock-theme.server';

/**
 * Theme Service Adapter
 * Routes requests to mock or real implementation based on configuration
 */
class ThemeAdapter implements ThemeServiceInterface {
  private service: ThemeServiceInterface;

  constructor() {
    logServiceConfig();
    this.service = serviceConfig.themeMode === 'mock'
      ? mockThemeService
      : themeService;
  }

  async getThemes(request: Request): Promise<import('../../types/shopify-api.types').Theme[]> {
    return this.service.getThemes(request);
  }

  async createSection(
    request: Request,
    themeId: string,
    fileName: string,
    content: string
  ): Promise<import('../../types/shopify-api.types').ThemeFileMetadata> {
    return this.service.createSection(request, themeId, fileName, content);
  }

  // Utility method to check current mode
  getCurrentMode(): 'mock' | 'real' {
    return serviceConfig.themeMode;
  }
}

export const themeAdapter = new ThemeAdapter();
