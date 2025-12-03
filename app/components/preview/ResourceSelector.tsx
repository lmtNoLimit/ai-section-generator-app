/**
 * Resource Selector Component
 * Uses Shopify App Bridge ResourcePicker for selecting products, collections, articles
 */

import { useState, useCallback } from 'react';
import { useAppBridge } from '@shopify/app-bridge-react';
import { SelectedResourceDisplay } from './SelectedResourceDisplay';

export type ResourceType = 'product' | 'collection' | 'variant';

export interface SelectedResource {
  id: string;
  title: string;
  image?: string;
}

interface ResourceSelectorProps {
  resourceType: ResourceType;
  onSelect: (resourceId: string | null, resource: SelectedResource | null) => void;
  selectedResource?: SelectedResource | null;
  disabled?: boolean;
  loading?: boolean;
}

/**
 * ResourceSelector - Opens App Bridge ResourcePicker modal
 * Provides product/collection selection with native Shopify admin UX
 */
export function ResourceSelector({
  resourceType,
  onSelect,
  selectedResource,
  disabled,
  loading
}: ResourceSelectorProps) {
  const shopify = useAppBridge();
  const [isOpening, setIsOpening] = useState(false);

  const resourceTypeLabel = {
    product: 'Product',
    collection: 'Collection',
    variant: 'Variant'
  }[resourceType];

  const handleOpenPicker = useCallback(async () => {
    if (disabled || loading || isOpening) return;

    setIsOpening(true);
    try {
      // Use App Bridge resourcePicker API
      const selected = await shopify.resourcePicker({
        type: resourceType,
        multiple: false,
        action: 'select'
      });

      if (selected && selected.length > 0) {
        const resource = selected[0];

        // Extract image based on resource type
        let imageUrl: string | undefined;
        if ('images' in resource && Array.isArray(resource.images) && resource.images.length > 0) {
          const firstImage = resource.images[0] as { originalSrc?: string; src?: string; url?: string };
          imageUrl = firstImage.originalSrc || firstImage.src || firstImage.url;
        } else if ('image' in resource && resource.image) {
          const img = resource.image as { originalSrc?: string; src?: string; url?: string };
          imageUrl = img.originalSrc || img.src || img.url;
        }

        const selectedResource: SelectedResource = {
          id: resource.id,
          title: resource.title || 'Untitled',
          image: imageUrl
        };

        onSelect(resource.id, selectedResource);
      }
    } catch (error) {
      // User cancelled the picker - this is expected behavior
      if ((error as Error)?.message?.includes('cancel')) {
        return;
      }
      console.error('ResourcePicker error:', error);
    } finally {
      setIsOpening(false);
    }
  }, [shopify, resourceType, disabled, loading, isOpening, onSelect]);

  const handleClear = useCallback(() => {
    onSelect(null, null);
  }, [onSelect]);

  return (
    <s-stack gap="small" direction="inline">
      {/* Select/Change button */}
      <s-button
        variant="secondary"
        onClick={handleOpenPicker}
        disabled={disabled || loading || isOpening || undefined}
        loading={isOpening || loading || undefined}
      >
        {selectedResource ? `Change ${resourceTypeLabel}` : `Select ${resourceTypeLabel}`}
      </s-button>

      {/* Selected resource display */}
      {selectedResource && (
        <SelectedResourceDisplay
          title={selectedResource.title}
          image={selectedResource.image}
          onClear={handleClear}
          disabled={disabled || loading}
        />
      )}
    </s-stack>
  );
}
