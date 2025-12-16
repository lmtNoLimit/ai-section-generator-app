import { useNavigate } from "react-router";

type IconType =
  | "file-list"
  | "page"
  | "clock"
  | "chart-line"
  | "chart-vertical"
  | "chart-horizontal";

interface AnalyticsCardProps {
  title: string;
  value: number | string;
  trend?: "up" | "down" | "stable";
  trendValue?: number;
  href?: string;
  icon?: IconType;
}

export function AnalyticsCard({
  title,
  value,
  trend,
  trendValue,
  href,
  icon,
}: AnalyticsCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (href) navigate(href);
  };

  const trendBadge =
    trend && trend !== "stable" ? (
      <s-badge tone={trend === "up" ? "success" : "critical"}>
        {trend === "up" ? "↑" : "↓"} {trendValue}%
      </s-badge>
    ) : null;

  const content = (
    <s-box padding="base">
      <s-stack gap="small-200" direction="block">
        <s-stack gap="small-200" direction="inline" alignItems="center">
          {icon && <s-icon type={icon} color="subdued" />}
          <s-text color="subdued">{title}</s-text>
        </s-stack>
        <s-stack gap="small-200" direction="inline" alignItems="end">
          <s-heading>{value}</s-heading>
          {trendBadge}
        </s-stack>
      </s-stack>
    </s-box>
  );

  if (href) {
    return (
      <s-clickable onClick={handleClick}>
        <s-box border="base" borderRadius="base" background="base">
          {content}
        </s-box>
      </s-clickable>
    );
  }

  return (
    <s-box border="base" borderRadius="base" background="base">
      {content}
    </s-box>
  );
}
