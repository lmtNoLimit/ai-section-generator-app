/**
 * PromptTemplates component - Quick template buttons for common section types
 * Displays as collapsible row of buttons below chat input
 */
import { useState, useCallback } from "react";
import { getTemplateEntries, type PromptTemplate } from "../../utils/prompt-templates";

export interface PromptTemplatesProps {
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}

export function PromptTemplates({ onSelect, disabled }: PromptTemplatesProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const templates = getTemplateEntries();

  const handleToggle = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const handleSelect = useCallback(
    (template: PromptTemplate) => {
      if (!disabled) {
        onSelect(template.prompt);
        setIsExpanded(false);
      }
    },
    [onSelect, disabled]
  );

  return (
    <s-box paddingBlockStart="small">
      {/* Toggle button */}
      <s-button
        variant="tertiary"
        icon={isExpanded ? "chevron-up" : "chevron-down"}
        onClick={handleToggle}
        disabled={disabled || undefined}
      >
        {isExpanded ? "Hide templates" : "Quick templates"}
      </s-button>

      {/* Template buttons - shown when expanded */}
      {isExpanded && (
        <s-box paddingBlockStart="small">
          <s-stack direction="inline" gap="small">
            {templates.map(([key, template]) => (
              <s-button
                key={key}
                variant="secondary"
                onClick={() => handleSelect(template)}
                disabled={disabled || undefined}
              >
                {template.name}
              </s-button>
            ))}
          </s-stack>
        </s-box>
      )}
    </s-box>
  );
}
