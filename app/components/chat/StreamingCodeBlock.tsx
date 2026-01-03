/**
 * StreamingCodeBlock component - Displays code with typing animation
 * Uses requestAnimationFrame for smooth 60fps rendering
 * Features: auto-scroll, cursor blink, chunked updates to prevent DOM thrashing
 */
import { useRef, useEffect, useState, useCallback, memo } from 'react';

export interface StreamingCodeBlockProps {
  code: string;
  isStreaming: boolean;
  language?: string;
  maxHeight?: string;
}

// Inline styles for code block (dark theme)
const containerStyle = {
  background: '#1e1e1e',
  borderRadius: 'var(--p-border-radius-200)',
  overflow: 'hidden',
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '8px 12px',
  background: '#2d2d2d',
  borderBottom: '1px solid #404040',
};

const languageLabelStyle = {
  color: '#858585',
  fontSize: '11px',
  fontWeight: 600,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

const preStyle = {
  margin: 0,
  padding: '12px',
  overflowX: 'auto' as const,
  overflowY: 'auto' as const,
  color: '#d4d4d4',
  fontFamily: "'SF Mono', Monaco, Consolas, 'Courier New', monospace",
  fontSize: '12px',
  lineHeight: 1.6,
  whiteSpace: 'pre-wrap' as const,
  wordBreak: 'break-word' as const,
};

/**
 * StreamingCodeBlock - Main component
 * Renders code with smooth typing animation during streaming
 */
export const StreamingCodeBlock = memo(function StreamingCodeBlock({
  code,
  isStreaming,
  language = 'liquid',
  maxHeight = '300px',
}: StreamingCodeBlockProps) {
  const [displayedCode, setDisplayedCode] = useState('');
  const [copied, setCopied] = useState(false);
  const preRef = useRef<HTMLPreElement>(null);
  const bufferRef = useRef(code);
  const frameIdRef = useRef<number | null>(null);
  const displayedLengthRef = useRef(0);

  // Chunked display for smooth animation (25 chars per frame ~60fps)
  const CHARS_PER_FRAME = 25;

  /**
   * Animation loop for typing effect
   * Uses requestAnimationFrame for smooth 60fps rendering
   */
  const animate = useCallback(() => {
    const target = bufferRef.current;
    const currentLength = displayedLengthRef.current;

    if (currentLength < target.length) {
      // Calculate chunk size for smooth animation
      const chunkSize = Math.min(CHARS_PER_FRAME, target.length - currentLength);
      const newLength = currentLength + chunkSize;

      displayedLengthRef.current = newLength;
      setDisplayedCode(target.slice(0, newLength));

      frameIdRef.current = requestAnimationFrame(animate);
    }
  }, []);

  // Handle code updates during streaming
  useEffect(() => {
    bufferRef.current = code;

    if (isStreaming) {
      // Start animation if not already running
      if (!frameIdRef.current) {
        frameIdRef.current = requestAnimationFrame(animate);
      }
    } else {
      // Show full code immediately when streaming ends
      displayedLengthRef.current = code.length;
      setDisplayedCode(code);
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
        frameIdRef.current = null;
      }
    }

    return () => {
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
        frameIdRef.current = null;
      }
    };
  }, [code, isStreaming, animate]);

  // Auto-scroll to bottom during streaming
  useEffect(() => {
    if (isStreaming && preRef.current) {
      preRef.current.scrollTop = preRef.current.scrollHeight;
    }
  }, [displayedCode, isStreaming]);

  // Reset state when code clears
  useEffect(() => {
    if (!code) {
      displayedLengthRef.current = 0;
      setDisplayedCode('');
    }
  }, [code]);

  // Copy handler
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [code]);

  // Don't render if no code
  if (!code && !isStreaming) return null;

  return (
    <div style={containerStyle} className="streaming-code-block">
      {/* Header with language label and copy button */}
      <div style={headerStyle}>
        <span style={languageLabelStyle}>{language}</span>
        <s-button
          variant="tertiary"
          onClick={handleCopy}
          icon={copied ? 'check' : 'clipboard'}
          disabled={isStreaming || undefined}
        >
          {copied ? 'Copied' : 'Copy'}
        </s-button>
      </div>

      {/* Code content with typing effect */}
      <pre
        ref={preRef}
        style={{ ...preStyle, maxHeight }}
        className={`language-${language}`}
      >
        <code>
          {displayedCode}
          {isStreaming && <span className="streaming-cursor" aria-hidden="true">|</span>}
        </code>
      </pre>
    </div>
  );
});
