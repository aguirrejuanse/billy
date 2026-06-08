import { todayLocalISO } from "@/lib/formatters";

function isValidPastDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && value <= todayLocalISO();
}

interface ReportHeaderProps {
  endDate: string;
  onEndDateChange: (date: string) => void;
}

export function ReportHeader({ endDate, onEndDateChange }: ReportHeaderProps) {
  return (
    <div className="flex items-center justify-end gap-3">
      <label className="text-sm text-muted-foreground" htmlFor="endDate">
        As of
      </label>
      <input
        id="endDate"
        type="date"
        value={endDate}
        max={todayLocalISO()}
        onChange={(e) => {
          const v = e.target.value;
          if (isValidPastDate(v)) onEndDateChange(v);
        }}
        className="h-9 cursor-pointer rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
    </div>
  );
}
