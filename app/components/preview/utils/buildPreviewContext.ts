/**
 * Preview Context Builder
 * Builds Liquid template context with Drop classes for real data
 * or uses mock data presets
 */

import { ProductDrop, CollectionDrop, ArticleDrop, ShopDrop } from '../drops';
import { buildContextFromPreset, getDefaultContext } from '../mockData/registry';
import type { MockProduct, MockCollection, MockArticle, MockShop } from '../mockData/types';

export interface PreviewContextOptions {
  useRealData: boolean;
  product?: MockProduct | null;
  collection?: MockCollection | null;
  article?: MockArticle | null;
  shop?: MockShop;
  preset?: string;
}

export interface PreviewContext {
  product?: ProductDrop;
  collection?: CollectionDrop;
  article?: ArticleDrop;
  shop: ShopDrop;
  [key: string]: unknown;
}

/**
 * Build preview context with Drop classes (real data) or mock data
 * Drop classes provide controlled access to object properties in Liquid templates
 */
export function buildPreviewContext(options: PreviewContextOptions): PreviewContext {
  const { useRealData, product, collection, article, shop, preset } = options;

  // Use mock data preset if not using real data
  if (!useRealData) {
    const mockContext = preset
      ? buildContextFromPreset(preset)
      : getDefaultContext();

    // Wrap mock data in Drop classes for consistent access
    return {
      product: mockContext.product ? new ProductDrop(mockContext.product as MockProduct) : undefined,
      collection: mockContext.collection ? new CollectionDrop(mockContext.collection as MockCollection) : undefined,
      article: mockContext.article ? new ArticleDrop(mockContext.article as MockArticle) : undefined,
      shop: new ShopDrop(mockContext.shop as MockShop),
      cart: mockContext.cart
    };
  }

  // Build context with Drop classes for real data
  const defaultShop = getDefaultContext().shop as MockShop;

  const context: PreviewContext = {
    shop: shop ? new ShopDrop(shop) : new ShopDrop(defaultShop)
  };

  if (product) {
    context.product = new ProductDrop(product);
  }

  if (collection) {
    context.collection = new CollectionDrop(collection);
  }

  if (article) {
    context.article = new ArticleDrop(article);
  }

  return context;
}

/**
 * Extract resource summary for UI display
 */
export function getContextResourceSummary(context: PreviewContext): string {
  const resources: string[] = [];

  if (context.product) {
    resources.push(`Product: ${context.product.title}`);
  }
  if (context.collection) {
    resources.push(`Collection: ${context.collection.title}`);
  }
  if (context.article) {
    resources.push(`Article: ${context.article.title}`);
  }

  return resources.length > 0
    ? resources.join(', ')
    : 'Using default shop data';
}

/**
 * Check if context has any selected resources
 */
export function hasSelectedResources(context: PreviewContext): boolean {
  return !!(context.product || context.collection || context.article);
}
