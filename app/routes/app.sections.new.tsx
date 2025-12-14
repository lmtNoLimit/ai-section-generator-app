import { useState, useEffect, useRef, type KeyboardEvent, type ChangeEvent } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useActionData, useNavigation, useSubmit, useNavigate } from "react-router";
import { authenticate } from "../shopify.server";
import { sectionService } from "../services/section.server";
import { chatService } from "../services/chat.server";
import { sanitizeUserInput } from "../utils/input-sanitizer";
import "../styles/new-section.css";

const MAX_PROMPT_LENGTH = 2000;

/**
 * Simplified /sections/new route - ChatGPT-style prompt-only UI
 * Creates section + conversation on submit, redirects to /$id for AI chat
 */

export async function loader({ request }: LoaderFunctionArgs) {
  await authenticate.admin(request);
  return {};
}

interface ActionData {
  sectionId?: string;
  error?: string;
}

export async function action({ request }: ActionFunctionArgs): Promise<ActionData> {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const rawPrompt = formData.get("prompt") as string;

  if (!rawPrompt?.trim()) {
    return { error: "Please describe the section you want to create" };
  }

  // Validate length
  if (rawPrompt.length > MAX_PROMPT_LENGTH) {
    return { error: `Prompt is too long (max ${MAX_PROMPT_LENGTH} characters)` };
  }

  // Sanitize input
  const { sanitized: prompt } = sanitizeUserInput(rawPrompt.trim());

  try {
    // Create section with minimal data (draft status, empty code until AI generates)
    const section = await sectionService.create({
      shop: session.shop,
      prompt,
      code: "", // Empty until AI generates in /$id
      status: "draft",
    });

    // Create conversation + first user message
    const conversation = await chatService.getOrCreateConversation(section.id, session.shop);
    await chatService.addUserMessage(conversation.id, prompt);

    return { sectionId: section.id };
  } catch (error) {
    console.error("Failed to create section:", error);
    return { error: "Failed to create section. Please try again." };
  }
}

const TEMPLATE_CHIPS = [
  { label: "Hero Section", prompt: "A hero section with a large background image, centered heading, subheading, and a call-to-action button" },
  { label: "Product Grid", prompt: "A responsive product grid with 3 columns showing product image, title, and price" },
  { label: "Testimonials", prompt: "A testimonial carousel with customer quotes, names, and star ratings" },
  { label: "Newsletter", prompt: "A newsletter signup section with email input and subscribe button" },
];

export default function NewSectionPage() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const submit = useSubmit();
  const [prompt, setPrompt] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isSubmitting = navigation.state === "submitting";

  // Redirect on success
  useEffect(() => {
    if (actionData?.sectionId) {
      navigate(`/app/sections/${actionData.sectionId}`);
    }
  }, [actionData, navigate]);

  // Focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    if (!prompt.trim() || isSubmitting) return;
    const formData = new FormData();
    formData.append("prompt", prompt);
    submit(formData, { method: "post" });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  };

  const handleChipClick = (chipPrompt: string) => {
    setPrompt(chipPrompt);
    textareaRef.current?.focus();
  };

  return (
    <s-page inlineSize="base">
      <div className="new-section-container">
        <div className="new-section-header">
          <h1>Create a Section</h1>
          <p>Describe the section you want to create. Be specific about layout, content, and style.</p>
        </div>

        {actionData?.error && (
          <s-banner tone="critical" dismissible>
            {actionData.error}
          </s-banner>
        )}

        <div className="prompt-input-wrapper">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            rows={4}
            placeholder="A hero section with video background, centered text overlay, and a prominent call-to-action button..."
            disabled={isSubmitting}
            className="prompt-textarea"
            aria-label="Section description"
          />
          <div className="prompt-actions">
            <span className="keyboard-hint">⌘ + Enter to submit</span>
            <s-button
              variant="primary"
              onClick={handleSubmit}
              loading={isSubmitting}
              disabled={!prompt.trim()}
            >
              Create Section
            </s-button>
          </div>
        </div>

        <div className="template-chips">
          <p className="chips-label">Quick start templates:</p>
          <div className="chips-container">
            {TEMPLATE_CHIPS.map((chip) => (
              <button
                key={chip.label}
                type="button"
                className="template-chip"
                onClick={() => handleChipClick(chip.prompt)}
                disabled={isSubmitting}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </s-page>
  );
}
