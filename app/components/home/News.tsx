import { Fragment, useState } from "react";
import type { NewsItem } from "../../types/dashboard.types";

interface NewsProps {
  items: NewsItem[];
  maxItems?: number;
}

// Format relative date
function formatRelativeDate(date: Date): string {
  const now = new Date();
  const dateObj = new Date(date);
  const diffMs = now.getTime() - dateObj.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return dateObj.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// Badge tone based on news type
function getTypeBadge(type: NewsItem["type"]): {
  tone: "success" | "caution" | "info";
  label: string;
} {
  switch (type) {
    case "feature":
      return { tone: "success", label: "New" };
    case "announcement":
      return { tone: "caution", label: "Important" };
    default:
      return { tone: "info", label: "Update" };
  }
}

export function News({ items, maxItems = 3 }: NewsProps) {
  const [showAll, setShowAll] = useState(false);

  // Empty state
  if (items.length === 0) {
    return (
      <s-section heading="News">
        <s-box
          padding="large"
          border="base"
          borderRadius="base"
          background="subdued"
        >
          <s-stack gap="small-200" direction="block" alignItems="center">
            <s-icon type="megaphone" size="base" color="subdued" />
            <s-text color="subdued">No news at the moment</s-text>
          </s-stack>
        </s-box>
      </s-section>
    );
  }

  const visibleItems = showAll ? items : items.slice(0, maxItems);
  const hasMore = items.length > maxItems;

  return (
    <s-section>
      <s-stack gap="small-200" direction="block">
        {/* Header */}
        <s-grid gridTemplateColumns="1fr auto" alignItems="center">
          <s-heading>News & Updates</s-heading>
          {hasMore && (
            <s-button variant="tertiary" onClick={() => setShowAll(!showAll)}>
              {showAll ? "Show less" : `See all (${items.length})`}
            </s-button>
          )}
        </s-grid>

        {/* News Items */}
        <s-box border="base" borderRadius="base">
          {visibleItems.map((item, i) => {
            const badge = getTypeBadge(item.type);

            return (
              <Fragment key={item.id}>
                <s-box padding="base">
                  <s-stack gap="small-200" direction="block">
                    {/* Date and Badge */}
                    <s-stack
                      gap="small-200"
                      direction="inline"
                      alignItems="center"
                    >
                      <s-text color="subdued">
                        {formatRelativeDate(item.publishedAt)}
                      </s-text>
                      <s-badge tone={badge.tone}>{badge.label}</s-badge>
                    </s-stack>

                    {/* Title */}
                    {item.url ? (
                      <s-link href={item.url} target="_blank">
                        <s-text type="strong">{item.title}</s-text>
                      </s-link>
                    ) : (
                      <s-text type="strong">{item.title}</s-text>
                    )}

                    {/* Description */}
                    <s-text color="subdued">{item.description}</s-text>
                  </s-stack>
                </s-box>

                {/* Divider between items */}
                {i < visibleItems.length - 1 && <s-divider />}
              </Fragment>
            );
          })}
        </s-box>
      </s-stack>
    </s-section>
  );
}
