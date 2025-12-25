/**
 * RadioSetting Component
 * Renders radio button group using Polaris Web Components
 * Uses <s-choice-list> for consistent styling with Theme Customizer
 */

import type { SchemaSetting } from '../schema/SchemaTypes';

export interface RadioSettingProps {
  setting: SchemaSetting;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function RadioSetting({ setting, value, onChange, disabled }: RadioSettingProps) {
  const options = setting.options || [];

  // Handle change event from s-choice-list
  // values is an array of selected values (single selection for radio)
  const handleChange = (e: Event) => {
    const target = e.currentTarget as HTMLElement & { values: string[] };
    if (target.values?.length > 0) {
      onChange(target.values[0]);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <s-choice-list
        label={setting.label}
        values={value ? [value] : []}
        disabled={disabled || undefined}
        onChange={handleChange}
      >
        {options.map((option) => (
          <s-choice key={option.value} value={option.value}>
            {option.label}
          </s-choice>
        ))}
      </s-choice-list>

      {setting.info && (
        <span style={{ fontSize: '13px', color: '#6d7175' }}>{setting.info}</span>
      )}
    </div>
  );
}
