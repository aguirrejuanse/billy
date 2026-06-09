"use client";

import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  value: string | undefined;
  onChange: (date: string) => void;
  placeholder?: string;
  maxDate?: Date;
  minDate?: Date;
  className?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  maxDate,
  minDate,
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);

  const selected = value ? parseISO(value) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          "h-9 cursor-pointer rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring flex items-center gap-2",
          className
        )}
      >
        <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className={cn(!selected && "text-muted-foreground")}>
          {selected ? format(selected, "MM/dd/yyyy") : placeholder}
        </span>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => {
            if (!date) return;
            onChange(format(date, "yyyy-MM-dd"));
            setOpen(false);
          }}
          disabled={(date) => {
            if (maxDate && date > maxDate) return true;
            if (minDate && date < minDate) return true;
            return false;
          }}
          defaultMonth={selected}
        />
      </PopoverContent>
    </Popover>
  );
}
