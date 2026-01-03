/**
 * MessageItem component - Individual chat message display
 * Uses Polaris components for layout and styling
 * Supports both user and assistant messages with code block rendering
 * Shows version badge for AI messages with codeSnapshot
 * Phase 05: Added suggestion chips for context-aware follow-ups
 */
import { memo, useMemo } from 'react';
import type { UIMessage } from '../../types';
import { CodeBlock } from './CodeBlock';
import { VersionCard } from './VersionCard';
import { SuggestionChips } from './SuggestionChips';
import { getSuggestions, type Suggestion } from './utils/suggestion-engine';

export interface MessageItemProps {
  message: UIMessage;
  isStreaming?: boolean;
  // Version display props
  versionNumber?: number;
  isSelected?: boolean;
  isLatest?: boolean;
  isActive?: boolean; // This version is current active draft
  onVersionSelect?: () => void;
  onVersionApply?: () => void;
  // Suggestion chips props (Phase 05)
  messageCount?: number;
  isLatestMessage?: boolean;
  onSuggestionClick?: (suggestion: Suggestion) => void;
  onCopyCode?: () => void;
  onApplyCode?: () => void;
}

interface ContentPart {
  type: 'text' | 'code';
  content: string;
  language?: string;
}

/**
 * Extract code from message content when codeSnapshot is not available
 * Falls back to parsing markdown code blocks from content
 */
function extractCodeFromContent(content: string): string | undefined {
  const codeBlockStart = content.indexOf('```');
  if (codeBlockStart === -1) return undefined;

  // Find the end of the language line
  const lineEnd = content.indexOf('\n', codeBlockStart);
  if (lineEnd === -1) return undefined;

  // Find closing ``` or use rest of content if incomplete
  const codeBlockEnd = content.indexOf('```', lineEnd + 1);
  if (codeBlockEnd === -1) return undefined;

  const codeContent = content.slice(lineEnd + 1, codeBlockEnd).trim();
  // Verify it looks like Liquid/HTML
  if (codeContent.includes('{%') || codeContent.includes('{{') || codeContent.includes('<')) {
    return codeContent;
  }
  return undefined;
}

/**
 * Parse message content to extract code blocks
 * Uses linear-time string scanning to avoid ReDoS vulnerabilities
 */
function parseMessageContent(content: string): ContentPart[] {
  const parts: ContentPart[] = [];
  let currentIndex = 0;

  while (currentIndex < content.length) {
    // Find next code block start
    const startMarker = content.indexOf('```', currentIndex);

    if (startMarker === -1) {
      // No more code blocks, add remaining text
      const text = content.slice(currentIndex).trim();
      if (text) {
        parts.push({ type: 'text', content: text });
      }
      break;
    }

    // Add text before code block
    if (startMarker > currentIndex) {
      const text = content.slice(currentIndex, startMarker).trim();
      if (text) {
        parts.push({ type: 'text', content: text });
      }
    }

    // Find language identifier (optional, on same line)
    const lineEnd = content.indexOf('\n', startMarker);
    if (lineEnd === -1) {
      // Malformed: no newline after opening ```
      const text = content.slice(startMarker).trim();
      if (text) {
        parts.push({ type: 'text', content: text });
      }
      break;
    }

    const langLine = content.slice(startMarker + 3, lineEnd).trim();
    const language = /^\w+$/.test(langLine) ? langLine : 'liquid';

    // Find closing ```
    const endMarker = content.indexOf('```', lineEnd + 1);
    if (endMarker === -1) {
      // No closing marker, treat rest as text
      const text = content.slice(startMarker).trim();
      if (text) {
        parts.push({ type: 'text', content: text });
      }
      break;
    }

    // Extract code content
    const codeContent = content.slice(lineEnd + 1, endMarker).trim();
    if (codeContent) {
      parts.push({
        type: 'code',
        content: codeContent,
        language,
      });
    }

    currentIndex = endMarker + 3;
  }

  // If no parts found, treat entire content as text
  if (parts.length === 0) {
    parts.push({ type: 'text', content });
  }

  return parts;
}

/**
 * Memoized MessageItem with custom comparison
 * Only re-renders when content, streaming, or version state changes
 */
