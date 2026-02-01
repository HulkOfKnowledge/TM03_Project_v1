/**
 * Checkbox Grid Component
 * Multi-select checkbox grid for onboarding forms
 */

interface CheckboxOption {
  value: string;
  label: string;
}

interface CheckboxGridProps {
  label: string;
  options: CheckboxOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  error?: string;
  columns?: 2 | 3;
}

export function CheckboxGrid({
  label,
  options,
  selectedValues,
  onChange,
  error,
  columns = 3,
}: CheckboxGridProps) {
  const handleToggle = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter((v) => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-2">
        {label}
      </label>
      <div className={`grid grid-cols-2 ${columns === 3 ? 'md:grid-cols-3' : ''} gap-3`}>
        {options.map((option) => {
          const isSelected = selectedValues.includes(option.value);
          
          return (
            <label
              key={option.value}
              className={`relative flex items-center  p-4 rounded-lg border-2 cursor-pointer transition-all ${
                isSelected
                  ? 'border-brand bg-brand/5'
                  : 'border-border hover:border-brand/50'
              }`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleToggle(option.value)}
                className="sr-only"
              />
              <div
                className={`flex-shrink-0 h-5 w-5 rounded border-2 flex items-center justify-center ${
                  isSelected
                    ? 'border-brand bg-brand'
                    : 'border-border bg-background'
                }`}
              >
                {isSelected && (
                  <svg
                    className="h-3 w-3 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </div>
              <span className="text-sm text-foreground pl-2">{option.label}</span>
            </label>
          );
        })}
      </div>
      {error && <p className="text-red-500 text-xs sm:text-sm mt-1">{error}</p>}
    </div>
  );
}
