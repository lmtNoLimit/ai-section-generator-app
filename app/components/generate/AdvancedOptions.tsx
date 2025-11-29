import { useState } from 'react';

export interface AdvancedOptionsState {
  tone: 'professional' | 'casual' | 'friendly';
  style: 'minimal' | 'bold' | 'elegant';
  includeSchema: boolean;
}

export interface AdvancedOptionsProps {
  value: AdvancedOptionsState;
  onChange: (options: AdvancedOptionsState) => void;
  disabled?: boolean;
}

/**
 * Collapsible advanced options for generation customization
 * Tone, style, schema settings
 */
export function AdvancedOptions({
  value,
  onChange,
  disabled = false
}: AdvancedOptionsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...value, tone: e.target.value as AdvancedOptionsState['tone'] });
  };

  const handleStyleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...value, style: e.target.value as AdvancedOptionsState['style'] });
  };

  const handleSchemaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...value, includeSchema: e.target.checked });
  };

  return (
    <s-stack gap="base" direction="block">
      {/* Collapsible trigger */}
      <s-button
        onClick={() => setIsExpanded(!isExpanded)}
        variant="plain"
        disclosure={isExpanded ? 'up' : 'down'}
        disabled={disabled}
      >
        Advanced Options
      </s-button>

      {/* Collapsible content */}
      {isExpanded && (
        <s-stack gap="base" direction="block">
          {/* Tone select */}
          <s-stack gap="small" direction="block">
            <s-text variant="bodyMd" fontWeight="semibold">Tone</s-text>
            <select
              value={value.tone}
              onChange={handleToneChange}
              disabled={disabled}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid var(--p-color-border)',
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: 'var(--p-color-bg-surface)',
              }}
            >
              <option value="professional">Professional</option>
              <option value="casual">Casual</option>
              <option value="friendly">Friendly</option>
            </select>
            <s-text variant="bodySm" tone="subdued">Writing style for generated content</s-text>
          </s-stack>

          {/* Style select */}
          <s-stack gap="small" direction="block">
            <s-text variant="bodyMd" fontWeight="semibold">Style</s-text>
            <select
              value={value.style}
              onChange={handleStyleChange}
              disabled={disabled}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid var(--p-color-border)',
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: 'var(--p-color-bg-surface)',
              }}
            >
              <option value="minimal">Minimal</option>
              <option value="bold">Bold</option>
              <option value="elegant">Elegant</option>
            </select>
            <s-text variant="bodySm" tone="subdued">Visual aesthetic for the section</s-text>
          </s-stack>

          {/* Checkbox */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={value.includeSchema}
              onChange={handleSchemaChange}
              disabled={disabled}
              style={{
                width: '18px',
                height: '18px',
                accentColor: 'var(--p-color-bg-fill-brand)',
              }}
            />
            <s-text variant="bodyMd">Include customizable schema settings</s-text>
          </label>
        </s-stack>
      )}
    </s-stack>
  );
}
