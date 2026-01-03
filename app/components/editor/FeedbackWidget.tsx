/**
 * Feedback widget for post-publish user feedback
 * Shows thumbs up/down options after successful publish
 */

import { useState } from 'react';
import { useFetcher } from 'react-router';

interface FeedbackWidgetProps {
  sectionId: string;
  onDismiss?: () => void;
}

/**
 * Post-publish feedback widget with thumbs up/down
 */
export function FeedbackWidget({ sectionId, onDismiss }: FeedbackWidgetProps) {
  const [submitted, setSubmitted] = useState(false);
  const fetcher = useFetcher();

  const handleFeedback = (positive: boolean) => {
    fetcher.submit(
      { sectionId, positive: String(positive) },
      { method: 'POST', action: '/api/feedback' }
    );
    setSubmitted(true);
    setTimeout(() => onDismiss?.(), 2000);
  };

  if (submitted) {
    return (
      <div
        style={{
          padding: '12px 16px',
          background: 'var(--p-color-bg-surface-success)',
          borderRadius: '8px',
        }}
      >
        <s-stack direction="inline" gap="small" alignItems="center">
          <s-icon type="check" tone="success" />
          <s-text>Thanks for your feedback!</s-text>
        </s-stack>
      </div>
    );
  }

  return (
    <s-box padding="base" background="subdued" borderRadius="base">
      <s-stack direction="block" gap="small">
        <s-text>How was this AI-generated section?</s-text>
        <s-stack direction="inline" gap="base">
          <s-button variant="secondary" onClick={() => handleFeedback(true)}>
            <s-icon type="thumbs-up" />
            Good
          </s-button>
          <s-button variant="secondary" onClick={() => handleFeedback(false)}>
            <s-icon type="thumbs-down" />
            Needs work
          </s-button>
          <s-button variant="tertiary" onClick={onDismiss}>
            Skip
          </s-button>
        </s-stack>
      </s-stack>
    </s-box>
  );
}
