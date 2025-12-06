import type { MockDataContext, DataPreset } from './types';
import { productPresets, defaultProduct } from './presets/product';
import { collectionPresets, defaultCollection } from './presets/collection';
import { defaultShop, cartPresets } from './presets/shop';

// Combine all presets into categories
export const presetCategories = {
  product: productPresets,
  collection: collectionPresets,
  cart: cartPresets
} as const;

export type PresetCategory = keyof typeof presetCategories;

/**
 * Get all presets as flat array
 */
export function getAllPresets(): DataPreset[] {
  return [
    ...productPresets,
    ...collectionPresets,
    ...cartPresets
  ];
}

/**
 * Get preset by ID
 */
export function getPresetById(id: string): DataPreset | undefined {
  return getAllPresets().find(p => p.id === id);
}

/**
 * Get default context (includes shop, product, and collection for preview)
 */
export function getDefaultContext(): MockDataContext {
  return {
    shop: defaultShop,
    product: defaultProduct,
    collection: defaultCollection,
    request: {
      design_mode: true,
      page_type: 'product',
      path: '/products/demo'
    },
    customer: null
  };
}

/**
 * Build full context from preset
 */
export function buildContextFromPreset(presetId: string): MockDataContext {
  const preset = getPresetById(presetId);
  const defaultContext = getDefaultContext();

  if (!preset) {
    return defaultContext;
  }

  return {
    ...defaultContext,
    ...preset.data
  };
}

/**
 * Merge custom data into context
 */
export function mergeCustomData(
  baseContext: MockDataContext,
  customJson: string
): MockDataContext {
  try {
    const customData = JSON.parse(customJson);
    return {
      ...baseContext,
      ...customData
    };
  } catch (error) {
    console.warn('Failed to parse custom JSON data:', error);
    return baseContext;
  }
}
