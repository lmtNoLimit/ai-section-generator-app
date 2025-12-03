import { ShopifyDrop } from './base/ShopifyDrop';
import type { MockImage } from '../mockData/types';

/**
 * Drop class for image objects
 * Provides Liquid-compatible access to image properties
 */
export class ImageDrop extends ShopifyDrop {
  private image: MockImage;

  constructor(image: MockImage) {
    super();
    this.image = image;
  }

  get src(): string {
    return this.image.src;
  }

  get url(): string {
    return this.image.src;
  }

  get alt(): string {
    return this.image.alt;
  }

  get width(): number {
    return this.image.width;
  }

  get height(): number {
    return this.image.height;
  }

  /**
   * Get image URL with size modifier (simplified implementation)
   * In Shopify, this would resize the image
   */
  img_url(_size?: string): string {
    // In real Shopify, size could be "100x100", "medium", "large", etc.
    // For preview, we just return the original URL
    return this.image.src;
  }

  /**
   * Get aspect ratio
   */
  get aspect_ratio(): number {
    return this.image.width / this.image.height;
  }

  liquidMethodMissing(propertyName: string): unknown {
    const data = this.image as unknown as Record<string, unknown>;
    return data[propertyName];
  }
}
