import type { ReactNode } from "react";

export interface GenerateLayoutProps {
  inputColumn: ReactNode;
  previewColumn: ReactNode;
}

/**
 * Two-column responsive layout for generate screen
 * Left: Input controls (1/3 width)
 * Right: Preview and actions (2/3 width)
 * Mobile: Stacked vertically (handled by Polaris s-layout)
 */
export function GenerateLayout({ inputColumn, previewColumn }: GenerateLayoutProps) {
  return (
    <s-layout>
      {/* Left column: Input area (1/3 width) */}
      <s-layout-section variant="oneThird">
        {inputColumn}
      </s-layout-section>

      {/* Right column: Preview area (2/3 width) */}
      <s-layout-section variant="twoThirds">
        {previewColumn}
      </s-layout-section>
    </s-layout>
  );
}
