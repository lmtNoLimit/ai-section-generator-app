import { ShopifyDrop } from './base/ShopifyDrop';
import { CollectionDrop } from './CollectionDrop';
import type { MockCollection } from '../mockData/types';

/**
 * Drop class for collections global object
 * Provides Liquid-compatible access to collections by handle
 * Acts as a proxy - returns the default collection for any key lookup
 */
export class CollectionsDrop extends ShopifyDrop {
  private defaultCollection: CollectionDrop;
  private collectionMap: Map<string, CollectionDrop>;

  constructor(defaultCollectionData: MockCollection, additionalCollections: MockCollection[] = []) {
    super();
    this.defaultCollection = new CollectionDrop(defaultCollectionData);
    this.collectionMap = new Map();

    // Add the default collection by its handle
    this.collectionMap.set(defaultCollectionData.handle, this.defaultCollection);

    // Add any additional collections
    additionalCollections.forEach(col => {
      this.collectionMap.set(col.handle, new CollectionDrop(col));
    });
  }

  /**
   * Handle property access like collections['all'] or collections.featured
   * Returns the default collection for any unknown handle (preview fallback)
   */
  liquidMethodMissing(key: string): CollectionDrop {
    // Check if we have this specific collection
    const found = this.collectionMap.get(key);
    if (found) {
      return found;
    }
    // Otherwise return the default collection as fallback
    return this.defaultCollection;
  }

  /**
   * Make the Drop iterable for {% for collection in collections %}
   */
  [Symbol.iterator](): Iterator<CollectionDrop> {
    return this.collectionMap.values();
  }

  /**
   * Return array of all collections for iteration
   */
  toArray(): CollectionDrop[] {
    return Array.from(this.collectionMap.values());
  }

  /**
   * Size property for length checks
   */
  get size(): number {
    return this.collectionMap.size;
  }
}
