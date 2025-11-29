import type { Theme } from '../../types';

export interface ThemeSelectorProps {
  themes: Theme[];
  selectedThemeId: string;
  onChange: (themeId: string) => void;
  disabled?: boolean;
}

/**
 * Theme selection dropdown
 * Highlights MAIN theme and provides theme role information
 */
export function ThemeSelector({
  themes,
  selectedThemeId,
  onChange,
  disabled = false
}: ThemeSelectorProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  return (
    <s-stack gap="small" direction="block">
      <s-text variant="bodyMd" fontWeight="semibold">Select Theme</s-text>
      <select
        value={selectedThemeId}
        onChange={handleChange}
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
        {themes.map((theme) => (
          <option key={theme.id} value={theme.id}>
            {theme.name} ({theme.role})
          </option>
        ))}
      </select>
    </s-stack>
  );
}
