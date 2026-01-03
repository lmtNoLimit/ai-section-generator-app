/**
 * ThemeContextBadge component - Shows detected theme context
 * Displays when theme style has been detected for better prompt enhancement
 */

export interface ThemeContextBadgeProps {
  themeName?: string;
  themeStyle?: string;
  detected: boolean;
}

export function ThemeContextBadge({
  themeName,
  themeStyle,
  detected,
}: ThemeContextBadgeProps) {
  if (!detected) return null;

  const displayText = themeName || themeStyle || "Detected";

  return (
    <s-tooltip id="theme-context-tooltip">
      <span slot="content">
        AI will consider your theme style when enhancing prompts
      </span>
      <s-badge tone="info">
        Theme: {displayText}
      </s-badge>
    </s-tooltip>
  );
}
