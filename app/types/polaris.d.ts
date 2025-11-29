/**
 * Polaris Web Component Type Definitions
 * These types enable TypeScript IntelliSense for Shopify Polaris web components
 * Updated to match actual Polaris schema (s-layout and s-layout-section removed)
 */

import type * as React from 'react';

// Gap values used by Polaris web components
type GapValue = 'none' | 'extraSmall' | 'small' | 'base' | 'large' | 'extraLarge';

// Direction values for s-stack
type DirectionValue = 'inline' | 'block';

declare global {
  namespace JSX {
  interface IntrinsicElements {
    's-page': {
      title?: string;
      heading?: string;
      primaryAction?: unknown;
      children?: React.ReactNode;
    };

    's-card': {
      title?: string;
      sectioned?: boolean;
      children?: React.ReactNode;
    };

    's-stack': {
      gap?: GapValue | string;
      direction?: DirectionValue;
      align?: 'start' | 'center' | 'end' | 'baseline' | 'stretch';
      distribution?: 'leading' | 'trailing' | 'center' | 'equalSpacing' | 'fill';
      wrap?: boolean;
      children?: React.ReactNode;
    };

    's-text': {
      variant?: 'headingSm' | 'headingMd' | 'headingLg' | 'bodyMd' | 'bodySm';
      as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';
      tone?: 'subdued' | 'success' | 'critical' | 'warning' | 'magic';
      alignment?: 'start' | 'center' | 'end' | 'justify';
      fontWeight?: 'regular' | 'medium' | 'semibold' | 'bold';
      children?: React.ReactNode;
    };

    's-text-field': {
      label?: string;
      value?: string;
      onInput?: (e: Event) => void;
      onChange?: (e: Event) => void;
      autoComplete?: string;
      autocomplete?: string;
      placeholder?: string;
      helpText?: string;
      details?: string;
      error?: string;
      name?: string;
      suffix?: string;
      disabled?: boolean;
      type?: string;
    };

    's-button': {
      variant?: 'primary' | 'secondary' | 'plain' | 'destructive' | 'tertiary';
      size?: 'slim' | 'medium' | 'large';
      loading?: string | boolean;
      disabled?: boolean;
      onClick?: () => void;
      submit?: boolean;
      slot?: string;
      target?: string;
      type?: string;
      disclosure?: 'up' | 'down';
      tone?: 'critical' | 'success';
      key?: string;
      accessibilityLabel?: string;
      children?: React.ReactNode;
    };

    's-select': {
      label?: string;
      value?: string;
      onChange?: (e: Event) => void;
      options?: Array<{ label: string; value: string }>;
      disabled?: boolean;
      helpText?: string;
      children?: React.ReactNode;
    };

    's-checkbox': {
      checked?: boolean;
      onChange?: (e: Event) => void;
      disabled?: boolean;
      children?: React.ReactNode;
    };

    's-banner': {
      tone?: 'info' | 'success' | 'warning' | 'critical';
      heading?: string;
      dismissible?: boolean;
      onDismiss?: () => void;
      children?: React.ReactNode;
    };

    's-box': {
      padding?: GapValue | string;
      paddingBlock?: GapValue | string;
      paddingInline?: GapValue | string;
      background?: 'subdued' | 'default' | 'surface' | 'surface-subdued';
      borderWidth?: string;
      borderRadius?: 'none' | 'small' | 'base' | 'large' | 'full';
      children?: React.ReactNode;
    };

    'ui-nav-menu': {
      children?: React.ReactNode;
    };

    'ui-title-bar': {
      title?: string;
      children?: React.ReactNode;
    };

    's-link': {
      href?: string;
      target?: string;
      rel?: string;
      children?: React.ReactNode;
    };

    's-section': {
      heading?: string;
      slot?: string;
      children?: React.ReactNode;
    };

    's-paragraph': {
      children?: React.ReactNode;
    };

    's-heading': {
      variant?: 'headingSm' | 'headingMd' | 'headingLg' | 'headingXl';
      as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
      children?: React.ReactNode;
    };

    's-list-item': {
      children?: React.ReactNode;
    };

    's-unordered-list': {
      children?: React.ReactNode;
    };

    's-spinner': {
      size?: 'small' | 'large';
    };

    's-divider': {
      borderWidth?: string;
      borderColor?: string;
    };

    's-badge': {
      tone?: 'info' | 'success' | 'warning' | 'critical' | 'attention' | 'new';
      progress?: 'incomplete' | 'partiallyComplete' | 'complete';
      children?: React.ReactNode;
    };

    's-grid': {
      gridTemplateColumns?: string;
      gridTemplateRows?: string;
      gap?: GapValue | string;
      children?: React.ReactNode;
    };
  }
  }
}
