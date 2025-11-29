export interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  helpText?: string;
  error?: string;
  disabled?: boolean;
  minLength?: number;
  maxLength?: number;
}

/**
 * Prompt input field with character counter and validation
 * Minimum 10 characters, maximum 2000 characters
 * Height: 250px per design decision
 */
export function PromptInput({
  value,
  onChange,
  placeholder = 'A hero section with a background image and centered text...',
  helpText = 'Describe the section you want to generate in natural language',
  error,
  disabled = false,
  minLength = 10,
  maxLength = 2000
}: PromptInputProps) {
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  // Character counter
  const charCount = value.length;
  const charCountText = `${charCount}/${maxLength} characters`;

  // Validation
  const isValid = charCount === 0 || (charCount >= minLength && charCount <= maxLength);
  const validationError = !isValid
    ? `Prompt must be between ${minLength} and ${maxLength} characters`
    : undefined;

  // Combine help text with character counter
  const displayHelpText = !error && !validationError
    ? `${helpText} (${charCountText})`
    : charCountText;

  return (
    <s-stack gap="small" direction="block">
      <s-text variant="bodyMd" fontWeight="semibold">Prompt</s-text>
      <textarea
        value={value}
        onInput={handleInput}
        autoComplete="off"
        placeholder={placeholder}
        disabled={disabled}
        rows={6}
        style={{
          width: '100%',
          padding: '12px',
          border: `1px solid var(--p-color-border${error || validationError ? '-critical' : ''})`,
          borderRadius: '8px',
          fontSize: '14px',
          fontFamily: 'inherit',
          resize: 'vertical',
          minHeight: '150px',
          backgroundColor: disabled ? 'var(--p-color-bg-surface-disabled)' : 'var(--p-color-bg-surface)',
        }}
      />
      {(error || validationError) ? (
        <s-text variant="bodySm" tone="critical">{error || validationError}</s-text>
      ) : (
        <s-text variant="bodySm" tone="subdued">{displayHelpText}</s-text>
      )}
    </s-stack>
  );
}
