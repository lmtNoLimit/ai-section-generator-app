import { useState, useEffect } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useActionData, useLoaderData, useNavigation, useSubmit } from "react-router";
import { authenticate } from "../shopify.server";
import { aiAdapter } from "../services/adapters/ai-adapter";
import { themeAdapter } from "../services/adapters/theme-adapter";
import { ServiceModeIndicator } from "../components/ServiceModeIndicator";
import { serviceConfig } from "../services/config.server";
import type { GenerateActionData, SaveActionData, Theme } from "../types";

import {
  PromptInput,
  ThemeSelector,
  CodePreview,
  SectionNameInput,
  GenerateActions,
  SuccessBanner,
  ErrorBanner
} from "../components";

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

  return (
    <>
      <s-page title="Generate Section">
        <s-layout>
          <s-layout-section>
            <s-stack gap="400" vertical>
              {/* Feedback banners */}
              {actionData?.success && (
                <SuccessBanner message={actionData.message} />
              )}
              {actionData?.success === false && (
                <ErrorBanner message={actionData.message} />
              )}

              {/* Input form */}
              <s-card>
                <s-stack gap="400" vertical>
                  <s-text variant="headingMd" as="h2">
                    Describe your section
                  </s-text>

                  <PromptInput
                    value={prompt}
                    onChange={setPrompt}
                    disabled={isGenerating || isSaving}
                  />

                  <GenerateActions
                    onGenerate={handleGenerate}
                    onSave={handleSave}
                    isGenerating={isGenerating}
                    isSaving={isSaving}
                    canSave={canSave}
                  />
                </s-stack>
              </s-card>

              {/* Code preview and save section */}
              {generatedCode && (
                <s-card>
                  <s-stack gap="400" vertical>
                    <s-text variant="headingMd" as="h2">
                      Preview & Save
                    </s-text>

                    <CodePreview code={generatedCode} />

                    <ThemeSelector
                      themes={themes}
                      selectedThemeId={selectedTheme}
                      onChange={setSelectedTheme}
                      disabled={isGenerating || isSaving}
                    />

                    <SectionNameInput
                      value={fileName}
                      onChange={setFileName}
                      disabled={isGenerating || isSaving}
                    />
                  </s-stack>
                </s-card>
              )}
            </s-stack>
          </s-layout-section>
        </s-layout>
      </s-page>

      <ServiceModeIndicator
        themeMode={serviceMode.themeMode}
        aiMode={serviceMode.aiMode}
        showIndicator={serviceMode.showIndicator}
      />
    </>
  );
}
