/**
 * Schema validation status display component
 * Shows errors, warnings, and validation status
 */

import type { SchemaValidationResult } from './validation/schema-validator';

interface SchemaValidationProps {
  validation: SchemaValidationResult;
  isLoading?: boolean;
}

/**
 * Displays schema validation results with errors and warnings
 */
export function SchemaValidation({ validation, isLoading }: SchemaValidationProps) {
  if (isLoading) {
    return (
      <s-box padding="base">
        <s-stack direction="inline" gap="small" alignItems="center">
          <s-spinner size="base" />
          <s-text color="subdued">Validating...</s-text>
        </s-stack>
      </s-box>
    );
  }

  const { valid, errors, warnings } = validation;

  return (
    <s-box padding="base">
      <s-stack direction="block" gap="base">
        {/* Status header */}
        <s-stack direction="inline" gap="small" alignItems="center">
          {valid ? (
            <>
              <s-icon type="check-circle" tone="success" />
              <s-text type="strong">Ready to publish</s-text>
            </>
          ) : (
            <>
              <s-icon type="alert-circle" tone="critical" />
              <s-text type="strong">
                {errors.length} error{errors.length !== 1 ? 's' : ''} found
              </s-text>
            </>
          )}

          {warnings.length > 0 && (
            <s-badge tone="warning">
              {warnings.length} warning{warnings.length !== 1 ? 's' : ''}
            </s-badge>
          )}
        </s-stack>

        {/* Errors */}
        {errors.length > 0 && (
          <s-box>
            <s-stack direction="block" gap="small">
              {errors.map((error, index) => (
                <div
                  key={index}
                  style={{
                    padding: '8px 12px',
                    background: 'var(--p-color-bg-surface-critical)',
                    borderRadius: '8px',
                  }}
                >
                  <s-stack direction="block" gap="small">
                    <s-text type="strong">{error.message}</s-text>
                    {error.suggestion && (
                      <s-text color="subdued">Fix: {error.suggestion}</s-text>
                    )}
                  </s-stack>
                </div>
              ))}
            </s-stack>
          </s-box>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (
          <s-box>
            <s-stack direction="block" gap="small">
              <s-text color="subdued">
                {warnings.length} warning{warnings.length !== 1 ? 's' : ''}
              </s-text>
              {warnings.map((warning, index) => (
                <div
                  key={index}
                  style={{
                    padding: '8px 12px',
                    background: 'var(--p-color-bg-surface-warning)',
                    borderRadius: '8px',
                  }}
                >
                  <s-stack direction="block" gap="small">
                    <s-text>{warning.message}</s-text>
                    {warning.suggestion && (
                      <s-text color="subdued">Suggestion: {warning.suggestion}</s-text>
                    )}
                  </s-stack>
                </div>
              ))}
            </s-stack>
          </s-box>
        )}
      </s-stack>
    </s-box>
  );
}
