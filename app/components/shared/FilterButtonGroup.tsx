interface FilterOption {
  value: string;
  label: string;
}

interface FilterButtonGroupProps {
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
}

/**
 * Scrollable filter button group using Polaris button-group pattern
 * Handles overflow for many categories
 */
export function FilterButtonGroup({ options, value, onChange }: FilterButtonGroupProps) {
  return (
    <div
      style={{
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        paddingBottom: '4px', // Space for scrollbar
      }}
    >
      <s-button-group gap="base">
        {options.map((opt) => (
          <s-button
            key={opt.value}
            variant={value === opt.value ? "primary" : "secondary"}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </s-button>
        ))}
      </s-button-group>
    </div>
  );
}
