import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAgingReportService } from "@/services/reports";
import { todayLocalISO } from "@/lib/formatters";
import type { AgingReportData } from "@/types";

export function useAgingReportQuery() {
  const [endDate, setEndDate] = useState(todayLocalISO());

  const query = useQuery<AgingReportData>({
    queryKey: ["reports", "aging", endDate],
    queryFn: () => getAgingReportService(endDate),
    staleTime: 30000,
  });

  return { ...query, endDate, setEndDate };
}
