"use client";

import { useFormContext } from "react-hook-form";
import { FormField } from "./FormField";

interface SelectOption {
  value: string;
  label: string;
}

interface FormSelectProps {
  name: string;
  label: string;
  options: SelectOption[];
  placeholder?: string;
  optional?: boolean;
  disabled?: boolean;
}

export function FormSelect({
  name,
  label,
  options,
  placeholder,
  optional,
  disabled,
}: FormSelectProps) {
  const { register } = useFormContext();

  return (
    <FormField name={name} label={label} optional={optional}>
      <select
        {...register(name)}
        disabled={disabled}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </FormField>
  );
}
