/**
 * Preview Context Builder
 * Builds Liquid template context with Drop classes for real data
 * or uses mock data presets
 */

import { ProductDrop, CollectionDrop, CollectionsDrop, ArticleDrop, ShopDrop } from '../drops';
import { buildContextFromPreset, getDefaultContext } from '../mockData/registry';
import type { MockProduct, MockCollection, MockArticle, MockShop } from '../mockData/types';

export interface PreviewContextOptions {
  useRealData: boolean;
  product?: MockProduct | null;
  products?: MockProduct[];
  collection?: MockCollection | null;
  article?: MockArticle | null;
  shop?: MockShop;
  preset?: string;
  // Settings-based resources (from schema settings with type: product/collection)
  settingsResources?: Record<string, MockProduct | MockCollection>;
}

export interface PreviewContext {
  product?: ProductDrop;
  collection?: CollectionDrop;
  collections?: CollectionsDrop;
  article?: ArticleDrop;
  shop: ShopDrop;
  settingsResourceDrops?: Record<string, ProductDrop | CollectionDrop>;
  [key: string]: unknown;
}

/**
 * Build Drop classes for settings-based resources
 * Wraps MockProduct/MockCollection in appropriate Drop classes
 */
function buildSettingsResourceDrops(
  settingsResources: Record<string, MockProduct | MockCollection>
): Record<string, ProductDrop | CollectionDrop> {
  const drops: Record<string, ProductDrop | CollectionDrop> = {};

  for (const [settingId, resource] of Object.entries(settingsResources)) {
    // Determine if resource is product or collection based on shape
    if ('variants' in resource || 'vendor' in resource || 'product_type' in resource) {
      // It's a product
      drops[settingId] = new ProductDrop(resource as MockProduct);
    } else {
      // It's a collection
      drops[settingId] = new CollectionDrop(resource as MockCollection);
    }
  }

  return drops;
}

/**
 * Build preview context with Drop classes (real data) or mock data
 * Drop classes provide controlled access to object properties in Liquid templates
 */
export function buildPreviewContext(options: PreviewContextOptions): PreviewContext {
  const { useRealData, product, products = [], collection, article, shop, preset, settingsResources = {} } = options;

  // Build settings resource drops (these are always available, regardless of mock/real mode)
  const settingsResourceDrops = Object.keys(settingsResources).length > 0
    ? buildSettingsResourceDrops(settingsResources)
    : undefined;

  // Get mock context for fallback (always have mock data available)
  const mockContext = preset
    ? buildContextFromPreset(preset)
    : getDefaultContext();

  // Use mock data preset if not using real data
  if (!useRealData) {
    // Wrap mock data in Drop classes for consistent access
    const collectionData = mockContext.collection as MockCollection | undefined;
    return {
      product: mockContext.product ? new ProductDrop(mockContext.product as MockProduct) : undefined,
      collection: collectionData ? new CollectionDrop(collectionData) : undefined,
      // Provide collections global for templates using collections['handle'] syntax
      collections: collectionData ? new CollectionsDrop(collectionData) : undefined,
      article: mockContext.article ? new ArticleDrop(mockContext.article as MockArticle) : undefined,
      shop: new ShopDrop(mockContext.shop as MockShop),
      cart: mockContext.cart,
      // Settings-based resources are always included
      settingsResourceDrops
    };
  }

  // Build context with Drop classes for real data
  const defaultShop = getDefaultContext().shop as MockShop;

  const context: PreviewContext = {
    shop: shop ? new ShopDrop(shop) : new ShopDrop(defaultShop)
  };

  // Use real data if selected, otherwise fall back to mock data
  // This prevents "product not found" errors when real data mode is on but no selection made
  if (product) {
    context.product = new ProductDrop(product);
  } else if (products.length > 0) {
    // Use first product from multiple selection as the "product" context
    context.product = new ProductDrop(products[0]);
  } else if (mockContext.product) {
    // Fallback to mock product when real data mode but no selection
    context.product = new ProductDrop(mockContext.product as MockProduct);
  }

  // Handle collection and collections global
  let collectionData: MockCollection | null = null;

  if (collection) {
    // If we have selected products, merge them into the collection
    if (products.length > 0) {
      collectionData = {
        ...collection,
        products: products,
        products_count: products.length
      };
    } else {
      collectionData = collection;
    }
  } else if (products.length > 0) {
    // Create a synthetic collection from selected products
    const mockCol = mockContext.collection as MockCollection | undefined;
    collectionData = {
      id: mockCol?.id || 1,
      title: mockCol?.title || 'Selected Products',
      handle: mockCol?.handle || 'selected-products',
      description: mockCol?.description || 'Products selected for preview',
      url: mockCol?.url || '/collections/selected-products',
      products_count: products.length,
      products: products,
      image: mockCol?.image || null
    };
  } else if (mockContext.collection) {
    // Fallback to mock collection when real data mode but no selection
    collectionData = mockContext.collection as MockCollection;
  }

  if (collectionData) {
    context.collection = new CollectionDrop(collectionData);
    // Provide collections global for templates using collections['handle'] syntax
    context.collections = new CollectionsDrop(collectionData);
  }

  if (article) {
    context.article = new ArticleDrop(article);
  } else if (mockContext.article) {
    // Fallback to mock article when real data mode but no selection
    context.article = new ArticleDrop(mockContext.article as MockArticle);
  }

  // Include cart from mock context
  if (mockContext.cart) {
    context.cart = mockContext.cart;
  }

  // Settings-based resources are always included
  if (settingsResourceDrops) {
    context.settingsResourceDrops = settingsResourceDrops;
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
