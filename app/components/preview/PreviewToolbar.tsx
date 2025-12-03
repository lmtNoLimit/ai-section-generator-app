import { useState } from 'react';
import type { DeviceSize } from './types';
import type { ResourceNeeds } from './hooks/useResourceDetection';
import type { SelectedResource } from './ResourceSelector';
import { ResourceSelector } from './ResourceSelector';

export interface PreviewToolbarProps {
  deviceSize: DeviceSize;
  onDeviceSizeChange: (size: DeviceSize) => void;
  onRefresh: () => void;
  isRendering?: boolean;
  selectedPreset?: string;
  onPresetChange?: (presetId: string) => void;
  presets?: Array<{ id: string; name: string }>;
  renderedHtml?: string;
  // Real data props
  useRealData?: boolean;
  onToggleRealData?: (enabled: boolean) => void;
  selectedProduct?: SelectedResource | null;
  selectedCollection?: SelectedResource | null;
  onProductSelect?: (productId: string | null, resource: SelectedResource | null) => void;
  onCollectionSelect?: (collectionId: string | null, resource: SelectedResource | null) => void;
  resourceNeeds?: ResourceNeeds;
  isLoadingResource?: boolean;
}

/**
 * Preview toolbar with device selector, data preset picker, resource picker, and refresh button
 */
export function PreviewToolbar({
  deviceSize,
  onDeviceSizeChange,
  onRefresh,
  isRendering,
  selectedPreset = '',
  onPresetChange,
  presets = [],
  renderedHtml,
  // Real data props
  useRealData = false,
  onToggleRealData,
  selectedProduct,
  selectedCollection,
  onProductSelect,
  onCollectionSelect,
  resourceNeeds,
  isLoadingResource
}: PreviewToolbarProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!renderedHtml) return;
    try {
      await navigator.clipboard.writeText(renderedHtml);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  // Group presets by category
  const productPresets = presets.filter(p => p.id.startsWith('product'));
  const collectionPresets = presets.filter(p => p.id.startsWith('collection'));
  const cartPresets = presets.filter(p => p.id.startsWith('cart'));

  // Check if section needs any resources
  const hasResourceNeeds = resourceNeeds && (
    resourceNeeds.needsProduct ||
    resourceNeeds.needsCollection ||
    resourceNeeds.needsArticle
  );

  return (
    <s-stack gap="base" direction="block">
      {/* Main toolbar row */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* Device size selector */}
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <s-button
            variant={deviceSize === 'mobile' ? 'primary' : 'tertiary'}
            onClick={() => onDeviceSizeChange('mobile')}
            aria-pressed={deviceSize === 'mobile' ? 'true' : 'false'}
            aria-label="Preview on mobile device"
          >
            Mobile
          </s-button>
          <s-button
            variant={deviceSize === 'tablet' ? 'primary' : 'tertiary'}
            onClick={() => onDeviceSizeChange('tablet')}
            aria-pressed={deviceSize === 'tablet' ? 'true' : 'false'}
            aria-label="Preview on tablet device"
          >
            Tablet
          </s-button>
          <s-button
            variant={deviceSize === 'desktop' ? 'primary' : 'tertiary'}
            onClick={() => onDeviceSizeChange('desktop')}
            aria-pressed={deviceSize === 'desktop' ? 'true' : 'false'}
            aria-label="Preview on desktop device"
          >
            Desktop
          </s-button>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* Data preset selector (only shown when using mock data) */}
          {onPresetChange && presets.length > 0 && !useRealData && (
            <select
              value={selectedPreset}
              onChange={(e) => onPresetChange(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #c9cccf',
                fontSize: '13px',
                backgroundColor: '#fff',
                cursor: 'pointer'
              }}
              aria-label="Select preview data preset"
            >
              <option value="">Default Data</option>
              {productPresets.length > 0 && (
                <optgroup label="Product">
                  {productPresets.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </optgroup>
              )}
              {collectionPresets.length > 0 && (
                <optgroup label="Collection">
                  {collectionPresets.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </optgroup>
              )}
              {cartPresets.length > 0 && (
                <optgroup label="Cart">
                  {cartPresets.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </optgroup>
              )}
            </select>
          )}

          {/* Copy HTML button */}
          {renderedHtml && (
            <s-button
              variant="tertiary"
              onClick={handleCopy}
            >
              {copied ? 'Copied!' : 'Copy HTML'}
            </s-button>
          )}

          {/* Refresh button */}
          <s-button
            variant="tertiary"
            onClick={onRefresh}
            loading={isRendering || undefined}
          >
            Refresh
          </s-button>
        </div>
      </div>

      {/* Real data controls row (shown if section uses resources) */}
      {hasResourceNeeds && onToggleRealData && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '12px',
          backgroundColor: useRealData ? '#f0fdf4' : '#f8f9fa',
          borderRadius: '8px',
          border: useRealData ? '1px solid #86efac' : '1px solid #e5e7eb',
          flexWrap: 'wrap'
        }}>
          {/* Data source toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <s-text type="strong">
              Preview Data:
            </s-text>
            <s-button
              variant={useRealData ? 'primary' : 'secondary'}
              onClick={() => onToggleRealData(!useRealData)}
              disabled={isLoadingResource || undefined}
            >
              {useRealData ? 'Using Real Data' : 'Using Mock Data'}
            </s-button>
          </div>

          {/* Resource selectors (only when using real data) */}
          {useRealData && (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              {resourceNeeds?.needsProduct && onProductSelect && (
                <ResourceSelector
                  resourceType="product"
                  onSelect={onProductSelect}
                  selectedResource={selectedProduct}
                  disabled={isLoadingResource}
                  loading={isLoadingResource}
                />
              )}

              {resourceNeeds?.needsCollection && onCollectionSelect && (
                <ResourceSelector
                  resourceType="collection"
                  onSelect={onCollectionSelect}
                  selectedResource={selectedCollection}
                  disabled={isLoadingResource}
                  loading={isLoadingResource}
                />
              )}
            </div>
          )}

          {/* Loading indicator */}
          {isLoadingResource && (
            <span style={{ color: '#6d7175', fontSize: '14px' }}>
              Loading...
            </span>
          )}
        </div>
      )}
    </s-stack>
  );
}
