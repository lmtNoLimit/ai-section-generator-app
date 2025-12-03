import { Drop } from 'liquidjs';

/**
 * Base class for all Shopify drop classes
 * Extends LiquidJS Drop to provide property access control for Liquid templates
 */
export abstract class ShopifyDrop extends Drop {
  /**
   * Safely get property value with optional default
   */
  protected safeGet<T>(obj: Record<string, unknown> | undefined | null, key: string, defaultValue?: T): T | undefined {
    if (!obj) return defaultValue;
    const value = obj[key];
    return (value !== undefined && value !== null ? value : defaultValue) as T | undefined;
  }

  /**
   * Check if property exists and is not null/undefined
   */
  protected hasProperty(obj: Record<string, unknown> | undefined | null, key: string): boolean {
    if (!obj) return false;
    return obj[key] !== undefined && obj[key] !== null;
  }

  /**
   * Default implementation of liquidMethodMissing
   * Override in subclasses for custom behavior
   */
  liquidMethodMissing(_key: string): unknown {
    return undefined;
  }
}
