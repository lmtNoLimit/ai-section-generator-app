export interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  helpText?: string;
  error?: string;
  disabled?: boolean;
}

/**
 * Prompt input field for section generation
 * Provides multiline text input with validation and help text
 */
export function PromptInput({
  value,
  onChange,
  placeholder = 'A hero section with a background image and centered text...',
  helpText = 'Describe the section you want to generate in natural language',
  error,
  disabled = false
}: PromptInputProps) {
  const handleInput = (e: Event) => {
    const target = e.target as HTMLInputElement;
    onChange(target.value);
  };

  return (
    <s-text-field
      label="Prompt"
      value={value}
      onInput={handleInput}
      multiline="4"
      autoComplete="off"
      placeholder={placeholder}
      helpText={!error ? helpText : undefined}
      error={error}
    />
  );
}
