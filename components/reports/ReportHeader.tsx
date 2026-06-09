import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { todayLocalISO } from "@/lib/formatters";

interface ReportHeaderProps {
  endDate: string;
  onEndDateChange: (date: string) => void;
  onExport: () => void;
  exportDisabled?: boolean;
}

export function ReportHeader({
  endDate,
  onEndDateChange,
  onExport,
  exportDisabled,
}: ReportHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-3">
      <div className="flex items-center gap-2">
        <label className="text-sm text-muted-foreground shrink-0" htmlFor="endDate">
          As of
        </label>
        <input
          id="endDate"
          type="date"
          value={endDate}
          max={todayLocalISO()}
          onChange={(e) => {
            if (e.target.value) onEndDateChange(e.target.value);
          }}
          className="flex-1 sm:flex-none h-9 cursor-pointer rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onExport}
        disabled={exportDisabled}
        className="w-full sm:w-auto"
      >
        <Download className="h-4 w-4" />
        Export CSV
      </Button>
    </div>
  );
}
