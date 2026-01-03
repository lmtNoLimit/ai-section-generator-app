/**
 * SuggestionChips - Context-aware follow-up action chips after AI responses
 *
 * 3-Tier System:
 * - Tier 1: Immediate actions (Copy, Apply) - always visible
 * - Tier 2: Section-specific refinements - scrollable row
 * - Tier 3: Conversation next-steps - after multiple exchanges
 */

import type { Suggestion } from './utils/suggestion-engine';

export interface SuggestionChipsProps {
  suggestions: Suggestion[];
  onChipClick: (suggestion: Suggestion) => void;
  onCopy?: () => void;
  onApply?: () => void;
}

/**
 * Renders suggestion chips grouped by tier
 * Tier 1 and 3 are inline, Tier 2 scrolls horizontally
 */
export function SuggestionChips({
  suggestions,
  onChipClick,
  onCopy,
  onApply,
}: SuggestionChipsProps) {
  // Group by tier
  const tier1 = suggestions.filter((s) => s.tier === 1);
  const tier2 = suggestions.filter((s) => s.tier === 2);
  const tier3 = suggestions.filter((s) => s.tier === 3);

  const handleClick = (suggestion: Suggestion) => {
    // Handle special action buttons
    if (suggestion.id === 'copy') {
      onCopy?.();
      return;
    }
    if (suggestion.id === 'apply') {
      onApply?.();
      return;
    }
    // Forward other chips to parent handler
    onChipClick(suggestion);
  };

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <s-box padding="small-100 none">
      <s-stack direction="block" gap="small">
        {/* Tier 1: Immediate actions */}
        {tier1.length > 0 && (
          <s-stack direction="inline" gap="small">
            {tier1.map((suggestion) => (
              <s-button
                key={suggestion.id}
                variant="secondary"
                onClick={() => handleClick(suggestion)}
              >
                {suggestion.label}
              </s-button>
            ))}
          </s-stack>
        )}

        {/* Tier 2: Refinement chips - scrollable */}
        {tier2.length > 0 && (
          <div
            className="suggestion-chips-scroll"
            style={{
              overflowX: 'auto',
              overflowY: 'hidden',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            <s-stack direction="inline" gap="small">
              {tier2.map((suggestion) => (
                <button
                  key={suggestion.id}
                  type="button"
                  onClick={() => handleClick(suggestion)}
                  className="suggestion-chip"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    border: '1px solid var(--p-color-border-subdued)',
                    background: 'var(--p-color-bg-fill-info-secondary)',
                    color: 'var(--p-color-text)',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--p-color-bg-fill-info)';
                    e.currentTarget.style.borderColor = 'var(--p-color-border-info)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--p-color-bg-fill-info-secondary)';
                    e.currentTarget.style.borderColor = 'var(--p-color-border-subdued)';
                  }}
                >
                  {suggestion.label}
                </button>
              ))}
            </s-stack>
          </div>
        )}

        {/* Tier 3: Next steps */}
        {tier3.length > 0 && (
          <s-stack direction="inline" gap="small">
            {tier3.map((suggestion) => (
              <s-button
                key={suggestion.id}
                variant="tertiary"
                onClick={() => handleClick(suggestion)}
              >
                {suggestion.label}
              </s-button>
            ))}
          </s-stack>
        )}
      </s-stack>

      {/* Hide scrollbar CSS */}
      <style>{`
        .suggestion-chips-scroll::-webkit-scrollbar {
          display: none;
        }
        .suggestion-chip:focus {
          outline: 2px solid var(--p-color-border-focus);
          outline-offset: 1px;
        }
      `}</style>
    </s-box>
  );
}

export type { Suggestion } from './utils/suggestion-engine';
