/**
 * ChatPanel component - Main chat container
 * Uses Polaris Web Components for structure with minimal CSS for flex layout
 * Supports version display, selection, and suggestion chips
 *
 * Layout: Header | Scrollable Messages | Fixed Input
 * - Full height using flex column layout
 * - MessageList scrolls, ChatInput stays at bottom
 */
import { useEffect, useCallback, useRef, useState } from "react";
import { useChat } from "./hooks/useChat";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { ChatStyles } from "./ChatStyles";
import { VersionTimeline } from "./VersionTimeline";
import type { UIMessage, CodeVersion } from "../../types";
import type { Suggestion } from "./utils/suggestion-engine";

export interface ChatPanelProps {
  conversationId: string;
  initialMessages?: UIMessage[];
  currentCode?: string;
  onCodeUpdate?: (code: string) => void;
  /** Callback when messages change (for syncing with parent state) */
  onMessagesChange?: (messages: UIMessage[]) => void;
  // Version props
  versions?: CodeVersion[];
  selectedVersionId?: string | null;
  activeVersionId?: string | null;
  onVersionSelect?: (versionId: string | null) => void;
  onVersionApply?: (versionId: string) => void;
}

export function ChatPanel({
  conversationId,
  initialMessages = [],
  currentCode,
  onCodeUpdate,
  onMessagesChange,
  versions = [],
  selectedVersionId,
  activeVersionId,
  onVersionSelect,
  onVersionApply,
}: ChatPanelProps) {
  const {
    messages,
    isStreaming,
    streamingContent,
    error,
    failedMessage,
    progress,
    sendMessage,
    triggerGeneration,
    stopStreaming,
    loadMessages,
    clearError,
    retryFailedMessage,
    clearConversation,
  } = useChat({
    conversationId,
    currentCode,
    onCodeUpdate,
  });

  // Track if we've already triggered auto-generation and loaded initial messages
  const hasTriggeredAutoGenRef = useRef(false);
  const hasLoadedInitialRef = useRef(false);
  const initialMessagesIdRef = useRef<string | null>(null);

  // Reset flags when conversation changes
  useEffect(() => {
    hasTriggeredAutoGenRef.current = false;
    hasLoadedInitialRef.current = false;
    initialMessagesIdRef.current = null;
  }, [conversationId]);

  // Load initial messages only once per conversation
  useEffect(() => {
    if (initialMessages.length === 0) return;

    // Create a stable ID from the messages to detect actual changes
    const messagesId = initialMessages.map(m => m.id).join(',');

    // Skip if we've already loaded these exact messages
    if (hasLoadedInitialRef.current && messagesId === initialMessagesIdRef.current) {
      return;
    }

    hasLoadedInitialRef.current = true;
    initialMessagesIdRef.current = messagesId;
    loadMessages(initialMessages);
  }, [initialMessages, loadMessages]);

  // Sync messages back to parent when they change
  useEffect(() => {
    onMessagesChange?.(messages);
  }, [messages, onMessagesChange]);

  // Auto-trigger AI generation if last message is user with no assistant response
  useEffect(() => {
    // Early exit for streaming or already triggered
    if (isStreaming || hasTriggeredAutoGenRef.current) return;
    if (messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    const hasAssistantResponse = messages.some((m) => m.role === "assistant");

    // Trigger generation if last message is from user and no assistant response yet
    if (lastMessage.role === "user" && !hasAssistantResponse) {
      hasTriggeredAutoGenRef.current = true;
      triggerGeneration(lastMessage.content);
    }
  }, [messages, isStreaming, triggerGeneration]);

  const handleClearConversation = useCallback(() => {
    if (messages.length === 0) return;

    const confirmed = window.confirm(
      "Clear conversation history? This cannot be undone.",
    );

    if (confirmed) {
      clearConversation();
    }
  }, [messages.length, clearConversation]);

  // Phase 05: State for prefilled input from suggestion chips
  const [prefilledInput, setPrefilledInput] = useState<string>("");

  // Phase 05: Handle suggestion chip click
  const handleSuggestionClick = useCallback((suggestion: Suggestion) => {
    if (suggestion.prompt) {
      // Set prefilled input for ChatInput
      setPrefilledInput(suggestion.prompt);
    }
    // Handle special actions
    if (suggestion.id === 'preview-theme') {
      // Could emit event for parent to handle tab switch
      console.log('Preview in theme clicked');
    }
    if (suggestion.id === 'publish') {
      // Could emit event for parent to handle publish modal
      console.log('Publish to theme clicked');
    }
  }, []);

  // Phase 05: Handle copy code action
  const handleCopyCode = useCallback((code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      // Could show toast notification
      console.log('Code copied to clipboard');
    }).catch((err) => {
      console.error('Failed to copy code:', err);
    });
  }, []);

  // Phase 05: Handle apply code action (uses onCodeUpdate if available)
  const handleApplyCode = useCallback((code: string) => {
    onCodeUpdate?.(code);
  }, [onCodeUpdate]);

  // Phase 05: Clear prefilled input after send
  const handleSend = useCallback((message: string) => {
    sendMessage(message);
    setPrefilledInput("");
  }, [sendMessage]);

  return (
    <div className="chat-panel-container">
      {/* Minimal CSS for animations + layout */}
      <ChatStyles />

      {/* Header - fixed at top */}
      <s-box
        padding="small base"
        borderWidth="none none small none"
        borderColor="subdued"
        background="base"
      >
        <s-stack
          direction="inline"
          justifyContent="space-between"
          alignItems="center"
          gap="base"
        >
          {versions.length > 0 && (
            <VersionTimeline
              versions={versions}
              selectedVersionId={selectedVersionId ?? null}
              onSelect={onVersionSelect || (() => {})}
            />
          )}
          <s-tooltip id="clear-conversation-tooltip">
            Clear conversation
          </s-tooltip>
          {messages.length > 0 && (
            <s-button
              variant="tertiary"
              icon="refresh"
              onClick={handleClearConversation}
              disabled={isStreaming || undefined}
              accessibilityLabel="Clear conversation"
              interestFor="clear-conversation-tooltip"
            />
          )}
        </s-stack>
      </s-box>

      {/* Error banner */}
      {error && (
        <s-banner tone="critical" onDismiss={clearError}>
          <s-text>{error}</s-text>
          {failedMessage?.error.retryable && (
            <s-button
              slot="primary-action"
              variant="primary"
              onClick={retryFailedMessage}
            >
              Retry
            </s-button>
          )}
        </s-banner>
      )}

      {/* Message list - scrollable, takes remaining space */}
      <div className="chat-messages-container">
        <MessageList
          messages={messages}
          isStreaming={isStreaming}
          streamingContent={streamingContent}
          progress={progress}
          versions={versions}
          selectedVersionId={selectedVersionId}
          activeVersionId={activeVersionId}
          onVersionSelect={onVersionSelect}
          onVersionApply={onVersionApply}
          // Phase 05: Suggestion chips handlers
          onSuggestionClick={handleSuggestionClick}
          onCopyCode={handleCopyCode}
          onApplyCode={handleApplyCode}
        />
      </div>

      {/* Input - fixed at bottom */}
      <ChatInput
        onSend={handleSend}
        onStop={stopStreaming}
        isStreaming={isStreaming}
        prefilledValue={prefilledInput}
        onPrefilledClear={() => setPrefilledInput("")}
      />
    </div>
  );
}
