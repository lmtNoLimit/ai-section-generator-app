import { useState, useEffect, useCallback, useRef } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import {
  useActionData,
  useNavigation,
  useSubmit,
  useNavigate,
  useLoaderData,
} from "react-router";
import { authenticate } from "../shopify.server";
import { sectionService } from "../services/section.server";
import { chatService } from "../services/chat.server";
import {
  templateService,
  type FeaturedTemplate,
} from "../services/template.server";
import { sanitizeUserInput } from "../utils/input-sanitizer";

const MAX_PROMPT_LENGTH = 2000;

/**
 * /sections/new route - AI-powered section creation
 * Two-column layout: Main prompt form + aside with tips
 * Creates section + conversation on submit, redirects to /$id for AI chat
 */

interface LoaderData {
  templates: FeaturedTemplate[];
  prebuiltCode: string | null;
  prebuiltName: string | null;
}

export async function loader({
  request,
}: LoaderFunctionArgs): Promise<LoaderData> {
  const { session } = await authenticate.admin(request);
  const url = new URL(request.url);

  // Handle pre-built code from "Use As-Is" template flow
  const prebuiltCode = url.searchParams.get("code");
  const prebuiltName = url.searchParams.get("name");

  // Fetch featured templates (shop-specific + defaults fallback)
  try {
    const templates = await templateService.getFeatured(session.shop, 6);
    return {
      templates,
      prebuiltCode,
      prebuiltName,
    };
  } catch (error) {
    console.error("Failed to fetch featured templates:", error);
    return {
      templates: [],
      prebuiltCode,
      prebuiltName,
    };
  }
}

interface ActionData {
  sectionId?: string;
  error?: string;
}

export async function action({
  request,
}: ActionFunctionArgs): Promise<ActionData> {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();

  // Check for pre-built code path (from "Use As-Is" template flow)
  const prebuiltCode = formData.get("prebuiltCode") as string | null;
  const prebuiltName = formData.get("prebuiltName") as string | null;

  // Pre-built code path: create section directly without AI
  if (prebuiltCode) {
    try {
      const section = await sectionService.create({
        shop: session.shop,
        prompt: prebuiltName || "Pre-built template",
        code: prebuiltCode,
      });

      // Create conversation for potential future modifications
      const conversation = await chatService.getOrCreateConversation(
        section.id,
        session.shop,
      );
      const { sanitized: safeName } = sanitizeUserInput(
        prebuiltName || "Pre-built template",
      );
      await chatService.addUserMessage(
        conversation.id,
        `Created from template: ${safeName}`,
      );

      return { sectionId: section.id };
    } catch (error) {
      console.error("Failed to create section from template:", error);
      return { error: "Failed to create section. Please try again." };
    }
  }

  // Standard prompt-based path
  const rawPrompt = formData.get("prompt") as string;

  if (!rawPrompt?.trim()) {
    return { error: "Please describe the section you want to create" };
  }

  // Validate length
  if (rawPrompt.length > MAX_PROMPT_LENGTH) {
    return {
      error: `Prompt is too long (max ${MAX_PROMPT_LENGTH} characters)`,
    };
  }

  // Sanitize input
  const { sanitized: prompt } = sanitizeUserInput(rawPrompt.trim());

  try {
    // Create section with minimal data (always starts as draft, empty code until AI generates)
    const section = await sectionService.create({
      shop: session.shop,
      prompt,
      code: "", // Empty until AI generates in /$id
    });

    // Create conversation + first user message
    const conversation = await chatService.getOrCreateConversation(
      section.id,
      session.shop,
    );
    await chatService.addUserMessage(conversation.id, prompt);

    return { sectionId: section.id };
  } catch (error) {
    console.error("Failed to create section:", error);
    return { error: "Failed to create section. Please try again." };
  }
}

