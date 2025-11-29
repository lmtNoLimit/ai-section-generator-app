import { PROMPT_EXAMPLES } from './templates/template-data';

export interface PromptExamplesProps {
  onSelectExample: (prompt: string) => void;
  disabled?: boolean;
}

/**
 * Quick prompt examples as chips/pills
 * Click to populate prompt field
 */
export function PromptExamples({
  onSelectExample,
  disabled = false
}: PromptExamplesProps) {
  return (
    <s-stack gap="base" direction="block">
      <s-text variant="headingSm" as="h3">
        Or try an example
      </s-text>

      <s-stack gap="small">
        {PROMPT_EXAMPLES.map((example) => (
          <s-button
            key={example.id}
            onClick={() => onSelectExample(example.prompt)}
            disabled={disabled}
            size="slim"
            variant="plain"
          >
            {example.label}
          </s-button>
        ))}
      </s-stack>
    </s-stack>
  );
}
