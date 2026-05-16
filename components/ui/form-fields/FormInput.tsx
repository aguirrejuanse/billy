"use client";

import { useFormContext } from "react-hook-form";
import { FormField } from "./FormField";

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
  label: string;
  optional?: boolean;
}

export function FormInput({ name, label, optional, ...inputProps }: FormInputProps) {
  const { register } = useFormContext();

  return (
    <FormField name={name} label={label} optional={optional}>
      <input
        {...register(name)}
        {...inputProps}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
      />
    </FormField>
  );
}
