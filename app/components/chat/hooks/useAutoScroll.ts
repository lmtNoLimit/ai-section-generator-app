/**
 * Auto-scroll hook for chat message list
 * Handles scroll to bottom with user scroll override
 */
import { useRef, useEffect, useCallback } from 'react';

interface UseAutoScrollOptions {
  enabled?: boolean;
  threshold?: number; // Distance from bottom to re-enable auto-scroll
}

export function useAutoScroll<T extends HTMLElement>({
  enabled = true,
  threshold = 100,
}: UseAutoScrollOptions = {}) {
  const containerRef = useRef<T>(null);
  const shouldAutoScrollRef = useRef(true);

  // Check if user has scrolled up
  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    // Enable auto-scroll if near bottom
    shouldAutoScrollRef.current = distanceFromBottom < threshold;
  }, [threshold]);

  // Scroll to bottom
  const scrollToBottom = useCallback((smooth = true) => {
    const container = containerRef.current;
    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: smooth ? 'smooth' : 'instant',
    });
  }, []);

  // Auto-scroll when content changes
  useEffect(() => {
    if (enabled && shouldAutoScrollRef.current) {
      scrollToBottom(true);
    }
  });

  return {
    containerRef,
    scrollToBottom,
    handleScroll,
  };
}

export type { UseAutoScrollOptions };
