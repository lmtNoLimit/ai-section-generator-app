/**
 * ChatInput component - Input field with send/stop button
 * Supports Enter to send, Shift+Enter for newline, auto-resize
 */
import { useState, useCallback, useRef, KeyboardEvent } from 'react';

export interface ChatInputProps {
  onSend: (message: string) => void;
  onStop?: () => void;
  isStreaming: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  onStop,
  isStreaming,
  disabled = false,
  placeholder = 'Describe changes to your section...',
}: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    if (isStreaming) {
      onStop?.();
      return;
    }

    const trimmed = value.trim();
    if (!trimmed || disabled) return;

    onSend(trimmed);
    setValue('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [value, disabled, isStreaming, onSend, onStop]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter to send, Shift+Enter for newline
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  // Auto-resize textarea
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    setValue(textarea.value);

    // Auto-resize
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }, []);

  return (
    <div className="chat-input">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className="chat-input__textarea"
        aria-label="Chat message input"
      />
      <button
        onClick={handleSubmit}
        disabled={disabled && !isStreaming}
        className={`chat-input__button ${isStreaming ? 'chat-input__button--stop' : ''}`}
        aria-label={isStreaming ? 'Stop generation' : 'Send message'}
      >
        {isStreaming ? (
          <span className="chat-input__stop-icon">⏹</span>
        ) : (
          <span className="chat-input__send-icon">↑</span>
        )}
      </button>
    </div>
  );
}
