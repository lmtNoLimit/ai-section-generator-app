import { useCallback, useRef } from 'react';
import type { ImperativePanelHandle } from 'react-resizable-panels';

const STORAGE_KEY = 'ai-section-editor-layout';

interface PanelSizes {
  chat: number;
  codePreview: number;
  settings: number;
}

const DEFAULT_SIZES: PanelSizes = {
  chat: 30,
  codePreview: 45,
  settings: 25,
};

/**
 * Hook for managing panel layout persistence and controls
 * Saves panel sizes to localStorage and provides toggle functions
 */
export function usePanelLayout() {
  const chatPanelRef = useRef<ImperativePanelHandle>(null);
  const settingsPanelRef = useRef<ImperativePanelHandle>(null);

  // Load sizes from localStorage
  const getSavedSizes = useCallback((): PanelSizes => {
    if (typeof window === 'undefined') return DEFAULT_SIZES;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Ignore localStorage errors
    }
    return DEFAULT_SIZES;
  }, []);

  // Save sizes to localStorage
  const saveSizes = useCallback((sizes: number[]) => {
    if (typeof window === 'undefined') return;
    try {
      const [chat, codePreview, settings] = sizes;
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ chat, codePreview, settings })
      );
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Collapse/expand chat panel
  const toggleChat = useCallback(() => {
    const panel = chatPanelRef.current;
    if (panel) {
      if (panel.getSize() < 5) {
        panel.resize(30);
      } else {
        panel.collapse();
      }
    }
  }, []);

  // Collapse/expand settings panel
  const toggleSettings = useCallback(() => {
    const panel = settingsPanelRef.current;
    if (panel) {
      if (panel.getSize() < 5) {
        panel.resize(25);
      } else {
        panel.collapse();
      }
    }
  }, []);

  return {
    chatPanelRef,
    settingsPanelRef,
    getSavedSizes,
    saveSizes,
    toggleChat,
    toggleSettings,
  };
}

export type { PanelSizes };
