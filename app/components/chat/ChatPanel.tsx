/**
 * ChatPanel component - Main chat container
 * Combines message list, input, and error handling
 */
import { useEffect, useCallback, useRef } from 'react';
import { useChat } from './hooks/useChat';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { ChatStyles } from './ChatStyles';
import type { UIMessage } from '../../types';

export interface ChatPanelProps {
  conversationId: string;
  initialMessages?: UIMessage[];
  currentCode?: string;
  onCodeUpdate?: (code: string) => void;
}

export function ChatPanel({
  conversationId,
  initialMessages = [],
  currentCode,
  onCodeUpdate,
}: ChatPanelProps) {
  const {
    messages,
    isStreaming,
    streamingContent,
    error,
    failedMessage,
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

  // Track if we've already triggered auto-generation
  const hasTriggeredAutoGenRef = useRef(false);

  // Reset auto-trigger flag when conversation changes
  useEffect(() => {
    hasTriggeredAutoGenRef.current = false;
  }, [conversationId]);

  // Load initial messages
  useEffect(() => {
    if (initialMessages.length > 0) {
      loadMessages(initialMessages);
    }
  }, [initialMessages, loadMessages]);

  // Auto-trigger AI generation if last message is user with no assistant response
  useEffect(() => {
    // Early exit for streaming or already triggered
    if (isStreaming || hasTriggeredAutoGenRef.current) return;
    if (messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    const hasAssistantResponse = messages.some(m => m.role === 'assistant');

    // Trigger generation if last message is from user and no assistant response yet
    if (lastMessage.role === 'user' && !hasAssistantResponse) {
      hasTriggeredAutoGenRef.current = true;
      triggerGeneration(lastMessage.content);
    }
  }, [messages, isStreaming, triggerGeneration]);

  const handleClearConversation = useCallback(() => {
    if (messages.length === 0) return;

    const confirmed = window.confirm(
      'Clear conversation history? This cannot be undone.'
    );

    if (confirmed) {
      clearConversation();
    }
  }, [messages.length, clearConversation]);

  return (
    <div className="chat-panel">
      {/* Inject styles */}
      <ChatStyles />

      {/* Header with clear button */}
      <div className="chat-panel__header">
        <span className="chat-panel__title">AI Assistant</span>
        {messages.length > 0 && (
          <button
            onClick={handleClearConversation}
            className="chat-panel__clear"
            aria-label="Clear conversation"
            disabled={isStreaming}
          >
            Clear
          </button>
        )}
      </div>

      {/* Error banner with retry option */}
      {error && (
        <div className="chat-error" role="alert">
          <span>{error}</span>
          <div className="chat-error__actions">
            {failedMessage?.error.retryable && (
              <button onClick={retryFailedMessage} className="chat-error__retry">
                Retry
              </button>
            )}
            <button onClick={clearError} aria-label="Dismiss error">×</button>
          </div>
        </div>
      )}

      {/* Message list */}
      <MessageList
        messages={messages}
        isStreaming={isStreaming}
        streamingContent={streamingContent}
      />

      {/* Input */}
      <ChatInput
        onSend={sendMessage}
        onStop={stopStreaming}
        isStreaming={isStreaming}
      />
    </div>
  );
}
