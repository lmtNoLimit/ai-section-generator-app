import { Fragment } from "react";

const FEATURES = [
  {
    title: "Generate Sections",
    description: "AI-powered Liquid code from natural language",
    href: "/app/generate",
    icon: "wand",
  },
  {
    title: "Template Library",
    description: "Save and reuse your best prompts",
    href: "/app/templates",
    icon: "file-list",
  },
  {
    title: "Generation History",
    description: "Track all your generated sections",
    href: "/app/history",
    icon: "clock",
  },
] as const;

export function FeatureNav() {
  return (
    <s-section heading="Features">
      <s-box border="base" borderRadius="base">
        {FEATURES.map((feature, i) => (
          <Fragment key={feature.title}>
            <s-clickable href={feature.href} padding="base">
              <s-grid
                gridTemplateColumns="auto 1fr auto"
                alignItems="center"
                gap="base"
              >
                <s-icon type={feature.icon} />
                <s-box>
                  <s-text type="strong">{feature.title}</s-text>
                  <s-paragraph color="subdued">{feature.description}</s-paragraph>
                </s-box>
                <s-icon type="chevron-right" color="subdued" />
              </s-grid>
            </s-clickable>
            {i < FEATURES.length - 1 && (
              <s-box paddingInline="base">
                <s-divider />
              </s-box>
            )}
          </Fragment>
        ))}
      </s-box>
    </s-section>
  );
}
