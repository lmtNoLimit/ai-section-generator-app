/**
 * Visual progress indicator for quota usage
 * Shows percentage with dynamic tone (critical/warning/highlight)
 */

interface QuotaProgressBarProps {
  used: number;
  included: number;
  tone?: "critical" | "warning" | "highlight" | "primary" | "success";
}

export function QuotaProgressBar({ used, included, tone = "highlight" }: QuotaProgressBarProps) {
  const percentage = Math.min(100, Math.round((used / included) * 100));

  return (
    <s-grid gap="small-100">
      {/* Progress bar as styled div since s-progress might not be available */}
      <div
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${percentage}% of quota used`}
        style={{
          width: "100%",
          height: "8px",
          backgroundColor: "#e1e3e5",
          borderRadius: "4px",
          overflow: "hidden"
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            height: "100%",
            backgroundColor: tone === "critical" ? "#d72c0d" : tone === "warning" ? "#f49342" : "#008060",
            transition: "width 0.3s ease"
          }}
        />
      </div>
      <s-grid gridTemplateColumns="1fr auto" alignItems="center">
        <s-paragraph color="subdued">
          {used} of {included} sections used
        </s-paragraph>
        <s-text color="subdued" fontVariantNumeric="tabular-nums">
          {percentage}%
        </s-text>
      </s-grid>
    </s-grid>
  );
}
