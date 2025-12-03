import { useState } from "react";
import type { SectionTemplate } from "@prisma/client";

export interface TemplateEditorModalProps {
  template: SectionTemplate | null;
  onSave: (data: {
    title: string;
    description: string;
    category: string;
    icon: string;
    prompt: string;
  }) => void;
  onClose: () => void;
}

const CATEGORIES = [
  { value: "marketing", label: "Marketing" },
  { value: "product", label: "Product" },
  { value: "content", label: "Content" },
  { value: "layout", label: "Layout" },
];

const ICONS = ["📋", "🎨", "📦", "📝", "🛒", "⭐", "🔥", "💡", "🎯", "🚀"];

/**
 * Modal for creating/editing templates
 */
export function TemplateEditorModal({
  template,
  onSave,
  onClose
}: TemplateEditorModalProps) {
  const [title, setTitle] = useState(template?.title || "");
  const [description, setDescription] = useState(template?.description || "");
  const [category, setCategory] = useState(template?.category || "marketing");
  const [icon, setIcon] = useState(template?.icon || "📋");
  const [prompt, setPrompt] = useState(template?.prompt || "");

  const isValid = title.trim() && description.trim() && prompt.trim();

  const handleSubmit = () => {
    if (!isValid) return;
    onSave({
      title: title.trim(),
      description: description.trim(),
      category,
      icon,
      prompt: prompt.trim(),
    });
  };

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="template-editor-title"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}
      onClick={onClose}
      onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
    >
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
      <div
        style={{
          backgroundColor: 'var(--p-color-bg-surface)',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '600px',
          maxHeight: '90vh',
          overflow: 'auto',
          padding: '20px'
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <s-stack gap="large" direction="block">
          {/* Header */}
          <s-stack gap="small" justifyContent="space-between" alignItems="center" direction="inline">
            <s-heading>{template ? "Edit Template" : "Create Template"}</s-heading>
            <s-button variant="tertiary" onClick={onClose}>Close</s-button>
          </s-stack>

          {/* Form */}
          <s-stack gap="large" direction="block">
            <s-text-field
              label="Title"
              value={title}
              onInput={(e: Event) => setTitle((e.target as HTMLInputElement).value)}
              placeholder="e.g., Hero Banner"
            />

            <s-text-field
              label="Description"
              value={description}
              onInput={(e: Event) => setDescription((e.target as HTMLInputElement).value)}
              placeholder="Brief description of the template"
            />

            <s-select
              label="Category"
              value={category}
              onChange={(e: Event) => setCategory((e.target as HTMLSelectElement).value)}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </s-select>

            {/* Icon picker */}
            <s-stack gap="small" direction="block">
              <s-text>Icon</s-text>
              <s-button-group gap="none">
                {ICONS.map((emoji) => (
                  <s-button
                    key={emoji}
                    variant={icon === emoji ? "primary" : "secondary"}
                    onClick={() => setIcon(emoji)}
                  >
                    {emoji}
                  </s-button>
                ))}
              </s-button-group>
            </s-stack>

            <s-text-area
              label="Prompt"
              value={prompt}
              onInput={(e: Event) => setPrompt((e.target as HTMLTextAreaElement).value)}
              placeholder="Describe what this template generates..."
              rows={4}
            />
          </s-stack>

          {/* Actions */}
          <s-stack gap="small" justifyContent="end" direction="inline">
            <s-button variant="secondary" onClick={onClose}>Cancel</s-button>
            <s-button
              variant="primary"
              onClick={handleSubmit}
              disabled={!isValid}
            >
              {template ? "Save Changes" : "Create Template"}
            </s-button>
          </s-stack>
        </s-stack>
      </div>
    </div>
  );
}
