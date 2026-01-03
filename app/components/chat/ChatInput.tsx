/**
 * ChatInput component - Input field with send/stop/enhance buttons
 * Uses Polaris s-text-area with accessory buttons
 * Supports Enter to send, Shift+Enter for newline, prompt enhancement
 * Phase 03: Added element targeting context support
 */
import { useState, useCallback, useEffect, useRef } from "react";
import { PromptEnhancer } from "./PromptEnhancer";
import { PromptTemplates } from "./PromptTemplates";
import { ThemeContextBadge } from "./ThemeContextBadge";
import type { SelectedElementInfo } from "../preview/types";

export interface ChatInputProps {
  onSend: (message: string) => void;
  onStop?: () => void;
  isStreaming: boolean;
  disabled?: boolean;
  placeholder?: string;
  /** Theme context for prompt enhancement */
  themeContext?: {
    themeName?: string;
    themeStyle?: string;
  };
  /** Selected element context for targeted editing (Phase 03) */
  selectedElement?: SelectedElementInfo | null;
  /** Callback to clear element selection after send */
  onClearElement?: () => void;
  /** Prefilled value from suggestion chips (Phase 05) */
  prefilledValue?: string;
  /** Callback when prefilled value is cleared */
  onPrefilledClear?: () => void;
}

export function ChatInput({
  onSend,
  onStop,
  isStreaming,
  disabled = false,
  placeholder = "Describe changes to your section...",
  themeContext,
  selectedElement,
  onClearElement,
  prefilledValue,
  onPrefilledClear,
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const [isEnhancerOpen, setIsEnhancerOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const containerRef = useRef<HTMLElement | null>(null);

  // Phase 05: Handle prefilled value from suggestion chips
  useEffect(() => {
    if (prefilledValue) {
      setValue(prefilledValue);
      // Focus textarea when prefilled
      textareaRef.current?.focus();
      // Clear the prefilled value in parent
      onPrefilledClear?.();
    }
  }, [prefilledValue, onPrefilledClear]);

  const handleSubmit = useCallback(() => {
    if (isStreaming) {
      onStop?.();
      return;
    }

    const trimmed = value.trim();
    if (!trimmed || disabled) return;

    // Prepend element context if available
    let messageToSend = trimmed;
    if (selectedElement) {
      const elementContext = `[Targeting: <${selectedElement.tagName}> at "${selectedElement.path.join(' > ')}"]\n\n`;
      messageToSend = elementContext + trimmed;
    }

    onSend(messageToSend);
    setValue("");
    // Clear element selection after sending
    onClearElement?.();
  }, [value, disabled, isStreaming, onSend, onStop, selectedElement, onClearElement]);

  // Handle input changes from Polaris text-area
  const handleInput = useCallback((e: Event) => {
    const target = e.currentTarget as HTMLTextAreaElement;
    setValue(target.value || "");
  }, []);

  // Get ref to the internal textarea for keyboard handling
  const handleRef = useCallback((el: HTMLElement | null) => {
    containerRef.current = el;
    if (el) {
      // s-text-area may have internal textarea we can attach to
      const textarea = el.querySelector("textarea");
      textareaRef.current = textarea;
    }
  }, []);

  // Attach keydown handler to the internal textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Enter to send, Shift+Enter for newline
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    };

    textarea.addEventListener("keydown", handleKeyDown);
    return () => textarea.removeEventListener("keydown", handleKeyDown);
  }, [handleSubmit]);

  // Open enhance modal
  const handleEnhanceClick = useCallback(() => {
    if (value.trim()) {
      setIsEnhancerOpen(true);
    }
  }, [value]);

  // Handle enhanced prompt selection
  const handleEnhanced = useCallback((enhanced: string) => {
    setValue(enhanced);
    setIsEnhancerOpen(false);
  }, []);

  // Handle template selection
  const handleTemplateSelect = useCallback((prompt: string) => {
    setValue(prompt);
    // Focus textarea after template selection
    textareaRef.current?.focus();
  }, []);

  const hasValue = value.trim().length > 0;
  const hasThemeContext = !!(themeContext?.themeName || themeContext?.themeStyle);
  const hasElementTarget = !!selectedElement;

  return (
    <s-box
      padding="base"
      borderWidth="small none none none"
      borderColor="subdued"
      background="base"
    >
      {/* Element targeting badge (Phase 03) */}
      {hasElementTarget && (
        <s-box paddingBlockEnd="small">
          <s-stack direction="inline" gap="small" alignItems="center">
            <s-badge tone="success">
              Targeting: &lt;{selectedElement.tagName}&gt;
            </s-badge>
            {selectedElement.className && (
              <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace', color: 'var(--p-color-text-subdued)', fontSize: '12px' }}>
                .{selectedElement.className.split(' ')[0]}
              </span>
            )}
            <s-button
              variant="tertiary"
              onClick={onClearElement}
              accessibilityLabel="Clear element selection"
            >
              Clear
            </s-button>
          </s-stack>
        </s-box>
      )}

      {/* Theme context badge */}
      {hasThemeContext && !hasElementTarget && (
        <s-box paddingBlockEnd="small">
          <ThemeContextBadge
            themeName={themeContext?.themeName}
            themeStyle={themeContext?.themeStyle}
            detected={hasThemeContext}
          />
        </s-box>
      )}

      <div className="chat-input-container" style={{ position: "relative" }}>
        <s-box inlineSize="100%">
          <s-text-area
            ref={handleRef}
            label=""
            value={value}
            placeholder={placeholder}
            disabled={disabled || undefined}
            rows={3}
            onInput={handleInput}
          />
        </s-box>
        {/* Action buttons */}
        <div
          style={{
            position: "absolute",
            bottom: "8px",
            right: "8px",
            display: "flex",
            gap: "8px",
          }}
        >
          {/* Enhance button - shown when there's input and not streaming */}
          {hasValue && !isStreaming && (
            <s-tooltip id="enhance-tooltip">
              <span slot="content">Enhance prompt with AI</span>
              <s-button
                variant="secondary"
                onClick={handleEnhanceClick}
                disabled={disabled || undefined}
                accessibilityLabel="Enhance prompt"
                icon="wand"
              />
            </s-tooltip>
          )}
          {/* Send/Stop button */}
          <s-button
            variant="primary"
            tone={isStreaming ? "critical" : undefined}
            onClick={handleSubmit}
            disabled={
              (!hasValue && !isStreaming) ||
              (disabled && !isStreaming) ||
              undefined
            }
            accessibilityLabel={
              isStreaming ? "Stop generation" : "Send message"
            }
            icon={isStreaming ? "stop-circle" : "send"}
          />
        </div>
      </div>

      {/* Template buttons */}
      <PromptTemplates
        onSelect={handleTemplateSelect}
        disabled={disabled || isStreaming}
      />

      {/* Hint text */}
      <s-box paddingBlockStart="small-100">
        <s-text color="subdued">
          Press Enter to send, Shift + Enter for new line
        </s-text>
      </s-box>

      {/* Enhance modal */}
      <PromptEnhancer
        prompt={value}
        isOpen={isEnhancerOpen}
        onEnhanced={handleEnhanced}
        onCancel={() => setIsEnhancerOpen(false)}
        context={{
          themeStyle: themeContext?.themeStyle,
        }}
      />
    </s-box>
  );
}
