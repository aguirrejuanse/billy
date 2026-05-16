"use client";

import { FormInput } from "./FormInput";

interface FormDateInputProps {
  name: string;
  label: string;
  optional?: boolean;
  min?: string;
}

export function FormDateInput({ name, label, optional, min }: FormDateInputProps) {
  return <FormInput name={name} label={label} optional={optional} type="date" min={min} />;
}
