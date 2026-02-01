/**
 * Radio Button List Component
 * Single-select radio button list for onboarding forms
 */

interface RadioOption {
  value: string;
  label: string;
}

interface RadioListProps {
  title: string;
  description?: string;
  options: RadioOption[];
  selectedValue?: string;
  onChange: (value: string) => void;
}

export function RadioList({
  title,
  description,
  options,
  selectedValue,
  onChange,
}: RadioListProps) {
  return (
    <div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
      )}
      <div className="space-y-3">
        {options.map((option) => {
          const isSelected = selectedValue === option.value;
          
          return (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              type="button"
              className={`w-full px-6 py-4 rounded-lg border-2 flex items-center justify-between text-left transition-all ${
                isSelected
                  ? 'border-brand bg-brand/5 text-brand'
                  : 'border-border hover:border-brand/50'
              }`}
            >
              <span className="flex-1 pr-4">{option.label}</span>
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
            </button>
          );
        })}
      </div>
    </div>
  );
}
