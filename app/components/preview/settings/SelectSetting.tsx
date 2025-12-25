import type { SchemaSetting } from '../schema/SchemaTypes';

export interface SelectSettingProps {
  setting: SchemaSetting;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

/**
 * SelectSetting - Renders dropdown or segmented control based on options
 * Per Shopify: Use SegmentedControl (s-button-group gap="none") for ≤5 ungrouped options
 * @see https://shopify.dev/docs/api/app-home/polaris-web-components/actions/buttongroup
 */
export function SelectSetting({ setting, value, onChange, disabled }: SelectSettingProps) {
  const options = setting.options || [];

  // Check if any options have groups
  const hasGroups = options.some(opt => opt.group);

  // Use segmented control for ≤5 ungrouped options
  const useSegmented = options.length <= 5 && options.length > 1 && !hasGroups;

  if (useSegmented) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <span style={{ fontWeight: 500 }}>{setting.label}</span>

        <s-button-group gap="none" accessibilityLabel={setting.label}>
          {options.map((opt) => (
            <s-button
              key={opt.value}
              slot="secondary-actions"
              variant={value === opt.value ? 'primary' : 'secondary'}
              disabled={disabled || undefined}
              onClick={() => onChange(opt.value)}
            >
              {opt.label}
            </s-button>
          ))}
        </s-button-group>

        {setting.info && (
          <span style={{ fontSize: '13px', color: '#6d7175' }}>{setting.info}</span>
        )}
      </div>
    );
  }

  // Default: dropdown select
  const handleChange = (e: Event) => {
    const target = e.target as HTMLSelectElement;
    onChange(target.value);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <s-select
        label={setting.label}
        value={value}
        disabled={disabled || undefined}
        onChange={handleChange}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </s-select>
      {setting.info && (
        <span style={{ fontSize: '13px', color: '#6d7175' }}>{setting.info}</span>
      )}
    </div>
  );
}
