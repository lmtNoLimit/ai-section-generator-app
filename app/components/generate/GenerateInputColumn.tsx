import { PromptInput } from "./PromptInput";
import { TemplateSuggestions } from "./TemplateSuggestions";
import { PromptExamples } from "./PromptExamples";
import { AdvancedOptions, type AdvancedOptionsState } from "./AdvancedOptions";

export interface GenerateInputColumnProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  advancedOptions: AdvancedOptionsState;
  onAdvancedOptionsChange: (options: AdvancedOptionsState) => void;
  disabled: boolean;
  onGenerate: () => void;
  isGenerating: boolean;
}

/**
 * Left column for generate screen
 * Contains prompt input, templates, examples, and advanced options
 */
export function GenerateInputColumn({
  prompt,
  onPromptChange,
  advancedOptions,
  onAdvancedOptionsChange,
  disabled,
  onGenerate,
  isGenerating
}: GenerateInputColumnProps) {
  // Validate prompt before enabling generate button (min 10, max 2000 chars)
  const isPromptValid = prompt.trim().length >= 10 && prompt.trim().length <= 2000;

  return (
    <s-stack gap="400" vertical>
      {/* Main input card */}
      <s-card>
        <s-stack gap="400" vertical>
          <s-text variant="headingMd" as="h2">
            Describe your section
          </s-text>

          <PromptInput
            value={prompt}
            onChange={onPromptChange}
            disabled={disabled}
          />

          <AdvancedOptions
            value={advancedOptions}
            onChange={onAdvancedOptionsChange}
            disabled={disabled}
          />

          <s-button
            variant="primary"
            onClick={onGenerate}
            loading={isGenerating ? "true" : undefined}
            disabled={disabled || !isPromptValid}
          >
            Generate Code
          </s-button>
        </s-stack>
      </s-card>

      {/* Template suggestions */}
      <s-card>
        <TemplateSuggestions
          onSelectTemplate={onPromptChange}
          disabled={disabled}
        />
      </s-card>

      {/* Prompt examples */}
      <s-card>
        <PromptExamples
          onSelectExample={onPromptChange}
          disabled={disabled}
        />
      </s-card>
    </s-stack>
  );
}
