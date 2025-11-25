import type { ThemeFileMetadata } from '../../types/shopify-api.types';

interface MockStoreState {
  savedSections: Map<string, ThemeFileMetadata>;
  generationCount: number;
}

class MockStore {
  private state: MockStoreState = {
    savedSections: new Map(),
    generationCount: 0
  };

  saveSection(themeId: string, filename: string, content: string): ThemeFileMetadata {
    const key = `${themeId}:${filename}`;
    const metadata: ThemeFileMetadata = {
      filename,
      size: content.length,
      contentType: 'text/liquid',
      checksum: this.generateChecksum(content)
    };

    this.state.savedSections.set(key, metadata);
    return metadata;
  }

  getSections(themeId: string): ThemeFileMetadata[] {
    const sections: ThemeFileMetadata[] = [];
    this.state.savedSections.forEach((metadata, key) => {
      if (key.startsWith(`${themeId}:`)) {
        sections.push(metadata);
      }
    });
    return sections;
  }

  incrementGeneration(): number {
    return ++this.state.generationCount;
  }

  getGenerationCount(): number {
    return this.state.generationCount;
  }

  reset(): void {
    this.state.savedSections.clear();
    this.state.generationCount = 0;
  }

  private generateChecksum(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }
}

export const mockStore = new MockStore();
