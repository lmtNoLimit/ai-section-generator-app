import type { ThemeServiceInterface } from '../../types/service.types';
import type { Theme, ThemeFileMetadata } from '../../types/shopify-api.types';
import { mockThemes } from './mock-data';
import { mockStore } from './mock-store';

export class MockThemeService implements ThemeServiceInterface {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getThemes(_request: Request): Promise<Theme[]> {
    // Simulate API latency (optional)
    await this.simulateLatency(100);

    console.log('[MOCK] Fetching themes');
    return [...mockThemes];
  }

  async createSection(
    request: Request,
    themeId: string,
    fileName: string,
    content: string
  ): Promise<ThemeFileMetadata> {
    await this.simulateLatency(200);

    // Validate theme exists
    const theme = mockThemes.find(t => t.id === themeId);
    if (!theme) {
      throw new Error(`Theme not found: ${themeId}`);
    }

    // Normalize filename
    let normalizedFileName = fileName.trim();
    if (!normalizedFileName.startsWith('sections/')) {
      normalizedFileName = `sections/${normalizedFileName}`;
    }
    if (!normalizedFileName.endsWith('.liquid')) {
      normalizedFileName = `${normalizedFileName}.liquid`;
    }

    // Save to mock store
    const metadata = mockStore.saveSection(themeId, normalizedFileName, content);

    console.log(`[MOCK] Saved section to theme "${theme.name}": ${normalizedFileName}`);

    return metadata;
  }

  private async simulateLatency(ms: number): Promise<void> {
    const { simulateLatency } = await import('../config.server').then(m => m.serviceConfig);
    if (simulateLatency) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
  }
}

export const mockThemeService = new MockThemeService();
