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
 * Reusable filter button group using Polaris button-group pattern
 */
export function FilterButtonGroup({ options, value, onChange }: FilterButtonGroupProps) {
  return (
    <s-button-group gap="none">
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
  );
}
