/**
 * CodeBlock component for displaying syntax-highlighted code
 * Features: copy button, line numbers, language label
 */
import { useState, useCallback } from 'react';

export interface CodeBlockProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
}

export function CodeBlock({
  code,
  language = 'liquid',
  showLineNumbers = true,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [code]);

  const lines = code.split('\n');

  return (
    <div className="chat-code-block">
      <div className="chat-code-block__header">
        <span className="chat-code-block__language">{language}</span>
        <button
          onClick={handleCopy}
          className="chat-code-block__copy"
          aria-label={copied ? 'Copied!' : 'Copy code'}
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <pre className="chat-code-block__pre">
        <code className="chat-code-block__code">
          {showLineNumbers ? (
            lines.map((line, i) => (
              <div key={i} className="chat-code-block__line">
                <span className="chat-code-block__line-number">{i + 1}</span>
                <span className="chat-code-block__line-content">{line}</span>
              </div>
            ))
          ) : (
            code
          )}
        </code>
      </pre>
    </div>
  );
}
