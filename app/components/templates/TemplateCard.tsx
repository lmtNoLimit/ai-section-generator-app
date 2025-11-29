import type { SectionTemplate } from "@prisma/client";

export interface TemplateCardProps {
  template: SectionTemplate;
  onUse: () => void;
  onEdit: () => void;
  onToggleFavorite: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

/**
 * Card component displaying a single template with Polaris patterns
 */
export function TemplateCard({
  template,
  onUse,
  onEdit,
  onToggleFavorite,
  onDuplicate,
  onDelete
}: TemplateCardProps) {
  return (
    <s-section>
      <s-stack gap="base" direction="block">
        {/* Header with icon and favorite */}
        <s-stack gap="small" justifyContent="space-between" alignItems="center" direction="inline">
          <s-stack gap="small" direction="inline" alignItems="center">
            <span style={{ fontSize: '24px' }}>{template.icon}</span>
            <s-text>{template.title}</s-text>
          </s-stack>
          <s-button
            variant="tertiary"
            onClick={onToggleFavorite}
            accessibilityLabel={template.isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            {template.isFavorite ? (
              <s-badge tone="warning">Fav</s-badge>
            ) : (
              <s-text color="subdued">+ Fav</s-text>
            )}
          </s-button>
        </s-stack>

        {/* Description */}
        <s-paragraph color="subdued">{template.description}</s-paragraph>

        {/* Category badge */}
        <s-badge tone="neutral">{template.category}</s-badge>

        {/* Prompt preview */}
        <div
          style={{
            padding: '8px',
            backgroundColor: 'var(--p-color-bg-surface-secondary)',
            borderRadius: '4px',
          }}
        >
          <s-text color="subdued">
            {template.prompt.length > 100
              ? `${template.prompt.substring(0, 100)}...`
              : template.prompt}
          </s-text>
        </div>

        {/* Actions */}
        <s-stack gap="small" direction="inline">
          <s-button variant="primary" onClick={onUse}>
            Use Template
          </s-button>
          <s-button onClick={onEdit}>Edit</s-button>
          <s-button onClick={onDuplicate}>Duplicate</s-button>
          <s-button tone="critical" onClick={onDelete}>Delete</s-button>
        </s-stack>
      </s-stack>
    </s-section>
  );
}
