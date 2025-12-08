import type { SectionTemplate } from "@prisma/client";
import { TemplateCard } from "./TemplateCard";

export interface TemplateGridProps {
  templates: SectionTemplate[];
  onUseAsIs: (template: SectionTemplate) => void;
  onCustomize: (template: SectionTemplate) => void;
  onEdit: (template: SectionTemplate) => void;
  onToggleFavorite: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

/**
 * Grid of template cards using Polaris s-grid
 */
export function TemplateGrid({
  templates,
  onUseAsIs,
  onCustomize,
  onEdit,
  onToggleFavorite,
  onDuplicate,
  onDelete
}: TemplateGridProps) {
  return (
    <s-grid
      gap="base"
      gridTemplateColumns="repeat(auto-fill, minmax(320px, 1fr))"
    >
      {templates.map((template) => (
        <TemplateCard
          key={template.id}
          template={template}
          onUseAsIs={() => onUseAsIs(template)}
          onCustomize={() => onCustomize(template)}
          onEdit={() => onEdit(template)}
          onToggleFavorite={() => onToggleFavorite(template.id)}
          onDuplicate={() => onDuplicate(template.id)}
          onDelete={() => onDelete(template.id)}
        />
      ))}
    </s-grid>
  );
}
