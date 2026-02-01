/**
 * Checkbox List Component
 * Multi-select checkbox list for detailed options
 */

interface CheckboxListProps {
  title: string;
  description?: string;
  options: string[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
}

export function CheckboxList({
  title,
  description,
  options,
  selectedValues,
  onChange,
}: CheckboxListProps) {
  const handleToggle = (option: string) => {
    if (selectedValues.includes(option)) {
      onChange(selectedValues.filter((v) => v !== option));
    } else {
      onChange([...selectedValues, option]);
    }
  };

  return (
    <div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
      )}
      <div className="space-y-3">
        {options.map((option) => {
          const isSelected = selectedValues.includes(option);
          
          return (
            <label
              key={option}
              className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all ${
                isSelected
                  ? 'border-brand bg-brand/5'
                  : 'border-border hover:border-brand/50'
              }`}
            >
              <span className="text-foreground flex-1 pr-4">{option}</span>
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleToggle(option)}
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
            </label>
          );
        })}
      </div>
    </div>
  );
}
