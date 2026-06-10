import { Download } from "lucide-react";
import { parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
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
        <span className="text-sm text-muted-foreground shrink-0">As of</span>
        <DatePicker
          value={endDate}
          onChange={onEndDateChange}
          maxDate={parseISO(todayLocalISO())}
          className="flex-1 sm:flex-none"
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
