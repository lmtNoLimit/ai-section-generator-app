import type { ReactNode } from 'react';

export interface BannerProps {
  tone?: 'info' | 'success' | 'warning' | 'critical';
  heading?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  children?: ReactNode;
}

/**
 * Wrapper for Polaris s-banner web component
 * Displays feedback messages with appropriate styling
 */
export function Banner({
  tone = 'info',
  heading,
  dismissible = false,
  onDismiss,
  children
}: BannerProps) {
  return (
    <s-banner
      tone={tone}
      heading={heading}
      dismissible={dismissible}
      onDismiss={onDismiss}
    >
      {children}
    </s-banner>
  );
}

/**
 * Pre-configured success banner
 * Used for displaying successful operations
 */
export function SuccessBanner({ message }: { message: string }) {
  return (
    <Banner tone="success" heading="Success" dismissible>
      {message}
    </Banner>
  );
}

/**
 * Pre-configured error banner
 * Used for displaying error messages
 */
export function ErrorBanner({ message }: { message: string }) {
  return (
    <Banner tone="critical" heading="Error">
      {message}
    </Banner>
  );
}
