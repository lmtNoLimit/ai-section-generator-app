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
 * Theme selection, filename, and optional template save
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
    <div className="settings-panel">
      <h2 className="settings-panel__title">Save Settings</h2>

      <div className="settings-panel__section">
        <ThemeSelector
          themes={themes}
          selectedThemeId={selectedTheme}
          onChange={onThemeChange}
          disabled={disabled}
        />
      </div>

      <div className="settings-panel__section">
        <SectionNameInput
          value={fileName}
          onChange={onFileNameChange}
          disabled={disabled}
        />
      </div>

      {onSaveAsTemplate && (
        <div className="settings-panel__section">
          <s-button
            variant="tertiary"
            onClick={onSaveAsTemplate}
            disabled={disabled || undefined}
          >
            Save as Template
          </s-button>
        </div>
      )}
    </div>
  );
}
