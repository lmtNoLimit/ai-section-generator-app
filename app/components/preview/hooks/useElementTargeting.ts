/**
 * Hook for element targeting in preview iframe
 * Manages targeting state and postMessage communication
 */
import { useState, useCallback, useEffect } from 'react';
import type { SelectedElementInfo } from '../types';

export interface UseElementTargetingResult {
  isTargetingEnabled: boolean;
  selectedElement: SelectedElementInfo | null;
  messageNonce: string;
  enableTargeting: () => void;
  disableTargeting: () => void;
  clearSelection: () => void;
  getElementContext: () => string;
  sendTargetingMessage: (type: string, payload?: Record<string, unknown>) => void;
}

interface UseElementTargetingOptions {
  /** Callback when element is selected */
  onElementSelected?: (element: SelectedElementInfo) => void;
}

/**
 * Generate crypto-safe random nonce for message authentication
 */
function generateNonce(): string {
  return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
}

export function useElementTargeting(
  options: UseElementTargetingOptions = {}
): UseElementTargetingResult {
  const { onElementSelected } = options;
  const [isTargetingEnabled, setIsTargetingEnabled] = useState(false);
  const [selectedElement, setSelectedElement] = useState<SelectedElementInfo | null>(null);
  const [messageNonce] = useState(generateNonce);

  // Send message to iframe
  const sendTargetingMessage = useCallback((type: string, payload?: Record<string, unknown>) => {
    // Find the preview iframe (use data attribute for reliable selection)
    const iframe = document.querySelector('iframe[title="Section Preview"]') as HTMLIFrameElement;
    if (!iframe?.contentWindow) return;

    iframe.contentWindow.postMessage({
      type,
      nonce: messageNonce,
      ...payload,
    }, '*');
  }, [messageNonce]);

  // Enable targeting mode
  const enableTargeting = useCallback(() => {
    setIsTargetingEnabled(true);
    sendTargetingMessage('ENABLE_TARGETING', { enabled: true });
  }, [sendTargetingMessage]);

  // Disable targeting mode
  const disableTargeting = useCallback(() => {
    setIsTargetingEnabled(false);
    setSelectedElement(null);
    sendTargetingMessage('ENABLE_TARGETING', { enabled: false });
  }, [sendTargetingMessage]);

  // Clear current selection
  const clearSelection = useCallback(() => {
    setSelectedElement(null);
    sendTargetingMessage('CLEAR_SELECTION');
  }, [sendTargetingMessage]);

  // Listen for messages from iframe with origin validation
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Security: Validate origin first
      // 'null' is for srcdoc iframes, window.location.origin for same-origin
      const allowedOrigins = ['null', window.location.origin];
      if (!allowedOrigins.includes(event.origin)) return;

      const data = event.data;
      if (!data || typeof data !== 'object') return;
      if (data.nonce !== messageNonce) return;

      if (data.type === 'ELEMENT_SELECTED' && data.element) {
        // Sanitize element data before setting state
        const sanitizedElement: SelectedElementInfo = {
          selector: String(data.element.selector || '').slice(0, 500),
          tagName: String(data.element.tagName || '').slice(0, 50),
          className: String(data.element.className || '').slice(0, 200),
          textContent: String(data.element.textContent || '').slice(0, 100),
          boundingRect: {
            top: Number(data.element.boundingRect?.top) || 0,
            left: Number(data.element.boundingRect?.left) || 0,
            width: Number(data.element.boundingRect?.width) || 0,
            height: Number(data.element.boundingRect?.height) || 0,
          },
          path: Array.isArray(data.element.path)
            ? data.element.path.map((p: unknown) => String(p).slice(0, 100)).slice(0, 10)
            : [],
        };
        setSelectedElement(sanitizedElement);
        onElementSelected?.(sanitizedElement);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [messageNonce, onElementSelected]);

  // Escape key to cancel targeting
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isTargetingEnabled) {
        disableTargeting();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTargetingEnabled, disableTargeting]);

  // Generate context string for AI prompt
  const getElementContext = useCallback(() => {
    if (!selectedElement) return '';

    const pathStr = selectedElement.path.join(' > ');
    const classStr = selectedElement.className
      ? `.${selectedElement.className.split(' ').slice(0, 2).join('.')}`
      : '';

    return `Target element:
- Tag: <${selectedElement.tagName}${classStr}>
- Path: ${pathStr}
- Content: "${selectedElement.textContent}"
- Selector: ${selectedElement.selector}`;
  }, [selectedElement]);

  return {
    isTargetingEnabled,
    selectedElement,
    messageNonce,
    enableTargeting,
    disableTargeting,
    clearSelection,
    getElementContext,
    sendTargetingMessage,
  };
}