export default function NewSectionPage() {
  const { templates, prebuiltCode, prebuiltName } =
    useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const submit = useSubmit();
  const [prompt, setPrompt] = useState("");
  const hasSubmittedPrebuilt = useRef(false);

  const isSubmitting = navigation.state === "submitting";

  // Auto-submit when prebuilt code is provided (from "Use As-Is" flow)
  useEffect(() => {
    if (prebuiltCode && !hasSubmittedPrebuilt.current && !isSubmitting) {
      hasSubmittedPrebuilt.current = true;
      const formData = new FormData();
      formData.append("prebuiltCode", prebuiltCode);
      if (prebuiltName) {
        formData.append("prebuiltName", prebuiltName);
      }
      submit(formData, { method: "post" });
    }
  }, [prebuiltCode, prebuiltName, isSubmitting, submit]);

  // Redirect on success
  useEffect(() => {
    if (actionData?.sectionId) {
      navigate(`/app/sections/${actionData.sectionId}`);
    }
  }, [actionData, navigate]);

  // Focus textarea on mount (only if not prebuilt flow)
  useEffect(() => {
    if (!prebuiltCode) {
      const textarea = document.getElementById(
        "prompt-textarea",
      ) as HTMLElement | null;
      textarea?.focus();
    }
  }, [prebuiltCode]);

  const handleSubmit = useCallback(() => {
    if (!prompt.trim() || isSubmitting) return;
    const formData = new FormData();
    formData.append("prompt", prompt);
    submit(formData, { method: "post" });
  }, [prompt, isSubmitting, submit]);

  // Handle keyboard shortcut (Cmd/Ctrl + Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSubmit();
      }
    };

    const textarea = document.getElementById("prompt-textarea");
    textarea?.addEventListener("keydown", handleKeyDown);
    return () => textarea?.removeEventListener("keydown", handleKeyDown);
  }, [handleSubmit]);

  const handleTemplateSelect = (templatePrompt: string) => {
    setPrompt(templatePrompt);
    const textarea = document.getElementById(
      "prompt-textarea",
    ) as HTMLElement | null;
    textarea?.focus();
  };

  // Show loading state when processing prebuilt code
  if (prebuiltCode && (isSubmitting || hasSubmittedPrebuilt.current)) {
    return (
      <s-page heading="Creating section..." inlineSize="base">
        <s-section>
          <s-stack gap="large" alignItems="center">
            <s-spinner />
            <s-text>
              Setting up your {prebuiltName || "section"}...
            </s-text>
          </s-stack>
        </s-section>
      </s-page>
    );
  }

  return (
    <s-page heading="Create section" inlineSize="base">
      {/* Main Content */}
      <s-section>
        <s-stack gap="large-200">
          {/* Error Banner */}
          {actionData?.error && (
            <s-banner tone="critical" dismissible>
              {actionData.error}
            </s-banner>
          )}

          {/* Hero Section - Prompt Input */}

          <s-stack gap="large">
            <s-stack gap="small">
              <s-heading accessibilityRole="heading">
                What section do you want to create?
              </s-heading>
              <s-text color="subdued">
                Describe your vision and our AI will generate a custom Shopify
                section for your store.
              </s-text>
            </s-stack>

            <s-text-area
              id="prompt-textarea"
              label="Describe your section"
              labelAccessibilityVisibility="exclusive"
              value={prompt}
              placeholder="Example: A hero banner with a full-width background image, bold headline, subtext, and a call-to-action button that links to a collection..."
              disabled={isSubmitting}
              rows={5}
              maxLength={MAX_PROMPT_LENGTH}
              onInput={(e: Event) => {
                const target = e.target as HTMLTextAreaElement;
                setPrompt(target.value);
              }}
            />

            <s-stack
              direction="inline"
              gap="base"
              justifyContent="space-between"
              alignItems="center"
            >
              <s-text color="subdued">
                {prompt.length}/{MAX_PROMPT_LENGTH} • Press ⌘/Ctrl + Enter
              </s-text>
              <s-button
                variant="primary"
                onClick={handleSubmit}
                loading={isSubmitting}
                disabled={!prompt.trim()}
              >
                Generate Section
              </s-button>
            </s-stack>
          </s-stack>

          {/* Template Suggestions */}
          {templates.length > 0 && (
            <s-stack gap="base">
              <s-stack gap="small-100">
                <s-heading>Start with a template</s-heading>
                <s-text color="subdued">
                  Choose a starting point and customize it to your needs
                </s-text>
              </s-stack>

              <s-stack direction="inline" gap="small">
                {templates.map((template) => (
                  <s-clickable-chip
                    key={template.id}
                    accessibilityLabel={`Use ${template.title} template`}
                    disabled={isSubmitting}
                    onClick={() => handleTemplateSelect(template.prompt)}
                  >
                    <s-icon slot="graphic" type="wand" />
                    {template.title}
                  </s-clickable-chip>
                ))}
              </s-stack>
            </s-stack>
          )}
        </s-stack>
      </s-section>

      {/* Aside - Tips */}
      <s-section slot="aside">
        <s-stack gap="large">
          <s-heading>Tips for better results</s-heading>

          <s-stack gap="base">
            <s-box padding="base" background="subdued" borderRadius="base">
              <s-stack gap="small-100">
                <s-text>Be specific</s-text>
                <s-text color="subdued">
                  Include details about layout, colors, and content placement
                </s-text>
              </s-stack>
            </s-box>

            <s-box padding="base" background="subdued" borderRadius="base">
              <s-stack gap="small-100">
                <s-text>Mention your brand</s-text>
                <s-text color="subdued">
                  Reference your brand style, tone, or existing design elements
                </s-text>
              </s-stack>
            </s-box>

            <s-box padding="base" background="subdued" borderRadius="base">
              <s-stack gap="small-100">
                <s-text>Define the goal</s-text>
                <s-text color="subdued">
                  What action should visitors take? Buy, subscribe, explore?
                </s-text>
              </s-stack>
            </s-box>
          </s-stack>

          <s-divider />

          <s-stack gap="small">
            <s-text>What happens next?</s-text>
            <s-text color="subdued">
              After generating, you can preview your section, make edits with AI
              assistance, and publish directly to your theme.
            </s-text>
          </s-stack>
        </s-stack>
      </s-section>
    </s-page>
  );
}
