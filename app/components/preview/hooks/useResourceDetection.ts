import { useMemo } from 'react';

/**
 * Resource needs detected from Liquid code
 */
export interface ResourceNeeds {
  needsProduct: boolean;
  needsCollection: boolean;
  needsArticle: boolean;
  needsBlog: boolean;
  needsCart: boolean;
}

/**
 * Analyze Liquid code to detect required resources
 * Looks for Liquid variable access patterns like {{ product.title }}
 */
export function useResourceDetection(liquidCode: string): ResourceNeeds {
  return useMemo(() => {
    if (!liquidCode) {
      return {
        needsProduct: false,
        needsCollection: false,
        needsArticle: false,
        needsBlog: false,
        needsCart: false
      };
    }

    // Patterns to detect resource usage in Liquid templates
    // Product patterns: {{ product.title }}, {% for variant in product.variants %}
    const productPattern = /\{\{-?\s*product\./i;
    const productForPattern = /{%\s*for\s+\w+\s+in\s+product\./i;

    // Collection patterns: {{ collection.title }}, {% for product in collection.products %}
    // Also detect: collections['handle'], collections[settings.collection], collections.all
    const collectionPattern = /\{\{-?\s*collection\./i;
    const collectionForPattern = /{%\s*for\s+\w+\s+in\s+collection\.products/i;
    const collectionsAccessPattern = /collections\[/i;
    const collectionsPropertyPattern = /collections\.\w+/i;

    const articlePattern = /\{\{-?\s*article\./i;
    const blogPattern = /\{\{-?\s*blog\./i;
    const cartPattern = /\{\{-?\s*cart\./i;

    // Detect if template iterates over products (common pattern in product grids)
    const productLoopPattern = /{%\s*for\s+product\s+in\s+/i;

    return {
      needsProduct: productPattern.test(liquidCode) || productForPattern.test(liquidCode) || productLoopPattern.test(liquidCode),
      needsCollection: collectionPattern.test(liquidCode) || collectionForPattern.test(liquidCode) || collectionsAccessPattern.test(liquidCode) || collectionsPropertyPattern.test(liquidCode),
      needsArticle: articlePattern.test(liquidCode),
      needsBlog: blogPattern.test(liquidCode),
      needsCart: cartPattern.test(liquidCode)
    };
  }, [liquidCode]);
}

/**
 * Get a human-readable summary of detected resources
 */
export function getResourceSummary(needs: ResourceNeeds): string {
  const resources: string[] = [];

  if (needs.needsProduct) resources.push('Product');
  if (needs.needsCollection) resources.push('Collection');
  if (needs.needsArticle) resources.push('Article');
  if (needs.needsBlog) resources.push('Blog');
  if (needs.needsCart) resources.push('Cart');

  if (resources.length === 0) {
    return 'No specific resources detected';
  }

  return `Detected: ${resources.join(', ')}`;
}
