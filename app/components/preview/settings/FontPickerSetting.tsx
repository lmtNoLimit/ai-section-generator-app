/**
 * FontPickerSetting Component
 * Renders font selection for typography settings
 * Uses fontRegistry for consistent font data across UI and rendering
 */

import type { SchemaSetting } from '../schema/SchemaTypes';
import { getFontOptions, getFontData } from '../utils/fontRegistry';

export interface FontPickerSettingProps {
  setting: SchemaSetting;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function FontPickerSetting({ setting, value, onChange, disabled }: FontPickerSettingProps) {
  const fontOptions = getFontOptions();

  const handleChange = (e: Event) => {
    const target = e.target as HTMLSelectElement;
    onChange(target.value);
  };

  const selectedFont = getFontData(value || 'system-ui');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <span style={{ fontWeight: 500 }}>{setting.label}</span>

      <s-select
        label="Font family"
        value={value || 'system-ui'}
        disabled={disabled || undefined}
        onChange={handleChange}
      >
        {fontOptions.map((font) => (
          <option key={font.value} value={font.value}>
            {font.label}
          </option>
        ))}
      </s-select>

      {/* Font preview with actual font stack */}
      <div style={{
        padding: '12px',
        backgroundColor: '#f6f6f7',
        borderRadius: '4px',
        fontFamily: selectedFont.stack,
        fontSize: '16px'
      }}>
        The quick brown fox jumps over the lazy dog
      </div>

      {setting.info && (
        <span style={{ fontSize: '13px', color: '#6d7175' }}>{setting.info}</span>
      )}

      <span style={{ fontSize: '12px', color: '#8c9196' }}>
        In Shopify, this opens the full font picker with Google Fonts
      </span>
    </div>
  );
}
