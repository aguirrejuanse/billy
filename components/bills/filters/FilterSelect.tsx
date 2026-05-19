"use client";

import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";

export interface FilterSelectProps {
  value: string | null;
  placeholder: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function FilterSelect({
  value,
  placeholder,
  options,
  onChange,
  disabled,
}: FilterSelectProps) {
  const selectedLabel = options.find((o) => o.value === value)?.label;

  function handleOnChange(v: string | null) {
    if (v === null) return;
    onChange(v);
  }

  return (
    <Select value={value ?? ""} onValueChange={handleOnChange} disabled={disabled}>
      <SelectTrigger className="w-44 h-8 text-sm">
        <span
          className={cn("truncate flex-1 text-left", !selectedLabel && "text-muted-foreground")}
        >
          {selectedLabel ?? placeholder}
        </span>
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
