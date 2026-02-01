/**
 * Select Input Component
 * Styled select dropdown for onboarding forms
 */

interface SelectInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  error?: string;
  required?: boolean;
}

export function SelectInput({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select one',
  error,
  required,
}: SelectInputProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full px-4 py-3 pr-10 rounded-lg border ${
            error ? 'border-red-500' : 'border-border'
          } bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-brand appearance-none cursor-pointer`}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg width="14" height="25" viewBox="0 0 14 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M6.99988 9.90833L2.16236 14.7458L1.3374 13.9209L6.99988 8.25841L12.6624 13.9209L11.8374 14.7458L6.99988 9.90833Z" fill="#8E8E8E"/>
            <path fillRule="evenodd" clipRule="evenodd" d="M6.99988 30.0917L2.16236 25.2542L1.3374 26.0791L6.99988 31.7416L12.6624 26.0791L11.8374 25.2542L6.99988 30.0917Z" fill="#8E8E8E"/>
          </svg>
        </div>
      </div>
      {error && <p className="text-red-500 text-xs sm:text-sm mt-1">{error}</p>}
    </div>
  );
}
