"use client";

import { AlertCircleIcon } from "lucide-react";

interface InlineErrorProps {
  message: string;
}

export function InlineError({ message }: InlineErrorProps) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
      <AlertCircleIcon className="h-4 w-4 shrink-0" />
      {message}
    </div>
  );
}
