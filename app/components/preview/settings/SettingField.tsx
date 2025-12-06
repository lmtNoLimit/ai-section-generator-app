import type { SchemaSetting } from '../schema/SchemaTypes';
import type { SelectedResource } from '../ResourceSelector';
import { TextSetting } from './TextSetting';
import { NumberSetting } from './NumberSetting';
import { SelectSetting } from './SelectSetting';
import { CheckboxSetting } from './CheckboxSetting';
import { ColorSetting } from './ColorSetting';
import { ImageSetting } from './ImageSetting';
import { ProductSetting } from './ProductSetting';
import { CollectionSetting } from './CollectionSetting';

export interface SettingFieldProps {
  setting: SchemaSetting;
  value: string | number | boolean;
  onChange: (id: string, value: string | number | boolean) => void;
  disabled?: boolean;
  // Resource setting props (for product/collection types)
  resourceSettings?: Record<string, SelectedResource | null>;
  onResourceSelect?: (settingId: string, resourceId: string | null, resource: SelectedResource | null) => void;
  isLoadingResource?: boolean;
}

/**
 * Routes setting to appropriate input component based on type
 */
export function SettingField({
  setting,
  value,
  onChange,
  disabled,
  resourceSettings,
  onResourceSelect,
  isLoadingResource
}: SettingFieldProps) {
  const handleChange = (newValue: string | number | boolean) => {
    onChange(setting.id, newValue);
  };

  switch (setting.type) {
    case 'text':
    case 'textarea':
    case 'richtext':
    case 'url':
    case 'html':
      return (
        <TextSetting
          setting={setting}
          value={String(value || '')}
          onChange={handleChange}
          disabled={disabled}
        />
      );

    case 'number':
    case 'range':
      return (
        <NumberSetting
          setting={setting}
          value={Number(value) || 0}
          onChange={handleChange}
          disabled={disabled}
        />
      );

    case 'select':
      return (
        <SelectSetting
          setting={setting}
          value={String(value || '')}
          onChange={handleChange}
          disabled={disabled}
        />
      );

    case 'checkbox':
      return (
        <CheckboxSetting
          setting={setting}
          value={Boolean(value)}
          onChange={handleChange}
          disabled={disabled}
        />
      );

    case 'color':
    case 'color_background':
      return (
        <ColorSetting
          setting={setting}
          value={String(value || '#000000')}
          onChange={handleChange}
          disabled={disabled}
        />
      );

    case 'image_picker':
      return (
        <ImageSetting
          setting={setting}
          value={String(value || '')}
          onChange={handleChange}
          disabled={disabled}
        />
      );

    case 'product':
      return (
        <ProductSetting
          setting={setting}
          value={String(value || '')}
          onChange={handleChange}
          disabled={disabled}
          selectedResource={resourceSettings?.[setting.id]}
          onResourceSelect={onResourceSelect}
          loading={isLoadingResource}
        />
      );

    case 'collection':
      return (
        <CollectionSetting
          setting={setting}
          value={String(value || '')}
          onChange={handleChange}
          disabled={disabled}
          selectedResource={resourceSettings?.[setting.id]}
          onResourceSelect={onResourceSelect}
          loading={isLoadingResource}
        />
      );

    default:
      // Fallback to text input for unsupported types
      return (
        <TextSetting
          setting={{ ...setting, type: 'text' }}
          value={String(value || '')}
          onChange={handleChange}
          disabled={disabled}
        />
      );
  }
}
