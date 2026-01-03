/**
 * PromptEnhancer component - Modal for enhancing prompts with AI
 * Shows enhanced prompt preview with variations for user selection
 * Uses Polaris s-modal with ref-based show/hide control
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { useFetcher } from "react-router";

export interface PromptEnhancerProps {
  prompt: string;
  isOpen: boolean;
  onEnhanced: (enhanced: string) => void;
  onCancel: () => void;
  context?: { themeStyle?: string; sectionType?: string };
}

interface EnhanceResponse {
  enhanced: string;
  variations: string[];
  error?: string;
}

/** Modal ID for commandFor reference */
export const ENHANCER_MODAL_ID = "prompt-enhancer-modal";

export function PromptEnhancer({
  prompt,
  isOpen,
  onEnhanced,
  onCancel,
  context,
}: PromptEnhancerProps) {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const modalRef = useRef<any>(null);
  /* eslint-enable @typescript-eslint/no-explicit-any */
  const fetcher = useFetcher<EnhanceResponse>();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [hasTriggered, setHasTriggered] = useState(false);

  const isLoading = fetcher.state !== "idle";
  const data = fetcher.data;
  const hasError = !!data?.error;

  // Show/hide modal based on isOpen prop
  useEffect(() => {
    if (isOpen) {
      modalRef.current?.showOverlay?.();
    } else {
      modalRef.current?.hideOverlay?.();
    }
  }, [isOpen]);

  // Trigger enhancement when modal opens
  useEffect(() => {
    if (isOpen && prompt.trim() && !hasTriggered) {
      setHasTriggered(true);
      fetcher.submit(
        { prompt, context: context || {} },
        {
          method: "POST",
          action: "/api/enhance-prompt",
          encType: "application/json",
        }
      );
    }
  }, [isOpen, prompt, context, fetcher, hasTriggered]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedIndex(0);
      setHasTriggered(false);
    }
  }, [isOpen]);

  const handleCancel = useCallback(() => {
    modalRef.current?.hideOverlay?.();
    onCancel();
  }, [onCancel]);

  const handleUseEnhanced = useCallback(() => {
    if (!data) return;

    const selected =
      selectedIndex === 0
        ? data.enhanced
        : data.variations[selectedIndex - 1];

    modalRef.current?.hideOverlay?.();
    onEnhanced(selected);
  }, [data, selectedIndex, onEnhanced]);

  const handleUseOriginal = useCallback(() => {
    modalRef.current?.hideOverlay?.();
    onEnhanced(prompt);
  }, [prompt, onEnhanced]);

  // Get all options (enhanced + variations)
  const options = data && !hasError
    ? [
        { label: "Enhanced", content: data.enhanced },
        ...data.variations.map((v, i) => ({
          label: `Variation ${i + 1}`,
          content: v,
        })),
      ]
    : [];

  return (
    <s-modal ref={modalRef} id={ENHANCER_MODAL_ID} heading="Enhance Your Prompt">
      <s-stack gap="base" direction="block">
        {/* Original prompt display */}
        <s-box>
          <s-box paddingBlockEnd="small">
            <s-text>
              <strong>Original prompt:</strong>
            </s-text>
          </s-box>
          <s-box
            padding="small"
            background="subdued"
            borderRadius="base"
          >
            <s-text color="subdued">{prompt}</s-text>
          </s-box>
        </s-box>

        {/* Loading state */}
        {isLoading && (
          <s-box padding="large">
            <s-stack direction="block" gap="base" alignItems="center">
              <s-spinner size="large" />
              <s-text>Enhancing your prompt...</s-text>
            </s-stack>
          </s-box>
        )}

        {/* Error state */}
        {hasError && (
          <s-banner tone="critical">
            <s-text>{data?.error || "Enhancement failed"}</s-text>
          </s-banner>
        )}

        {/* Enhanced options */}
        {data && !hasError && (
          <s-box>
            <s-box paddingBlockEnd="small">
              <s-text>
                <strong>Select a version:</strong>
              </s-text>
            </s-box>
            <s-stack direction="block" gap="small">
              {options.map((option, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setSelectedIndex(index)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedIndex(index);
                    }
                  }}
                  style={{
                    cursor: "pointer",
                    width: "100%",
                    textAlign: "left",
                    border: "none",
                    background: "none",
                    padding: 0,
                  }}
                  aria-pressed={selectedIndex === index}
                >
                  <s-box
                    padding="base"
                    background={selectedIndex === index ? "subdued" : "base"}
                    borderWidth="small"
                    borderColor="subdued"
                    borderRadius="base"
                  >
                    <s-stack direction="block" gap="small">
                      <s-stack direction="inline" gap="small" alignItems="center">
                        <s-badge tone={selectedIndex === index ? "info" : "neutral"}>
                          {option.label}
                        </s-badge>
                        {index === 0 && (
                          <s-badge tone="success">Recommended</s-badge>
                        )}
                      </s-stack>
                      <s-text>{option.content}</s-text>
                    </s-stack>
                  </s-box>
                </button>
              ))}
            </s-stack>
          </s-box>
        )}
      </s-stack>

      {/* Modal actions */}
      <s-button
        slot="secondary-actions"
        onClick={handleCancel}
      >
        Cancel
      </s-button>
      <s-button
        slot="secondary-actions"
        onClick={handleUseOriginal}
      >
        Use Original
      </s-button>
      <s-button
        slot="primary-action"
        variant="primary"
        onClick={handleUseEnhanced}
        disabled={isLoading || hasError || undefined}
      >
        Use Selected
      </s-button>
    </s-modal>
  );
}
