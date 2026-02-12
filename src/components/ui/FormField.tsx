/**
 * Reusable form field components that integrate with React Hook Form.
 * Each component reads errors from the form context and renders
 * validation messages automatically.
 */

import type { FieldError, UseFormRegisterReturn } from "react-hook-form";

// ---------------------------------------------------------------------------
// Text / Number Input
// ---------------------------------------------------------------------------

interface FormFieldProps {
  label: string;
  unit?: string;
  error?: FieldError;
  registration: UseFormRegisterReturn;
  type?: "text" | "number";
  placeholder?: string;
  step?: string;
  min?: string;
  max?: string;
  disabled?: boolean;
}

export function FormField({
  label,
  unit,
  error,
  registration,
  type = "text",
  placeholder,
  step,
  min,
  max,
  disabled = false,
}: FormFieldProps) {
  return (
    <div className="form-field">
      <label className="form-label">
        {label}
        {unit && <span className="form-unit"> ({unit})</span>}
      </label>
      <input
        className={`form-input ${error ? "form-input--error" : ""}`}
        type={type}
        placeholder={placeholder}
        step={step}
        min={min}
        max={max}
        disabled={disabled}
        {...registration}
      />
      {error && <span className="form-error">{error.message}</span>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Select
// ---------------------------------------------------------------------------

interface FormSelectProps {
  label: string;
  options: readonly string[] | { value: string; label: string }[];
  error?: FieldError;
  registration: UseFormRegisterReturn;
  placeholder?: string;
}

export function FormSelect({
  label,
  options,
  error,
  registration,
  placeholder,
}: FormSelectProps) {
  return (
    <div className="form-field">
      <label className="form-label">{label}</label>
      <select
        className={`form-input ${error ? "form-input--error" : ""}`}
        {...registration}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => {
          const value = typeof opt === "string" ? opt : opt.value;
          const displayLabel = typeof opt === "string" ? opt : opt.label;
          return (
            <option key={value} value={value}>
              {displayLabel}
            </option>
          );
        })}
      </select>
      {error && <span className="form-error">{error.message}</span>}
    </div>
  );
}
