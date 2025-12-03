/**
 * Selected Resource Display Component
 * Shows thumbnail, title, and clear button for a selected resource
 */

interface SelectedResourceDisplayProps {
  title: string;
  image?: string;
  onClear: () => void;
  disabled?: boolean;
}

/**
 * SelectedResourceDisplay - Compact display of a selected resource
 * Shows thumbnail, title, and clear button
 */
export function SelectedResourceDisplay({
  title,
  image,
  onClear,
  disabled
}: SelectedResourceDisplayProps) {
  return (
    <s-stack gap="small" direction="inline">
      {/* Thumbnail */}
      {image && (
        <img
          src={image}
          alt={title}
          style={{
            width: '32px',
            height: '32px',
            objectFit: 'cover',
            borderRadius: '4px',
            border: '1px solid var(--p-color-border-secondary)'
          }}
        />
      )}

      {/* Title (truncated) */}
      <s-text>
        {title.length > 30 ? `${title.substring(0, 30)}...` : title}
      </s-text>

      {/* Clear button */}
      <s-button
        variant="tertiary"
        onClick={onClear}
        disabled={disabled || undefined}
        accessibilityLabel={`Clear ${title} selection`}
      >
        ×
      </s-button>
    </s-stack>
  );
}
