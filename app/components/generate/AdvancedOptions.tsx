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

  const handleToneChange = (e: Event) => {
    const target = e.target as HTMLSelectElement;
    onChange({ ...value, tone: target.value as AdvancedOptionsState['tone'] });
  };

  const handleStyleChange = (e: Event) => {
    const target = e.target as HTMLSelectElement;
    onChange({ ...value, style: target.value as AdvancedOptionsState['style'] });
  };

  const handleSchemaChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    onChange({ ...value, includeSchema: target.checked });
  };

  return (
    <s-stack gap="300" vertical>
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
        <s-stack gap="300" vertical>
          <s-select
            label="Tone"
            value={value.tone}
            onChange={handleToneChange}
            disabled={disabled}
            helpText="Writing style for generated content"
          >
            <s-option value="professional">Professional</s-option>
            <s-option value="casual">Casual</s-option>
            <s-option value="friendly">Friendly</s-option>
          </s-select>

          <s-select
            label="Style"
            value={value.style}
            onChange={handleStyleChange}
            disabled={disabled}
            helpText="Visual aesthetic for the section"
          >
            <s-option value="minimal">Minimal</s-option>
            <s-option value="bold">Bold</s-option>
            <s-option value="elegant">Elegant</s-option>
          </s-select>

          <s-checkbox
            checked={value.includeSchema}
            onChange={handleSchemaChange}
            disabled={disabled}
          >
            Include customizable schema settings
          </s-checkbox>
        </s-stack>
      )}
    </s-stack>
  );
}
