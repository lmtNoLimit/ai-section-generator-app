import { AnalyticsCard } from "./AnalyticsCard";
import type { DashboardStats } from "../../types/dashboard.types";

interface AnalyticsProps {
  stats: DashboardStats;
}

export function Analytics({ stats }: AnalyticsProps) {
  return (
    <s-section heading="Analytics">
      <s-grid
        gridTemplateColumns="repeat(auto-fit, minmax(200px, 1fr))"
        gap="base"
      >
        <AnalyticsCard
          title="Sections Created"
          value={stats.sectionsGenerated}
          icon="file-list"
          href="/app/sections"
        />
        <AnalyticsCard
          title="Templates Saved"
          value={stats.templatesSaved}
          icon="page"
          href="/app/templates"
        />
        <AnalyticsCard
          title="This Week"
          value={stats.generationsThisWeek}
          trend={stats.weeklyTrend}
          trendValue={stats.weeklyChange}
          icon="clock"
        />
        <AnalyticsCard
          title="Avg. per Week"
          value={
            stats.sectionsGenerated > 0
              ? Math.round(stats.sectionsGenerated / 4)
              : 0
          }
          icon="chart-line"
        />
      </s-grid>
    </s-section>
  );
}
