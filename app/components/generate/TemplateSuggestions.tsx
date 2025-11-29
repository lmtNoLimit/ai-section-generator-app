import { SECTION_TEMPLATES, type SectionTemplate } from './templates/template-data';

export interface TemplateSuggestionsProps {
  onSelectTemplate: (prompt: string) => void;
  disabled?: boolean;
}

/**
 * Template gallery showing common section types
 * Click to populate prompt with pre-written description
 */
export function TemplateSuggestions({
  onSelectTemplate,
  disabled = false
}: TemplateSuggestionsProps) {
  const handleClick = (template: SectionTemplate) => {
    if (!disabled) {
      onSelectTemplate(template.prompt);
    }
  };

  return (
    <s-stack gap="300" vertical>
      <s-text variant="headingSm" as="h3">
        Quick Start Templates
      </s-text>

      {/* Grid layout: 2 columns on desktop, 1 on mobile */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: '12px'
        }}
      >
        {SECTION_TEMPLATES.map((template) => (
          <button
            key={template.id}
            onClick={() => handleClick(template)}
            disabled={disabled}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '8px',
              padding: '12px',
              border: '1px solid var(--p-color-border)',
              borderRadius: '8px',
              background: 'var(--p-color-bg-surface)',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.5 : 1,
              textAlign: 'left',
              width: '100%'
            }}
          >
            <span style={{ fontSize: '24px' }}>{template.icon}</span>
            <s-text variant="bodySm" fontWeight="semibold">
              {template.title}
            </s-text>
            <s-text variant="bodySm" tone="subdued">
              {template.description}
            </s-text>
          </button>
        ))}
      </div>
    </s-stack>
  );
}
