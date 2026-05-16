"use client";

import { FormInput } from "./FormInput";

interface FormDateInputProps {
  name: string;
  label: string;
  optional?: boolean;
}

export function FormDateInput({ name, label, optional }: FormDateInputProps) {
  return <FormInput name={name} label={label} optional={optional} type="date" />;
}
