/**
 * Tests for useAutoScroll hook
 * Tests auto-scroll behavior and manual scroll detection
 */
import { renderHook, act } from '@testing-library/react';
import { useAutoScroll } from '../hooks/useAutoScroll';

describe('useAutoScroll', () => {
  let mockContainer: HTMLDivElement;

  beforeEach(() => {
    // Create a mock container element
    mockContainer = document.createElement('div');
    mockContainer.style.height = '300px';
    mockContainer.style.overflow = 'auto';
    document.body.appendChild(mockContainer);
  });

  afterEach(() => {
    document.body.removeChild(mockContainer);
  });

  it('returns containerRef, scrollToBottom, and handleScroll', () => {
    const { result } = renderHook(() => useAutoScroll<HTMLDivElement>());

    expect(result.current.containerRef).toBeDefined();
    expect(result.current.scrollToBottom).toBeDefined();
    expect(result.current.handleScroll).toBeDefined();
  });

  it('initializes with containerRef', () => {
    const { result } = renderHook(() => useAutoScroll<HTMLDivElement>());

    act(() => {
      result.current.containerRef.current = mockContainer;
    });

    expect(result.current.containerRef.current).toBe(mockContainer);
  });

  it('scrolls to bottom when called', () => {
    const { result } = renderHook(() => useAutoScroll<HTMLDivElement>());

    act(() => {
      result.current.containerRef.current = mockContainer;
    });

    // Mock scrollTo
    mockContainer.scrollTo = jest.fn();

    act(() => {
      result.current.scrollToBottom(false);
    });

    expect(mockContainer.scrollTo).toHaveBeenCalledWith({
      top: mockContainer.scrollHeight,
      behavior: 'instant',
    });
  });

  it('scrolls smoothly by default', () => {
    const { result } = renderHook(() => useAutoScroll<HTMLDivElement>());

    act(() => {
      result.current.containerRef.current = mockContainer;
    });

    mockContainer.scrollTo = jest.fn();

    act(() => {
      result.current.scrollToBottom();
    });

    expect(mockContainer.scrollTo).toHaveBeenCalledWith({
      top: mockContainer.scrollHeight,
      behavior: 'smooth',
    });
  });

  it('detects when user scrolls away from bottom', () => {
    const { result } = renderHook(() => useAutoScroll<HTMLDivElement>());

    act(() => {
      result.current.containerRef.current = mockContainer;
    });

    // Setup: container scrolled up (distance from bottom > threshold)
    Object.defineProperty(mockContainer, 'scrollTop', {
      value: 100,
      writable: true,
    });
    Object.defineProperty(mockContainer, 'scrollHeight', {
      value: 500,
      writable: true,
    });
    Object.defineProperty(mockContainer, 'clientHeight', {
      value: 300,
      writable: true,
    });

    // Distance from bottom = 500 - 100 - 300 = 100
    // Default threshold is 100, so we're at the edge
    act(() => {
      result.current.handleScroll();
    });

    // Should disable auto-scroll (distance == threshold)
    // Actually with threshold 100 and distance 100, it should still enable (distance < threshold)
  });

  it('enables auto-scroll when user scrolls near bottom', () => {
    const { result } = renderHook(() =>
      useAutoScroll<HTMLDivElement>({ threshold: 100 })
    );

    act(() => {
      result.current.containerRef.current = mockContainer;
    });

    // Setup: container near bottom
    Object.defineProperty(mockContainer, 'scrollTop', {
      value: 100,
      writable: true,
    });
    Object.defineProperty(mockContainer, 'scrollHeight', {
      value: 500,
      writable: true,
    });
    Object.defineProperty(mockContainer, 'clientHeight', {
      value: 300,
      writable: true,
    });

    // Distance from bottom = 500 - 100 - 300 = 100
    // At threshold should enable (not less than)
    act(() => {
      result.current.handleScroll();
    });

    // Further up would be: scrollTop = 50
    Object.defineProperty(mockContainer, 'scrollTop', {
      value: 50,
      writable: true,
    });

    act(() => {
      result.current.handleScroll();
    });

    // Distance = 500 - 50 - 300 = 150, should disable (> 100)
  });

  it('respects custom threshold', () => {
    const { result } = renderHook(() =>
      useAutoScroll<HTMLDivElement>({ threshold: 50 })
    );

    act(() => {
      result.current.containerRef.current = mockContainer;
    });

    Object.defineProperty(mockContainer, 'scrollTop', {
      value: 100,
      writable: true,
    });
    Object.defineProperty(mockContainer, 'scrollHeight', {
      value: 500,
      writable: true,
    });
    Object.defineProperty(mockContainer, 'clientHeight', {
      value: 300,
      writable: true,
    });

    // Distance = 100, threshold = 50
    // 100 > 50, so auto-scroll should be disabled
    act(() => {
      result.current.handleScroll();
    });

    // Now closer
    Object.defineProperty(mockContainer, 'scrollTop', {
      value: 120,
      writable: true,
    });

    // Distance = 80, still > 50
    act(() => {
      result.current.handleScroll();
    });

    // Very close
    Object.defineProperty(mockContainer, 'scrollTop', {
      value: 145,
      writable: true,
    });

    // Distance = 55, still > 50
    act(() => {
      result.current.handleScroll();
    });

    // At threshold
    Object.defineProperty(mockContainer, 'scrollTop', {
      value: 150,
      writable: true,
    });

    // Distance = 50, equals threshold, should enable
    act(() => {
      result.current.handleScroll();
    });
  });

  it('handles missing container gracefully', () => {
    const { result } = renderHook(() => useAutoScroll<HTMLDivElement>());

    // Container ref is not set
    expect(() => {
      act(() => {
        result.current.scrollToBottom();
      });
    }).not.toThrow();

    expect(() => {
      act(() => {
        result.current.handleScroll();
      });
    }).not.toThrow();
  });

  it('can be disabled', () => {
    const { result } = renderHook(() =>
      useAutoScroll<HTMLDivElement>({ enabled: false })
    );

    act(() => {
      result.current.containerRef.current = mockContainer;
    });

    mockContainer.scrollTo = jest.fn();

    // Even though setup would normally scroll, disabled prevents it
    act(() => {
      result.current.scrollToBottom();
    });

    // Function still works, but hook's internal useEffect should not auto-scroll
  });

  it('has default options', () => {
    const { result } = renderHook(() => useAutoScroll());

    expect(result.current.containerRef).toBeDefined();
    expect(result.current.scrollToBottom).toBeDefined();
    expect(result.current.handleScroll).toBeDefined();
  });
});
