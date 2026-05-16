"use client";

import { useFormContext, get } from "react-hook-form";

interface FormFieldProps {
  name: string;
  label: string;
  optional?: boolean;
  children: React.ReactNode;
}

export function FormField({ name, label, optional, children }: FormFieldProps) {
  const {
    formState: { errors },
  } = useFormContext();
  const error = get(errors, name);

  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">
        {label}
        {optional && <span className="text-muted-foreground font-normal"> (optional)</span>}
      </label>
      {children}
      {error && <p className="text-xs text-destructive">{error.message as string}</p>}
    </div>
  );
}
