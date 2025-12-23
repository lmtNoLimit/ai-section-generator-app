/**
 * MessageList component - Scrollable message container
 * Handles auto-scroll, empty state, and version display
 */
import { useAutoScroll } from './hooks/useAutoScroll';
import { MessageItem } from './MessageItem';
import { TypingIndicator } from './TypingIndicator';
import type { UIMessage, CodeVersion } from '../../types';

export interface MessageListProps {
  messages: UIMessage[];
  isStreaming: boolean;
  streamingContent: string;
  // Version props
  versions?: CodeVersion[];
  selectedVersionId?: string | null;
  activeVersionId?: string | null;
  onVersionSelect?: (versionId: string) => void;
  onVersionApply?: (versionId: string) => void;
}

export function MessageList({
  messages,
  isStreaming,
  streamingContent,
  versions = [],
  selectedVersionId,
  activeVersionId,
  onVersionSelect,
  onVersionApply,
}: MessageListProps) {
  const { containerRef, handleScroll } = useAutoScroll<HTMLDivElement>({
    enabled: true,
  });

  return (
    <div
      ref={containerRef}
      className="chat-message-list"
      onScroll={handleScroll}
      role="log"
      aria-live="polite"
      aria-label="Chat messages"
    >
      {messages.length === 0 ? (
        <div className="chat-empty-state">
          <div className="chat-empty-state__icon">💬</div>
          <p className="chat-empty-state__title">Start a conversation</p>
          <p className="chat-empty-state__examples">
            Ask me to modify your section. Try:<br />
            &quot;Make the heading larger&quot; or &quot;Add a call-to-action button&quot;
          </p>
        </div>
      ) : (
        <>
          {messages.map((message) => {
            // Find version info for this message
            const version = versions.find((v) => v.id === message.id);
            const isLatestVersion = version && versions.indexOf(version) === versions.length - 1;

            return (
              <MessageItem
                key={message.id}
                message={message}
                versionNumber={version?.versionNumber}
                isSelected={selectedVersionId === message.id}
                isLatest={isLatestVersion || false}
                isActive={activeVersionId === message.id}
                onVersionSelect={() => onVersionSelect?.(message.id)}
                onVersionApply={() => onVersionApply?.(message.id)}
              />
            );
          })}

          {/* Streaming message */}
          {isStreaming && streamingContent && (
            <MessageItem
              message={{
                id: 'streaming',
                conversationId: '',
                role: 'assistant',
                content: streamingContent,
                createdAt: new Date(),
              }}
              isStreaming={true}
            />
          )}

          {/* Typing indicator when waiting for first token */}
          {isStreaming && !streamingContent && (
            <TypingIndicator />
          )}
        </>
      )}
    </div>
  );
}
