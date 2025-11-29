import type { ThemeServiceInterface } from '../../types/service.types';
import { themeService } from '../theme.server';

/**
 * Theme Service Adapter
 * Provides a consistent interface to the theme service
 */
class ThemeAdapter implements ThemeServiceInterface {
  private service: ThemeServiceInterface;

  constructor() {
    this.service = themeService;
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
}

export const themeAdapter = new ThemeAdapter();
