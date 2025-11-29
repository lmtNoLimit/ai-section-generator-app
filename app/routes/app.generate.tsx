import { useState, useEffect } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useActionData, useLoaderData, useNavigation, useSubmit } from "react-router";
import { authenticate } from "../shopify.server";
import { aiAdapter } from "../services/adapters/ai-adapter";
import { themeAdapter } from "../services/adapters/theme-adapter";
import { ServiceModeIndicator } from "../components/ServiceModeIndicator";
import { serviceConfig } from "../services/config.server";
import type { GenerateActionData, SaveActionData, Theme } from "../types";

import { GenerateLayout } from "../components/generate/GenerateLayout";
import { GenerateInputColumn } from "../components/generate/GenerateInputColumn";
import { GeneratePreviewColumn } from "../components/generate/GeneratePreviewColumn";
import type { AdvancedOptionsState } from "../components/generate/AdvancedOptions";

export async function loader({ request }: LoaderFunctionArgs) {
  await authenticate.admin(request);
  const themes = await themeAdapter.getThemes(request);
  return {
    themes,
    serviceMode: {
      themeMode: serviceConfig.themeMode,
      aiMode: serviceConfig.aiMode,
      showIndicator: serviceConfig.showModeInUI
    }
  };
}

export async function action({ request }: ActionFunctionArgs) {
  await authenticate.admin(request);
  const formData = await request.formData();
  const actionType = formData.get("action");

  if (actionType === "generate") {
    const prompt = formData.get("prompt") as string;
    const code = await aiAdapter.generateSection(prompt);
    return { code, prompt } satisfies GenerateActionData;
  }

  if (actionType === "save") {
    const themeId = formData.get("themeId") as string;
    const fileName = formData.get("fileName") as string;
    const content = formData.get("content") as string;

    try {
      const result = await themeAdapter.createSection(request, themeId, fileName, content);
      return {
        success: true,
        message: `Section saved successfully to ${result?.filename || fileName}!`
      } satisfies SaveActionData;
    } catch (error) {
      console.error("Failed to save section:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to save section. Please try again."
      } satisfies SaveActionData;
    }
  }

  return null;
}

export default function GeneratePage() {
  const { themes, serviceMode } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const submit = useSubmit();

  const [prompt, setPrompt] = useState(actionData?.prompt || "");
  const [generatedCode, setGeneratedCode] = useState(actionData?.code || "");

  // Advanced options state (for future AI integration)
  const [advancedOptions, setAdvancedOptions] = useState<AdvancedOptionsState>({
    tone: 'professional',
    style: 'minimal',
    includeSchema: true
  });

  // Find the active (main) theme to set as default
  const activeTheme = themes.find((theme: Theme) => theme.role === "MAIN");
  const [selectedTheme, setSelectedTheme] = useState(activeTheme?.id || themes[0]?.id || "");

  const [fileName, setFileName] = useState("ai-section");

  const isLoading = navigation.state === "submitting";
  const isGenerating = isLoading && navigation.formData?.get("action") === "generate";
  const isSaving = isLoading && navigation.formData?.get("action") === "save";

  // Update state when action data changes
  useEffect(() => {
    if (actionData?.code && actionData.code !== generatedCode) {
      setGeneratedCode(actionData.code);
    }
  }, [actionData?.code, generatedCode]);

  // Handlers
  const handleGenerate = () => {
    if (!prompt.trim()) return;
    const formData = new FormData();
    formData.append("action", "generate");
    formData.append("prompt", prompt);
    // Future: pass advancedOptions to AI service
    submit(formData, { method: "post" });
  };

  const handleSave = () => {
    const formData = new FormData();
    formData.append("action", "save");
    formData.append("themeId", selectedTheme);
    formData.append("fileName", fileName);
    formData.append("content", generatedCode);
    submit(formData, { method: "post" });
  };

  const canSave = Boolean(generatedCode && fileName && selectedTheme);

  // Get theme name for success message
  const selectedThemeName = themes.find((t: Theme) => t.id === selectedTheme)?.name || 'theme';

  return (
    <>
      <s-page title="Generate Section">
        <s-stack gap="400" vertical>
          {/* Enhanced feedback banners */}

          {/* Success banner after save */}
          {actionData?.success && (
            <s-banner tone="success" dismissible>
              Section saved successfully to {selectedThemeName}! Visit the Theme Editor to customize your new section.
            </s-banner>
          )}

          {/* Error banner with recovery guidance */}
          {actionData?.success === false && (
            <s-banner tone="critical">
              {actionData.message}
              {actionData.message?.toLowerCase().includes('generate') && (
                <span> Try simplifying your prompt or choose a pre-built template.</span>
              )}
              {actionData.message?.toLowerCase().includes('save') && (
                <span> Verify that the selected theme exists and you have permission to modify it.</span>
              )}
            </s-banner>
          )}

          {/* Two-column layout */}
          <GenerateLayout
            inputColumn={
              <GenerateInputColumn
                prompt={prompt}
                onPromptChange={setPrompt}
                advancedOptions={advancedOptions}
                onAdvancedOptionsChange={setAdvancedOptions}
                disabled={isGenerating || isSaving}
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
              />
            }
            previewColumn={
              <GeneratePreviewColumn
                generatedCode={generatedCode}
                themes={themes}
                selectedTheme={selectedTheme}
                onThemeChange={setSelectedTheme}
                fileName={fileName}
                onFileNameChange={setFileName}
                onSave={handleSave}
                isSaving={isSaving}
                isGenerating={isGenerating}
                canSave={canSave}
              />
            }
          />
        </s-stack>
      </s-page>

      <ServiceModeIndicator
        themeMode={serviceMode.themeMode}
        aiMode={serviceMode.aiMode}
        showIndicator={serviceMode.showIndicator}
      />
    </>
  );
}
