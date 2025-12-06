import { useState } from 'react';
import type { SchemaSetting, SettingsState, BlockInstance, SchemaDefinition } from '../schema/SchemaTypes';
import type { SelectedResource } from '../ResourceSelector';
import type { DeviceSize } from '../types';
import { SettingField } from './SettingField';

export interface DataPreset {
  id: string;
  name: string;
}

export interface SettingsPanelProps {
  settings: SchemaSetting[];
  values: SettingsState;
  onChange: (values: SettingsState) => void;
  disabled?: boolean;
  schema?: SchemaDefinition | null;
  blocks?: BlockInstance[];
  onBlockSettingChange?: (blockIndex: number, settingId: string, value: string | number | boolean) => void;
  // Resource setting props
  resourceSettings?: Record<string, SelectedResource | null>;
  onResourceSelect?: (settingId: string, resourceId: string | null, resource: SelectedResource | null) => void;
  isLoadingResource?: boolean;
  // Preview controls (formerly in toolbar)
  deviceSize?: DeviceSize;
  onDeviceSizeChange?: (size: DeviceSize) => void;
  onRefresh?: () => void;
  isRendering?: boolean;
  selectedPreset?: string;
  onPresetChange?: (presetId: string) => void;
  presets?: DataPreset[];
}

/**
 * Collapsible panel displaying schema settings form
 */
