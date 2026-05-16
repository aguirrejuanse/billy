"use client";

import { useFormContext } from "react-hook-form";
import { FormField } from "./FormField";

interface FormTextareaProps {
  name: string;
  label: string;
  optional?: boolean;
  rows?: number;
  placeholder?: string;
}

export function FormTextarea({ name, label, optional, rows = 3, placeholder }: FormTextareaProps) {
  const { register } = useFormContext();

  return (
    <FormField name={name} label={label} optional={optional}>
      <textarea
        {...register(name)}
        rows={rows}
        placeholder={placeholder}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
      />
    </FormField>
  );
}
