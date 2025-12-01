interface QuickStatsProps {
  stats: {
    sectionsGenerated: number;
    templatesSaved: number;
    generationsThisWeek: number;
  };
}

export function QuickStats({ stats }: QuickStatsProps) {
  return (
    <s-stack gap="base" direction="block">
      <s-stack gap="small" direction="block">
        <s-text type="strong">{stats.sectionsGenerated}</s-text>
        <s-text color="subdued">Sections generated</s-text>
      </s-stack>
      <s-divider />
      <s-stack gap="small" direction="block">
        <s-text type="strong">{stats.templatesSaved}</s-text>
        <s-text color="subdued">Templates saved</s-text>
      </s-stack>
      <s-divider />
      <s-stack gap="small" direction="block">
        <s-text type="strong">{stats.generationsThisWeek}</s-text>
        <s-text color="subdued">This week</s-text>
      </s-stack>
    </s-stack>
  );
}