export function SettingsPanel({
  settings,
  values,
  onChange,
  disabled,
  schema,
  blocks,
  onBlockSettingChange,
  resourceSettings,
  onResourceSelect,
  isLoadingResource,
  // Preview controls
  deviceSize = 'desktop',
  onDeviceSizeChange,
  onRefresh,
  isRendering,
  selectedPreset = '',
  onPresetChange,
  presets = []
}: SettingsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedBlocks, setExpandedBlocks] = useState<Record<string, boolean>>({});

  // Group presets by category
  const productPresets = presets.filter(p => p.id.startsWith('product'));
  const collectionPresets = presets.filter(p => p.id.startsWith('collection'));
  const cartPresets = presets.filter(p => p.id.startsWith('cart'));

  // Preview controls toolbar (always shown)
  const previewControls = (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '12px',
      marginBottom: '16px',
      paddingBottom: '16px',
      borderBottom: '1px solid #e1e3e5'
    }}>
      {/* Device size selector */}
      {onDeviceSizeChange && (
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <button
            onClick={() => onDeviceSizeChange('mobile')}
            style={{
              padding: '6px 12px',
              backgroundColor: deviceSize === 'mobile' ? '#008060' : 'transparent',
              color: deviceSize === 'mobile' ? '#fff' : '#202223',
              border: deviceSize === 'mobile' ? 'none' : '1px solid #c9cccf',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            Mobile
          </button>
          <button
            onClick={() => onDeviceSizeChange('tablet')}
            style={{
              padding: '6px 12px',
              backgroundColor: deviceSize === 'tablet' ? '#008060' : 'transparent',
              color: deviceSize === 'tablet' ? '#fff' : '#202223',
              border: deviceSize === 'tablet' ? 'none' : '1px solid #c9cccf',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            Tablet
          </button>
          <button
            onClick={() => onDeviceSizeChange('desktop')}
            style={{
              padding: '6px 12px',
              backgroundColor: deviceSize === 'desktop' ? '#008060' : 'transparent',
              color: deviceSize === 'desktop' ? '#fff' : '#202223',
              border: deviceSize === 'desktop' ? 'none' : '1px solid #c9cccf',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            Desktop
          </button>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {/* Data preset selector */}
        {onPresetChange && presets.length > 0 && (
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

        {/* Refresh button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRendering}
            style={{
              padding: '6px 12px',
              backgroundColor: 'transparent',
              border: '1px solid #c9cccf',
              borderRadius: '4px',
              cursor: isRendering ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              opacity: isRendering ? 0.5 : 1
            }}
          >
            {isRendering ? 'Rendering...' : 'Refresh'}
          </button>
        )}
      </div>
    </div>
  );

  if (settings.length === 0 && (!blocks || blocks.length === 0)) {
    return (
      <div style={{
        backgroundColor: '#fff',
        border: '1px solid #e1e3e5',
        borderRadius: '8px',
        padding: '16px'
      }}>
        {previewControls}
        <p style={{ color: '#6d7175', fontSize: '14px', margin: 0 }}>
          No customizable settings found in section schema.
        </p>
      </div>
    );
  }

  const toggleBlockExpanded = (blockId: string) => {
    setExpandedBlocks(prev => ({
      ...prev,
      [blockId]: !prev[blockId]
    }));
  };

  const getBlockTitle = (block: BlockInstance, blockDef: { name?: string } | undefined) => {
    const settingsTitle = block.settings.heading || block.settings.title || block.settings.text;
    return String(settingsTitle || blockDef?.name || block.type);
  };

  const handleFieldChange = (id: string, value: string | number | boolean) => {
    onChange({
      ...values,
      [id]: value
    });
  };

  const handleResetDefaults = () => {
    const defaults: SettingsState = {};
    for (const setting of settings) {
      if (setting.default !== undefined) {
        defaults[setting.id] = setting.default;
      } else {
        switch (setting.type) {
          case 'checkbox':
            defaults[setting.id] = false;
            break;
          case 'number':
          case 'range':
            defaults[setting.id] = setting.min ?? 0;
            break;
          case 'color':
          case 'color_background':
            defaults[setting.id] = '#000000';
            break;
          case 'select':
            defaults[setting.id] = setting.options?.[0]?.value ?? '';
            break;
          default:
            defaults[setting.id] = '';
        }
      }
    }
    onChange(defaults);
  };

  return (
    <div style={{
      backgroundColor: '#fff',
      border: '1px solid #e1e3e5',
      borderRadius: '8px',
      padding: '16px'
    }}>
      {/* Preview controls */}
      {previewControls}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>
            Settings ({settings.length})
          </h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleResetDefaults}
              disabled={disabled}
              style={{
                padding: '6px 12px',
                backgroundColor: 'transparent',
                border: '1px solid #c9cccf',
                borderRadius: '4px',
                cursor: disabled ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                opacity: disabled ? 0.5 : 1
              }}
            >
              Reset
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              style={{
                padding: '6px 12px',
                backgroundColor: 'transparent',
                border: '1px solid #c9cccf',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </button>
          </div>
        </div>

        {isExpanded && settings.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {settings.map((setting) => (
              <SettingField
                key={setting.id}
                setting={setting}
                value={values[setting.id]}
                onChange={handleFieldChange}
                disabled={disabled}
                resourceSettings={resourceSettings}
                onResourceSelect={onResourceSelect}
                isLoadingResource={isLoadingResource}
              />
            ))}
          </div>
        )}

        {/* Block Settings */}
        {isExpanded && blocks && blocks.length > 0 && (
          <div style={{ marginTop: settings.length > 0 ? '16px' : 0 }}>
            <div style={{
              borderTop: settings.length > 0 ? '1px solid #e1e3e5' : 'none',
              paddingTop: settings.length > 0 ? '16px' : 0
            }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600 }}>
                Blocks ({blocks.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {blocks.map((block, blockIndex) => {
                  const blockDef = schema?.blocks?.find(b => b.type === block.type);
                  const blockSettings = blockDef?.settings || [];

                  if (blockSettings.length === 0) return null;

                  const isBlockExpanded = expandedBlocks[block.id] ?? false;
                  const blockTitle = getBlockTitle(block, blockDef);

                  return (
                    <div
                      key={block.id}
                      style={{
                        backgroundColor: '#f6f6f7',
                        border: '1px solid #e1e3e5',
                        borderRadius: '6px',
                        overflow: 'hidden'
                      }}
                    >
                      {/* Block Header */}
                      <button
                        onClick={() => toggleBlockExpanded(block.id)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          backgroundColor: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        <span style={{
                          fontSize: '13px',
                          fontWeight: 500,
                          color: '#202223'
                        }}>
                          {blockTitle} #{blockIndex + 1}
                        </span>
                        <span style={{
                          fontSize: '12px',
                          color: '#6d7175',
                          transform: isBlockExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s'
                        }}>
                          ▼
                        </span>
                      </button>

                      {/* Block Settings */}
                      {isBlockExpanded && (
                        <div style={{
                          padding: '12px',
                          borderTop: '1px solid #e1e3e5',
                          backgroundColor: '#fff',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px'
                        }}>
                          {blockSettings.map((setting) => (
                            <SettingField
                              key={`${block.id}-${setting.id}`}
                              setting={setting}
                              value={block.settings[setting.id] ?? ''}
                              onChange={(_id, value) => {
                                onBlockSettingChange?.(blockIndex, setting.id, value);
                              }}
                              disabled={disabled}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
