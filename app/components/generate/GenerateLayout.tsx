import type { ReactNode } from "react";

export interface GenerateLayoutProps {
  inputColumn: ReactNode;
  previewColumn: ReactNode;
}

/**
 * Two-column responsive layout for generate screen
 * Left: Input controls (1/3 width)
 * Right: Preview and actions (2/3 width)
 * Mobile: Stacked vertically using CSS grid with responsive breakpoints
 */
export function GenerateLayout({ inputColumn, previewColumn }: GenerateLayoutProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(1, 1fr)',
        gap: '16px',
      }}
      className="generate-layout"
    >
      <style>{`
        @media (min-width: 768px) {
          .generate-layout {
            grid-template-columns: 1fr 2fr !important;
          }
        }
      `}</style>
      {/* Left column: Input area (1/3 width on desktop) */}
      <div>{inputColumn}</div>

      {/* Right column: Preview area (2/3 width on desktop) */}
      <div>{previewColumn}</div>
    </div>
  );
}
