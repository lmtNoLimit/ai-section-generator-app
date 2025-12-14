/**
 * Keyboard shortcuts hook for global and component-level shortcuts
 * Supports Cmd/Ctrl modifiers and input-aware handling
 */
import { useEffect, useCallback } from 'react';

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
  enabled?: boolean;
}

interface UseKeyboardShortcutsOptions {
  shortcuts: ShortcutConfig[];
  enabled?: boolean;
}

export function useKeyboardShortcuts({
  shortcuts,
  enabled = true,
}: UseKeyboardShortcutsOptions) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in inputs (except explicit ones)
      const target = event.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' ||
                      target.tagName === 'TEXTAREA' ||
                      target.isContentEditable;

      for (const shortcut of shortcuts) {
        if (shortcut.enabled === false) continue;

        const ctrlMatch = (shortcut.ctrl ?? false) === (event.ctrlKey || event.metaKey);
        const shiftMatch = (shortcut.shift ?? false) === event.shiftKey;
        const altMatch = (shortcut.alt ?? false) === event.altKey;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
          // Allow Cmd+Enter in textareas for sending messages
          if (isInput && !(shortcut.key.toLowerCase() === 'enter' && shortcut.ctrl)) {
            // Allow Escape in inputs for stopping
            if (shortcut.key.toLowerCase() !== 'escape') {
              continue;
            }
          }

          event.preventDefault();
          shortcut.action();
          return;
        }
      }
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

/**
 * Hook for chat input specific shortcuts
 */
export function useChatInputShortcuts({
  onSend,
  onStop,
  isStreaming,
}: {
  onSend: () => void;
  onStop: () => void;
  isStreaming: boolean;
}) {
  useKeyboardShortcuts({
    shortcuts: [
      {
        key: 'Enter',
        ctrl: true,
        action: isStreaming ? onStop : onSend,
        description: isStreaming ? 'Stop generation' : 'Send message',
      },
      {
        key: 'Escape',
        action: onStop,
        description: 'Cancel generation',
        enabled: isStreaming,
      },
    ],
  });
}

export type { ShortcutConfig, UseKeyboardShortcutsOptions };
