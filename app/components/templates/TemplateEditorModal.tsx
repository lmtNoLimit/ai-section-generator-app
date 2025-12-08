import { useState, useEffect } from "react";
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

// Updated categories to match the new 10 categories
const CATEGORIES = [
  { value: "hero", label: "Hero" },
  { value: "features", label: "Features" },
  { value: "testimonials", label: "Testimonials" },
  { value: "pricing", label: "Pricing" },
  { value: "cta", label: "Call to Action" },
  { value: "faq", label: "FAQ" },
  { value: "team", label: "Team" },
  { value: "gallery", label: "Gallery" },
  { value: "content", label: "Content" },
  { value: "footer", label: "Footer" },
];

const ICONS = ["🖼️", "🎬", "⬛", "✨", "🛍️", "📋", "🃏", "💬", "⭐", "💰", "📧", "❓", "👥", "📦", "📝"];

const MODAL_ID = "template-editor-modal";

/**
 * Modal for creating/editing templates using s-modal
 */
export function TemplateEditorModal({
  template,
  onSave,
  onClose
}: TemplateEditorModalProps) {
  const [title, setTitle] = useState(template?.title || "");
  const [description, setDescription] = useState(template?.description || "");
  const [category, setCategory] = useState(template?.category || "hero");
  const [icon, setIcon] = useState(template?.icon || "🖼️");
  const [prompt, setPrompt] = useState(template?.prompt || "");

  // Update form when template changes
  useEffect(() => {
    setTitle(template?.title || "");
    setDescription(template?.description || "");
    setCategory(template?.category || "hero");
    setIcon(template?.icon || "🖼️");
    setPrompt(template?.prompt || "");
  }, [template]);

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

  // Programmatically show modal when component mounts
  useEffect(() => {
    const modal = document.getElementById(MODAL_ID);
    if (modal) {
      (modal as HTMLElement & { show: () => void }).show?.();
    }
  }, []);

  // Handle close via modal's close event
  const handleModalClose = () => {
    onClose();
  };

  return (
    <s-modal
      id={MODAL_ID}
      heading={template ? "Edit Template" : "Create Template"}
      size="large"
    >
      <s-stack gap="large" direction="block">
        {/* Title */}
        <s-text-field
          label="Title"
          value={title}
          onInput={(e: Event) => setTitle((e.target as HTMLInputElement).value)}
          placeholder="e.g., Hero with Background Image"
          required
        />

        {/* Description */}
        <s-text-field
          label="Description"
          value={description}
          onInput={(e: Event) => setDescription((e.target as HTMLInputElement).value)}
          placeholder="Brief description of what this template creates"
          required
        />

        {/* Category */}
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
          <s-text type="strong">Icon</s-text>
          <div style={{ overflowX: 'auto', paddingBottom: '4px' }}>
            <s-button-group gap="none">
              {ICONS.map((emoji) => (
                <s-button
                  key={emoji}
                  variant={icon === emoji ? "primary" : "secondary"}
                  onClick={() => setIcon(emoji)}
                >
                  <span style={{ fontSize: '18px' }}>{emoji}</span>
                </s-button>
              ))}
            </s-button-group>
          </div>
        </s-stack>

        {/* Prompt */}
        <s-text-area
          label="Prompt"
          value={prompt}
          onInput={(e: Event) => setPrompt((e.target as HTMLTextAreaElement).value)}
          placeholder="Describe what section this template should generate when used..."
          rows={4}
          required
        />
      </s-stack>

      {/* Modal Actions */}
      <s-button
        slot="secondary-actions"
        command="--hide"
        commandFor={MODAL_ID}
        onClick={handleModalClose}
      >
        Cancel
      </s-button>
      <s-button
        slot="primary-action"
        variant="primary"
        command="--hide"
        commandFor={MODAL_ID}
        onClick={handleSubmit}
        disabled={!isValid}
      >
        {template ? "Save Changes" : "Create Template"}
      </s-button>
    </s-modal>
  );
}