export const MessageItem = memo(function MessageItem({
  message,
  isStreaming = false,
  versionNumber,
  isSelected = false,
  isLatest: _isLatest = false,
  isActive = false,
  onVersionSelect,
  onVersionApply,
  // Suggestion chips props (Phase 05)
  messageCount = 0,
  isLatestMessage = false,
  onSuggestionClick,
  onCopyCode,
  onApplyCode,
}: MessageItemProps) {
  const isUser = message.role === 'user';
  const parts = parseMessageContent(message.content);

  // For AI messages, check if there's any text content (not just code)
  const hasTextContent = parts.some(p => p.type === 'text');
  const hasCodeContent = parts.some(p => p.type === 'code');

  // Derive effective code: prefer codeSnapshot, fallback to extracted from content
  const effectiveCode = useMemo(() => {
    if (message.codeSnapshot) return message.codeSnapshot;
    if (!isUser && hasCodeContent) {
      return extractCodeFromContent(message.content);
    }
    return undefined;
  }, [message.codeSnapshot, message.content, isUser, hasCodeContent]);

  // Show version badge for AI messages with code (use effectiveCode as fallback)
  const showVersionBadge = !isUser && (message.codeSnapshot || effectiveCode) && versionNumber;

  // Generate context-aware suggestions (Phase 05) - use effectiveCode
  const suggestions = useMemo(() => {
    if (isUser || isStreaming) return [];
    return getSuggestions({
      code: effectiveCode || '',
      messageCount,
      isLatestMessage,
      isStreaming,
    });
  }, [isUser, isStreaming, effectiveCode, messageCount, isLatestMessage]);

  return (
    <div className="chat-message-enter">
      <s-box
        padding="small"
        borderRadius="base"
        accessibilityRole="generic"
        accessibilityLabel={`${isUser ? 'You' : 'AI Assistant'} said`}
      >
        <s-stack
          direction="inline"
          gap="small"
          alignItems="start"
          justifyContent={isUser ? 'end' : 'start'}
        >
          {/* Avatar - show on left for assistant */}
          {!isUser && (
            <div className="chat-avatar--ai">
              <s-avatar
                initials="AI"
                size="small"
              />
            </div>
          )}

          {/* Message content */}
          <s-box maxInlineSize="85%">
            <s-stack direction="block" gap="small">
              {/* For AI messages with only code (no text), show default message */}
              {!isUser && hasCodeContent && !hasTextContent && (
                <div
                  className="chat-bubble--ai"
                  style={{
                    padding: '10px 14px',
                    borderRadius: '16px 16px 16px 4px',
                  }}
                >
                  <s-text>Here's your section code. You can preview it in the panel on the right.</s-text>
                </div>
              )}

              {/* Message content parts */}
              {parts.map((part, index) => {
                // For AI messages: skip code blocks (code is displayed in Code Preview Panel)
                // For user messages: render code blocks inline
                if (part.type === 'code') {
                  if (!isUser) return null; // AI code shown in preview panel
                  return (
                    <CodeBlock
                      key={index}
                      code={part.content}
                      language={part.language || 'liquid'}
                    />
                  );
                }

                // Text content - show streaming cursor on last text part only
                const textParts = parts.filter(p => p.type === 'text');
                const isLastTextPart = part === textParts[textParts.length - 1];

                return (
                  <div
                    key={index}
                    className={isUser ? 'chat-bubble--user' : 'chat-bubble--ai'}
                    style={{
                      padding: '10px 14px',
                      borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    }}
                  >
                    <s-text>
                      {part.content}
                      {isStreaming && isLastTextPart && (
                        <span className="chat-cursor" aria-hidden="true" />
                      )}
                    </s-text>
                  </div>
                );
              })}

              {/* Version Card for AI messages with code */}
              {showVersionBadge && (
                <VersionCard
                  versionNumber={versionNumber}
                  createdAt={message.createdAt}
                  isActive={isActive}
                  isSelected={isSelected}
                  onPreview={onVersionSelect || (() => {})}
                  onRestore={onVersionApply || (() => {})}
                />
              )}

              {/* Suggestion Chips (Phase 05) */}
              {suggestions.length > 0 && (
                <SuggestionChips
                  suggestions={suggestions}
                  onChipClick={onSuggestionClick || (() => {})}
                  onCopy={onCopyCode}
                  onApply={onApplyCode}
                />
              )}

              {/* Error display */}
              {message.isError && (
                <s-banner tone="critical" dismissible={false}>
                  <s-text>{message.errorMessage || 'An error occurred'}</s-text>
                </s-banner>
              )}
            </s-stack>
          </s-box>

          {/* Avatar - show on right for user */}
          {isUser && (
            <div className="chat-avatar--user">
              <s-avatar
                initials="U"
                size="small"
              />
            </div>
          )}
        </s-stack>
      </s-box>
    </div>
  );
}, (prevProps, nextProps) => {
  // Re-render if content, streaming, version state, or suggestion state changes
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.isStreaming === nextProps.isStreaming &&
    prevProps.versionNumber === nextProps.versionNumber &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isLatest === nextProps.isLatest &&
    prevProps.isActive === nextProps.isActive &&
    // Phase 05: suggestion chips state
    prevProps.messageCount === nextProps.messageCount &&
    prevProps.isLatestMessage === nextProps.isLatestMessage
  );
});
