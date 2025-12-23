import { ThemeSelector } from '../generate/ThemeSelector';
import { SectionNameInput } from '../generate/SectionNameInput';
import type { Theme } from '../../types';

interface EditorSettingsPanelProps {
  themes: Theme[];
  selectedTheme: string;
  onThemeChange: (themeId: string) => void;
  fileName: string;
  onFileNameChange: (name: string) => void;
  onSaveAsTemplate?: () => void;
  disabled?: boolean;
}

/**
 * Settings panel for save configuration
 * Uses Polaris components for structure
 */
export function EditorSettingsPanel({
  themes,
  selectedTheme,
  onThemeChange,
  fileName,
  onFileNameChange,
  onSaveAsTemplate,
  disabled = false,
}: EditorSettingsPanelProps) {
  return (
    <s-stack gap="large">
      <s-heading>Settings</s-heading>

      {/* Theme Selection */}
      <s-stack gap="base">
        <ThemeSelector
          themes={themes}
          selectedThemeId={selectedTheme}
          onChange={onThemeChange}
          disabled={disabled}
        />
      </s-stack>

      {/* File Name */}
      <s-stack gap="base">
        <SectionNameInput
          value={fileName}
          onChange={onFileNameChange}
          disabled={disabled}
        />
      </s-stack>

      {/* Optional: Save as Template */}
      {onSaveAsTemplate && (
        <s-button
          variant="tertiary"
          onClick={onSaveAsTemplate}
          disabled={disabled || undefined}
        >
          Save as Template
        </s-button>
      )}
    </s-stack>
  );
}
