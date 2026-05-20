"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { FormField } from "./FormField";

interface CheckboxOption {
  value: string;
  label: string;
}

interface FormCheckboxGroupProps {
  name: string;
  label: string;
  options: CheckboxOption[];
  optional?: boolean;
}

export function FormCheckboxGroup({ name, label, options, optional }: FormCheckboxGroupProps) {
  const { setValue } = useFormContext();
  const selected: string[] = useWatch({ name }) ?? [];

  function toggle(value: string) {
    if (selected.includes(value)) {
      setValue(
        name,
        selected.filter((v) => v !== value),
        { shouldValidate: true }
      );
    } else {
      setValue(name, [...selected, value], { shouldValidate: true });
    }
  }

  return (
    <FormField name={name} label={label} optional={optional}>
      <div className="flex flex-wrap gap-2 pt-1">
        {options.map((opt) => {
          const checked = selected.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={checked}
              onClick={() => toggle(opt.value)}
              className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors cursor-pointer ${
                checked
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-foreground border-input hover:bg-muted"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </FormField>
  );
}
