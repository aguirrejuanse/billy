import type { ReactNode } from "react";

interface FieldProps {
  label: string;
  value: ReactNode;
  className?: string;
}

export function Field({ label, value, className }: FieldProps) {
  return (
    <div className={className}>
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-sm font-medium mt-0.5">{value}</p>
    </div>
  );
}
