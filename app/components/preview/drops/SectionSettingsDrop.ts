import { ShopifyDrop } from './base/ShopifyDrop';
import type { ProductDrop } from './ProductDrop';
import type { CollectionDrop } from './CollectionDrop';
import type { SettingsState } from '../schema/SchemaTypes';
import { FontDrop } from './FontDrop';
import { isFontIdentifier, getFontData } from '../utils/fontRegistry';

type ResourceDrop = ProductDrop | CollectionDrop;

/**
 * Drop class for section.settings that merges primitive values with resource Drops
 * Enables property access chains like {{ section.settings.featured_product.title }}
 *
 * When a resource picker (product/collection) is selected, the Drop is stored and
 * returned instead of the primitive ID value, allowing nested property access.
 *
 * Font picker values are automatically wrapped in FontDrop for Liquid compatibility.
 */
export class SectionSettingsDrop extends ShopifyDrop {
  private primitiveSettings: SettingsState;
  private resourceDrops: Record<string, ResourceDrop>;
  private fontDropCache: Map<string, FontDrop> = new Map();

  constructor(
    settings: SettingsState,
    resourceDrops: Record<string, ResourceDrop> = {}
  ) {
    super();
    this.primitiveSettings = settings;
    this.resourceDrops = resourceDrops;
  }

  /**
   * LiquidJS calls this for any property access on the Drop
   * Returns resource Drop if exists, FontDrop for font values, otherwise primitive
   */
  liquidMethodMissing(key: string): unknown {
    // Resource drops take precedence (product/collection pickers)
    if (key in this.resourceDrops) {
      return this.resourceDrops[key];
    }

    const value = this.primitiveSettings[key];

    // Wrap font identifier strings in FontDrop for Liquid property access
    if (typeof value === 'string' && isFontIdentifier(value)) {
      // Use cache to avoid creating new FontDrop instances on every access
      if (!this.fontDropCache.has(key)) {
        this.fontDropCache.set(key, new FontDrop(getFontData(value)));
      }
      return this.fontDropCache.get(key);
    }

    // Primitive settings (text, number, color, etc.)
    return value;
  }

  /**
   * Make Drop iterable for {% for %} loops if needed
   * Yields [key, value] pairs for all settings
   */
  *[Symbol.iterator](): Generator<[string, unknown]> {
    // First yield primitive settings
    for (const key of Object.keys(this.primitiveSettings)) {
      yield [key, this.liquidMethodMissing(key)];
    }
    // Then yield resource drops not in primitives
    for (const key of Object.keys(this.resourceDrops)) {
      if (!(key in this.primitiveSettings)) {
        yield [key, this.resourceDrops[key]];
      }
    }
  }
}
