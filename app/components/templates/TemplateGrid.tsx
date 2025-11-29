import type { SectionTemplate } from "@prisma/client";
import { TemplateCard } from "./TemplateCard";

export interface TemplateGridProps {
  templates: SectionTemplate[];
  onUse: (template: SectionTemplate) => void;
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
  onUse,
  onEdit,
  onToggleFavorite,
  onDuplicate,
  onDelete
}: TemplateGridProps) {
  return (
    <s-grid
      gap="base"
      gridTemplateColumns="repeat(auto-fill, minmax(280px, 1fr))"
    >
      {templates.map((template) => (
        <TemplateCard
          key={template.id}
          template={template}
          onUse={() => onUse(template)}
          onEdit={() => onEdit(template)}
          onToggleFavorite={() => onToggleFavorite(template.id)}
          onDuplicate={() => onDuplicate(template.id)}
          onDelete={() => onDelete(template.id)}
        />
      ))}
    </s-grid>
  );
}
